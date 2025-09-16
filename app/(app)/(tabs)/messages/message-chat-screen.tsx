/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";

// Sample messages data for each conversation
const conversationMessages: {
  [key: string]: { id: number; text: string; time: string; sender: string }[];
} = {
  "1": [
    {
      id: 1,
      text: "Hi Eric I scheduled an appointment to you for this month.",
      time: "Today 9:41 am",
      sender: "me",
    },
    {
      id: 2,
      text: "Hi John. Yes, I saw it. Lets talk then.",
      time: "Today 9:42 am",
      sender: "other",
    },
    {
      id: 3,
      text: "I'm glad you're feeling okay now.",
      time: "30m ago",
      sender: "other",
    },
  ],
  "2": [
    {
      id: 1,
      text: "Jenny: I found this article really helpful for managing anxiety during stressful times.",
      time: "2d ago",
      sender: "other",
    },
    {
      id: 2,
      text: "Mike: Thanks for sharing Jenny! This was exactly what I needed to read today.",
      time: "1d ago",
      sender: "other",
    },
    {
      id: 3,
      text: "Sarah: Has anyone tried the breathing techniques mentioned in the article?",
      time: "1d ago",
      sender: "other",
    },
    {
      id: 4,
      text: "Yes, I've been practicing them daily and they really help!",
      time: "12h ago",
      sender: "me",
    },
  ],
};

// Sample contacts data
type Contact = {
  id: number;
  name: string;
  avatar: string;
  online: boolean;
};

const contacts: { [key: string]: Contact } = {
  "1": {
    id: 1,
    name: "Eric Young",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    online: true,
  },
  "2": {
    id: 2,
    name: "Support Group",
    avatar: "https://randomuser.me/api/portraits/women/4.jpg",
    online: false,
  },
  "3": {
    id: 3,
    name: "Sophia Lee",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    online: true,
  },
};

// User avatar for sent messages
const userAvatar = "https://randomuser.me/api/portraits/women/17.jpg";

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const contactId = params.id as string;
  const contact = contacts[contactId];

  const [messages, setMessages] = useState(
    conversationMessages[contactId] || []
  );
  const [newMessage, setNewMessage] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    const newMsg = {
      id: messages.length + 1,
      text: newMessage,
      time: "Just now",
      sender: "me",
    };

    setMessages([...messages, newMsg]);
    setNewMessage("");

    if (contactId === "1") {
      setTimeout(() => {
        const reply = {
          id: messages.length + 2,
          text: "Thanks for your message. I'll get back to you soon.",
          time: "Just now",
          sender: "other",
        };
        setMessages((prev: typeof messages) => [...prev, reply]);
      }, 1500);
    }
  };

  if (!contact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Contact not found</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>

          <View style={styles.contactInfo}>
            <Image
              source={{ uri: contact.avatar }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactStatus}>
                {contact.online ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push("../appointments/book")}>
            <Ionicons name="call-outline" size={24} color="#2E7D32" />
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <ScrollView
          style={styles.messagesContainer}
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === "me"
                  ? styles.myMessageContainer
                  : styles.theirMessageContainer,
              ]}
            >
              {message.sender === "other" && (
                <Image
                  source={{ uri: contact.avatar }}
                  style={styles.messageAvatar}
                />
              )}

              <View
                style={[
                  styles.messageBubble,
                  message.sender === "me"
                    ? styles.myMessage
                    : styles.theirMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.sender === "me"
                      ? styles.myMessageText
                      : styles.theirMessageText,
                  ]}
                >
                  {message.text}
                </Text>
                <Text style={styles.messageTime}>{message.time}</Text>
              </View>

              {message.sender === "me" && (
                <Image
                  source={{ uri: userAvatar }}
                  style={styles.messageAvatar}
                />
              )}
            </View>
          ))}
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
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                newMessage.trim() === "" && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={newMessage.trim() === ""}
            >
              <Ionicons
                name="send"
                size={24}
                color={newMessage.trim() === "" ? "#9E9E9E" : "#FFFFFF"}
              />
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
  headerGradient: {
    paddingTop: 10,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingTop: 10,
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
    marginRight: 10,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
  },
  contactStatus: {
    fontSize: 12,
    color: "##000000",
    flexDirection: "row",
    alignItems: "center",
  },

  messagesContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 10,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    maxWidth: "100%",
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 5,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
    borderTopRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#cfe2f3",
    borderTopLeftRadius: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  messageText: {
    fontSize: 16,
    marginBottom: 5,
  },
  myMessageText: {
    color: "#000000",
  },
  theirMessageText: {
    color: "#000000",
  },
  messageTime: {
    fontSize: 12,
    color: "#9E9E9E",
    alignSelf: "flex-end",
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
    borderRadius: 24,
    paddingHorizontal: 10,
  },
  attachmentButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 5,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  sendButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
});
