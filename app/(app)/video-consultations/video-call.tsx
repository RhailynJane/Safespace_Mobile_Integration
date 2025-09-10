import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import BottomNavigation from "../../../components/BottomNavigation";

const { width } = Dimensions.get("window");

const appointments = [
  {
    id: 1,
    supportWorker: "Eric Young",
    date: "October 07, 2025",
    time: "10:30 AM",
    type: "Video",
    status: "Upcoming",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
  },
];

export default function VideoCallScreen() {
  const [audioOption, setAudioOption] = useState("phone"); // 'phone', 'none'
  const { user, profile, logout } = useAuth();

  const getDisplayName = () => {
    if (profile?.firstName) return profile.firstName;
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const handleStartMeeting = () => {
    router.replace("../video-consultations/video-call-meeting");
  };

  const currentAppointment = appointments[0];
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const [activeTab, setActiveTab] = useState<string>("home");

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  return (
    <SafeAreaView style={styles.meetingContainer}>
      <View style={styles.meetingHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.meetingTitle}>Safespace Meeting</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Meeting Content */}
      <View style={styles.meetingContent}>
        <Text style={styles.meetingWith}>
          Meeting with {currentAppointment?.supportWorker ?? ""}
        </Text>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={50} color="#FFFFFF" />
          </View>
          <View style={styles.profileTextContainer}>
            <Text style={styles.avatarName}>{getDisplayName()}</Text>
          </View>
        </View>
      </View>

      {/*Audio Options Content */}
      <View style={styles.audioOptions}>
        <Text style={styles.audioTitle}>Audio Options</Text>

        <TouchableOpacity
          style={[
            styles.audioOption,
            audioOption === "phone" && styles.audioOptionSelected,
          ]}
          onPress={() => setAudioOption("phone")}
        >
          <Ionicons
            name={
              audioOption === "phone" ? "radio-button-on" : "radio-button-off"
            }
            size={24}
            color={audioOption === "phone" ? "#4CAF50" : "#757575"}
          />
          <View style={styles.audioOptionText}>
            <Text style={styles.audioOptionTitle}>Phone Audio</Text>
            <Text style={styles.audioOptionDesc}>Call in with your phone</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.audioOption,
            audioOption === "none" && styles.audioOptionSelected,
          ]}
          onPress={() => setAudioOption("none")}
        >
          <Ionicons
            name={
              audioOption === "none" ? "radio-button-on" : "radio-button-off"
            }
            size={24}
            color={audioOption === "none" ? "#4CAF50" : "#757575"}
          />
          <View style={styles.audioOptionText}>
            <Text style={styles.audioOptionTitle}>Don't Use Audio</Text>
            <Text style={styles.audioOptionDesc}>Join without audio</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.meetingActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.joinNowButton}
          onPress={handleStartMeeting}
        >
          <Text style={styles.joinNowButtonText}>Join Now</Text>
        </TouchableOpacity>
      </View>

      <BottomNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  meetingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
  },
  meetingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backButton: {
    padding: 4,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E7D32",
  },
  meetingContent: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  meetingWith: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 30,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 5,
  },
  avatarStatus: {
    fontSize: 14,
    color: "#757575",
  },
  profileTextContainer: {
    alignItems: "center",
  },
  audioOptions: {
    width: "100%",
    maxWidth: 300,
    marginRight: 15,
    marginLeft: 50,
    justifyContent: "center",
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 15,
  },
  audioOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    marginBottom: 15,
  },
  audioOptionSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#F1F8E9",
  },
  audioOptionText: {
    marginLeft: 15,
    flex: 1,
  },
  audioOptionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  audioOptionDesc: {
    fontSize: 10,
    color: "#757575",
  },
  meetingActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#757575",
    fontSize: 13,
    fontWeight: "600",
  },
  joinNowButton: {
    flex: 1,
    padding: 15,
    backgroundColor: "#4CAF50",
    borderRadius: 20,
    alignItems: "center",
    marginLeft: 10,
  },
  joinNowButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
