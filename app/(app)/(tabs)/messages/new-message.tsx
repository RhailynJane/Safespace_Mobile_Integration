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
import AsyncStorage from "@react-native-async-storage/async-storage";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";

const { width } = Dimensions.get("window");

/**
 * MessagesScreen Component
 *
 * Screen for viewing and managing messages with contacts. Features a search bar,
 * contact list with online status indicators, and navigation to individual chat screens.
 *
 * This is a frontend-only implementation with mock data for demonstration.
 */
export default function MessagesScreen() {
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessageModalVisible, setNewMessageModalVisible] = useState(false);

  // Mock user data for frontend-only implementation
  const MOCK_USER = {
    email: "demo@gmail.com",
    displayName: "Demo User",
  };

  const MOCK_PROFILE = {
    firstName: "Demo",
    lastName: "User",
  };

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

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
   * Side menu navigation items for app navigation
   */
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
        // Clear local storage and navigate to login
        await AsyncStorage.clear();
        router.replace("/(auth)/login");
      },
    },
  ];

  /**
   * Returns the user's display name for personalization
   */
  const getDisplayName = () => {
    if (MOCK_PROFILE.firstName) return MOCK_PROFILE.firstName;
    if (MOCK_USER.displayName) return MOCK_USER.displayName.split(" ")[0];
    if (MOCK_USER.email) return MOCK_USER.email.split("@")[0];
    return "User";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  /**
   * Mock contact data for demonstration
   */
  const contacts = [
    {
      id: 1,
      name: "Eric Young",
      avatar: "https://randomuser.me/api/portraits/men/1.jpg",
      online: true,
      lastMessage: "Thanks for checking in!",
      timestamp: "2:30 PM",
    },
    {
      id: 2,
      name: "Support Group",
      avatar: "https://randomuser.me/api/portraits/women/4.jpg",
      online: false,
      lastMessage: "Weekly meeting reminder",
      timestamp: "Yesterday",
    },
    {
      id: 3,
      name: "Sophia Lee",
      avatar: "https://randomuser.me/api/portraits/women/3.jpg",
      online: true,
      lastMessage: "How are you feeling today?",
      timestamp: "10:45 AM",
    },
    {
      id: 4,
      name: "Dr. Martinez",
      avatar: "https://randomuser.me/api/portraits/men/5.jpg",
      online: false,
      lastMessage: "Appointment confirmation",
      timestamp: "Monday",
    },
    {
      id: 5,
      name: "Wellness Coach",
      avatar: "https://randomuser.me/api/portraits/women/6.jpg",
      online: true,
      lastMessage: "Exercise routine update",
      timestamp: "Just now",
    },
  ];

  /**
   * Custom BottomNavigation component for tab navigation
   */
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
        <AppHeader title="New Message" showBack={true} />

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
            placeholder="Search contacts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9E9E9E"
            autoFocus={true}
          />
        </View>

        {/* Contact List */}
        <ScrollView style={styles.contactList}>
          <Text style={styles.sectionTitle}>Recent Contacts</Text>
          {contacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactItem}
              onPress={() =>
                router.push(`../messages/message-chat-screen?id=${contact.id}`)
              }
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: contact.avatar }}
                  style={styles.contactAvatar}
                />
                {contact.online && <View style={styles.onlineIndicator} />}
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactMessage}>{contact.lastMessage}</Text>
              </View>
              <View style={styles.timestampContainer}>
                <Text style={styles.timestamp}>{contact.timestamp}</Text>
                {contact.online && <View style={styles.unreadIndicator} />}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
});

const bottomNavStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
