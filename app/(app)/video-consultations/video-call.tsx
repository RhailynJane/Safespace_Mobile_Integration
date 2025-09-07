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

const { width } = Dimensions.get("window");

// Mock appointment data - in a real app, this would come from props or context
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

  const handleStartMeeting = () => {
    // Here you would typically connect to your video API
    // For now, we'll just show a success message
    alert("Meeting started successfully!");
    // You could navigate to an actual video call screen here
  };

  // Get the current appointment (in a real app, this would come from navigation params)
  const currentAppointment = appointments[0];

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

      <View style={styles.meetingContent}>
        <Text style={styles.meetingWith}>
          Meeting with {currentAppointment?.supportWorker ?? ""}
        </Text>
        
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={50} color="#FFFFFF" />
          </View>
          <Text style={styles.avatarName}>{currentAppointment?.supportWorker ?? ""}</Text>
          <Text style={styles.avatarStatus}>Connecting...</Text>
        </View>
      </View>

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
});