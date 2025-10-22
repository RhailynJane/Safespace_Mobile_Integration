/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../../../contexts/ThemeContext";

export default function MessagesScreen() {
  const { theme } = useTheme();
  const { userId } = useAuth(); // Get actual Clerk user ID
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [sendbirdStatus, setSendbirdStatus] =
    useState<string>("Initializing...");
  const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const initializeMessaging = useCallback(async () => {
    if (!userId) {
      console.log("❌ No user ID available");
      setSendbirdStatus("User not authenticated");
      setLoading(false);
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
      await loadConversations();
    }
  }, [userId]);

  useEffect(() => {
    initializeMessaging();
  }, [initializeMessaging]);

  useFocusEffect(
    useCallback(() => {
      console.log("💬 MessagesScreen focused, refreshing conversations");
      loadConversations();
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

      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${userId}`
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`💬 Setting ${result.data.length} conversations`);
        setConversations(result.data);
        setFilteredConversations(result.data); // Initialize filtered conversations

        // DEBUG: Check what online status is being returned
        console.log(
          "🔍 Online status debug:",
          result.data.map((conv: any) => ({
            id: conv.id,
            participants: conv.participants.map((p: any) => ({
              name: `${p.first_name} ${p.last_name}`,
              online: p.online,
              last_active_at: p.last_active_at,
            })),
          }))
        );
      } else {
        console.log("💬 Failed to load conversations from backend");
        setConversations([]);
        setFilteredConversations([]);
      }
    } catch (error) {
      console.error("💬 Error loading conversations:", error);
      setConversations([]);
      setFilteredConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
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

    // If profile image exists, return URL
    if (displayParticipant?.profile_image_url) {
      return { type: "image", value: displayParticipant.profile_image_url };
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
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading messages...</Text>
        <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>{sendbirdStatus}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CurvedBackground>
        <AppHeader title="Messages" showBack={true} />

        {/* New Message Button */}
        <View>
          <TouchableOpacity
            style={styles.newMessageButton}
            onPress={() => {
              if (!userId) {
                Alert.alert("Error", "Please sign in to send messages");
                return;
              }
              router.push("../messages/new-message");
            }}
          >
            <LinearGradient
              colors={["#5296EA", "#489EEA", "#459EEA", "#4896EA"]}
              style={styles.newMessageButtonGradient}
            >
              <Text style={styles.newMessageButtonText}>+ New Message</Text>
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
              <Text style={styles.clearSearchText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Connection Status */}
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: messagingService.isSendBirdEnabled()
                ? "#4CAF50"
                : "#FF9800",
            },
          ]}
        >
          <Ionicons
            name={
              messagingService.isSendBirdEnabled()
                ? "checkmark-circle"
                : "warning"
            }
            size={16}
            color="#FFF"
          />
          <Text style={styles.statusIndicatorText}>{sendbirdStatus}</Text>
        </View>

        {/* Conversation List */}
        <View style={styles.conversationContainer}>
          <ScrollView
            style={styles.conversationList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#4CAF50"]}
              />
            }
          >
            {filteredConversations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons 
                  name={searchQuery.trim() ? "search-outline" : "chatbubble-outline"} 
                  size={64} 
                  color="#CCCCCC" 
                />
                <Text style={styles.emptyStateText}>
                  {searchQuery.trim() 
                    ? "No conversations found" 
                    : "No conversations yet"
                  }
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {searchQuery.trim() 
                    ? "Try adjusting your search terms"
                    : "Start a new conversation to begin messaging"
                  }
                </Text>
                {searchQuery.trim() ? (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={clearSearch}
                  >
                    <Text style={styles.retryButtonText}>Clear Search</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadConversations}
                  >
                    <Text style={styles.retryButtonText}>Refresh</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredConversations.map((conversation) => (
                <TouchableOpacity
                  key={conversation.id}
                  style={styles.conversationItem}
                  onPress={() => {
                    if (!userId) {
                      Alert.alert("Error", "Please sign in to view messages");
                      return;
                    }
                    router.push({
                      pathname: "../messages/message-chat-screen",
                      params: {
                        id: conversation.id,
                        title: getDisplayName(conversation),
                      },
                    });
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
                          <View style={styles.initialsAvatar}>
                            <Text style={styles.initialsText}>
                              {avatar.value}
                            </Text>
                          </View>
                        );
                      }
                    })()}

                    {/* Show green dot if online, gray dot if offline */}
                    {(() => {
                      const otherParticipants =
                        conversation.participants.filter(
                          (p) => p.clerk_user_id !== userId
                        );
                      const isOnline = otherParticipants.some(
                        (p) => p.online === true
                      );

                      return (
                        <View
                          style={[
                            styles.onlineIndicator,
                            isOnline
                              ? styles.onlineIndicator
                              : styles.offlineIndicator,
                          ]}
                        />
                      );
                    })()}
                  </View>
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.conversationName}>
                        {getDisplayName(conversation)}
                      </Text>
                      <Text style={styles.conversationTime}>
                        {formatTime(conversation.updated_at)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.conversationMessage,
                        conversation.unread_count > 0 && styles.unreadMessage,
                      ]}
                      numberOfLines={1}
                    >
                      {conversation.last_message || "No messages yet"}
                    </Text>
                    <Text style={styles.participantsText}>
                      {conversation.participants.length === 1
                        ? conversation.participants[0]?.email ?? "Unknown Email"
                        : `${conversation.participants.length} participants`}
                    </Text>
                  </View>
                  {conversation.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {conversation.unread_count > 99
                          ? "99+"
                          : conversation.unread_count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor removed - now uses theme.colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor removed - now uses theme.colors.background
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    // color removed - now uses theme.colors.text
  },
  statusContainer: {
    alignItems: "center",
    marginTop: 5,
  },
  statusSubtitle: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  statusText: {
    marginTop: 5,
    fontSize: 14,
    color: "#999",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    // backgroundColor removed - now uses theme.colors.surface
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
    fontSize: 16,
    // color removed - now uses theme.colors.text
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
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  clearSearchText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
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
    fontSize: 12,
    fontWeight: "600",
  },
  conversationContainer: {
    flex: 1,
    backgroundColor: "rgba(250, 250, 250, 0.8)",
    borderWidth: 1,
    margin: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 10,
    borderColor: "rgba(0, 0, 0, 0.1)",
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
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
    marginHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: 10,
    paddingTop: 3,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
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
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFF",
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
    fontSize: 13,
    fontWeight: "800",
    color: "#333",
  },
  conversationTime: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#000",
  },
  conversationMessage: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 2,
  },
  unreadMessage: {
    color: "#333",
    fontWeight: "500",
  },
  participantsText: {
    fontSize: 12,
    color: "#999",
  },
  unreadBadge: {
    backgroundColor: "#4CAF50",
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
    fontSize: 12,
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
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
  initialsAvatar: {
    width: 60,
    height: 60,
    borderRadius: 60,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  offlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#9E9E9E",
    borderWidth: 2,
    borderColor: "#FFF",
  },
});