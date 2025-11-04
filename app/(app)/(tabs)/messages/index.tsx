/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { LinearGradient } from "expo-linear-gradient";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import {
  messagingService,
  Conversation,
  Participant,
} from "../../../../utils/sendbirdService";
import activityApi from "../../../../utils/activityApi";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useTheme } from "../../../../contexts/ThemeContext";
import { useRef } from "react";
import { getApiBaseUrl } from "../../../../utils/apiBaseUrl";
import { APP_TIME_ZONE } from "../../../../utils/timezone";

export default function MessagesScreen() {
    // Access isDarkMode and fontScale from useTheme
  const { theme, scaledFontSize, isDarkMode, fontScale } = useTheme();
  const isFocused = useIsFocused();
  const { userId } = useAuth(); // Get actual Clerk user ID
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [sendbirdStatus, setSendbirdStatus] = useState<string>("Initializing...");
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalData, setStatusModalData] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
    confirm: undefined as undefined | { confirmText?: string; cancelText?: string; onConfirm: () => void },
  });
  // Track conversations marked read in this session to avoid poll flicker
  // Key: conversationId, Value: timestamp when marked read
  const recentlyReadRef = useRef<Record<string, number>>({});
  // Removed session-based unread suppression; rely on backend read receipts instead
  const API_BASE_URL = getApiBaseUrl();

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [fontScale]);

  const showStatusModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setStatusModalData({ type, title, message, confirm: undefined });
    setStatusModalVisible(true);
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    opts?: { confirmText?: string; cancelText?: string }
  ) => {
    setStatusModalData({
      type: 'info',
      title,
      message,
      confirm: { onConfirm, confirmText: opts?.confirmText, cancelText: opts?.cancelText },
    });
    setStatusModalVisible(true);
  };

  const initializeMessaging = useCallback(async () => {
    if (!userId) {
      console.log("❌ No user ID available");
      setSendbirdStatus("User not authenticated");
      setLoading(false);
      showStatusModal('error', 'Authentication Error', 'Please sign in to access messages');
      return;
    }

    try {
      const accessToken = process.env.EXPO_PUBLIC_SENDBIRD_ACCESS_TOKEN;

      // Add default profile URL to avoid SendBird error
      const sendbirdInitialized = await messagingService.initializeSendBird(
        userId,
        accessToken,
        "https://ui-avatars.com/api/?name=User&background=666&color=fff&size=60"
      );
      setSendbirdStatus(
        sendbirdInitialized ? "SendBird Connected" : "Using Backend API"
      );

      await loadConversations();
    } catch (error) {
      console.log("Failed to initialize messaging");
      setSendbirdStatus("Using Backend API");
      showStatusModal('info', 'Connection Notice', 'Using backend messaging service');
      await loadConversations();
    }
  }, [userId]);

  useEffect(() => {
    initializeMessaging();
  }, [initializeMessaging]);

  // Track opened conversations in current session only (no persistence)
  // This clears unread counts when user taps a conversation during this session
  // but allows unread counts to show again after app restart

  useFocusEffect(
    useCallback(() => {
      console.log("💬 MessagesScreen focused, refreshing conversations");
      console.log("💬 Current userId:", userId);
      console.log("💬 Current conversations count:", conversations.length);
      if (userId) {
        loadConversations();
      }
    }, [userId])
  );

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conversation => {
      const searchLower = searchQuery.toLowerCase().trim();
      
      // Search in participant names
      const participantNames = conversation.participants
        .filter(p => p.clerk_user_id !== userId) // Exclude current user
        .map(p => `${p.first_name} ${p.last_name}`.toLowerCase());
      
      const hasMatchingParticipant = participantNames.some(name => 
        name.includes(searchLower)
      );

      // Search in conversation title
      const hasMatchingTitle = conversation.title?.toLowerCase().includes(searchLower);

      // Search in last message
      const hasMatchingLastMessage = conversation.last_message?.toLowerCase().includes(searchLower);

      // Search in participant emails
      const hasMatchingEmail = conversation.participants.some(p => 
        p.email?.toLowerCase().includes(searchLower)
      );

      return hasMatchingParticipant || hasMatchingTitle || hasMatchingLastMessage || hasMatchingEmail;
    });

    setFilteredConversations(filtered);
  }, [searchQuery, conversations, userId]);

  const loadConversations = async () => {
    if (!userId) {
      console.log("❌ No user ID available for loading conversations");
      setConversations([]);
      setFilteredConversations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`💬 Loading conversations for user: ${userId}`);

      // Add timestamp to prevent caching
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${userId}?t=${Date.now()}`
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`💬 Setting ${result.data.length} conversations`);
        console.log(`💬 Conversation data:`, JSON.stringify(result.data, null, 2));
        let convs: Conversation[] = result.data;

        // After conversations load, refresh presence using batch status for other participants
        try {
          const otherIds = Array.from(
            new Set(
              convs
                .flatMap((c) => c.participants)
                .filter((p) => p.clerk_user_id !== userId)
                .map((p) => p.clerk_user_id)
                .filter(Boolean)
            )
          );

          if (otherIds.length > 0) {
            const statusMap = await activityApi.statusBatch(otherIds);
            convs = convs.map((c) => ({
              ...c,
              participants: c.participants.map((p) => {
                if (p.clerk_user_id === userId) return p;
                const s = statusMap[p.clerk_user_id];
                return s
                  ? { ...p, online: !!s.online, presence: s.presence as any, last_active_at: s.last_active_at }
                  : p;
              }),
            }));
          }
        } catch (e) {
          console.log("Presence batch update failed:", e);
        }

        // Apply session read suppression (2 minutes) to avoid unread flicker right after opening
        const now = Date.now();
        const suppressed = convs.map((c) => {
          const t = recentlyReadRef.current[c.id];
          if (t && now - t < 2 * 60 * 1000) {
            return { ...c, unread_count: 0 };
          }
          return c;
        });

        setConversations(suppressed);
        setFilteredConversations(suppressed); // Initialize filtered conversations
      } else {
        console.log("💬 Failed to load conversations from backend");
        setConversations([]);
        setFilteredConversations([]);
        showStatusModal('error', 'Load Error', 'Failed to load conversations. Please try again.');
      }
    } catch (error) {
      console.error("💬 Error loading conversations:", error);
      setConversations([]);
      setFilteredConversations([]);
      showStatusModal('error', 'Connection Error', 'Unable to load conversations. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Removed presence polling per request

  // Poll for new messages and update unread counts every 10 seconds
  useEffect(() => {
    if (!isFocused || !userId) return;
    
    const pollMessages = async () => {
      try {
        console.log('📬 Polling for new messages...');
        const response = await fetch(
          `${API_BASE_URL}/api/messages/conversations/${userId}?t=${Date.now()}`
        );
        
        if (response.ok) {
          const result = await response.json();
          let freshConvs: Conversation[] = result.data;
          // Honor session-level suppression window to prevent unread reappearing immediately after open
          const now = Date.now();
          freshConvs = freshConvs.map((c) => {
            const t = recentlyReadRef.current[c.id];
            if (t && now - t < 2 * 60 * 1000) {
              return { ...c, unread_count: 0 };
            }
            return c;
          });
          
          console.log(`📬 Polled ${freshConvs.length} conversations, unread counts:`, 
            freshConvs.map(c => ({ id: c.id, unread: c.unread_count }))
          );
          
          // Update conversations with fresh unread counts
          setConversations(freshConvs);
          setFilteredConversations((prev) => {
            // Maintain search filter
            if (!searchQuery.trim()) return freshConvs;
            return freshConvs.filter((c) => {
              const searchLower = searchQuery.toLowerCase().trim();
              const participantNames = c.participants
                .filter(p => p.clerk_user_id !== userId)
                .map(p => `${p.first_name} ${p.last_name}`.toLowerCase());
              return participantNames.some(name => name.includes(searchLower)) ||
                c.title?.toLowerCase().includes(searchLower) ||
                c.last_message?.toLowerCase().includes(searchLower);
            });
          });
        }
      } catch (e) {
        console.log('❌ Error polling messages:', e);
      }
    };
    
    const pollInterval = setInterval(pollMessages, 10000); // Poll every 10 seconds
    return () => clearInterval(pollInterval);
  }, [isFocused, userId, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    // Use replace for all tab switches to avoid stacking screens and off-tab renders
    router.replace(`/(app)/(tabs)/${tabId}`);
  };

  const getDisplayName = (conversation: Conversation) => {
    // Filter out current user from participants list
    const otherParticipants = conversation.participants.filter(
      (p) => p.clerk_user_id !== userId
    );

    // If there are other participants, show their FULL names
    if (otherParticipants.length > 0) {
      const fullNames = otherParticipants
        .map((p) => `${p.first_name} ${p.last_name}`.trim())
        .join(", ");
      return fullNames;
    }

    // If no other participants found, fallback to conversation title
    if (conversation.title) {
      return conversation.title;
    }

    return "Unknown User";
  };

  // Get user initials for avatar
  const getUserInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  // Get avatar display (text for initials or URL for image)
  const getAvatarDisplay = (participants: Participant[]) => {
    // Get other participants (not current user)
    const otherParticipants = participants.filter(
      (p) => p.clerk_user_id !== userId
    );

    const displayParticipant =
      otherParticipants.length > 0 ? otherParticipants[0] : participants[0];

    // If profile image exists, return a normalized absolute URL
    if (displayParticipant?.profile_image_url) {
      const raw = displayParticipant.profile_image_url;
      let normalized = raw;
      if (raw.startsWith('http')) {
        normalized = raw;
      } else if (raw.startsWith('/')) {
        normalized = `${API_BASE_URL}${raw}`;
      } else if (raw.startsWith('data:image')) {
        // Use lightweight server endpoint that streams the image instead of embedding base64
        normalized = `${API_BASE_URL}/api/users/${encodeURIComponent(displayParticipant.clerk_user_id || '')}/profile-image`;
      }
      return { type: "image", value: normalized };
    }

    // Otherwise return initials for text display
    const initials = getUserInitials(
      displayParticipant?.first_name,
      displayParticipant?.last_name
    );
    return { type: "text", value: initials };
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: APP_TIME_ZONE,
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", timeZone: APP_TIME_ZONE });
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView testID="messages-screen" style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CurvedBackground>
        <AppHeader title="Messages" showBack={true} />

        {/* Status Modal (also supports confirmations) */}
        <Modal
          visible={statusModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <View style={[
            styles.modalOverlay,
            { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)' }
          ]}>
            <View style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }
            ]}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name={
                    statusModalData.type === 'success' ? 'checkmark-circle' :
                    statusModalData.type === 'error' ? 'close-circle' : 'information-circle'
                  } 
                  size={64} 
                  color={
                    statusModalData.type === 'success' ? '#4CAF50' :
                    statusModalData.type === 'error' ? '#FF3B30' : '#007AFF'
                  } 
                />
              </View>

              <Text style={[
                styles.modalTitle,
                { color: isDarkMode ? '#F9FAFB' : '#1F2937' }
              ]}>
                {statusModalData.title}
              </Text>
              <Text style={[
                styles.modalMessage,
                { color: isDarkMode ? '#D1D5DB' : '#6B7280' }
              ]}>
                {statusModalData.message}
              </Text>

              {statusModalData.confirm ? (
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#6B7280' }]}
                    onPress={() => setStatusModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>{statusModalData.confirm.cancelText || 'Cancel'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#FF3B30' }]}
                    onPress={() => {
                      setStatusModalVisible(false);
                      setTimeout(() => { try { statusModalData.confirm?.onConfirm(); } catch { /* noop */ } }, 120);
                    }}
                  >
                    <Text style={styles.modalButtonText}>{statusModalData.confirm.confirmText || 'Delete'}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.modalButton, 
                    { 
                      backgroundColor: 
                        statusModalData.type === 'success' ? '#4CAF50' :
                        statusModalData.type === 'error' ? '#FF3B30' : '#007AFF'
                    }
                  ]}
                  onPress={() => setStatusModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>

        {/* New Message Button */}
        <View>
          <TouchableOpacity
            testID="new-message-button"
            style={styles.newMessageButton}
            onPress={() => {
              if (!userId) {
                showStatusModal('error', 'Authentication Required', 'Please sign in to send messages');
                return;
              }
              router.push("../messages/new-message");
            }}
          >
            <LinearGradient
              colors={["#5296EA", "#489EEA", "#459EEA", "#4896EA"]}
              style={styles.newMessageButtonGradient}
            >
              <Text style={[styles.newMessageButtonText, { color: '#FFF' }]}>+ New Message</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.icon}
            style={styles.searchIcon}
          />
          <TextInput
            testID="messages-search"
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.textSecondary}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={theme.colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results Info */}
        {!!searchQuery.trim() && (
          <View style={styles.searchResultsInfo}>
            <Text style={[styles.searchResultsText, { color: theme.colors.textSecondary }]}>
              {filteredConversations.length === 0 
                ? "No conversations found" 
                : (() => {
                    const conversationText = filteredConversations.length === 1 ? '' : 's';
                    return `Found ${filteredConversations.length} conversation${conversationText}`;
                  })()
              }
            </Text>
            <TouchableOpacity onPress={clearSearch}>
              <Text style={[styles.clearSearchText, { color: theme.colors.primary }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Connection Status removed per request */}

        {/* Conversation List */}
        <View style={[styles.conversationContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight }]}>
          <ScrollView
            style={styles.conversationList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
              />
            }
          >
            {filteredConversations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons 
                  name={searchQuery.trim() ? "search-outline" : "chatbubble-outline"} 
                  size={64} 
                  color={theme.colors.iconDisabled} 
                />
                <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
                  {searchQuery.trim() 
                    ? "No conversations found" 
                    : "No conversations yet"
                  }
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                  {searchQuery.trim() 
                    ? "Try adjusting your search terms"
                    : "Start a new conversation to begin messaging"
                  }
                </Text>
                {searchQuery.trim() ? (
                  <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                    onPress={clearSearch}
                  >
                    <Text style={styles.retryButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                    onPress={loadConversations}
                  >
                    <Text style={styles.retryButtonText}>Refresh</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredConversations.map((conversation) => {
                return (
                <TouchableOpacity
                  key={conversation.id}
                  style={[styles.conversationItem, { borderBottomColor: theme.colors.borderLight }]}
                  onPress={() => {
                    if (!userId) {
                      showStatusModal('error', 'Authentication Required', 'Please sign in to view messages');
                      return;
                    }
                    // Persistently clear unread via backend mark-read endpoint, and optimistically update UI
                    (async () => {
                      try {
                        await fetch(`${API_BASE_URL}/api/messages/conversations/${conversation.id}/mark-read`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ clerkUserId: userId })
                        });
                      } catch (_e) { /* ignore transient errors */ }
                    })();
                    // Record as recently read to suppress unread flicker for a short window
                    recentlyReadRef.current[conversation.id] = Date.now();
                    setConversations((prev) => prev.map((c) => c.id === conversation.id ? { ...c, unread_count: 0 } : c));
                    setFilteredConversations((prev) => prev.map((c) => c.id === conversation.id ? { ...c, unread_count: 0 } : c));

                    // Determine other participant to pass initial presence
                    const otherParticipants = conversation.participants.filter((p) => p.clerk_user_id !== userId);
                    const other = otherParticipants[0];
                    const otherAvatar = other ? getAvatarDisplay([other as any]) : { type: 'text', value: '' } as const;
                    const initialPresence = (other?.presence as any) || (other?.online ? 'online' : 'offline');

                    router.push({
                      pathname: "../messages/message-chat-screen",
                      params: {
                        id: conversation.id,
                        title: getDisplayName(conversation),
                        channelUrl: conversation.channel_url || "",
                        initialOnline: other?.online ? "1" : "0",
                        initialLastActive: other?.last_active_at || "",
                        otherClerkId: other?.clerk_user_id || "",
                        profileImageUrl: otherAvatar.type === 'image' ? otherAvatar.value : "",
                        initialPresence: initialPresence,
                      },
                    });
                  }}
                  onLongPress={() => {
                    if (!userId) return;
                    showConfirm(
                      'Delete conversation',
                      'This will remove the conversation from your inbox. Continue?',
                      async () => {
                        try {
                          const res = await fetch(`${API_BASE_URL}/api/messages/conversations/${conversation.id}?clerkUserId=${encodeURIComponent(String(userId))}`, { method: 'DELETE' });
                          if (res.ok) {
                            setConversations((prev) => prev.filter((c) => c.id !== conversation.id));
                            setFilteredConversations((prev) => prev.filter((c) => c.id !== conversation.id));
                            showStatusModal('success', 'Deleted', 'Conversation removed');
                          } else {
                            showStatusModal('error', 'Delete failed', 'Unable to delete this conversation');
                          }
                        } catch (_e) {
                          showStatusModal('error', 'Network error', 'Please try again.');
                        }
                      },
                      { confirmText: 'Delete', cancelText: 'Cancel' }
                    );
                  }}
                >
                  <View style={styles.avatarContainer}>
                    {(() => {
                      const avatar = getAvatarDisplay(
                        conversation.participants
                      );
                      if (avatar.type === "image") {
                        return (
                          <Image
                            source={{ uri: avatar.value }}
                            style={styles.avatar}
                          />
                        );
                      } else {
                        return (
                          <View style={[styles.initialsAvatar, { backgroundColor: theme.colors.primary }]}>
                            <Text style={styles.initialsText}>
                              {avatar.value}
                            </Text>
                          </View>
                        );
                      }
                    })()}

                    {/* Show presence dot: green online, yellow away, gray offline */}
                    {(() => {
                      const otherParticipants =
                        conversation.participants.filter(
                          (p) => p.clerk_user_id !== userId
                        );
                      // choose first other participant's presence
                      const presence = otherParticipants[0]?.presence || (otherParticipants[0]?.online ? 'online' : 'offline');
                      const color = presence === 'online'
                        ? theme.colors.primary
                        : presence === 'away'
                          ? '#FFC107'
                          : theme.colors.iconDisabled;

                      return (
                        <View
                          testID={`online-indicator-${conversation.id}`}
                          style={[
                            styles.onlineIndicator,
                            {
                              backgroundColor: color,
                              borderColor: theme.colors.surface,
                            },
                          ]}
                        />
                      );
                    })()}
                  </View>
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={[styles.conversationName, { color: theme.colors.text }]}>
                        {getDisplayName(conversation)}
                      </Text>
                      <Text style={[styles.conversationTime, { color: theme.colors.textSecondary }]}>
                        {formatTime(conversation.updated_at)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.conversationMessage,
                        { color: theme.colors.textSecondary },
                        conversation.unread_count > 0 && { color: theme.colors.text },
                      ]}
                      numberOfLines={1}
                    >
                      {conversation.last_message || "No messages yet"}
                    </Text>
                    <Text style={[styles.participantsText, { color: theme.colors.textSecondary }]}>
                      {conversation.participants.length === 1
                        ? conversation.participants[0]?.email ?? "Unknown Email"
                        : `${conversation.participants.length} participants`}
                    </Text>
                  </View>
                  {conversation.unread_count > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                      <Text style={styles.unreadCount}>
                        {conversation.unread_count > 99
                          ? "99+"
                          : conversation.unread_count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
              })
            )}
          </ScrollView>
        </View>

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </CurvedBackground>
    </SafeAreaView>
  );
}

// Styles function that accepts scaledFontSize for dynamic text sizing
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: scaledFontSize(16),
  },
  statusContainer: {
    alignItems: "center",
    marginTop: 5,
  },
  statusSubtitle: {
    fontSize: scaledFontSize(14),
    fontStyle: "italic",
  },
  statusText: {
    marginTop: 5,
    fontSize: scaledFontSize(14),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    marginTop: 10,
    margin: 15,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "grey",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: scaledFontSize(16),
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  searchResultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  searchResultsText: {
    fontSize: scaledFontSize(14),
    fontStyle: 'italic',
  },
  clearSearchText: {
    fontSize: scaledFontSize(14),
    fontWeight: "600",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    padding: 8,
    borderRadius: 20,
    justifyContent: "center",
    marginBottom: 10,
    gap: 8,
  },
  statusIndicatorText: {
    color: "#FFF",
    fontSize: scaledFontSize(12),
    fontWeight: "600",
  },
  conversationContainer: {
    flex: 1,
    borderWidth: 1,
    margin: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 10,
    marginBottom: 100,
    marginTop: 5,
  },
  conversationList: {
    flex: 1,
    paddingHorizontal: 5,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: scaledFontSize(18),
    marginTop: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: scaledFontSize(14),
    marginTop: 8,
    textAlign: "center",
    marginHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: scaledFontSize(14),
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: 10,
    paddingTop: 3,
    borderBottomWidth: 1,
    width: "100%",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 60,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: scaledFontSize(13),
    fontWeight: "800",
  },
  conversationTime: {
    fontSize: scaledFontSize(12),
    fontStyle: "italic",
  },
  conversationMessage: {
    fontSize: scaledFontSize(14),
    marginBottom: 2,
  },
  unreadMessage: {
    fontWeight: "500",
  },
  participantsText: {
    fontSize: scaledFontSize(12),
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: "#FFF",
    fontSize: scaledFontSize(12),
    fontWeight: "bold",
  },
  newMessageButton: {
    marginHorizontal: 40,
    marginTop: 10,
    marginBottom: 15,
    shadowColor: "grey",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  newMessageButtonGradient: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  newMessageButtonText: {
    fontSize: scaledFontSize(16),
    fontWeight: "800",
  },
  initialsAvatar: {
    width: 60,
    height: 60,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(18),
    fontWeight: "600",
  },
  offlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: scaledFontSize(28),
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  modalMessage: {
    fontSize: scaledFontSize(16),
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  modalButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 140,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(17),
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});