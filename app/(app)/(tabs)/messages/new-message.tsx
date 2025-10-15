/* eslint-disable react-hooks/exhaustive-deps */
/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState, useEffect, useCallback } from "react";
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

const { width } = Dimensions.get("window");

/**
 * MessagesScreen Component
 *
 * Screen for viewing and managing messages with contacts. Features a search bar,
 * contact list with online status indicators, and navigation to individual chat screens.
 */
export default function NewMessagesScreen() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessageModalVisible, setNewMessageModalVisible] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [filteredConversations, setFilteredConversations] = useState<any[]>([]);

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

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
      const initialized = await messagingService.initializeSendBird(userId);
      if (initialized) {
        await loadConversationsAndContacts();
      }
    } catch (error) {
      console.error("Failed to initialize messaging:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const loadConversationsAndContacts = async () => {
    if (!userId) {
      console.error("User ID is null or undefined");
      return;
    }
    const conversationsResult = await messagingService.getConversations(userId);
    if (conversationsResult.success) {
      setConversations(conversationsResult.data);
      setFilteredConversations(conversationsResult.data);
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
        return { type: "image", value: firstParticipant.profile_image_url };
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
      return { type: "image", value: displayParticipant.profile_image_url };
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
        
        // Navigate to the new chat
        router.push(`../messages/message-chat-screen?id=${result.data.id}&title=${encodeURIComponent(contact.first_name + ' ' + contact.last_name)}`);
        
        // Refresh conversations
        initializeMessaging();
      } else {
        Alert.alert("Error", "Failed to start conversation");
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
      Alert.alert("Error", "Failed to start conversation");
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
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading messages...</Text>
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
    <View style={bottomNavStyles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={bottomNavStyles.tab}
          onPress={() => onTabPress(tab.id)}
        >
          <Ionicons
            name={tab.icon as any}
            size={24}
            color={activeTab === tab.id ? "#2EA78F" : "#9E9E9E"}
          />
          <Text
            style={[
              bottomNavStyles.tabText,
              { color: activeTab === tab.id ? "#2EA78F" : "#9E9E9E" },
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
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="Messages" 
          showBack={true}
          rightActions={
            <TouchableOpacity onPress={() => setNewMessageModalVisible(true)}>
              <Ionicons name="add" size={24} color="#333" />
            </TouchableOpacity>
          }
        />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9E9E9E"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9E9E9E"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results Info */}
        {!!searchQuery.trim() && (
          <View style={styles.searchResultsInfo}>
            <Text style={styles.searchResultsText}>
              {filteredConversations.length === 0 
                ? "No conversations found" 
                : `Found ${filteredConversations.length} conversation${filteredConversations.length === 1 ? '' : 's'}`
              }
            </Text>
            <TouchableOpacity onPress={clearSearch}>
              <Text style={styles.clearSearchText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contact List */}
        <ScrollView style={styles.contactList}>
          <Text style={styles.sectionTitle}>
            {searchQuery.trim() ? "Search Results" : "Recent Conversations"}
          </Text>
          {filteredConversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name={searchQuery.trim() ? "search-outline" : "chatbubble-outline"} 
                size={64} 
                color="#CCCCCC" 
              />
              <Text style={styles.emptyStateText}>
                {searchQuery.trim() ? "No conversations found" : "No conversations yet"}
              </Text>
              <Text style={styles.emptyStateSubtext}>
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

              return (
                <TouchableOpacity
                  key={conversation.id}
                  style={styles.contactItem}
                  onPress={() =>
                    router.push(`../messages/message-chat-screen?id=${conversation.id}&title=${encodeURIComponent(displayName)}`)
                  }
                >
                  <View style={styles.avatarContainer}>
                    {avatar.type === "image" ? (
                      <Image
                        source={{ uri: avatar.value }}
                        style={styles.contactAvatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {avatar.value}
                        </Text>
                      </View>
                    )}
                    {isOnline && (
                      <View style={styles.onlineIndicator} />
                    )}
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{displayName}</Text>
                    <Text style={styles.contactMessage}>
                      {conversation.last_message || 'No messages yet'}
                    </Text>
                  </View>
                  <View style={styles.timestampContainer}>
                    <Text style={styles.timestamp}>
                      {conversation.last_message_time ? 
                        formatTime(conversation.last_message_time) : ''
                      }
                    </Text>
                    {conversation.unread_count > 0 && (
                      <View style={styles.unreadBadge}>
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
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>New Message</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Search for Users */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color="#9E9E9E"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by email address..."
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  // handleSearchUsers will be called via useEffect debounce
                }}
                placeholderTextColor="#9E9E9E"
                autoFocus={true}
              />
            </View>

            <ScrollView style={styles.searchResults}>
              {searching ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                </View>
              ) : (
                <>
                  {searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.searchResultItem}
                        onPress={() => startNewConversation(user)}
                      >
                        <View style={styles.avatarContainer}>
                          {user.profile_image_url ? (
                            <Image
                              source={{ uri: user.profile_image_url }}
                              style={styles.contactAvatar}
                            />
                          ) : (
                            <View style={styles.avatarPlaceholder}>
                              <Text style={styles.avatarText}>
                                {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          {user.online && <View style={styles.onlineIndicator} />}
                        </View>
                        <View style={styles.contactInfo}>
                          <Text style={styles.contactName}>
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}`
                              : user.email
                            }
                          </Text>
                          <Text style={styles.contactEmail}>{user.email}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
                      </TouchableOpacity>
                    ))
                  ) : (
                    searchQuery.trim() && (
                      <View style={styles.centered}>
                        <Text style={styles.noResultsText}>No users found</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
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
    fontSize: 20,
    fontWeight: "600",
    color: "#2E7D32",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
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
    fontSize: 16,
    color: "#333",
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
  contactList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9E9E9E",
    marginBottom: 15,
    marginTop: 10,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
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
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginBottom: 4,
  },
  contactMessage: {
    fontSize: 14,
    color: "#666",
  },
  contactEmail: {
    fontSize: 14,
    color: "#999",
  },
  timestampContainer: {
    alignItems: "flex-end",
  },
  timestamp: {
    fontSize: 12,
    color: "#9E9E9E",
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
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
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
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
    borderBottomColor: "#F0F0F0",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  noResultsText: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
  },
});

const bottomNavStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
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