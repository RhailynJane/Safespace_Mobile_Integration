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
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Contact } from "../../../../utils/sendbirdService"; // Keep types only; rely on Convex for actual messaging logic
import { useTheme } from "../../../../contexts/ThemeContext";
import { getApiBaseUrl } from "../../../../utils/apiBaseUrl";
import { getAvatarSource } from "../../../../utils/avatar";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";

/**
 * MessagesScreen Component
 *
 * Screen for viewing and managing messages with contacts. Features a search bar,
 * contact list with online status indicators, and navigation to individual chat screens.
 */
export default function NewMessagesScreen() {
  const { theme, scaledFontSize, isDarkMode, fontScale } = useTheme();
  const { userId, getToken } = useAuth();
  const API_BASE_URL = getApiBaseUrl();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<Contact[]>([]);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalData, setStatusModalData] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  // Shared Convex client
  const convex = useConvex();

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [fontScale]);

  const showStatusModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setStatusModalData({ type, title, message });
    setStatusModalVisible(true);
  };

  // Load suggested users on mount
  useEffect(() => {
    if (!searchQuery.trim()) {
      loadSuggestedUsers();
    }
  }, []);

  const loadSuggestedUsers = async () => {
    if (!userId) return;
    try {
      const results = await convex.query(api.profiles.searchUsers, { term: '', limit: 20 });
      const mapped: Contact[] = (results || []).map((r: any) => ({
        id: r.clerkId,
        clerk_user_id: r.clerkId,
        first_name: r.firstName || '',
        last_name: r.lastName || '',
        email: r.email || '',
        profile_image_url: r.imageUrl || '',
        online: false,
        last_active_at: '',
        role: 'user',
        has_existing_conversation: false,
      }));
      setSuggestedUsers(mapped.filter(u => u.clerk_user_id !== userId)); // Exclude self
    } catch (error) {
      console.error('Failed to load suggested users:', error);
      setSuggestedUsers([]);
    }
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
      // Convex user search
      const results = await convex.query(api.profiles.searchUsers, { term: query, limit: 20 });
      const mapped: Contact[] = (results || []).map((r: any) => ({
        id: r.clerkId,
        clerk_user_id: r.clerkId,
        first_name: r.firstName || '',
        last_name: r.lastName || '',
        email: r.email || '',
        profile_image_url: r.imageUrl || '',
        online: false,
        last_active_at: '',
        role: 'user',
        has_existing_conversation: false,
      }));
      setSearchResults(mapped);
    } catch (error) {
      console.error('Search failed (Convex):', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [userId, convex]);

  /**
   * Debounced search
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearchUsers]);

  /**
   * Start a new conversation with a user
   */
  const startNewConversation = async (contact: Contact) => {
    if (!userId) return;

    try {
      setLoading(true);
      const fullName = `${contact.first_name} ${contact.last_name}`.trim();
      const online = contact.online ? "1" : "0";
      // Create conversation via Convex and get id
      const res = await convex.mutation(api.conversations.create, {
        title: fullName || undefined,
        participantIds: [contact.clerk_user_id],
      });
      const conversationId = res?.conversationId as string | undefined;
      if (!conversationId) {
        showStatusModal('error', 'Create Error', 'Failed to start conversation');
        return;
      }

      setSearchQuery("");
      setSearchResults([]);
      router.replace({
        pathname: `/(app)/(tabs)/messages/message-chat-screen`,
        params: {
          id: String(conversationId),
          title: fullName,
          otherClerkId: contact.clerk_user_id,
          initialOnline: online,
          initialLastActive: contact.last_active_at || "",
          profileImageUrl: contact.profile_image_url || "",
        }
      });
      // No manual reload needed; live subscription will reflect new conversation
    } catch (error) {
      console.error("Failed to create conversation:", error);
      showStatusModal('error', 'Create Error', 'Failed to start conversation');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear search query
   */
  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <>
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

      {/* New Message Modal */}
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView
          edges={["top", "left", "right"]}
          style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.borderLight }]}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={28} color={theme.colors.icon} />
            </TouchableOpacity>
            <Text style={[styles.newMessageModalTitle, { color: theme.colors.text }]}>New message</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* To Field */}
          <View style={[styles.toFieldContainer, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.borderLight }]}>
            <Text style={[styles.toLabel, { color: theme.colors.text }]}>To:</Text>
            <TextInput
              style={[styles.toInput, { color: theme.colors.text }]}
              placeholder="Type a name or email address"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
              }}
              placeholderTextColor={theme.colors.textSecondary}
              autoFocus={true}
            />
          </View>

            {/* Suggested Users Section */}
            <ScrollView style={styles.searchResults}>
              {!searchQuery.trim() && (
                <View>
                  <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>Suggested</Text>
                  {suggestedUsers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={[styles.searchResultItem, { borderBottomColor: theme.colors.borderLight }]}
                      onPress={() => startNewConversation(user)}
                    >
                      <View style={styles.avatarContainer}>
                        {(() => {
                          const avatar = getAvatarSource({
                            profileImageUrl: user.profile_image_url,
                            imageUrl: user.profile_image_url,
                            firstName: user.first_name,
                            lastName: user.last_name,
                            email: user.email,
                            clerkId: user.clerk_user_id,
                            apiBaseUrl: API_BASE_URL,
                          });
                          return avatar.type === 'image' ? (
                            <Image source={{ uri: avatar.value }} style={styles.contactAvatar} />
                          ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                              <Text style={styles.avatarText}>{avatar.value}</Text>
                            </View>
                          );
                        })()}
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
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Search Results */}
              {searchQuery.trim() && (
                <View>
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
                              {(() => {
                                const avatar = getAvatarSource({
                                  profileImageUrl: user.profile_image_url,
                                  imageUrl: user.profile_image_url,
                                  firstName: user.first_name,
                                  lastName: user.last_name,
                                  email: user.email,
                                  clerkId: user.clerk_user_id,
                                  apiBaseUrl: API_BASE_URL,
                                });
                                return avatar.type === 'image' ? (
                                  <Image source={{ uri: avatar.value }} style={styles.contactAvatar} />
                                ) : (
                                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary }]}>
                                    <Text style={styles.avatarText}>{avatar.value}</Text>
                                  </View>
                                );
                              })()}
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
                          </TouchableOpacity>
                        ))
                      ) : (
                        <View style={styles.centered}>
                          <Text style={[styles.noResultsText, { color: theme.colors.textSecondary }]}>No users found</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
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
  toFieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toLabel: {
    fontSize: scaledFontSize(16),
    fontWeight: "500",
    marginRight: 12,
  },
  toInput: {
    flex: 1,
    fontSize: scaledFontSize(16),
    paddingVertical: 8,
  },
  sectionHeader: {
    fontSize: scaledFontSize(14),
    fontWeight: "500",
    paddingHorizontal: 16,
    paddingVertical: 12,
    textTransform: "uppercase",
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