"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { BorderRadius } from "../../../constants/theme";

const { width } = Dimensions.get("window");

type MoodEntry = {
  id: string;
  mood_type: string;
  created_at: string;
  mood_emoji?: string;
  mood_label?: string;
};

type Resource = {
  id: string;
  title: string;
  duration: string;
};

export default function HomeScreen() {
  const { user, profile, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeTab, setActiveTab] = useState("home");
  const [sideMenuVisible, setSideMenuVisible] = useState(false);4
  const fadeAnim = useRef(new Animated.Value(0)).current;


  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];


  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const quickActions = [
    {
      id: "mood",
      title: "Track Mood",
      icon: "happy-outline",
      image: require("../../../assets/images/track-mood.png"), 
      color: "#EDE7EC",
      borderColor: "#bab5b9ff",
      onPress: () => router.push("/mood-tracking"),
    },
    {
      id: "journal",
      title: "Journal",
      icon: "journal-outline",
      image: require("../../../assets/images/journal.png"), 
      color: "#EDE7EC",
      borderColor: "#bab5b9ff",
      onPress: () => router.push("/journaling"),
    },
    {
      id: "resources",
      title: "Resources",
      icon: "library-outline",
      image: require("../../../assets/images/resources.png"), 
      color: "#EDE7EC",
      borderColor: "#bab5b9ff",
      onPress: () => router.push("/resources"),
    },
    {
      id: "crisis",
      title: "Crisis Support",
      icon: "help-buoy-outline",
      image: require("../../../assets/images/crisis-support.png"), 
      color: "#EDE7EC",
      borderColor: "#bab5b9ff",
      onPress: () => router.push("/crisis-support"),
    },
  ];

  const showSideMenu = () => {
  setSideMenuVisible(true);
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 800, // 300ms fade in
    useNativeDriver: true,
  }).start();
};

const hideSideMenu = () => {
  Animated.timing(fadeAnim, {
    toValue: 0,
    duration: 800, // 300ms fade out
    useNativeDriver: true,
  }).start(() => {
    setSideMenuVisible(false);
  });
};

  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/home");
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
        router.push("/journaling");
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
        try {
          setSideMenuVisible(false);
          await logout();
        } catch (error) {
          console.error("Sign out error:", error);
        }
      },
    },
  ];

  const getEmojiForMood = (moodType: string) => {
    switch (moodType) {
      case "very-happy":
        return "😄";
      case "happy":
        return "🙂";
      case "neutral":
        return "😐";
      case "sad":
        return "🙁";
      case "very-sad":
        return "😢";
      default:
        return "😐";
    }
  };

  const getLabelForMood = (moodType: string) => {
    switch (moodType) {
      case "very-happy":
        return "Very Happy";
      case "happy":
        return "Happy";
      case "neutral":
        return "Neutral";
      case "sad":
        return "Sad";
      case "very-sad":
        return "Very Sad";
      default:
        return "Unknown";
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const fetchRecentMoods = async () => {
    try {
      if (!user?.uid) return;

      // First get client ID
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("firebase_uid", user.uid)
        .single();

      if (clientError || !clientData) return;

      // Then fetch mood entries
      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("client_id", clientData.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) return;

      const transformedEntries = (data || []).map((entry) => ({
        ...entry,
        mood_emoji: getEmojiForMood(entry.mood_type),
        mood_label: getLabelForMood(entry.mood_type),
      }));

      setRecentMoods(transformedEntries);
    } catch (error) {
      console.log("Mood entries not available");
      setRecentMoods([]);
    }
  };

  const fetchResources = async () => {
    try {
      // Check if resources table exists
      const { data: tableExists } = await supabase.rpc("table_exists", {
        table_name: "resources",
      });

      if (!tableExists) {
        setResources([]);
        return;
      }

      const { data, error } = await supabase
        .from("resources")
        .select("id, title, duration")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      setResources([]);
    }
  };

  const [profileImage, setProfileImage] = useState<string | null>(null);

  useFocusEffect(
  useCallback(() => {
    fetchData();
    loadProfileImage(); // Add this line
  }, [user?.uid])
);

  // Set up realtime subscription for mood updates
  useEffect(() => {
    if (!user?.uid) return;

    // First get client ID for the filter
    supabase
      .from("clients")
      .select("id")
      .eq("firebase_uid", user.uid)
      .single()
      .then(({ data: clientData, error: clientError }) => {
        if (clientError || !clientData) return;

        const subscription = supabase
          .channel("mood_entries")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "mood_entries",
              filter: `client_id=eq.${clientData.id}`,
            },
            () => {
              fetchRecentMoods(); // Refresh when mood entries change
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(subscription);
        };
      });
  }, [user?.uid]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchRecentMoods(), fetchResources()]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user?.uid])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const loadProfileImage = async () => {
  try {
    const savedImage = await AsyncStorage.getItem(`profileImage_${user?.uid}`);
    if (savedImage) {
      setProfileImage(savedImage);
    }
  } catch (error) {
    console.log('Error loading profile image:', error);
  }
};

