import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function VideoCallScreen() {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRaiseHand, setIsRaiseHand] = useState(false);

  const handleLeaveCall = () => {
    router.replace("../(tabs)/appointments/appointment-list");
  };

  const handleToggleCamera = () => {
    setIsCameraOn(!isCameraOn);
  };

  const handleToggleMic = () => {
    setIsMicOn(!isMicOn);
  };

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleToggleRaiseHand = () => {
    setIsRaiseHand(!isRaiseHand);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Video Content */}
      <View style={styles.videoContainer}>
        {/* Participant Video */}
        <View style={styles.participantVideo}>
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/1.jpg" }}
            style={styles.videoImage}
            resizeMode="cover"
          />
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>Eric Young</Text>
            <View style={styles.audioIndicator}>
              <Ionicons name="mic" size={12} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Self Video Preview */}
        <View style={styles.selfVideoPreview}>
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/women/17.jpg" }}
            style={styles.selfVideoImage}
            resizeMode="cover"
          />
          {!isCameraOn && (
            <View style={styles.cameraOffOverlay}>
              <Ionicons name="videocam-off" size={24} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Call Status */}
        <View style={styles.callStatus}>
          <Text style={styles.callStatusText}>00:01</Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controlsContainer}>
        {/* First Row - All controls in one line */}
        <View style={styles.controlsRow}>
          {/* Chat Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              isChatOpen && styles.controlButtonActive,
            ]}
            onPress={handleToggleChat}
          >
            <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>Chat</Text>
          </TouchableOpacity>

          {/* Raise Hand Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              isRaiseHand && styles.controlButtonActive,
            ]}
            onPress={handleToggleRaiseHand}
          >
            <Ionicons
              name={isRaiseHand ? "hand-left" : "hand-left-outline"}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.controlText}>Raise</Text>
          </TouchableOpacity>

          {/* React Button */}
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="happy" size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>React</Text>
          </TouchableOpacity>

          {/* Camera Toggle */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              !isCameraOn && styles.controlButtonMuted,
            ]}
            onPress={handleToggleCamera}
          >
            <Ionicons
              name={isCameraOn ? "videocam" : "videocam-off"}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.controlText}>Camera</Text>
          </TouchableOpacity>

          {/* Mic Toggle */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              !isMicOn && styles.controlButtonMuted,
            ]}
            onPress={handleToggleMic}
          >
            <Ionicons
              name={isMicOn ? "mic" : "mic-off"}
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.controlText}>Mic</Text>
          </TouchableOpacity>
        </View>

        {/* Second Row - Only Leave button */}
        <View style={styles.leaveButtonContainer}>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveCall}
          >
            <Ionicons name="call" size={16} color="#FFFFFF" />
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat Panel */}
      {isChatOpen && (
        <View style={styles.chatPanel}>
          <Text style={styles.chatTitle}>Chat</Text>
          {/* Chat messages would go here */}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A1A",
  },
  videoContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  participantVideo: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  videoImage: {
    width: "100%",
    height: "100%",
    opacity: 0.8,
  },
  participantInfo: {
    position: "absolute",
    bottom: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 8,
    borderRadius: 20,
  },
  participantName: {
    color: "#FFFFFF",
    fontSize: 16,
    marginRight: 8,
  },
  audioIndicator: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 4,
  },
  selfVideoPreview: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  selfVideoImage: {
    width: "100%",
    height: "100%",
  },
  cameraOffOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  callStatus: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  callStatusText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  controlsContainer: {
    padding: 10,
    backgroundColor: "#2D2D2D",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  controlButton: {
    alignItems: "center",
    padding: 13,
    borderRadius: 8,
    backgroundColor: "#404040",
    minWidth: 20,
    marginBottom: 5,
  },
  controlButtonActive: {
    backgroundColor: "#4CAF50",
  },
  controlButtonMuted: {
    backgroundColor: "#F44336",
  },
  controlText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 4,
  },
  leaveButtonContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#F44336",
    width: "80%",
    height: 30,
    gap: 8,
  },
  leaveButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },
  chatPanel: {
    position: "absolute",
    right: 20,
    bottom: 180,
    width: 300,
    height: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333333",
  },
});
