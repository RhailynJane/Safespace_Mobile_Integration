import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";

const { width, height } = Dimensions.get("window");

// Mock chat messages
const initialMessages = [
  { id: 1, text: "Hello! How are you feeling today?", sender: "Support Worker", time: "10:25 AM" },
  { id: 2, text: "I'm doing well, thank you for asking.", sender: "You", time: "10:26 AM" },
  { id: 3, text: "That's great to hear. Let's begin our session.", sender: "Support Worker", time: "10:28 AM" },
];

// Emoji options
const emojiOptions = ["👍", "❤️", "😊", "😮", "😢", "🙏", "👏", "🔥"];

export default function VideoCallScreen() {
  const [isDemoMode] = useState(true);
  const { user } = useUser();
  const params = useLocalSearchParams();
  const supportWorkerName = (params.supportWorkerName as string) || "Support Worker";

  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("front");

  // Call states
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRaiseHand, setIsRaiseHand] = useState(false);
  const [isEmojiPanelOpen, setIsEmojiPanelOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [reactions, setReactions] = useState<
    { id: number; emoji: string; position: { x: number; y: number }; opacity: Animated.Value }[]
  >([]);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [callDuration, setCallDuration] = useState(0);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const callDurationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeCall();
    requestCameraPermissionImmediately();

    return () => {
      endCall();
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
      }
    };
  }, []);

  // FORCE camera permission request immediately
  const requestCameraPermissionImmediately = async () => {
    console.log("🎥 FORCING camera permission request...");
    
    try {
      // Small delay to ensure component is mounted
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!permission) {
        console.log("⚠️ Permission object not ready yet");
        return;
      }

      console.log("📊 Current status:", permission.status);
      console.log("📊 Granted:", permission.granted);

      if (!permission.granted && !permissionRequested) {
        console.log("🔔 Requesting permission NOW...");
        setPermissionRequested(true);
        
        const result = await requestPermission();
        console.log("✅ Permission result:", result);

        if (!result.granted) {
          Alert.alert(
            "Camera Permission Required",
            "Please go to Settings → SafeSpace → Camera and enable access.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Open Settings",
                onPress: () => {
                  // On iOS, this doesn't directly open settings
                  // But we can at least inform the user
                  console.log("User needs to open Settings manually");
                }
              }
            ]
          );
        } else {
          console.log("✅ Camera permission granted!");
        }
      } else if (permission.granted) {
        console.log("✅ Permission already granted");
      }
    } catch (error) {
      console.error("❌ Error requesting permission:", error);
    }
  };

  // Initialize call (demo mode)
  const initializeCall = async () => {
    setCallStatus("Connecting...");
    
    setTimeout(() => {
      setCallStatus("Connected (Demo)");
      setIsCallConnected(true);
      startCallTimer();
    }, 2000);
  };

  // Start call duration timer
  const startCallTimer = () => {
    callDurationInterval.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLeaveCall = () => {
    Alert.alert(
      "End Call",
      "Are you sure you want to end this call?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Call",
          style: "destructive",
          onPress: () => endCall(),
        },
      ]
    );
  };

  const endCall = async () => {
    if (callDurationInterval.current) {
      clearInterval(callDurationInterval.current);
    }
    router.back();
  };

  const handleToggleCamera = () => {
    if (!permission?.granted) {
      Alert.alert(
        "Camera Permission Required",
        "Camera permission is not granted. Please enable it in Settings.",
        [
          { text: "OK" },
          {
            text: "Request Again",
            onPress: requestCameraPermissionImmediately
          }
        ]
      );
      return;
    }
    setIsCameraOn(!isCameraOn);
  };

  const handleFlipCamera = () => {
    setFacing(current => (current === "back" ? "front" : "back"));
  };

  const handleToggleMic = () => {
    setIsMicOn(!isMicOn);
  };

  const handleToggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setIsEmojiPanelOpen(false);
    }
  };

  const handleToggleRaiseHand = () => {
    setIsRaiseHand(!isRaiseHand);
  };

  const handleToggleEmojiPanel = () => {
    setIsEmojiPanelOpen(!isEmojiPanelOpen);
    if (!isEmojiPanelOpen && isChatOpen) {
      setIsChatOpen(false);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        text: newMessage,
        sender: "You",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMsg]);
      setNewMessage("");
    }
  };

  const handleAddReaction = (emoji: string) => {
    const newReaction = {
      id: Date.now(),
      emoji,
      position: {
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 200) + 100,
      },
      opacity: new Animated.Value(1),
    };
    
    setReactions([...reactions, newReaction]);
    
    Animated.sequence([
      Animated.timing(newReaction.opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(newReaction.opacity, {
        toValue: 0,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2300);
    
    setIsEmojiPanelOpen(false);
  };

  // Show loading if permissions not loaded
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Permission Debug Banner */}
      {!permission.granted && (
        <View style={styles.permissionBanner}>
          <Ionicons name="warning" size={20} color="#FFF" />
          <Text style={styles.permissionBannerText}>
            Camera access needed
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestCameraPermissionImmediately}
          >
            <Text style={styles.permissionButtonText}>Grant Access</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Video Content */}
      <View style={styles.videoContainer}>
        {/* Remote Video Placeholder */}
        <View style={styles.participantVideo}>
          <View style={styles.videoPlaceholder}>
            <Ionicons name="person-circle" size={100} color="#FFFFFF" />
            <Text style={styles.placeholderText}>Remote Video</Text>
            <Text style={styles.placeholderSubtext}>{supportWorkerName}</Text>
          </View>
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>{supportWorkerName}</Text>
            <View style={styles.audioIndicator}>
              <Ionicons name="mic" size={12} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Local Video Preview with REAL CAMERA */}
        <View style={styles.selfVideoPreview}>
          {isCameraOn && permission?.granted ? (
            <>
              <CameraView 
                style={styles.camera}
                facing={facing}
              />
              {/* Flip Camera Button */}
              <TouchableOpacity 
                style={styles.flipCameraButton}
                onPress={handleFlipCamera}
              >
                <Ionicons name="camera-reverse" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.cameraOffOverlay}>
              <Ionicons name="videocam-off" size={24} color="#FFFFFF" />
              <Text style={styles.cameraOffText}>
                {!permission?.granted ? "No Permission" : "Camera Off"}
              </Text>
              {!permission?.granted && (
                <TouchableOpacity
                  style={styles.miniButton}
                  onPress={requestCameraPermissionImmediately}
                >
                  <Text style={styles.miniButtonText}>Grant Access</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Call Status */}
        <View style={styles.callStatus}>
          <Text style={styles.callStatusText}>
            {isCallConnected ? formatDuration(callDuration) : callStatus}
          </Text>
        </View>

        {/* Connection Info Banner */}
        {isCallConnected && (
          <View style={styles.connectionBanner}>
            <Ionicons name="information-circle" size={20} color="#FFF" />
            <Text style={styles.connectionText}>
              {permission?.granted ? "Camera ready! 📹" : "Tap to grant camera access"}
            </Text>
          </View>
        )}

        {/* Reactions displayed on screen */}
        {reactions.map((reaction) => (
          <Animated.Text
            key={reaction.id}
            style={[
              styles.reaction,
              {
                left: reaction.position.x,
                top: reaction.position.y,
                opacity: reaction.opacity,
                transform: [
                  {
                    translateY: reaction.opacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -50],
                    }),
                  },
                ],
              },
            ]}
          >
            {reaction.emoji}
          </Animated.Text>
        ))}
      </View>

      {/* Bottom Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={[styles.controlButton, isChatOpen && styles.controlButtonActive]}
            onPress={handleToggleChat}
          >
            <Ionicons name="chatbubble" size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>Chat</Text>
          </TouchableOpacity>

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

          <TouchableOpacity 
            style={[styles.controlButton, isEmojiPanelOpen && styles.controlButtonActive]}
            onPress={handleToggleEmojiPanel}
          >
            <Ionicons name="happy" size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>React</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, !isCameraOn && styles.controlButtonMuted]}
            onPress={handleToggleCamera}
          >
            <Ionicons 
              name={isCameraOn ? "videocam" : "videocam-off"} 
              size={24} 
              color="#FFFFFF" 
            />
            <Text style={styles.controlText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, !isMicOn && styles.controlButtonMuted]}
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

      {/* Emoji Panel */}
      {isEmojiPanelOpen && (
        <View style={styles.emojiPanel}>
          <Text style={styles.emojiPanelTitle}>React</Text>
          <View style={styles.emojiGrid}>
            {emojiOptions.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.emojiButton}
                onPress={() => handleAddReaction(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Chat Panel */}
      {isChatOpen && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.chatPanelContainer}
        >
          <View style={styles.chatPanel}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Chat</Text>
              <TouchableOpacity onPress={handleToggleChat}>
                <Ionicons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.messagesContainer}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageBubble,
                    message.sender === "You" ? styles.myMessage : styles.theirMessage,
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
  permissionText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  permissionBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FF9800",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    zIndex: 10000,
  },
  permissionBannerText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 8,
    marginRight: 12,
    fontWeight: "600",
  },
  permissionButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  permissionButtonText: {
    color: "#FF9800",
    fontSize: 12,
    fontWeight: "600",
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
  videoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
  },
  placeholderText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 10,
  },
  placeholderSubtext: {
    color: "#999",
    fontSize: 14,
    marginTop: 5,
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
    backgroundColor: "#333",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  flipCameraButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 8,
  },
  cameraOffOverlay: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraOffText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 8,
  },
  miniButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  miniButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
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
  connectionBanner: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: "90%",
  },
  connectionText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  reaction: {
    position: "absolute",
    fontSize: 30,
    zIndex: 100,
  },
  controlsContainer: {
    padding: 15,
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
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#404040",
    minWidth: 60,
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
    gap: 8,
  },
  leaveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emojiPanel: {
    position: "absolute",
    bottom: 150,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  emojiPanelTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333333",
    textAlign: "center",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 240,
  },
  emojiButton: {
    padding: 8,
    borderRadius: 8,
    margin: 4,
    backgroundColor: "#F0F0F0",
  },
  emoji: {
    fontSize: 24,
  },
  chatPanelContainer: {
    position: "absolute",
    right: 20,
    bottom: 180,
    width: 300,
    height: 400,
    zIndex: 1000,
  },
  chatPanel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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