const getInitials = () => {
  const firstName = profile?.firstName || "";
  const lastName = profile?.lastName || "";
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
};

  const getGreetingName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    return "User";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
{/* Header */}
      <View style={styles.header}>
       <TouchableOpacity onPress={() => router.push("/(app)/(tabs)/profile/edit")}>
      <View style={styles.profileImageContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <Text style={styles.initialsText}>{getInitials()}</Text>
        )}
      </View>
    </TouchableOpacity>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={showSideMenu}
          >
            <Ionicons name="grid-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Greeting Section */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>
              {getGreeting()}, <Text style={styles.nameText}>{getGreetingName()}!</Text>
            </Text>
            <Text style={styles.subGreetingText}>How are you feeling today?</Text>
          </View>

          {/* Emergency Help Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => router.push("/crisis-support")}
            >
              <View style={styles.helpButtonContent}>
                <Text style={styles.helpButtonText}>Get Help Now</Text>
              </View>
            </TouchableOpacity>
          </View>


          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.actionCard,
                    { 
                      backgroundColor: action.color,
                      borderColor: action.borderColor 
                    }
                  ]}
                  onPress={action.onPress}
                >
                  <View style={[styles.iconContainer, { backgroundColor: action.borderColor }]}>
                    {action.image ? (
                      <Image 
                        source={action.image} 
                        style={styles.actionImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons
                        name={action.icon as any}
                        size={28}
                        color="white"
                      />
                    )}
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mood Tracking Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Moods</Text>
            {recentMoods.length > 0 ? (
              <View style={styles.recentMoods}>
                {recentMoods.map((mood) => (
                  <View key={mood.id} style={styles.moodItem}>
                    <Text style={styles.moodEmoji}>{mood.mood_emoji}</Text>
                    <View style={styles.moodDetails}>
                      <Text style={styles.moodDate}>
                        {formatDate(mood.created_at)}
                      </Text>
                      <Text style={styles.moodText}>{mood.mood_label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No mood entries yet</Text>
                <Text style={styles.noDataSubtext}>
                  Start tracking your mood to see insights here
                </Text>
              </View>
            )}
          </View>

          {/* Resources Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Resources</Text>
            {resources.length > 0 ? (
              resources.map((resource) => (
                <TouchableOpacity
                  key={resource.id}
                  style={styles.resourceCard}
                  onPress={() => router.push(`/resources/${resource.id}`)}
                >
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceTitle}>{resource.title}</Text>
                    <Text style={styles.resourceDuration}>
                      {resource.duration}
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={32} color="#4CAF50" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No resources available</Text>
                <Text style={styles.noDataSubtext}>
                  Check back later for new content
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              onPress={() => {
                setActiveTab(tab.id);
                if (tab.id !== "home") router.push(`/${tab.id}`);
              }}
            >
              <Ionicons
                name={tab.icon as any}
                size={24}
                color={activeTab === tab.id ? "#4CAF50" : "#9E9E9E"}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Side Menu */}
        <Modal
          animationType="none" 
          transparent={true}
          visible={sideMenuVisible}
          onRequestClose={hideSideMenu}
        >
          <Animated.View style={[styles.fullScreenOverlay, { opacity: fadeAnim }]}>
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={hideSideMenu}
            />
            <Animated.View style={[styles.sideMenu, { opacity: fadeAnim }]}>
              <View style={styles.sideMenuHeader}>
                <Text style={styles.profileName}>{getGreetingName()}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
              </View>
              <ScrollView style={styles.sideMenuContent}>
                {sideMenuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sideMenuItem}
                    onPress={() => {
                      hideSideMenu(); // Use hideSideMenu instead
                      item.onPress();
                    }}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color="#757575"
                    />
                    <Text style={styles.sideMenuItemText}>{item.title}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}




