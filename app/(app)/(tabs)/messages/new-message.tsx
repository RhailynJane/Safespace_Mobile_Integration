/* eslint-disable react-hooks/exhaustive-deps */
/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState, useEffect } from "react";
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
export default function MessagesScreen() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessageModalVisible, setNewMessageModalVisible] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Load conversations and initialize SendBird
   */
  useEffect(() => {
    initializeMessaging();
  }, [userId]);

  /**
   * Initialize messaging service and load conversations
   */
  const initializeMessaging = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Initialize SendBird
      const initialized = await messagingService.initializeSendBird(userId);
      
      if (initialized) {
        // Load conversations
        const conversationsResult = await messagingService.getConversations(userId);
        if (conversationsResult.success) {
          setConversations(conversationsResult.data);
        }
        
        // Load contacts
        const contactsResult = await messagingService.getContacts(userId);
        if (contactsResult.success) {
          setContacts(contactsResult.data);
        }
      }
    } catch (error) {
      console.error("Failed to initialize messaging:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search users by email
   */
  const handleSearchUsers = async (query: string) => {
    if (!userId || !query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const result = await messagingService.searchUsers(userId, query);
      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  };

  /**
   * Start a new conversation with a user
   */
  const startNewConversation = async (contact: Contact) => {
    if (!userId) return;

    try {
      setLoading(true);
      const result = await messagingService.createConversation(userId, {
        participantIds: [contact.clerk_user_id],
        conversationType: 'direct',
        title: `${contact.first_name} ${contact.last_name}`.trim()
      });

      if (result.success) {
        setNewMessageModalVisible(false);
        setSearchQuery("");
        setSearchResults([]);
        
        // Navigate to the new chat
        router.push(`../messages/message-chat-screen?id=${result.data.id}&title=${contact.first_name} ${contact.last_name}`);
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
        </View>

        {/* Contact List */}
        <ScrollView style={styles.contactList}>
          <Text style={styles.sectionTitle}>Recent Conversations</Text>
          {conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-outline" size={64} color="#CCCCCC" />
              <Text style={styles.emptyStateText}>No conversations yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start a new conversation by tapping the + button
              </Text>
            </View>
          ) : (
            conversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                style={styles.contactItem}
                onPress={() =>
                  router.push(`../messages/message-chat-screen?id=${conversation.id}&title=${conversation.title}`)
                }
              >
                <View style={styles.avatarContainer}>
                  {conversation.participants[0]?.profile_image_url ? (
                    <Image
                      source={{ uri: conversation.participants[0].profile_image_url }}
                      style={styles.contactAvatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {conversation.title.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {conversation.participants[0]?.online && (
                    <View style={styles.onlineIndicator} />
                  )}
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{conversation.title}</Text>
                  <Text style={styles.contactMessage}>
                    {conversation.last_message || 'No messages yet'}
                  </Text>
                </View>
                <View style={styles.timestampContainer}>
                  <Text style={styles.timestamp}>
                    {conversation.last_message_time ? 
                      new Date(conversation.last_message_time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : ''
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
            ))
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
              <TouchableOpacity 
                onPress={() => {
                  setNewMessageModalVisible(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
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
                  handleSearchUsers(text);
                }}
                placeholderTextColor="#9E9E9E"
                autoFocus={true}
              />
            </View>

            <ScrollView style={styles.searchResults}>
              {searching ? (
                <ActivityIndicator size="small" color="#4CAF50" />
              ) : (
                <>
                  {searchResults.length > 0 && (
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
                  )}
                  {!!(searchResults.length === 0 && searchQuery.trim()) && (
                    <Text style={styles.noResultsText}>No users found</Text>
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
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
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
  noResultsText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
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