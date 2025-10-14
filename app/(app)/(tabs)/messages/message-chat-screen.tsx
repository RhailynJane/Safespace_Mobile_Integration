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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import CurvedBackground from "../../../../components/CurvedBackground";
import { messagingService, Message, Participant } from "../../../../utils/sendbirdService";

export default function ChatScreen() {
  const { userId } = useAuth();
  const params = useLocalSearchParams();
  const conversationId = params.id as string;
  const conversationTitle = params.title as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contact, setContact] = useState<Participant | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!conversationId) return;

    loadMessages(); // Load immediately
    const pollInterval = setInterval(() => {
      loadMessages();
    }, 3000); // Check every 3 seconds

    return () => clearInterval(pollInterval);
  }, [conversationId, userId]);

  const loadMessages = useCallback(async () => {
    try {
      const result = await messagingService.getMessages(conversationId, userId || 'current_user');
      if (result.success) {
        setMessages(result.data);
        
        // Extract contact info from messages
        if (result.data.length > 0) {
          const otherParticipant = result.data.find(msg => msg.sender.clerk_user_id !== userId)?.sender;
          if (otherParticipant) {
            setContact(otherParticipant);
          }
        } else {
          // If no messages, set contact from conversation title
          setContact({
            id: 'unknown',
            clerk_user_id: 'unknown', 
            first_name: conversationTitle?.split(' ')[0] || 'User',
            last_name: conversationTitle?.split(' ').slice(1).join(' ') || '',
            email: '',
            profile_image_url: undefined,
            online: false
          });
        }
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId, conversationTitle]);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || sending) return;

    try {
      setSending(true);
      const result = await messagingService.sendMessage(conversationId, userId || 'current_user', {
        messageText: newMessage,
        messageType: 'text'
      });

      if (result.success) {
        setMessages(prev => [...prev, result.data]);
        setNewMessage("");
      } else {
        console.error("Failed to send message:", result);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60 * 1000) {
      return 'Just now';
    } else if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get user initials for avatar
  const getUserInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
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
      <SafeAreaView style={styles.container}>
        {/* Fixed Header with proper safe area padding */}
        <View style={styles.headerWrapper}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#2E7D32" />
            </TouchableOpacity>

            <View style={styles.contactInfo}>
              <View style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>
                  {getUserInitials(contact?.first_name, contact?.last_name)}
                </Text>
              </View>
              <View>
                <Text style={styles.contactName}>{conversationTitle}</Text>
                <Text style={styles.contactStatus}>
                  {contact?.online ? "Online" : "Offline"}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => router.push("../appointments/book")}>
              <Ionicons name="call-outline" size={24} color="#2E7D32" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat Messages */}
        <ScrollView
          style={styles.messagesContainer}
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
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
                    myMessage ? styles.myMessageContainer : styles.theirMessageContainer,
                  ]}
                >
                  {/* Other user's avatar (left side) */}
                  {!myMessage && (
                    <View style={styles.avatarContainer}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {getUserInitials(message.sender.first_name, message.sender.last_name)}
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
                        myMessage ? styles.myMessageText : styles.theirMessageText,
                      ]}
                    >
                      {message.message_text}
                    </Text>
                    <Text style={[
                      styles.messageTime,
                      myMessage ? styles.myMessageTime : styles.theirMessageTime
                    ]}>
                      {formatTime(message.created_at)}
                    </Text>
                  </View>

                  {/* My avatar (right side) */}
                  {myMessage && (
                    <View style={styles.avatarContainer}>
                      <View style={[styles.avatar, styles.myAvatar]}>
                        <Text style={styles.avatarText}>
                          {getUserInitials(message.sender.first_name, message.sender.last_name)}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputContainer}
        >
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
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                (newMessage.trim() === "" || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={newMessage.trim() === "" || sending}
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
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  // Wrapper to handle safe area properly
  headerWrapper: {
    backgroundColor: "transparent",
    paddingTop: Platform.OS === 'ios' ? 0 : 40, // Adjust for Android status bar
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
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
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
  },
  contactStatus: {
    fontSize: 12,
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
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  myAvatar: {
    backgroundColor: "#4CAF50",
  },
  avatarText: {
    color: "#666",
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