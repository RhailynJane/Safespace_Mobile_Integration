import { useState, useEffect, useRef, useCallback } from "react";
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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import SendBirdCallService from "../../../lib/sendbird-service";
import { useConvexVideoSession } from "../../../utils/hooks/useConvexVideoSession";
import StatusModal from "../../../components/StatusModal";

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
  const supportWorkerId = params.supportWorkerId as string;
  const supportWorkerName = params.supportWorkerName as string || "Support Worker";
  const sessionIdParam = params.sessionId as string || '';
  const audioOption = params.audioOption as string || 'phone';

  // Convex whoami — helps detect auth readiness (optional UI use)
  const whoami = useQuery(api.auth.whoami as any, {} as any) as any;

  // Video session tracking hook
  const { markConnected, endSession, updateSettings, reportQualityIssue, attachExistingSession, isUsingConvex } = useConvexVideoSession(null);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(audioOption !== 'none');
  // Chat removed per request
  const [isRaiseHand, setIsRaiseHand] = useState(false);
  const [isEmojiPanelOpen, setIsEmojiPanelOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [qualityIssueText, setQualityIssueText] = useState("");
  const [qualitySubmitting, setQualitySubmitting] = useState(false);
  const [qualityFeedback, setQualityFeedback] = useState<string | null>(null);
  const [messages, setMessages] = useState(initialMessages);
  // Chat removed
  const [reactions, setReactions] = useState<
    { id: number; emoji: string; position: { x: number; y: number }; opacity: Animated.Value }[]
  >([]);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [callDuration, setCallDuration] = useState(0);
  const [isCallConnected, setIsCallConnected] = useState(false);

  // Safe area and focus
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  // Camera & permissions state
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [cameraReady, setCameraReady] = useState(true);
  const [cameraRefresh, setCameraRefresh] = useState(0);
  const [showFullCamera, setShowFullCamera] = useState(false);
  const [showCamera, setShowCamera] = useState(true);

  const callDurationInterval = useRef<NodeJS.Timeout | null>(null);
  const cameraReadyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: request permissions on demand
  const requestCameraPermissionImmediately = useCallback(async () => {
    try {
      const result = await requestPermission();
      if (result.granted) {
        // Force a refresh after permission is granted
        setCameraRefresh(prev => prev + 1);
      }
    } catch (e) {
      console.warn('Camera permission request failed', e);
    }
  }, [requestPermission]);

  // Flip between front/back camera
  const handleFlipCamera = useCallback(() => {
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
    setCameraRefresh((prev) => prev + 1);
  }, []);

  // Start call duration timer (defined early for use in callbacks)
  const startCallTimer = useCallback(() => {
    // Mark session as connected in Convex
    if (isUsingConvex && sessionIdParam) {
      markConnected(sessionIdParam);
    }

    callDurationInterval.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, [isUsingConvex, sessionIdParam, markConnected]);

  // Set up call event listeners (defined before initializeCall for hook deps ordering)
  const setupCallListeners = useCallback((call: any) => {
    call.onEstablished = () => {
      setCallStatus("Connected");
      setIsCallConnected(true);
      startCallTimer();
    };

    call.onConnected = () => {
      console.log("Call connected");
    };

    call.onEnded = () => {
      setCallStatus("Call Ended");
      setIsCallConnected(false);
      setTimeout(() => {
        router.replace("/(app)/video-consultations");
      }, 2000);
    };

    call.onRemoteAudioSettingsChanged = () => {
      console.log("Remote audio settings changed");
    };

    call.onRemoteVideoSettingsChanged = () => {
      console.log("Remote video settings changed");
    };
  }, [startCallTimer]);

  // Initialize SendBird and start call
  const initializeCall = useCallback(async () => {
    // Demo mode - simulate successful connection
    if (isDemoMode) {
      setCallStatus("Connecting...");
      
      // Simulate connection delay
      setTimeout(() => {
        setCallStatus("Connected (Demo)");
        setIsCallConnected(true);
        startCallTimer();
      }, 2000);
      
      return;
    }

    // Real SendBird code (only runs if isDemoMode is false)
    try {
      await SendBirdCallService.initialize();
      const userId = user?.id || `user_${Date.now()}`;
      await SendBirdCallService.authenticate(userId);
      const call = await SendBirdCallService.createCall(
        `support_worker_${supportWorkerId}`,
        true
      );
      setupCallListeners(call);
      setCallStatus("Ringing...");
    } catch (error) {
      console.error("Failed to initialize call:", error);
      Alert.alert(
        "Call Failed",
        "Unable to start video call. Please try again.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    }
  }, [isDemoMode, supportWorkerId, user?.id, setupCallListeners, startCallTimer]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const [endModalVisible, setEndModalVisible] = useState(false);
  const handleLeaveCall = () => setEndModalVisible(true);

  const endCall = useCallback(async () => {
    // End session in Convex first
    if (isUsingConvex && sessionIdParam) {
      await endSession({
        sessionIdToEnd: sessionIdParam,
        endReason: 'user_left',
      });
    }

    // Demo mode - just go back
    if (isDemoMode) {
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
      }
      router.replace("/(app)/video-consultations");
      return;
    }

    // Real SendBird code
    try {
      await SendBirdCallService.endCall();
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
      }
      router.replace("/(app)/video-consultations");
    } catch (error) {
      console.error("Error ending call:", error);
      router.replace("/(app)/video-consultations");
    }
  }, [isDemoMode, isUsingConvex, sessionIdParam, endSession]);

  // End session when app goes to background (user left call)
  useEffect(() => {
    const sub = (state: string) => {
      if (state === 'background' || state === 'inactive') {
        endCall();
      }
    };
    const { AppState } = require('react-native');
    const subscription = AppState.addEventListener('change', sub);
    return () => {
      subscription?.remove?.();
    };
  }, [endCall]);

  useEffect(() => {
    // Attach existing session id so updateSettings/reportQualityIssue works
    if (sessionIdParam) attachExistingSession(sessionIdParam);
    initializeCall();

    return () => {
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
      }
      if (cameraReadyTimeoutRef.current) {
        clearTimeout(cameraReadyTimeoutRef.current);
      }
    };
  }, [initializeCall, sessionIdParam, attachExistingSession]);

  // Ensure camera is ready when permissions are granted
  useEffect(() => {
    if (isFocused && isCameraOn && permission?.granted && showCamera) {
      setCameraReady(true);
    }
  }, [isFocused, isCameraOn, permission?.granted, showCamera]);

  const handleToggleCamera = () => {
    const newState = !isCameraOn;
    setIsCameraOn(newState);
    
    if (newState) {
      // Refresh camera when turning it back on
      setCameraRefresh((prev) => prev + 1);
      setCameraReady(true);
    }
    
    // Update session settings in Convex
    if (isUsingConvex && sessionIdParam) {
      updateSettings({ cameraEnabled: newState });
    }
    
    if (!isDemoMode) {
      SendBirdCallService.toggleVideo(newState);
    }
  };

  const handleToggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    
    // Update session settings in Convex
    if (isUsingConvex && sessionIdParam) {
      updateSettings({ micEnabled: newState });
    }
    
    if (!isDemoMode) {
      SendBirdCallService.toggleAudio(newState);
    }
  };

  // Apply initial mic state based on audioOption immediately when session is available
  useEffect(() => {
    if (!sessionIdParam) return;
    try {
      if (isUsingConvex) {
        updateSettings({ micEnabled: isMicOn });
      }
      if (!isDemoMode) {
        SendBirdCallService.toggleAudio(isMicOn);
      }
    } catch (e) {
      // no-op: initial mic state propagation is best-effort
    }
  }, [sessionIdParam, isUsingConvex, isMicOn, updateSettings, isDemoMode]);

  // Chat removed

  const handleToggleRaiseHand = () => {
    setIsRaiseHand(!isRaiseHand);
  };

  const handleToggleEmojiPanel = () => {
    setIsEmojiPanelOpen(!isEmojiPanelOpen);
  };

  // Quality Issue Reporting Helpers
  const presetQualityIssues = [
    "Audio cutting out",
    "Video freezing",
    "Echo in audio",
    "Connection dropped",
    "Low video quality",
  ];

  const openQualityModal = () => {
    setIsQualityModalOpen(true);
    setQualityFeedback(null);
    setQualityIssueText("");
  };

  const submitQualityIssue = async () => {
    if (!qualityIssueText.trim()) return;
    setQualitySubmitting(true);
    try {
      if (isUsingConvex && sessionIdParam) {
        await reportQualityIssue(qualityIssueText.trim());
        setQualityFeedback("Issue reported to support. Thank you!");
      } else {
        setQualityFeedback("Issue captured locally (offline mode)");
      }
      setTimeout(() => setIsQualityModalOpen(false), 1200);
    } catch (e) {
      setQualityFeedback("Failed to report issue");
    } finally {
      setQualitySubmitting(false);
    }
  };

  // Chat removed

  const handleAddReaction = (emoji: string) => {
    const newReaction = {
      id: Date.now(),
      emoji,
      position: {
        x: Math.random() * (width - 120) + 60,
        y: Math.random() * (height - 300) + 140,
      },
      opacity: new Animated.Value(1),
    };
    
    setReactions([...reactions, newReaction]);
    
    const driftX = new Animated.Value(0);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(newReaction.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(newReaction.opacity, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(driftX, { toValue: 15, duration: 800, useNativeDriver: true }),
        Animated.timing(driftX, { toValue: -10, duration: 800, useNativeDriver: true }),
        Animated.timing(driftX, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]),
    ]).start();
    
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2300);
    
    setIsEmojiPanelOpen(false);
  };

  const handleCameraReady = useCallback(() => {
    console.log('Camera is ready');
    setCameraReady(true);
    if (cameraReadyTimeoutRef.current) {
      clearTimeout(cameraReadyTimeoutRef.current);
    }
  }, []);

  const handleCameraError = useCallback((e: any) => {
    console.log('CameraView onMountError', e?.nativeEvent || e);
    setCameraReady(false);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A1A1A' }}>
      <View style={{ flex: 1 }}>
        {/* Permission Debug Banner */}
        {!permission?.granted && (
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={[styles.videoContainer, { flex: 1, width: '100%', height: undefined, minHeight: 0, maxHeight: '100%' }]}> 
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
            <View 
              style={[
                styles.selfVideoPreview,
                Platform.OS === 'ios' ? styles.previewClipIOS : styles.previewClipAndroid,
                { bottom: Math.max(insets.bottom, 8) + 60 }
              ]}
            >
              {isFocused && isCameraOn && permission?.granted && showCamera ? (
                <>
                  <CameraView
                    style={[styles.camera, { backgroundColor: '#000' }]}
                    facing={facing}
                    onCameraReady={handleCameraReady}
                    onMountError={handleCameraError}
                    key={`camera-${facing}-${cameraRefresh}`}
                  />
                  {/* Expand to full screen */}
                  <TouchableOpacity
                    style={styles.expandButton}
                    onPress={() => setShowFullCamera(true)}
                  >
                    <Ionicons name="expand" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  {/* Flip Camera Button */}
                  <TouchableOpacity
                    style={styles.flipCameraButton}
                    onPress={handleFlipCamera}
                  >
                    <Ionicons name="camera-reverse" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  {/* Non-clipping rounded border overlay for Android */}
                  {Platform.OS === 'android' && (
                    <View pointerEvents="none" style={styles.previewBorderOverlay} />
                  )}
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
            <View style={[
              styles.callStatus,
              isCallConnected ? { top: 100 } : { top: 20 }
            ]}>
              <Text style={styles.callStatusText}>
                {isCallConnected ? formatDuration(callDuration) : callStatus}
              </Text>
            </View>

            {/* Connection Info Banner */}
            {isCallConnected && (
              <View style={styles.connectionBanner}>
                <Ionicons name="information-circle" size={20} color="#FFF" />
                <Text style={styles.connectionText}>
                  {permission?.granted ? "Connected to Support Worker" : "Tap to grant camera access"}
                </Text>
              </View>
            )}

            {/* Hand Raised indicator */}
            {isRaiseHand && (
              <View style={[styles.connectionBanner, { top: 140, backgroundColor: 'rgba(255, 193, 7, 0.95)' }]}>
                <Ionicons name="hand-left" size={20} color="#000" />
                <Text style={[styles.connectionText, { color: '#000' }]}>Hand Raised</Text>
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
                      // slight horizontal drift for a nicer effect
                      { translateX: reaction.opacity.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }) },
                    ],
                  },
                ]}
              >
                {reaction.emoji}
              </Animated.Text>
            ))}
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

        {/* Full-screen Camera (debug/expand) */}
        <Modal
          visible={showFullCamera}
          animationType="fade"
          onRequestClose={() => setShowFullCamera(false)}
          transparent={false}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
            <View style={{ flex: 1 }}>
              {isFocused && isCameraOn && permission?.granted ? (
                <CameraView
                  style={{ flex: 1, backgroundColor: '#000' }}
                  facing={facing}
                  onCameraReady={handleCameraReady}
                  onMountError={handleCameraError}
                  key={`full-camera-${facing}-${cameraRefresh}`}
                />
              ) : (
                <View style={[styles.cameraOffOverlay, { flex: 1 }]}>
                  <Ionicons name="videocam-off" size={24} color="#FFFFFF" />
                  <Text style={styles.cameraOffText}>
                    {!permission?.granted ? "No Permission" : "Camera Off"}
                  </Text>
                </View>
              )}
              <View style={{ position: 'absolute', top: 16, right: 16 }}>
                <TouchableOpacity
                  onPress={() => setShowFullCamera(false)}
                  style={{ backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 8 }}
                >
                  <Ionicons name="close" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Chat removed */}

        {/* Bottom Controls and Leave Button */}
        <View style={{ backgroundColor: '#2D2D2D', paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8) + 16 }}>
          <View style={styles.controlsRow}>
            {/* Chat button removed */}
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
            <TouchableOpacity 
              style={[styles.controlButton, isQualityModalOpen && styles.controlButtonActive]}
              onPress={openQualityModal}
            >
              <Ionicons name="alert-circle" size={24} color="#FFFFFF" />
              <Text style={styles.controlText}>Issue</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.leaveButtonContainer, { marginBottom: 8 }]}> 
            <TouchableOpacity 
              style={styles.leaveButton}
              onPress={handleLeaveCall}
            >
              <Ionicons name="call" size={16} color="#FFFFFF" />
              <Text style={styles.leaveButtonText}>Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Quality Issue Modal */}
      <Modal
        visible={isQualityModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsQualityModalOpen(false)}
      >
        <View style={styles.qualityModalOverlay}>
          <View style={styles.qualityModalCard}>
            <View style={styles.qualityModalHeader}>
              <Text style={styles.qualityModalTitle}>Report Quality Issue</Text>
              <TouchableOpacity onPress={() => setIsQualityModalOpen(false)}>
                <Ionicons name="close" size={22} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.qualityModalSubtitle}>Select an issue or describe briefly.</Text>
            <View style={styles.qualityPresetContainer}>
              {presetQualityIssues.map(issue => (
                <TouchableOpacity
                  key={issue}
                  style={[
                    styles.presetIssueChip,
                    qualityIssueText === issue && styles.presetIssueChipActive,
                  ]}
                  onPress={() => setQualityIssueText(issue)}
                >
                  <Text style={[
                    styles.presetIssueText,
                    qualityIssueText === issue && styles.presetIssueTextActive,
                  ]}>{issue}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.qualityInput}
              placeholder="Describe the issue (optional)"
              placeholderTextColor="#888"
              multiline
              value={qualityIssueText}
              onChangeText={setQualityIssueText}
              maxLength={200}
            />
            {qualityFeedback && (
              <Text style={styles.qualityFeedbackText}>{qualityFeedback}</Text>
            )}
            <View style={styles.qualityActions}>
              <TouchableOpacity
                style={styles.qualityCancelButton}
                onPress={() => setIsQualityModalOpen(false)}
                disabled={qualitySubmitting}
              >
                <Text style={styles.qualityCancelText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.qualitySubmitButton, !qualityIssueText.trim() && { opacity: 0.5 }]}
                onPress={submitQualityIssue}
                disabled={!qualityIssueText.trim() || qualitySubmitting}
              >
                <Text style={styles.qualitySubmitText}>{qualitySubmitting ? 'Sending…' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* End Call Confirmation (StatusModal) */}
      <StatusModal
        visible={endModalVisible}
        type="info"
        title="End Call?"
        message="Are you sure you want to end this call?"
        buttonText="Keep Calling"
        onClose={() => setEndModalVisible(false)}
        secondaryButtonText="End Call"
        secondaryButtonType="destructive"
        onSecondaryButtonPress={() => { setEndModalVisible(false); endCall(); }}
      />

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
    padding: 16,
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
    backgroundColor: "#000",
    zIndex: 2,
    elevation: 6,
  },
  previewClipIOS: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewClipAndroid: {
    borderRadius: 0,
    overflow: 'visible',
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
    zIndex: 11,
  },
  expandButton: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    padding: 6,
    zIndex: 11,
  },
  previewBorderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 9,
  },
  cameraOffOverlay: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraOffText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
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
    justifyContent: "center",
    marginBottom: 6,
    flexWrap: "wrap",
    gap: 8,
  },
  controlButton: {
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#404040",
    minWidth: 60,
    marginBottom: 6,
    marginRight: 8,
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
  qualityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qualityModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
  },
  qualityModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  qualityModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  qualityModalSubtitle: {
    fontSize: 12,
    color: '#555',
    marginBottom: 10,
  },
  qualityPresetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  presetIssueChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F1F1',
  },
  presetIssueChipActive: {
    backgroundColor: '#4CAF50',
  },
  presetIssueText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  presetIssueTextActive: {
    color: '#FFF',
  },
  qualityInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#333',
    backgroundColor: '#FAFAFA',
    marginBottom: 12,
  },
  qualityFeedbackText: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  qualityActions: {
    flexDirection: 'row',
    gap: 10,
  },
  qualityCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCC',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  qualityCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  qualitySubmitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  qualitySubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});