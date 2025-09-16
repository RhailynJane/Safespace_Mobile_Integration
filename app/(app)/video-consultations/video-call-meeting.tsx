/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

// Mock chat messages
const initialMessages = [
  { id: 1, text: "Hello! How are you feeling today?", sender: "Eric", time: "10:25 AM" },
  { id: 2, text: "I'm doing well, thank you for asking.", sender: "You", time: "10:26 AM" },
  { id: 3, text: "That's great to hear. Let's begin our session.", sender: "Eric", time: "10:28 AM" },
];

// Emoji options
const emojiOptions = ["👍", "❤️", "😊", "😮", "😢", "🙏", "👏", "🔥"];

export default function VideoCallScreen() {
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
    // Close emoji panel if chat is opened
    if (!isChatOpen) {
      setIsEmojiPanelOpen(false);
    }
  };

  const handleToggleRaiseHand = () => {
    setIsRaiseHand(!isRaiseHand);
  };

  const handleToggleEmojiPanel = () => {
    setIsEmojiPanelOpen(!isEmojiPanelOpen);
    // Close chat if emoji panel is opened
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
      
      // Simulate a response after a short delay
      setTimeout(() => {
        const responseMsg = {
          id: messages.length + 2,
          text: "Thank you for sharing that. Let's explore this further in our session.",
          sender: "Eric",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, responseMsg]);
      }, 1500);
    }
  };

  const handleAddReaction = (emoji: string) => {
    // Add the reaction to the screen with a random position
    const newReaction = {
      id: Date.now(),
      emoji,
      position: {
        x: Math.random() * (width - 100) + 50, // Random x position
        y: Math.random() * (height - 200) + 100, // Random y position
      },
      opacity: new Animated.Value(1),
    };
    
    setReactions([...reactions, newReaction]);
    
    // Animate the reaction (fade out and move up)
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
    
    // Remove the reaction after animation completes
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2300);
    
    // Close the emoji panel after selection
    setIsEmojiPanelOpen(false);
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
        {/* First Row - All controls in one line */}
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
          <TouchableOpacity 
            style={[styles.controlButton, isEmojiPanelOpen && styles.controlButtonActive]}
            onPress={handleToggleEmojiPanel}
          >
            <Ionicons name="happy" size={24} color="#FFFFFF" />
            <Text style={styles.controlText}>React</Text>
          </TouchableOpacity>

          {/* Camera Toggle */}
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

          {/* Mic Toggle */}
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
  // Reaction styles
  reaction: {
    position: "absolute",
    fontSize: 30,
    zIndex: 100,
  },
  // Controls styles
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
  // Emoji Panel styles
  emojiPanel: {
    position: "absolute",
    bottom: 150,
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
  // Chat Panel Styles
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