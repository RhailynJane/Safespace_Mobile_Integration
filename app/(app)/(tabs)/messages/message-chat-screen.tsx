import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CurvedBackground from "../../../../components/CurvedBackground";
import {
  Message,
  Participant,
} from "../../../../utils/sendbirdService";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ChatScreen() {
  const { userId } = useAuth();
  const params = useLocalSearchParams();
  const conversationId = params.id as string;
  const conversationTitle = params.title as string;
  const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contact, setContact] = useState<Participant | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get safe area insets for proper spacing
  const insets = useSafeAreaInsets();

  // Calculate header height based on screen size and safe area
  const getHeaderHeight = () => {
    const baseHeight = 60; // Minimum header height
    const safeAreaTop = insets.top;
    
    // Adjust header height based on screen size
    if (SCREEN_HEIGHT > 800) {
      return baseHeight + safeAreaTop + 10; // For larger screens
    } else if (SCREEN_HEIGHT > 600) {
      return baseHeight + safeAreaTop + 5; // For medium screens
    } else {
      return baseHeight + safeAreaTop; // For smaller screens
    }
  };

  const headerHeight = getHeaderHeight();

  // Update user activity
  const updateUserActivity = useCallback(async () => {
    if (!userId) return;

    try {
      await fetch(`${API_BASE_URL}/api/users/${userId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating user activity:", error);
    }
  }, [userId, API_BASE_URL]);

  // Get last seen text with persistent online status
  const getLastSeenText = useCallback((lastActiveAt: string | null, online: boolean) => {
    if (online) return "Online now";

    if (!lastActiveAt) return "Offline";

    const lastActive = new Date(lastActiveAt);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - lastActive.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) return "Online now";
    if (diffMinutes < 60) return `Offline - ${diffMinutes}m ago`;
    if (diffMinutes < 1440)
      return `Offline - ${Math.floor(diffMinutes / 60)}h ago`;
    return `Offline - ${Math.floor(diffMinutes / 1440)}d ago`;
  }, []);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversationId || !userId) {
      console.log("❌ Missing conversationId or userId");
      setLoading(false);
      return;
    }

    try {
      // Update user's activity
      await updateUserActivity();

      console.log(`💬 Loading messages for conversation ${conversationId}, user ${userId}`);
      
      // Use direct backend API instead of messagingService
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}/messages?clerkUserId=${userId}&limit=50`
      );

      if (response.ok) {
        const result = await response.json();
        console.log(`💬 Loaded ${result.data.length} messages`);
        setMessages(result.data);
        
        // Get conversation details to find the other participant with online status
        const conversationsResponse = await fetch(
          `${API_BASE_URL}/api/messages/conversations/${userId}`
        );
        
        if (conversationsResponse.ok) {
          const conversationsResult = await conversationsResponse.json();
          const currentConversation = conversationsResult.data.find(
            (conv: any) => conv.id === conversationId
          );
          
          if (currentConversation) {
            const otherParticipant = currentConversation.participants.find(
              (p: Participant) => p.clerk_user_id !== userId
            );
            if (otherParticipant) {
              setContact(otherParticipant);
              // Set online status once and persist it
              setIsOnline(otherParticipant.online || false);
            }
          }
        }

        // Fallback if no contact found
        if (!contact) {
          const fallbackContact = {
            id: 'unknown',
            clerk_user_id: 'unknown', 
            first_name: conversationTitle?.split(' ')[0] || 'User',
            last_name: conversationTitle?.split(' ').slice(1).join(' ') || '',
            email: '',
            profile_image_url: undefined,
            online: false,
            last_active_at: null
          };
          setContact(fallbackContact);
          setIsOnline(false);
        }
      } else {
        console.error("💬 Failed to load messages:", response.status);
        Alert.alert("Error", "Failed to load messages");
      }
    } catch (error) {
      console.error("💬 Error loading messages:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId, conversationTitle, API_BASE_URL, contact, updateUserActivity]);

  // Load messages with 60-second polling
  useEffect(() => {
    if (!conversationId || !userId) return;

    loadMessages(); // Load immediately

    // Use a longer interval for polling
    const pollInterval = setInterval(() => {
      loadMessages();
    }, 60000); // 60 seconds

    return () => clearInterval(pollInterval);
  }, [conversationId, userId, loadMessages]);

  // Update online status based on last activity (every 10 seconds)
  useEffect(() => {
    if (!contact) return;

    const updateOnlineStatus = () => {
      if (contact.last_active_at) {
        const lastActive = new Date(contact.last_active_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
        
        // Consider online if active in last 3 minutes
        const shouldBeOnline = diffMinutes <= 3;
        if (isOnline !== shouldBeOnline) {
          setIsOnline(shouldBeOnline);
        }
      }
    };

    updateOnlineStatus();
    const statusInterval = setInterval(updateOnlineStatus, 10000); // Check every 10 seconds

    return () => clearInterval(statusInterval);
  }, [contact, isOnline]);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || sending || !userId || !conversationId) {
      return;
    }

    try {
      setSending(true);
      console.log(`💬 Sending message: "${newMessage}"`);

      // Update activity when sending message
      await updateUserActivity();

      // Use direct backend API instead of messagingService
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: userId,
            messageText: newMessage,
            messageType: "text",
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("💬 Message sent successfully");
        setMessages((prev) => [...prev, result.data]);
        setNewMessage("");

        // Reload messages to ensure both parties see the same
        setTimeout(() => loadMessages(), 500);
      } else {
        console.error("💬 Failed to send message:", response.status);
        Alert.alert("Error", "Failed to send message");
      }
    } catch (error) {
      console.error("💬 Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "Just now";

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60 * 1000) {
      return "Just now";
    } else if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  // Get user initials for avatar
  const getUserInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  // Check if message is from current user
  const isMyMessage = (message: Message) => {
    return message.sender.clerk_user_id === userId;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CurvedBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <SafeAreaView style={styles.container}>
          {/* Fixed Header with dynamic height based on screen size */}
          <View style={[styles.headerWrapper, { height: headerHeight }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#2E7D32" />
              </TouchableOpacity>

              <View style={styles.contactInfo}>
                <View style={styles.headerAvatar}>
                  <Text style={styles.headerAvatarText}>
                    {getUserInitials(contact?.first_name, contact?.last_name)}
                  </Text>
                  {/* Online/Offline indicator in header */}
                  <View style={[
                    styles.headerStatusIndicator,
                    isOnline ? styles.onlineIndicator : styles.offlineIndicator
                  ]} />
                </View>
                <View>
                  <Text style={styles.contactName}>{conversationTitle}</Text>
                  <Text style={[
                    styles.contactStatus,
                    isOnline ? styles.onlineStatus : styles.offlineStatus
                  ]}>
                    {contact
                      ? getLastSeenText(contact.last_active_at, isOnline)
                      : "Offline"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push("../appointments/book")}
              >
                <Ionicons name="call-outline" size={24} color="#2E7D32" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat Messages */}
          <ScrollView
            style={styles.messagesContainer}
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>No messages yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start the conversation by sending a message
                </Text>
              </View>
            ) : (
              messages.map((message) => {
                const myMessage = isMyMessage(message);

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageContainer,
                      myMessage
                        ? styles.myMessageContainer
                        : styles.theirMessageContainer,
                    ]}
                  >
                    {/* Other user's avatar (left side) */}
                    {!myMessage && (
                      <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {getUserInitials(
                              message.sender.first_name,
                              message.sender.last_name
                            )}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Message bubble */}
                    <View
                      style={[
                        styles.messageBubble,
                        myMessage ? styles.myMessage : styles.theirMessage,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          myMessage
                            ? styles.myMessageText
                            : styles.theirMessageText,
                        ]}
                      >
                        {message.message_text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          myMessage
                            ? styles.myMessageTime
                            : styles.theirMessageTime,
                        ]}
                      >
                        {formatTime(message.created_at)}
                      </Text>
                    </View>

                    {/* My avatar (right side) */}
                    {myMessage && (
                      <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, styles.myAvatar]}>
                          <Text style={styles.avatarText}>
                            {getUserInitials(
                              message.sender.first_name,
                              message.sender.last_name
                            )}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TouchableOpacity style={styles.attachmentButton}>
                <Ionicons name="attach" size={24} color="#4CAF50" />
              </TouchableOpacity>

              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
                editable={!sending}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (newMessage.trim() === "" || sending) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={newMessage.trim() === "" || sending || !userId}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name="send"
                    size={24}
                    color={newMessage.trim() === "" ? "#9E9E9E" : "#FFFFFF"}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </CurvedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
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
  // Dynamic header wrapper
  headerWrapper: {
    backgroundColor: "transparent",
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 15,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    position: 'relative',
  },
  headerAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerStatusIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  onlineIndicator: {
    backgroundColor: "#4CAF50",
  },
  offlineIndicator: {
    backgroundColor: "#9E9E9E",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
  },
  contactStatus: {
    fontSize: 12,
  },
  onlineStatus: {
    color: "#4CAF50",
  },
  offlineStatus: {
    color: "#666",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 10,
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
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 15,
    maxWidth: "100%",
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#859ce1ff",
    justifyContent: "center",
    alignItems: "center",
  },
  myAvatar: {
    backgroundColor: "#2196F3",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  myMessage: {
    backgroundColor: "#DCF8C6",
    borderTopRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  myMessageText: {
    color: "#000000",
  },
  theirMessageText: {
    color: "#000000",
  },
  messageTime: {
    fontSize: 11,
    alignSelf: "flex-end",
  },
  myMessageTime: {
    color: "#666",
  },
  theirMessageTime: {
    color: "#999",
  },
  inputContainer: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  attachmentButton: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxHeight: 100,
    fontSize: 16,
    color: "#333",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
});