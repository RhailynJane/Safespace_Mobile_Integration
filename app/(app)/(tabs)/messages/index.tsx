import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";

const { width } = Dimensions.get("window");
export default function MessagesScreen() {
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };
  
  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        setSideMenuVisible(false);
        router.replace("/(app)/(tabs)/home");
      },
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/profile");
      },
    },
    {
      icon: "bar-chart",
      title: "Self-Assessment",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/self-assessment");
      },
    },
    {
      icon: "happy",
      title: "Mood Tracking",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/mood-tracking");
      },
    },
    {
      icon: "journal",
      title: "Journaling",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/journal");
      },
    },
    {
      icon: "library",
      title: "Resources",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/resources");
      },
    },
    {
      icon: "help-circle",
      title: "Crisis Support",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/crisis-support");
      },
    },
    {
      icon: "chatbubble",
      title: "Messages",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/messages");
      },
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/appointments");
      },
    },
    {
      icon: "people",
      title: "Community Forum",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/community-forum");
      },
    },
    {
      icon: "videocam",
      title: "Video Consultations",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/video-consultations");
      },
    },
    {
      icon: "log-out",
      title: "Sign Out",
      onPress: async () => {
        setSideMenuVisible(false);
        // Simulate logout
        console.log("User signed out");
      },
    },
  ];

  const getDisplayName = () => {
    return "User";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  // Sample conversations data
  const conversations = [
    {
      id: 1,
      name: "Eric Young",
      lastMessage: "I'm glad you're feeling okay now.",
      time: "30m ago",
      unread: 0,
      online: true,
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    },
    {
      id: 2,
      name: "Support Group",
      lastMessage: "Jenny: I found this article really helpful...",
      time: "2d ago",
      unread: 5,
      online: false,
      avatar: "https://randomuser.me/api/portraits/women/4.jpg",
    },
    {
      id: 3,
      name: "Dr. Sarah Johnson",
      lastMessage: "Let's schedule our next appointment.",
      time: "1d ago",
      unread: 1,
      online: false,
      avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    },
    {
      id: 4,
      name: "Therapist Group",
      lastMessage: "Mark: Has anyone tried the new technique?",
      time: "3d ago",
      unread: 0,
      online: false,
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <CurvedBackground>
        {/* Header */}
          <AppHeader 
            title="Messages" 
            showBack={true}
          />

        {/* New Message Button */}
        <View>
          <TouchableOpacity
            style={styles.newMessageButton}
            onPress={() => router.push("../messages/new-message")}
          >
            <LinearGradient
              colors={['#5296EA', '#489EEA', '#459EEA', '#4896EA']}
              style={styles.newMessageButtonGradient}
            >
              <Text style={styles.newMessageButtonText}>+ New Message</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9E9E9E"
          />
          <Ionicons
            name="search"
            size={22}
            color="#333"
            style={styles.searchIcon}
          />
        </View>

        {/* Conversation List */}
        <View style={styles.conversationContainer}>
          <ScrollView style={styles.conversationList}>
            {conversations.map((conversation) => (
              <TouchableOpacity
                key={conversation.id}
                style={styles.conversationItem}
                onPress={() => router.replace(`../messages/message-chat-screen?id=${conversation.id}`)}
              >
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: conversation.avatar }}
                    style={styles.avatar}
                  />
                  {conversation.online && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.conversationName}>{conversation.name}</Text>
                    <Text style={styles.conversationTime}>{conversation.time}</Text>
                  </View>
                  <Text
                    style={[
                      styles.conversationMessage,
                      conversation.unread > 0 && styles.unreadMessage,
                    ]}
                    numberOfLines={1}
                  >
                    {conversation.lastMessage}
                  </Text>
                </View>

                {conversation.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{conversation.unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Side Menu */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={sideMenuVisible}
          onRequestClose={() => setSideMenuVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setSideMenuVisible(false)}
            />
            <View style={styles.sideMenu}>
              <View style={styles.sideMenuHeader}>
                <Text style={styles.profileName}>{getDisplayName()}</Text>
                <Text style={styles.profileEmail}>user@example.com</Text>
              </View>
              <ScrollView style={styles.sideMenuContent}>
                {sideMenuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sideMenuItem}
                    onPress={item.onPress}
                  >
                    <Ionicons name={item.icon as any} size={20} color="#4CAF50" />
                    <Text style={styles.sideMenuItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius:30,
    backgroundColor: "#fff",
    marginTop: -1,
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
    marginRight: .5,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    fontStyle: "italic",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor:"transparent",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sideMenu: {
    width: "75%",
    backgroundColor: "#FFFFFF",
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  menuProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#757575",
  },
  sideMenuContent: {
    padding: 10,
  },
  sideMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  sideMenuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  conversationList: {
    flex: 1,
    paddingHorizontal: 5,
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
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
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
    marginBottom: 10,
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
  },
  unreadMessage: {
    color: "#333",
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: "#4CAF50",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  unreadCount: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  newMessageButton: {
    marginHorizontal:40,
    marginTop:10,
    marginBottom:15,
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
});