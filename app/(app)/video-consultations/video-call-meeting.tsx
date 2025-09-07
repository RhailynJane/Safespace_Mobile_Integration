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
    router.back();
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
          <Text style={styles.callStatusText}>00:08</Text>
        </View>

        {/* Bottom Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          {/* Chat Button */}
          <TouchableOpacity 
            style={[styles.controlButton, isChatOpen && styles.controlButtonActive]}
            onPress={handleToggleChat}
          >
            <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>Chat</Text>
          </TouchableOpacity>

          {/* Raise Hand Button */}
          <TouchableOpacity 
            style={[styles.controlButton, isRaiseHand && styles.controlButtonActive]}
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

          {/* View Button */}
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="people" size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>View</Text>
          </TouchableOpacity>

          {/* More Options Button */}
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>More</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    padding: 20,
    backgroundColor: "#2D2D2D",
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  controlButton: {
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#404040",
    minWidth: 60,
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
});
