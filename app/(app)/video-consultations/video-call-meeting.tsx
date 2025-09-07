import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function VideoCallScreen() {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRaiseHand, setIsRaiseHand] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([
    { id: "1", sender: "You", text: "Hello!", time: "00:00" },
    { id: "2", sender: "Eric Young", text: "Hi there!", time: "00:01" },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages(prev => [
        ...prev,
        {
          id: (prev.length + 1).toString(),
          sender: "You",
          text: newMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setNewMessage("");
    }
  };

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
        <KeyboardAvoidingView 
          style={styles.chatPanelContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={100}
        >
          <View style={styles.chatPanel}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Chat</Text>
              <TouchableOpacity onPress={() => setIsChatOpen(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.messagesContainer}
              ref={ref => ref?.scrollToEnd({ animated: true })}
            >
              {messages.map((message) => (
                <View 
                  key={message.id} 
                  style={[
                    styles.messageBubble,
                    message.sender === "You" ? styles.myMessage : styles.theirMessage
                  ]}
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                  <Text style={styles.messageTime}>{message.time}</Text>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={newMessage.trim() ? "#4CAF50" : "#CCC"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  // Chat Panel Styles
  chatPanelContainer: {
    position: "absolute",
    right: 20,
    bottom: 180,
    width: 300,
    height: 400,
  },
  chatPanel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F8F9FA",
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F0F0",
  },
  messageText: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 10,
    color: "#666666",
    alignSelf: "flex-end",
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    padding: 8,
  },
});

