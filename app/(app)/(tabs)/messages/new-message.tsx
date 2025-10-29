/* eslint-disable react-hooks/exhaustive-deps */
/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Image,
  Modal,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import { messagingService, Contact } from "../../../../utils/sendbirdService";
import { useTheme } from "../../../../contexts/ThemeContext";
import { getApiBaseUrl } from "../../../../utils/apiBaseUrl";
import { APP_TIME_ZONE } from "../../../../utils/timezone";

const { width } = Dimensions.get("window");

/**
 * MessagesScreen Component
 *
 * Screen for viewing and managing messages with contacts. Features a search bar,
 * contact list with online status indicators, and navigation to individual chat screens.
 */
export default function NewMessagesScreen() {
  const { theme, scaledFontSize, isDarkMode, fontScale } = useTheme();
  const { userId } = useAuth();
  const API_BASE_URL = getApiBaseUrl();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessageModalVisible, setNewMessageModalVisible] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [filteredConversations, setFilteredConversations] = useState<any[]>([]);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalData, setStatusModalData] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

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
    setStatusModalData({ type, title, message });
    setStatusModalVisible(true);
  };

  useEffect(() => {
    initializeMessaging();
  }, [userId]);

  useEffect(() => {
    filterConversations();
  }, [searchQuery, conversations, userId]);

  const initializeMessaging = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      // Try to initialize SendBird (if configured); otherwise we'll use backend
      try {
        const accessToken = process.env.EXPO_PUBLIC_SENDBIRD_ACCESS_TOKEN;
        const sbInitialized = await messagingService.initializeSendBird(
          userId,
          accessToken,
          "https://ui-avatars.com/api/?name=User&background=666&color=fff&size=60"
        );
        console.log("💬 [NewMessages] SendBird initialized:", sbInitialized);
      } catch (e) {
        console.log("💬 [NewMessages] SendBird init skipped/fallback", e);
      }
      // Load from backend (or SendBird via wrapper if available)
      console.log("💬 [NewMessages] initializeMessaging for user:", userId);
      await loadConversationsAndContacts();
    } catch (error) {
      console.error("Failed to initialize messaging:", error);
      showStatusModal('error', 'Load Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadConversationsAndContacts = async () => {
    if (!userId) {
      console.error("User ID is null or undefined");
      return;
    }
    console.log("💬 [NewMessages] Loading conversations for:", userId);
    const conversationsResult = await messagingService.getConversations(userId);
    console.log("💬 [NewMessages] Conversations result:", {
      success: conversationsResult.success,
      count: conversationsResult.data?.length || 0,
      sample: conversationsResult.data?.[0] ? {
        id: conversationsResult.data[0].id,
        participants: conversationsResult.data[0].participants?.map(p => p.clerk_user_id)
      } : null
    });
    if (conversationsResult.success) {
      let convs = conversationsResult.data || [];
      // Fallback: if empty, try direct backend fetch (cache-busted) just in case
      if (convs.length === 0) {
        try {
          const resp = await fetch(`${API_BASE_URL}/api/messages/conversations/${userId}?t=${Date.now()}`);
          if (resp.ok) {
            const json = await resp.json();
            console.log("💬 [NewMessages] Fallback fetch conversations count:", json?.data?.length || 0);
            convs = json?.data || [];
          } else {
            console.log("💬 [NewMessages] Fallback fetch failed with status:", resp.status);
          }
        } catch (e) {
          console.log("💬 [NewMessages] Fallback fetch error:", e);
        }
      }
      setConversations(convs);
      setFilteredConversations(convs);
    } else {
      console.log("💬 [NewMessages] getConversations did not succeed");
    }

    const contactsResult = await messagingService.getContacts(userId);
    if (contactsResult.success) {
      setContacts(contactsResult.data);
    }
  };

  const filterConversations = () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conversation =>
      matchConversation(conversation, searchQuery, userId || "")
    );

    setFilteredConversations(filtered);
  };

  const matchConversation = (conversation: any, query: string, userId: string) => {
    const searchLower = query.toLowerCase().trim();
    const otherParticipants = conversation.participants?.filter(
      (p: any) => p.clerk_user_id?.toString().trim() !== userId?.toString().trim()
    ) || [];

    const hasMatchingParticipant = otherParticipants.some((p: any) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchLower) ||
      p.first_name?.toLowerCase().includes(searchLower) ||
      p.last_name?.toLowerCase().includes(searchLower)
    );

    const hasMatchingTitle = conversation.title?.toLowerCase().includes(searchLower);
    const hasMatchingLastMessage = conversation.last_message?.toLowerCase().includes(searchLower);
    const hasMatchingEmail = otherParticipants.some((p: any) =>
      p.email?.toLowerCase().includes(searchLower)
    );

    return hasMatchingParticipant || hasMatchingTitle || hasMatchingLastMessage || hasMatchingEmail;
  };

  /**
   * Search users by email with debouncing
   */
  const handleSearchUsers = useCallback(async (query: string) => {
    if (!userId || !query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const result = await messagingService.searchUsers(userId, query);
      if (result.success) {
        setSearchResults(result.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [userId]);

  /**
   * Debounced search for modal
   */
  useEffect(() => {
    if (!newMessageModalVisible) return;

    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, newMessageModalVisible, handleSearchUsers]);

  /**
   * Get display name for conversation (showing other participants, not current user)
   */
  const getDisplayName = (conversation: any) => {
    if (!userId) {
      return conversation.title || "Unknown User";
    }

    // Filter out current user from participants
    const otherParticipants = conversation.participants?.filter(
      (p: any) => p.clerk_user_id?.toString().trim() !== userId.toString().trim()
    ) || [];

    // If there are other participants, show their names
    if (otherParticipants.length > 0) {
      const fullNames = otherParticipants
        .map((p: any) => {
          const firstName = p.first_name || '';
          const lastName = p.last_name || '';
          return `${firstName} ${lastName}`.trim();
        })
        .filter((name: string) => name.length > 0) // Remove empty names
        .join(", ");
      
      return fullNames || "Unknown User";
    }

    // Fallback to conversation title
    if (conversation.title) {
      return conversation.title;
    }

    return "Unknown User";
  };

  /**
   * Get avatar for conversation (showing other participants, not current user)
   */
  const getAvatarDisplay = (participants: any[]) => {
    if (!userId) {
      const firstParticipant = participants[0];
      if (firstParticipant?.profile_image_url) {
        const raw = firstParticipant.profile_image_url as string;
        let normalized = raw;
        if (raw.startsWith('http')) {
          normalized = raw;
        } else if (raw.startsWith('/')) {
          normalized = `${API_BASE_URL}${raw}`;
        } else if (raw.startsWith('data:image')) {
          normalized = `${API_BASE_URL}/api/users/${encodeURIComponent(firstParticipant.clerk_user_id || '')}/profile-image`;
        }
        return { type: "image", value: normalized };
      }
      const initials = getUserInitials(
        firstParticipant?.first_name,
        firstParticipant?.last_name
      );
      return { type: "text", value: initials };
    }

    // Get other participants (not current user)
    const otherParticipants = participants.filter(
      (p: any) => p.clerk_user_id?.toString().trim() !== userId.toString().trim()
    );

    const displayParticipant = otherParticipants.length > 0 
      ? otherParticipants[0] 
      : participants[0];

    // If profile image exists, return URL
    if (displayParticipant?.profile_image_url) {
      const raw = displayParticipant.profile_image_url as string;
      let normalized = raw;
      if (raw.startsWith('http')) {
        normalized = raw;
      } else if (raw.startsWith('/')) {
        normalized = `${API_BASE_URL}${raw}`;
      } else if (raw.startsWith('data:image')) {
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

  /**
   * Get user initials for avatar
   */
  const getUserInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  /**
   * Check if other participant is online
   */
  const isOtherParticipantOnline = (participants: any[]) => {
    if (!userId) return false;

    const otherParticipants = participants.filter(
      (p: any) => p.clerk_user_id?.toString().trim() !== userId.toString().trim()
    );

    return otherParticipants.some((p: any) => p.online === true);
  };

  /**
   * Start a new conversation with a user
   */
  const startNewConversation = async (contact: Contact) => {
    if (!userId) return;

    try {
      setLoading(true);
      const result = await messagingService.createConversation(userId, {
        participantIds: [contact.clerk_user_id], // Use actual participant ID
        conversationType: 'direct',
        title: `${contact.first_name} ${contact.last_name}`.trim()
      });

      if (result.success) {
        setNewMessageModalVisible(false);
        setSearchQuery("");
        setSearchResults([]);
        
        console.log("📝 Created conversation result:", result.data);
        
        // Compute a safe conversation id; fallback to lookup if non-numeric
        const fullName = `${contact.first_name} ${contact.last_name}`.trim();
        const online = contact.online ? "1" : "0";
        let conversationId = result.data?.id || result.data;

        const isNumericId = typeof conversationId === 'string' && /^\d+$/.test(conversationId);
        if (!isNumericId) {
          try {
            console.log("🔎 Fallback: resolving numeric conversation id via list…");
            const resp = await fetch(`${API_BASE_URL}/api/messages/conversations/${userId}?t=${Date.now()}`);
            if (resp.ok) {
              const json = await resp.json();
              const conv = (json?.data || []).find((c: any) =>
                Array.isArray(c.participants) && c.participants.some((p: any) => p.clerk_user_id === contact.clerk_user_id)
              );
              if (conv?.id) {
                conversationId = conv.id;
                console.log("✅ Resolved conversation id:", conversationId);
              }
            }
          } catch (e) {
            console.log("❌ Fallback resolution failed:", e);
          }
        }

        if (!conversationId || !(typeof conversationId === 'string') || !/^\d+$/.test(conversationId)) {
          showStatusModal('error', 'Create Error', 'Failed to create conversation. Please try again.');
        } else {
          console.log("🔗 Navigating to chat with ID:", conversationId);
          router.push({
            pathname: `../messages/message-chat-screen`,
            params: {
              id: conversationId,
              title: fullName,
              otherClerkId: contact.clerk_user_id,
              initialOnline: online,
              initialLastActive: contact.last_active_at || "",
              profileImageUrl: contact.profile_image_url || "",
            }
          });
          // Refresh conversations after navigation kickoff
          initializeMessaging();
        }
      } else {
        showStatusModal('error', 'Create Error', 'Failed to start conversation');
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
      showStatusModal('error', 'Create Error', 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles tab navigation between different app sections
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  /**
   * Clear search and close modal
   */
  const handleCloseModal = () => {
    setNewMessageModalVisible(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  /**
   * Clear search query
   */
  const clearSearch = () => {
    setSearchQuery("");
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading messages...</Text>
      </View>
    );
  }

  // Moved BottomNavigation component outside of MessagesScreen
  const BottomNavigation = ({
    tabs,
    activeTab,
    onTabPress,
  }: {
    tabs: Array<{ id: string; name: string; icon: string }>;
    activeTab: string;
    onTabPress: (tabId: string) => void;
  }) => (
    <View style={[bottomNavStyles.container, { backgroundColor: theme.colors.surface }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={bottomNavStyles.tab}
          onPress={() => onTabPress(tab.id)}
        >
          <Ionicons
            name={tab.icon as any}
            size={24}
            color={activeTab === tab.id ? theme.colors.primary : theme.colors.iconDisabled}
          />
          <Text
            style={[
              bottomNavStyles.tabText,
              { color: activeTab === tab.id ? theme.colors.primary : theme.colors.iconDisabled },
            ]}
          >
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Status Modal */}
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
            </View>
          </View>
        </Modal>

        <AppHeader 
          title="Messages" 
          showBack={true}
          rightActions={
            <TouchableOpacity onPress={() => setNewMessageModalVisible(true)}>
              <Ionicons name="add" size={24} color={theme.colors.icon} />
            </TouchableOpacity>
          }
        />

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.icon}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.textSecondary}
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
                : `Found ${filteredConversations.length} conversation${filteredConversations.length === 1 ? '' : 's'}`
              }
            </Text>
            <TouchableOpacity onPress={clearSearch}>
              <Text style={[styles.clearSearchText, { color: theme.colors.primary }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact List */}
        <ScrollView style={styles.contactList}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            {searchQuery.trim() ? "Search Results" : "Recent Conversations"}
          </Text>
          {filteredConversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name={searchQuery.trim() ? "search-outline" : "chatbubble-outline"} 
                size={64} 
                color={theme.colors.iconDisabled} 
              />
              <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
                {searchQuery.trim() ? "No conversations found" : "No conversations yet"}
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                {searchQuery.trim() 
                  ? "Try adjusting your search terms" 
                  : "Start a new conversation by tapping the + button"
                }
              </Text>
            </View>
          ) : (
            filteredConversations.map((conversation) => {
              const avatar = getAvatarDisplay(conversation.participants || []);
              const displayName = getDisplayName(conversation);
              const isOnline = isOtherParticipantOnline(conversation.participants || []);
              const otherParticipant = (conversation.participants || []).find((p: any) => p.clerk_user_id !== userId);

              return (
                <TouchableOpacity
                  key={conversation.id}
                  style={[styles.contactItem, { borderBottomColor: theme.colors.borderLight }]}
                  onPress={() =>
                    router.push({
                      pathname: `../messages/message-chat-screen`,
                      params: {
                        id: conversation.id,
                        title: displayName,
                        otherClerkId: otherParticipant?.clerk_user_id || "",
                        initialOnline: isOnline ? "1" : "0",
                        initialLastActive: otherParticipant?.last_active_at || "",
                        profileImageUrl: otherParticipant?.profile_image_url || "",
                        initialPresence: (otherParticipant?.presence as any) || (isOnline ? 'online' : 'offline'),
                      }
                    })
                  }
                >
                  <View style={styles.avatarContainer}>
                    {avatar.type === "image" ? (
                      <Image
                        source={{ uri: avatar.value }}
                        style={styles.contactAvatar}
                      />
                    ) : (
                      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.avatarText}>
                          {avatar.value}
                        </Text>
                      </View>
                    )}
                    {isOnline && (
                      <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]} />
                    )}
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactName, { color: theme.colors.text }]}>{displayName}</Text>
                    <Text style={[styles.contactMessage, { color: theme.colors.textSecondary }]}>
                      {conversation.last_message || 'No messages yet'}
                    </Text>
                  </View>
                  <View style={styles.timestampContainer}>
                    <Text style={[styles.timestamp, { color: theme.colors.textSecondary }]}>
                      {conversation.last_message_time ? 
                        formatTime(conversation.last_message_time) : ''
                      }
                    </Text>
                    {conversation.unread_count > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: theme.colors.primary }]}>
                        <Text style={styles.unreadCount}>
                          {conversation.unread_count}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* New Message Modal */}
        <Modal
          visible={newMessageModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.borderLight }] }>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color={theme.colors.icon} />
              </TouchableOpacity>
              <Text style={[styles.newMessageModalTitle, { color: theme.colors.text }]}>New Message</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Search for Users */}
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
              <Ionicons
                name="search"
                size={20}
                color={theme.colors.icon}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder="Search by email address..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  // handleSearchUsers will be called via useEffect debounce
                }}
                placeholderTextColor={theme.colors.textSecondary}
                autoFocus={true}
              />
            </View>

            <ScrollView style={styles.searchResults}>
              {searching ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : (
                <>
                  {searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[styles.searchResultItem, { borderBottomColor: theme.colors.borderLight }]}
                        onPress={() => startNewConversation(user)}
                      >
                        <View style={styles.avatarContainer}>
                          {user.profile_image_url ? (
                            <Image
                              source={{ uri: user.profile_image_url }}
                              style={styles.contactAvatar}
                            />
                          ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                              <Text style={styles.avatarText}>
                                {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          {user.online && <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]} />}
                        </View>
                        <View style={styles.contactInfo}>
                          <Text style={[styles.contactName, { color: theme.colors.text }]}>
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.email
                            }
                          </Text>
                          <Text style={[styles.contactEmail, { color: theme.colors.textSecondary }]}>{user.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.icon} />
                      </TouchableOpacity>
                    ))
                  ) : (
                    searchQuery.trim() && (
                      <View style={styles.centered}>
                        <Text style={[styles.noResultsText, { color: theme.colors.textSecondary }]}>No users found</Text>
                      </View>
                    )
                  )}
                </>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </CurvedBackground>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
    color: "#2E7D32",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
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
    fontWeight: '600',
  },
  contactList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    marginBottom: 15,
    marginTop: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(18),
    fontWeight: "600",
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
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: scaledFontSize(16),
    fontWeight: "500",
    marginBottom: 4,
  },
  contactMessage: {
    fontSize: scaledFontSize(14),
  },
  contactEmail: {
    fontSize: scaledFontSize(14),
  },
  timestampContainer: {
    alignItems: "flex-end",
  },
  timestamp: {
    fontSize: scaledFontSize(12),
    marginBottom: 4,
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(12),
    fontWeight: "600",
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
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  newMessageModalTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 15,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  noResultsText: {
    textAlign: "center",
    fontSize: scaledFontSize(16),
  },
  // Status Modal Styles
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

const bottomNavStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    alignItems: "center",
    padding: 8,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
  },
});