const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    backgroundColor: "#7BB8A8",
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 80,
  },
  greetingSection: {
    backgroundColor: "#7BB8A8",
    marginHorizontal: 0,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderTopLeftRadius: 0,      // Sharp top left corner
    borderTopRightRadius: 0,     // Sharp top right corner
    borderBottomLeftRadius: 50,  // Rounded bottom left
    borderBottomRightRadius: 50, // Rounded bottom right
    marginBottom: 20,
  },

  greetingText: {
    fontSize: 24,
    fontWeight: "300",
    fontFamily: 'Epilogue-Regular',
    color: "#000000",
    marginBottom: 4,
  },
  subGreetingText: {
    fontSize: 15,
    fontFamily: 'Epilogue-Regular',

    color: "#000000",
    opacity: 0.8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: 'Epilogue-Regular',
    color: "#212121",
    marginBottom: 16,
  },

  profileImage: {
  width: 40,
  height: 40,
  borderRadius: 20,
  },
  initialsText: {
  fontSize: 16,
  fontWeight: "bold",
  color: "#4CAF50",
  },
  helpButton: {
    backgroundColor: "#DF1D1D",
    fontFamily: 'Epilogue-Regular',
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  helpButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  helpButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: 'Epilogue-Regular',

    fontWeight: "600",
    marginLeft: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    padding: 20,
  },
  actionCard: {
    width: 141 ,
    height: 159,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: 120,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  actionImage: {
    width: 85,
    height: 120,
    // tintColor: "white", 
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    textAlign: "center",
    marginTop: 8,
  },
  recentMoods: {
    backgroundColor: "#EDE7EC",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  moodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  moodEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  moodDetails: {
    flex: 1,
  },
  moodDate: {
    fontSize: 12,
    color: "#9E9E9E",
    marginBottom: 2,
  },
  moodText: {
    fontSize: 16,
    color: "#212121",
    fontWeight: "500",
  },
  noDataContainer: {
    backgroundColor: "#EDE7EC",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  noDataText: {
    fontSize: 16,
    color: "#424242",
    fontWeight: "500",
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EDE7EC",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
    marginBottom: 4,
  },
  resourceDuration: {
    fontSize: 14,
    color: "#757575",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    flexDirection: "row",

  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: '100%',  
    height: '100%', 
    
    
  },
  // Remove modalContainer and modalOverlay, replace with:
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: 'flex-start',
    alignItems: 'flex-end', // This positions the sidebar on the right
  },
  sideMenu: {
 
    paddingTop: 40,
    width: width * 0.75,
    backgroundColor: "#FFFFFF",
    height: "100%", // Full height
    // Remove marginTop
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    alignItems: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  nameText: {
  fontWeight: "700", // Bold for the name
  color: "#4C4A53",
  fontFamily: 'Epilogue-Regular',


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
});