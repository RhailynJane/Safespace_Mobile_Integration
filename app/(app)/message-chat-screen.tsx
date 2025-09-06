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
import { LinearGradient } from "expo-linear-gradient";

// Sample messages data for each conversation
const conversationMessages: { [key: string]: { id: number; text: string; time: string; sender: string; }[] } = {
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
};

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const contactId = params.id as string;
  const contact = contacts[contactId];
  
  const [messages, setMessages] = useState(conversationMessages[contactId] || []);
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#2E7D32" />
          </TouchableOpacity>
          
          <View style={styles.contactInfo}>
            <Image source={{ uri: contact.avatar }} style={styles.headerAvatar} />
            <View>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactStatus}>
                {contact.online ? "Online" : "Offline"}
                {contact.online && <View style={styles.onlineIndicator} />}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity>
            <Ionicons name="call-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

       </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerGradient: {
    paddingTop: 10,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    overflow: 'hidden',
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
    color: "#FFFFFF",
  },
  contactStatus: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    flexDirection: "row",
    alignItems: "center",
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginLeft: 5,
  },
})