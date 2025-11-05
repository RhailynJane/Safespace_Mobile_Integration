/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// Utility function to get file icon based on file name or extension
const getFileIcon = (
  fileName?: string
):
  | "document-outline"
  | "document-text-outline"
  | "grid-outline"
  | "image-outline"
  | "archive-outline" => {
  if (!fileName) return "document-outline";
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "document-text-outline";
    case "doc":
    case "docx":
      return "document-outline";
    case "xls":
    case "xlsx":
      return "grid-outline";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "image-outline";
    case "zip":
    case "rar":
      return "archive-outline";
    default:
      return "document-outline";
  }
};
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
  Keyboard,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from 'expo-av';
import CurvedBackground from "../../../../components/CurvedBackground";
import OptimizedImage from "../../../../components/OptimizedImage";
import { Message, Participant, messagingService } from "../../../../utils/sendbirdService";
import activityApi from "../../../../utils/activityApi";
import * as FileSystem from "expo-file-system";
import * as FSLegacy from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "../../../../contexts/ThemeContext";
import { getApiBaseUrl } from "../../../../utils/apiBaseUrl";
import * as MediaLibrary from "expo-media-library";
import Constants from "expo-constants";
import { useIsFocused } from "@react-navigation/native";
import { APP_TIME_ZONE } from "../../../../utils/timezone";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Extended Message type to include attachment properties
interface ExtendedMessage extends Message {
  attachment_url?: string;
  file_name?: string;
  file_size?: number;
}

export default function ChatScreen() {
  const { theme, scaledFontSize, isDarkMode, fontScale } = useTheme();
  const isFocused = useIsFocused();
  const { userId } = useAuth();
  const params = useLocalSearchParams();
  const conversationId = params.id as string;
  const conversationTitle = params.title as string;
  const channelUrl = (params.channelUrl as string) || "";
  const initialOnlineParam = (params.initialOnline as string) || "";
  const initialPresenceParam = (params.initialPresence as string) || "";
  const initialLastActiveParam = (params.initialLastActive as string) || "";
  const otherClerkIdParam = (params.otherClerkId as string) || "";
  const profileImageUrlParam = (params.profileImageUrl as string) || "";
  const API_BASE_URL = getApiBaseUrl();

  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const lastMessageIdRef = useRef<string | null>(null);
  const lastMarkedAtRef = useRef<number>(0);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contact, setContact] = useState<Participant | null>(null);
  // Optimistic presence: default to online unless explicitly told otherwise by param
  const [isOnline, setIsOnline] = useState(initialOnlineParam === "0" ? false : true);
  const [presence, setPresence] = useState<'online' | 'away' | 'offline'>(
    (initialPresenceParam as any) === 'online' || (initialPresenceParam as any) === 'away' || (initialPresenceParam as any) === 'offline'
      ? (initialPresenceParam as any)
      : (initialOnlineParam === '0' ? 'offline' : 'online')
  );
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [viewerModalVisible, setViewerModalVisible] = useState(false);
  const [currentAttachment, setCurrentAttachment] =
    useState<ExtendedMessage | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [fileErrorModalVisible, setFileErrorModalVisible] = useState(false);
  const [fileErrorMessage, setFileErrorMessage] = useState("");
  const [userNearBottom, setUserNearBottom] = useState(true);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const didMarkReadRef = useRef(false);
  const [manualScrolling, setManualScrolling] = useState(false);
  const scrollIdleTimerRef = useRef<any>(null);
  const messagesListRef = useRef<FlatList<ExtendedMessage>>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingRecordingUri, setPendingRecordingUri] = useState<string | null>(null);
  const [pendingRecordingDuration, setPendingRecordingDuration] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<Array<{ uri: string; name: string; size?: number }>>([]);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('smileys');
  const emojiScrollRef = useRef<ScrollView>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalData, setStatusModalData] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
    confirm: undefined as undefined | { confirmText?: string; cancelText?: string; onConfirm: () => void },
    actions: undefined as undefined | Array<{ label: string; onPress: () => void; variant?: 'default' | 'primary' | 'danger' }>,
  });

  // Get safe area insets for proper spacing
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Create styles dynamically based on text size
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const styles = useMemo(() => createStyles(scaledFontSize), [fontScale]);

  const showStatusModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setStatusModalData({ type, title, message, confirm: undefined, actions: undefined });
    setStatusModalVisible(true);
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    opts?: { confirmText?: string; cancelText?: string }
  ) => {
    setStatusModalData({
      type: 'info',
      title,
      message,
      confirm: { onConfirm, confirmText: opts?.confirmText, cancelText: opts?.cancelText },
      actions: undefined,
    });
    setStatusModalVisible(true);
  };

  const showActions = (
    title: string,
    message: string,
    actions: Array<{ label: string; onPress: () => void; variant?: 'default' | 'primary' | 'danger' }>
  ) => {
    setStatusModalData({ type: 'info', title, message, confirm: undefined, actions });
    setStatusModalVisible(true);
  };

  // Calculate header height based on screen size and safe area
  const getHeaderHeight = () => {
    const baseHeight = 60; // Minimum header height
    const safeAreaTop = insets.top;

    // Adjust header height based on screen size
    if (SCREEN_HEIGHT > 800) {
      return baseHeight + safeAreaTop + 10; // For larger screens
    } else if (SCREEN_HEIGHT > 600) {
      return baseHeight + safeAreaTop + 5; // For medium screens
    } else {
      return baseHeight + safeAreaTop; // For smaller screens
    }
  };

  const headerHeight = getHeaderHeight();
  // Use a smaller keyboard offset to avoid excessive gap between input and keyboard
  const keyboardOffset = Platform.OS === 'ios' ? insets.top + 50 : 0;

  // Track keyboard visibility to adjust bottom spacing only when keyboard is hidden
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    // Also listen to 'will' events on iOS for smoother transitions
    const willShowSub = Keyboard.addListener('keyboardWillShow', () => setKeyboardVisible(true));
    const willHideSub = Keyboard.addListener('keyboardWillHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
      willShowSub.remove();
      willHideSub.remove();
    };
  }, []);

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showStatusModal(
          'error', 
          'Permission Required', 
          'Sorry, we need camera roll permissions to make this work!'
        );
      }
    })();
  }, []);

  // Update user activity
  const updateUserActivity = useCallback(async () => {
    if (!userId) return;

    try {
      await fetch(`${API_BASE_URL}/api/users/${userId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating user activity:", error);
    }
  }, [userId, API_BASE_URL]);

  // Get last seen text with persistent online status
  const getLastSeenText = useCallback(
    (lastActiveAt: string | null, online: boolean) => {
      if (online) return "Online now";

      if (!lastActiveAt) return "Offline";

      const lastActive = new Date(lastActiveAt);
      const now = new Date();
      const diffMinutes = Math.floor(
        (now.getTime() - lastActive.getTime()) / (1000 * 60)
      );

      if (diffMinutes < 1) return "Online now";
      if (diffMinutes < 60) return `Offline - ${diffMinutes}m ago`;
      if (diffMinutes < 1440)
        return `Offline - ${Math.floor(diffMinutes / 60)}h ago`;
      return `Offline - ${Math.floor(diffMinutes / 1440)}d ago`;
    },
    []
  );

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversationId || !userId) {
      console.log("Missing conversationId or userId");
      setLoading(false);
      return;
    }

    try {
      console.log(`[${Date.now()}] Loading messages for conversation ${conversationId}`)
      // Start all non-blocking operations in parallel
      const startTime = Date.now();
      
      // Fire and forget: update activity in background (don't await)
      updateUserActivity().catch(() => {});

      // Load messages (this is the critical path) - no limit to show all messages
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}/messages?clerkUserId=${userId}&t=${Date.now()}`
      );

      if (response.ok) {
        const result = await response.json();
        const loadTime = Date.now() - startTime;
        console.log(`[${Date.now()}] Loaded ${result.data.length} messages in ${loadTime}ms`);
        setMessages(result.data);

        // Detect new last message and mark as read when appropriate
        const latest = result.data[result.data.length - 1];
        const latestId = latest ? String(latest.id) : null;
        const prevId = lastMessageIdRef.current;
        const nowTs = Date.now();
        const shouldMark =
          latestId && latestId !== prevId &&
          // Do not mark if the latest is mine
          !(latest && latest.sender && latest.sender.clerk_user_id === userId) &&
          // Throttle mark-as-read to avoid spamming
          nowTs - lastMarkedAtRef.current > 2000;

        if (shouldMark) {
          lastMessageIdRef.current = latestId;
          lastMarkedAtRef.current = nowTs;
          // Fire-and-forget: mark as read both in SendBird (if enabled) and backend
          (async () => {
            try {
              if (channelUrl && messagingService.isSendBirdEnabled()) {
                await messagingService.markAsRead(channelUrl);
              }
            } catch (_e) { /* ignore SendBird mark-as-read errors */ }
            try {
              await fetch(`${API_BASE_URL}/api/messages/conversations/${conversationId}/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clerkUserId: userId })
              });
            } catch (_e) { /* ignore backend mark-read errors */ }
          })();
        }

        // Fire and forget: mark as read in background (don't block UI)
        Promise.all([
          // SendBird mark as read
          (async () => {
            try {
              if (!didMarkReadRef.current && channelUrl && messagingService.isSendBirdEnabled()) {
                await messagingService.markAsRead(channelUrl);
                didMarkReadRef.current = true;
              }
            } catch (_e) {
              // ignore SB errors
            }
          })(),
          // Backend mark as read
          (async () => {
            try {
              if (userId && conversationId) {
                console.log(`📭 Calling mark-read API for conversation ${conversationId}`);
                const markResponse = await fetch(`${API_BASE_URL}/api/messages/conversations/${conversationId}/mark-read`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ clerkUserId: userId })
                });
                console.log(`✅ Mark-read API responded:`, markResponse.status, markResponse.ok);
              } else {
                console.log(`⚠️ Skip mark-read: userId=${userId}, conversationId=${conversationId}`);
              }
            } catch (e) {
              console.log(`❌ Mark-read API failed:`, e);
            }
          })()
        ]).catch(() => {}); // Don't block on mark-read failures

        // Initialize contact from route params if not already set
        if (!contact && otherClerkIdParam) {
          const fallbackContact = {
            id: otherClerkIdParam,
            clerk_user_id: otherClerkIdParam,
            first_name: conversationTitle?.split(" ")[0] || "User",
            last_name: conversationTitle?.split(" ").slice(1).join(" ") || "",
            email: "",
            profile_image_url: profileImageUrlParam || undefined,
            online: initialOnlineParam === "0" ? false : true,
            last_active_at: initialLastActiveParam || null,
          };
          setContact(fallbackContact);
        }
      } else {
        console.error("Failed to load messages:", response.status);
        showStatusModal('error', 'Load Error', 'Failed to load messages. Please try again.');
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      showStatusModal('error', 'Connection Error', 'Failed to load messages. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [
    conversationId,
    userId,
    conversationTitle,
    API_BASE_URL,
    channelUrl,
    initialOnlineParam,
    initialLastActiveParam,
    otherClerkIdParam,
    profileImageUrlParam,
    contact,
    updateUserActivity,
  ]);

  // Load messages with fast polling while in the chat screen
  useEffect(() => {
    if (!isFocused || !conversationId || !userId) return;

    loadMessages(); // Load immediately

    // Poll faster when the user is near the bottom (actively viewing latest)
    const intervalMs = userNearBottom ? 4000 : 8000; // 4s vs 8s
    const pollInterval = setInterval(() => {
      loadMessages();
    }, intervalMs);

    return () => clearInterval(pollInterval);
  }, [isFocused, conversationId, userId, loadMessages, userNearBottom]);

  // One-time status refresh after mount (no polling)
  useEffect(() => {
    if (!isFocused || !contact || !contact.clerk_user_id || contact.clerk_user_id === "unknown") return;

    const updateOnlineStatus = async () => {
      try {
        const status = await activityApi.status(contact.clerk_user_id);
        if (status) {
          const newOnline = !!status.online;
          const newPresence = (status as any).presence as 'online' | 'away' | 'offline' | undefined;
          setIsOnline(newOnline);
          
          if (newPresence) {
            setPresence(newPresence);
          } else {
            setPresence(newOnline ? 'online' : 'offline');
          }
          setContact((prev) => prev ? { ...prev, online: newOnline, last_active_at: status.last_active_at } : prev);
        }
      } catch (_e) {
        // ignore
      }
    };

    const initialTimeout = setTimeout(updateOnlineStatus, 1500);
    return () => clearTimeout(initialTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused, contact?.clerk_user_id]);

  useEffect(() => {
    // Only auto-scroll if user is near bottom or last message is mine
    const last = messages[messages.length - 1];
    const lastIsMine = last ? last.sender.clerk_user_id === userId : false;
    if (!manualScrolling && (userNearBottom || lastIsMine)) {
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd?.({ animated: true });
      }, 100);
    }
  }, [messages, userNearBottom, userId, manualScrolling]);

  // Handle image selection from gallery
  const pickImage = async () => {
    try {
      setAttachmentModalVisible(false);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // slightly lower quality to reduce file size and improve performance
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAttachment(result.assets[0].uri, "image");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showStatusModal('error', 'Upload Error', 'Failed to pick image');
    }
  };

  // Handle document selection
  const pickDocument = async () => {
    try {
      setAttachmentModalVisible(false);

      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      const assets = result.assets || (result as any).assets || [];
      if (assets.length > 0) {
        const toAdd: Array<{ uri: string; name: string; size?: number }> = [];
        for (const asset of assets) {
          try {
            const info = await getFileInfo(asset.uri);
            toAdd.push({ uri: asset.uri, name: asset.name || `file_${Date.now()}`, size: info.size });
          } catch {
            toAdd.push({ uri: asset.uri, name: asset.name || `file_${Date.now()}` });
          }
        }
        setPendingFiles((prev) => [...prev, ...toAdd]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      showStatusModal('error', 'Upload Error', 'Failed to pick document');
    }
  };

  // Handle camera capture
  const takePhoto = async () => {
    try {
      setAttachmentModalVisible(false);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showStatusModal(
          'error',
          'Permission Required',
          'Sorry, we need camera permissions to take photos!'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // slightly lower quality to reduce file size
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAttachment(result.assets[0].uri, "image");
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      showStatusModal('error', 'Camera Error', 'Failed to take photo');
    }
  };

  // Simple and reliable file info function
  const getFileInfo = async (fileUri: string) => {
    try {
      // Use fetch to get file info - this works for most file types
      const response = await fetch(fileUri);

      // For local files, we might not get all headers, so use a default approach
      let fileSize = 0;

      // Try to get content-length from headers
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        fileSize = Number.parseInt(contentLength, 10);
      }

      // If we can't determine size from headers, use a fallback
      if (!fileSize) {
        // For local files, we can use the blob approach
        const blob = await response.blob();
        fileSize = blob.size;
      }

      return {
        exists: true,
        size: fileSize,
        uri: fileUri,
      };
    } catch (error) {
      console.error("Error getting file info:", error);

      return {
        exists: true,
        size: 1024, // Default size (1KB) - you can adjust this
        uri: fileUri,
      };
    }
  };

  // Upload attachment to server (multipart) and create a proper attachment message
  const uploadAttachment = async (
    fileUri: string,
    fileType: "image" | "file",
    fileName?: string
  ) => {
    if (!userId || !conversationId) return;

    try {
      setUploading(true);

      // Derive filename and extension
      const defaultName = fileType === "image" ? `photo_${Date.now()}.jpg` : `document_${Date.now()}.bin`;
      const originalName = fileName || (fileUri.split("/").pop() || defaultName);
      const nameParts = originalName.split(".");
      const originalExt = (nameParts.length > 1 ? nameParts.pop() : "bin") as string;
      let finalExt = originalExt;
      let finalMime = getMimeType(originalExt) || (fileType === "image" ? "image/jpeg" : "application/octet-stream");
      let finalNameBase = nameParts.join(".") || (fileType === "image" ? `photo_${Date.now()}` : `document_${Date.now()}`);
      let uploadUri = fileUri;

      // If image, compress/resize before upload using expo-image-manipulator (if available)
      if (fileType === 'image') {
        try {
          // @ts-ignore - optional dependency; will be resolved at runtime if installed
          const ImageManipulator: any = await import('expo-image-manipulator');
          const manipulated = await ImageManipulator.manipulateAsync(
            fileUri,
            [{ resize: { width: 1280 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );
          if (manipulated?.uri) {
            uploadUri = manipulated.uri;
            finalExt = 'jpg';
            finalMime = 'image/jpeg';
          }
        } catch (_e) {
          // If the module isn't installed or manipulation fails, proceed with original file
        }
      }

      // Validate size against backend 10MB cap
      try {
        const info = await getFileInfo(fileUri);
        if (info.size && info.size > 10 * 1024 * 1024) {
          showStatusModal(
            'error',
            'File Too Large',
            'Please select a file under 10 MB. For images, try choosing a lower-quality version or cropping.'
          );
          return;
        }
      } catch (_e) {
        // Ignore size check failures; we'll let the server enforce limits
      }

      // Build multipart form data
      const form = new FormData();
      form.append("conversationId", String(conversationId));
      form.append("clerkUserId", String(userId));
      form.append("messageType", fileType);
      const finalFileName = `${finalNameBase}.${finalExt}`;
      form.append(
        "file",
        {
          uri: uploadUri,
          name: finalFileName,
          type: finalMime,
        } as any
      );

      const res = await fetch(`${API_BASE_URL}/api/messages/upload-attachment`, {
        method: "POST",
        // Let React Native set the Content-Type with boundary
        body: form as any,
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("ðŸ“ Upload failed:", errText);
        setFileErrorMessage("Failed to upload attachment. Please try again.");
        setFileErrorModalVisible(true);
        return;
      }

      const json = await res.json();
      console.log('📦 Backend upload response:', json);
      if (json?.data) {
        // Optimistically add the new message returned by server
        console.log('📎 Upload successful, adding message:', { 
          id: json.data.id, 
          type: json.data.message_type, 
          fileName: json.data.file_name,
          attachmentUrl: json.data.attachment_url 
        });
        setMessages((prev) => {
          console.log(`📝 Current messages count: ${prev.length}, adding uploaded attachment`);
          return [...prev, json.data];
        });
        // Optionally refresh to sync ordering/unread states
        setTimeout(() => loadMessages(), 800);
      } else {
        console.warn('⚠️ Upload response missing data:', json);
      }
    } catch (error) {
      console.error("ðŸ“ Upload error:", error);
      setFileErrorMessage("Network error. Please check your connection.");
      setFileErrorModalVisible(true);
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || sending || !userId || !conversationId) {
      return;
    }

    try {
      setSending(true);
      // console.log(`Sending message: "${newMessage}"`);

      // Update activity when sending message
      await updateUserActivity();

      // Use direct backend API instead of messagingService
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: userId,
            messageText: newMessage,
            messageType: "text",
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        // console.log("Message sent successfully");
        console.log('✅ Text message sent, adding to UI:', result.data);
        setMessages((prev) => {
          console.log(`📝 Current messages count: ${prev.length}, adding new message`);
          return [...prev, result.data];
        });
        setNewMessage("");
        setIsTyping(false); // Reset typing state after sending

        // Reload messages to ensure both parties see the same
        setTimeout(() => loadMessages(), 500);
      } else {
        console.error("Failed to send message:", response.status);
        showStatusModal('error', 'Send Error', 'Failed to send message');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showStatusModal('error', 'Send Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Handle emoji picker
  const handleEmojiPress = () => {
    setEmojiPickerVisible(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setEmojiPickerVisible(false);
  };

  // Handle voice recording (start/stop)
  const handleMicPress = async () => {
    if (isRecording) {
      // Stop recording
      try {
        if (recordingRef.current) {
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          recordingRef.current = null;
          setIsRecording(false);
          if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
          // Move to pending state so user can preview/cancel/send from UI
          if (uri) {
            setPendingRecordingUri(uri);
            setPendingRecordingDuration(Math.max(1, Math.floor(recordingDuration)));
          }
          setRecordingDuration(0);
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        showStatusModal('error', 'Error', 'Failed to stop recording');
        setIsRecording(false);
        recordingRef.current = null;
      }
    } else {
      // Start recording
      try {
        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) {
          showStatusModal('error', 'Permission Required', 'Please allow microphone access to record voice messages.');
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        
        recordingRef.current = recording;
        setIsRecording(true);
        
        // Track duration
        const durationInterval = setInterval(() => {
          if (recordingRef.current) {
            recordingRef.current.getStatusAsync().then((status: any) => {
              if (status.isRecording) {
                setRecordingDuration(status.durationMillis / 1000);
              }
            });
          }
        }, 100);
        recordingTimerRef.current = durationInterval as unknown as NodeJS.Timeout;
        
        // Auto-stop after 2 minutes
        setTimeout(async () => {
          if (recordingRef.current && isRecording) {
            clearInterval(durationInterval);
            await handleMicPress(); // This will stop the recording
          }
        }, 120000);
        
      } catch (error) {
        console.error('Error starting recording:', error);
        showStatusModal('error', 'Error', 'Failed to start recording. Please check your microphone permissions.');
        setIsRecording(false);
      }
    }
  };

  // Cancel/remove pending recording (or abort active recording)
  const cancelPendingRecording = async () => {
    try {
      if (isRecording && recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
        setIsRecording(false);
      }
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
      if (pendingRecordingUri) {
        await FileSystem.deleteAsync(pendingRecordingUri, { idempotent: true }).catch(() => {});
      }
    } finally {
      setPendingRecordingUri(null);
      setPendingRecordingDuration(0);
      setRecordingDuration(0);
    }
  };

  // Send the prepared recording
  const sendPendingRecording = async () => {
    if (!pendingRecordingUri) return;
    try {
      setUploading(true);
      const fileName = `voice_${Date.now()}.m4a`;
      console.log('🎤 Sending voice message:', { fileName, uri: pendingRecordingUri });
      await uploadAttachment(pendingRecordingUri, 'file', fileName);
      showStatusModal('success', 'Sent', 'Voice message sent successfully');
    } catch (error) {
      console.error('❌ Error sending voice message:', error);
      showStatusModal('error', 'Error', 'Failed to send voice message');
    } finally {
      setUploading(false);
      try { await FileSystem.deleteAsync(pendingRecordingUri, { idempotent: true }); } catch { /* noop */ }
      setPendingRecordingUri(null);
      setPendingRecordingDuration(0);
    }
  };

  // Send pending files and/or message
  const handleMainSend = async () => {
    if (sending || uploading) return;
    try {
      // Send files first
      if (pendingFiles.length > 0) {
        setUploading(true);
        for (const f of pendingFiles) {
          await uploadAttachment(f.uri, 'file', f.name);
        }
        setPendingFiles([]);
        setUploading(false);
      }
      // Then send text if any
      if (newMessage.trim().length > 0) {
        await handleSendMessage();
      }
    } catch (e) {
      console.error('Send error:', e);
      showStatusModal('error', 'Error', 'Failed to send');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "Just now";

    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60 * 1000) {
      return "Just now";
    } else if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes}m ago`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: APP_TIME_ZONE,
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", timeZone: APP_TIME_ZONE });
    }
  };

  // Get user initials for avatar
  const getUserInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  // Check if message is from current user
  const isMyMessage = (message: ExtendedMessage) => {
    return message.sender.clerk_user_id === userId;
  };

  // Download file to local storage and share
  const downloadAndShareFile = async (remoteUri: string, fileName: string) => {
    try {
      console.log("ðŸ“¥ Starting download:", { remoteUri, fileName });
      setDownloading(true);
      const resolvedUri = resolveRemoteUri(remoteUri);
      const urlWithoutParams = resolvedUri.split("?")[0];
      const fileExtension = (urlWithoutParams ?? "").split(".").pop()?.toLowerCase() || "file";
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const baseName = safeFileName.replace(/\.[^/.]+$/, ""); // remove existing extension if present

      // Use legacy API shim to avoid runtime deprecation errors (SDK 54): download into cache directory
      const cacheDir = (FSLegacy as any).cacheDirectory || (FileSystem as any).cacheDirectory || '';
      const fileUri = `${cacheDir}${baseName}.${fileExtension}`;
      console.log("ðŸ“¥ Downloading to:", fileUri);
      await FSLegacy.downloadAsync(resolvedUri, fileUri);

      console.log("âœ… Download complete, opening share sheet");

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: getMimeType(fileExtension),
          dialogTitle: `Share ${fileName}`,
          UTI: getUTI(fileExtension),
        });
        console.log("âœ… Share sheet closed");
      } else {
        console.log("âš ï¸ Sharing not available, opening in browser");
        // Fallback: open in browser quietly
        await WebBrowser.openBrowserAsync(remoteUri);
      }
    } catch (error) {
      console.error("âŒ Download error:", error);
      setFileErrorMessage("Unable to download or share the file. Please try again.");
      setFileErrorModalVisible(true);
    } finally {
      setDownloading(false);
    }
  };

  // Helper function to get MIME type
  const getMimeType = (extension: string): string => {
    const mimeTypes: { [key: string]: string } = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      zip: "application/zip",
      rar: "application/x-rar-compressed",
      txt: "text/plain",
    };

    return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
  };

  // Ensure we share a local file: download remote HTTP(S) URIs to cache first
  const shareUriEnsuringLocal = async (uri: string, fallbackName = `share_${Date.now()}`) => {
    console.log("ðŸ“¤ shareUriEnsuringLocal called with:", uri);
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      console.log("âš ï¸ Sharing not available on this device");
      return false;
    }
    try {
      let localUri = uri;
      let ext = 'file';
      if (uri.startsWith('http')) {
        console.log("ðŸ“¥ Remote URI detected, downloading first...");
        const resolved = resolveRemoteUri(uri);
        const withoutParams = (resolved.split('?')[0] ?? resolved) as string;
        ext = (withoutParams.split('.').pop() || 'file').toLowerCase();
        const cacheDir = (FSLegacy as any).cacheDirectory || (FileSystem as any).cacheDirectory || '';
        const destUri = `${cacheDir}${fallbackName}.${ext}`;
        console.log("ðŸ“¥ Downloading to:", destUri);
        await FSLegacy.downloadAsync(resolved, destUri);
        localUri = destUri;
        console.log("âœ… Download complete:", localUri);
      }
      console.log("ðŸ“¤ Opening share sheet for:", localUri);
      await Sharing.shareAsync(localUri, { mimeType: getMimeType(ext) });
      console.log("âœ… Share sheet closed");
      return true;
    } catch (e) {
      console.error('âŒ Share error:', e);
      return false;
    }
  };

  // Save image to gallery
  const saveImageToGallery = async (imageUri: string) => {
    console.log("ðŸ’¾ saveImageToGallery called with:", imageUri);
    try {
      setDownloading(true);
      // Expo Go limitation: cannot grant full media access; fallback to share
      if (Constants?.appOwnership === 'expo') {
        console.log("â„¹ï¸ Running in Expo Go, using share fallback for gallery save");
        const shared = await shareUriEnsuringLocal(imageUri, `image_${Date.now()}`);
        if (!shared) {
          setFileErrorMessage("Saving to gallery isn't supported in Expo Go. Shared instead.");
          setFileErrorModalVisible(true);
        }
        return;
      }
      // Request permissions; if not available or rejected, fallback to share sheet
      try {
        console.log("ðŸ” Requesting media library permissions...");
        // Request only photo permission to avoid AUDIO manifest requirement on Android 13+
        const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
        console.log("ðŸ” Permission status:", status);
        if (status !== "granted") {
          console.log("âš ï¸ Permission denied, falling back to share");
          const shared = await shareUriEnsuringLocal(imageUri, `image_${Date.now()}`);
          if (shared) return;
          setFileErrorMessage("Cannot save without media permissions.");
          setFileErrorModalVisible(true);
          return;
        }
      } catch (_permErr) {
        console.error("âš ï¸ Permission request error:", _permErr);
        // Some Android setups (Expo Go) will reject if manifest lacks permissions.
        // Gracefully fallback to share sheet.
        const shared = await shareUriEnsuringLocal(imageUri, `image_${Date.now()}`);
        if (shared) return;
        setFileErrorMessage("Unable to request media permissions.");
        setFileErrorModalVisible(true);
        return;
      }

      let finalUri = imageUri;
      // If remote, download to a writable cache path
      if (imageUri.startsWith("http")) {
        console.log("ðŸ“¥ Remote image, downloading first...");
        const resolved = resolveRemoteUri(imageUri);
        const withoutParams = (resolved.split('?')[0] ?? resolved) as string;
        const ext = (withoutParams.split('.').pop() || 'jpg').toLowerCase();
        const cacheDir = (FSLegacy as any).cacheDirectory || (FileSystem as any).cacheDirectory || '';
        const destUri = `${cacheDir}image_${Date.now()}.${ext}`;
        await FSLegacy.downloadAsync(resolved, destUri);
        finalUri = destUri;
        console.log("âœ… Downloaded to:", finalUri);
      }

      console.log("ðŸ’¾ Creating media library asset...");
      const asset = await MediaLibrary.createAssetAsync(finalUri);
      await MediaLibrary.createAlbumAsync("Downloads", asset, false);
      console.log("âœ… Image saved to gallery!");
    } catch (error) {
      console.error("âŒ Save image error:", error);
      // Final fallback: try share if gallery save failed
      try {
        console.log("âš ï¸ Gallery save failed, trying share fallback...");
        const shared = await shareUriEnsuringLocal(imageUri, `image_${Date.now()}`);
        if (shared) return;
      } catch (_e2) {
        // ignore share fallback errors here; will show modal below
      }
      setFileErrorMessage("Failed to save image to gallery.");
      setFileErrorModalVisible(true);
    } finally {
      setDownloading(false);
    }
  };

  // Enhanced renderMessageContent function
  const renderMessageContent = (message: ExtendedMessage) => {
    // Normalize message text to avoid odd line breaks (Android sometimes inserts newlines)
    const sanitizeText = (txt?: string) => {
      if (!txt) return '';
      // Remove zero-width spaces and collapse newlines into single spaces
      return txt
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\r?\n+/g, ' ')
        .trim();
    };
    // Helper: detect audio files by extension/name
    const isAudioFile = (name?: string, url?: string) => {
      const target = (name || url || '').toLowerCase();
      return ['.m4a', '.mp3', '.wav', '.ogg', '.aac'].some(ext => target.includes(ext))
        || (url || '').startsWith('data:audio')
        || (url || '').includes('/audio/');
    };

    // Inline component for playing audio messages
    const AudioBubble = ({ uri }: { uri: string }) => {
      const [playing, setPlaying] = useState(false);
      const [barAnim] = useState([new Animated.Value(2), new Animated.Value(8), new Animated.Value(4)]);
      const soundRef = useRef<Audio.Sound | null>(null);

      const startWave = () => {
        const loops = barAnim.map((v, i) => Animated.loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 14 - i * 2, duration: 250, useNativeDriver: false }),
            Animated.timing(v, { toValue: 2 + i * 2, duration: 250, useNativeDriver: false }),
          ])
        ));
        Animated.parallel(loops).start();
      };

      const stopWave = () => {
        barAnim.forEach(v => v.stopAnimation());
      };

      const toggle = async () => {
        try {
          if (!soundRef.current) {
            const { sound } = await Audio.Sound.createAsync({ uri: resolveRemoteUri(uri) });
            soundRef.current = sound;
            await sound.playAsync();
            setPlaying(true);
            startWave();
            sound.setOnPlaybackStatusUpdate((st: any) => {
              if (st.didJustFinish) {
                setPlaying(false);
                stopWave();
              }
            });
          } else {
            const status: any = await soundRef.current.getStatusAsync();
            if (status.isPlaying) {
              await soundRef.current.pauseAsync();
              setPlaying(false);
              stopWave();
            } else {
              await soundRef.current.playAsync();
              setPlaying(true);
              startWave();
            }
          }
        } catch (_e) {
          // ignore
        }
      };

      useEffect(() => {
        return () => { try { soundRef.current?.unloadAsync(); } catch { /* noop */ } };
      }, []);

      return (
        <View style={styles.audioBubble}>
          <TouchableOpacity style={styles.audioPlayButton} onPress={toggle}>
            <Ionicons name={playing ? 'pause' : 'play'} size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.audioBars}>
            {barAnim.map((v, idx) => (
              <Animated.View key={idx} style={[styles.audioBar, { height: v }]} />
            ))}
          </View>
          <Text style={styles.audioDurationText}>Voice</Text>
        </View>
      );
    };

    // Handle image attachments
    if (message.message_type === "image" && message.attachment_url) {
      return (
        <TouchableOpacity
          style={styles.imageAttachment}
          onPress={() => handleViewAttachment(message)}
          onLongPress={() => {
            showActions(
              'Image options',
              message.file_name || 'Choose an action for this image',
              [
                { label: 'View', onPress: () => handleViewAttachment(message), variant: 'primary' },
                { label: 'Save to Gallery', onPress: () => saveImageToGallery(message.attachment_url!), variant: 'default' },
                { label: 'Download', onPress: () => handleDownloadFile(message), variant: 'default' },
                { label: 'Cancel', onPress: () => {}, variant: 'default' },
              ]
            );
          }}
        >
          <OptimizedImage
            source={{ uri: resolveRemoteUri(message.attachment_url) }}
            style={styles.attachmentImage}
            resizeMode="cover"
            cache="force-cache"
            loaderColor={theme.colors.primary}
          />
          <View style={styles.imageOverlay}>
            <Ionicons name="expand" size={20} color="#FFFFFF" />
            <Text style={styles.imageText}>Tap to view</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Handle audio attachments (voice notes)
    if (message.message_type === 'file' && message.attachment_url && isAudioFile(message.file_name, message.attachment_url)) {
      console.log('🎵 Rendering audio message:', { 
        id: message.id, 
        fileName: message.file_name, 
        url: message.attachment_url,
        isAudio: isAudioFile(message.file_name, message.attachment_url)
      });
      return <AudioBubble uri={message.attachment_url} />;
    }

    // Handle other file attachments - dark bubble with icon, name and size
    if (message.message_type === "file" && message.attachment_url) {
      console.log('📄 Rendering file message:', { 
        id: message.id, 
        fileName: message.file_name, 
        url: message.attachment_url 
      });
      return (
        <TouchableOpacity
          onPress={() => handleDownloadFile(message)}
          onLongPress={() => {
            showActions(
              'File options',
              message.file_name || 'Choose an action',
              [
                { label: 'Download & Share', onPress: () => handleDownloadFile(message), variant: 'primary' },
                { label: 'Open in Browser', onPress: () => { if (message.attachment_url) WebBrowser.openBrowserAsync(message.attachment_url); }, variant: 'default' },
                { label: 'Cancel', onPress: () => {}, variant: 'default' },
              ]
            );
          }}
          activeOpacity={0.8}
        >
          <View style={styles.fileBubbleRow}>
            <View style={styles.fileIconCircle}>
              <Ionicons name={getFileIcon(message.file_name)} size={18} color="#FFFFFF" />
            </View>
            <View style={styles.fileTexts}>
              <Text style={styles.fileNameDark} numberOfLines={1}>
                {message.file_name || "Document"}
              </Text>
              <Text style={styles.fileSizeDark}>
                {message.file_size ? formatFileSize(message.file_size) : getFileTypeText(message.file_name)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Regular text message
    return (
      <Text
        style={[
          styles.messageText,
          isMyMessage(message) ? styles.myMessageText : styles.theirMessageText,
        ]}
      >
        {sanitizeText(message.message_text)}
      </Text>
    );
  };

  const getFileTypeText = (fileName?: string): string => {
    if (!fileName) return "File";
    const extension = fileName.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return "PDF Document";
      case "doc":
      case "docx":
        return "Word Document";
      case "xls":
      case "xlsx":
        return "Excel Spreadsheet";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "Image";
      case "zip":
      case "rar":
        return "Archive";
      case "txt":
        return "Text File";
      default:
        return "Document";
    }
  };

  const handleDownloadFile = async (message: ExtendedMessage) => {
    if (!message.attachment_url) return;

    const fileUri = message.attachment_url;
    const fileName = message.file_name || `file_${Date.now()}`;

    // Show download confirmation via status modal
    showConfirm(
      'Download File',
      `Download "${message.file_name || 'this file'}"?`,
      async () => {
        try {
          setDownloading(true);
          await downloadAndShareFile(fileUri, fileName);
        } catch (error) {
          console.error('Download error:', error);
          setFileErrorMessage('Failed to download file. Please try again.');
          setFileErrorModalVisible(true);
        } finally {
          setDownloading(false);
        }
      },
      { confirmText: 'Download', cancelText: 'Cancel' }
    );
  };

  // Normalize any local LAN or localhost URLs to the public API base (e.g., ngrok)
  const resolveRemoteUri = (uri: string) => {
    try {
      if (!uri) return uri;
      // If relative path
      if (uri.startsWith('/')) {
        return `${API_BASE_URL}${uri}`;
      }
      const src = new URL(uri);
      const api = new URL(API_BASE_URL);
      // If host differs and the path is under uploads, rebuild with public base
      if (src.host !== api.host && src.pathname.startsWith('/uploads')) {
        return `${api.origin}${src.pathname}`;
      }
      return uri;
    } catch {
      // Fallback: if it's not parsable but looks like an uploads path, prefix API base
      if (uri?.startsWith('/uploads')) return `${API_BASE_URL}${uri}`;
      return uri;
    }
  };

  // Render message content based on type
  // Handle viewing attachments
  const handleViewAttachment = async (message: ExtendedMessage) => {
    if (!message.attachment_url) {
      showStatusModal('error', 'View Error', 'No attachment URL found.');
      return;
    }

    setCurrentAttachment(message);

    // For images, show in viewer modal
    if (message.message_type === "image") {
      setViewerModalVisible(true);
    } else {
      // For files, download directly
      await handleDownloadFile(message);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: 'padding', android: 'height' })}
          style={styles.container}
          keyboardVerticalOffset={keyboardOffset}
        >
          {/* Status Modal (also used for confirmations) */}
          <Modal
            visible={statusModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setStatusModalVisible(false)}
          >
            <View style={[
              styles.modalOverlay,
              { backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.6)' }
            ]}>
              <View style={[
                styles.modalContent,
                { backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF' }
              ]}>
                <View style={styles.iconContainer}>
                  <Ionicons 
                    name={
                      statusModalData.type === 'success' ? 'checkmark-circle' :
                      statusModalData.type === 'error' ? 'close-circle' : 'information-circle'
                    } 
                    size={64} 
                    color={
                      statusModalData.type === 'success' ? '#4CAF50' :
                      statusModalData.type === 'error' ? '#FF3B30' : '#007AFF'
                    } 
                  />
                </View>

                <Text style={[
                  styles.modalTitle,
                  { color: isDarkMode ? '#F9FAFB' : '#1F2937' }
                ]}>
                  {statusModalData.title}
                </Text>
                <Text style={[
                  styles.modalMessage,
                  { color: isDarkMode ? '#D1D5DB' : '#6B7280' }
                ]}>
                  {statusModalData.message}
                </Text>

                {statusModalData.actions && statusModalData.actions.length > 0 ? (
                  <View style={{ alignSelf: 'stretch', gap: 12 }}>
                    {statusModalData.actions.map((a, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.modalButton,
                          { backgroundColor: a.variant === 'danger' ? '#FF3B30' : a.variant === 'primary' ? '#007AFF' : '#6B7280' }
                        ]}
                        onPress={() => {
                          setStatusModalVisible(false);
                          setTimeout(() => { try { a.onPress(); } catch { /* noop */ } }, 120);
                        }}
                      >
                        <Text style={styles.modalButtonText}>{a.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : statusModalData.confirm ? (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: '#6B7280' }]}
                      onPress={() => setStatusModalVisible(false)}
                    >
                      <Text style={styles.modalButtonText}>{statusModalData.confirm.cancelText || 'Cancel'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: '#FF3B30' }]}
                      onPress={() => {
                        setStatusModalVisible(false);
                        setTimeout(() => { try { statusModalData.confirm?.onConfirm(); } catch { /* noop */ } }, 120);
                      }}
                    >
                      <Text style={styles.modalButtonText}>{statusModalData.confirm.confirmText || 'Delete'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.modalButton, 
                      { 
                        backgroundColor: 
                          statusModalData.type === 'success' ? '#4CAF50' :
                          statusModalData.type === 'error' ? '#FF3B30' : '#007AFF'
                      }
                    ]}
                    onPress={() => setStatusModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>OK</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </Modal>

          {/* Fixed Header with dynamic height based on screen size */}
          <View style={[styles.headerWrapper, { height: headerHeight }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
              </TouchableOpacity>

              <View style={styles.contactInfo}>
                <View style={styles.headerAvatarWrapper}>
                  {contact?.profile_image_url ? (
                    <OptimizedImage
                      source={{ uri: resolveRemoteUri(contact.profile_image_url) }}
                      style={styles.headerAvatar}
                      resizeMode="cover"
                      cache="force-cache"
                      loaderSize="small"
                      showErrorIcon={false}
                    />
                  ) : (
                    <View style={styles.headerAvatar}>
                      <Text style={styles.headerAvatarText}>
                        {getUserInitials(contact?.first_name, contact?.last_name)}
                      </Text>
                    </View>
                  )}
                  {/* Presence indicator in header: green online, yellow away, gray offline */}
                  <View
                    style={[
                      styles.headerStatusIndicator,
                      {
                        backgroundColor:
                          presence === 'online' ? '#4CAF50' : presence === 'away' ? '#FFC107' : theme.colors.iconDisabled,
                        borderColor: theme.colors.surface,
                      },
                    ]}
                  />
                </View>
                <View style={styles.headerTextBlock}>
                  <Text style={[styles.contactName, { color: theme.colors.text }]}>{conversationTitle}</Text>
                  <Text
                    style={[
                      styles.contactStatus,
                      presence === 'online' ? styles.onlineStatus : styles.offlineStatus,
                    ]}
                  >
                    {presence === 'online'
                      ? 'Online now'
                      : presence === 'away'
                        ? 'Away'
                        : (contact ? getLastSeenText(contact.last_active_at, false) : 'Offline')}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {/* Delete conversation */}
                <TouchableOpacity
                  onPress={() => {
                    if (!conversationId || !userId) return;
                    showConfirm(
                      'Delete conversation',
                      'This will remove the conversation from your inbox. Continue?',
                      async () => {
                        try {
                          const res = await fetch(`${API_BASE_URL}/api/messages/conversations/${conversationId}?clerkUserId=${encodeURIComponent(String(userId))}`, { method: 'DELETE' });
                          if (res.ok) {
                            router.back();
                          } else {
                            showStatusModal('error', 'Delete failed', 'Unable to delete this conversation.');
                          }
                        } catch (_e) {
                          showStatusModal('error', 'Network error', 'Please check your connection and try again.');
                        }
                      },
                      { confirmText: 'Delete', cancelText: 'Cancel' }
                    );
                  }}
                >
                  <Ionicons name="trash-outline" size={22} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Chat Messages (FlatList for virtualization) */}
          <FlatList
            ref={messagesListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            onLayout={() => console.log(`📋 FlatList rendering ${messages.length} messages`)}
            renderItem={({ item }) => {
              const myMessage = isMyMessage(item);
              // Decide bubble style: for non-audio files use a dark file bubble like the mock
              const looksLikeAudio = (
                item.message_type === 'file' && item.attachment_url && (
                  (item.file_name || '').toLowerCase().match(/\.(m4a|mp3|wav|ogg|aac)$/) ||
                  (item.attachment_url || '').toLowerCase().match(/\.(m4a|mp3|wav|ogg|aac)$/)
                )
              );
              const isFileButNotAudio = item.message_type === 'file' && item.attachment_url && !looksLikeAudio;
              const bubbleStyle = isFileButNotAudio
                ? (myMessage ? styles.myFileMessage : styles.theirFileMessage)
                : (myMessage ? styles.myMessage : styles.theirMessage);
              return (
                <View
                  style={[
                    styles.messageContainer,
                    myMessage ? styles.myMessageContainer : styles.theirMessageContainer,
                  ]}
                >
                  {!myMessage && (
                    <View style={styles.avatarContainer}>
                      {item.sender.profile_image_url ? (
                        <OptimizedImage
                          source={{ uri: resolveRemoteUri(item.sender.profile_image_url) }}
                          style={styles.avatar}
                          resizeMode="cover"
                          cache="force-cache"
                          loaderSize="small"
                          showErrorIcon={false}
                        />
                      ) : (
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {getUserInitials(item.sender.first_name, item.sender.last_name)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onLongPress={() => {
                      // Allow deleting only own messages
                      if (!myMessage) return;
                      showConfirm(
                        'Delete message',
                        'Are you sure you want to delete this message?',
                        async () => {
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/messages/conversations/${encodeURIComponent(String(conversationId))}/messages/${encodeURIComponent(String(item.id))}?clerkUserId=${encodeURIComponent(String(userId))}`, { method: 'DELETE' });
                            if (res.ok) {
                              setMessages((prev) => prev.filter((m) => String(m.id) !== String(item.id)));
                            } else {
                              showStatusModal('error', 'Delete failed', 'Could not delete this message.');
                            }
                          } catch (_e) {
                            showStatusModal('error', 'Network error', 'Please try again.');
                          }
                        },
                        { confirmText: 'Delete', cancelText: 'Cancel' }
                      );
                    }}
                  >
                    <View style={[styles.messageBubble, bubbleStyle]}>
                    {renderMessageContent(item)}
                    <Text
                      style={[
                        styles.messageTime,
                        myMessage ? styles.myMessageTime : styles.theirMessageTime,
                      ]}
                    >
                      {formatTime(item.created_at)}
                    </Text>
                    </View>
                  </TouchableOpacity>

                  {myMessage && (
                    <View style={styles.avatarContainer}>
                      {item.sender.profile_image_url ? (
                        <OptimizedImage
                          source={{ uri: resolveRemoteUri(item.sender.profile_image_url) }}
                          style={[styles.avatar, styles.myAvatar]}
                          resizeMode="cover"
                          cache="force-cache"
                          loaderSize="small"
                          showErrorIcon={false}
                        />
                      ) : (
                        <View style={[styles.avatar, styles.myAvatar]}>
                          <Text style={styles.avatarText}>
                            {getUserInitials(item.sender.first_name, item.sender.last_name)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            }}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
              const near = distanceFromBottom < 300;
              if (near !== userNearBottom) setUserNearBottom(near);
              setShowScrollToLatest(!near && messages.length > 0);
              if (!near) setManualScrolling(true);
            }}
            scrollEventThrottle={100}
            onContentSizeChange={() => {
              if (!manualScrolling && userNearBottom) {
                messagesListRef.current?.scrollToEnd?.({ animated: true });
              }
            }}
            onScrollBeginDrag={() => {
              setManualScrolling(true);
              if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
            }}
            onScrollEndDrag={() => {
              if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
              scrollIdleTimerRef.current = setTimeout(() => setManualScrolling(false), 1200);
            }}
            onMomentumScrollEnd={() => {
              if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
              scrollIdleTimerRef.current = setTimeout(() => setManualScrolling(false), 800);
            }}
            initialNumToRender={12}
            windowSize={7}
            removeClippedSubviews
          />

          {showScrollToLatest && (
            <TouchableOpacity
              onPress={() => {
                messagesListRef.current?.scrollToEnd?.({ animated: true });
                setShowScrollToLatest(false);
                setUserNearBottom(true);
              }}
            >
            </TouchableOpacity>
          )}

          {/* Message Input - Single row with icons and text input */}
          <View style={[
            styles.bottomInputSection, 
            { 
              backgroundColor: 'transparent',
              // Add safe-area bottom padding so the input doesn't touch system navigation
              paddingBottom: Math.max(insets.bottom || 0, 8),
            }
          ]}>
            {/* Show expand button when icons are hidden */}
            {isTyping && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setIsTyping(false)}
              >
                <Ionicons name="chevron-forward" size={28} color={theme.colors.primary} />
              </TouchableOpacity>
            )}

            {/* Left icons - hide when typing */}
            {!isTyping && (
              <>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={28} color={theme.colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={pickImage}
                >
                  <Ionicons name="image" size={28} color={theme.colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={pickDocument}
                >
                  <Ionicons name="document-text" size={28} color={theme.colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleMicPress}
                >
                  <Ionicons 
                    name={isRecording ? "stop-circle" : "mic"} 
                    size={28} 
                    color={isRecording ? "#FF0000" : theme.colors.primary} 
                  />
                </TouchableOpacity>
              </>
            )}

            <View style={[
              styles.inputWrapper,
              { 
                backgroundColor: theme.colors.background,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.15)'
              }
            ]}>
              {/* Pending document chips */}
              {pendingFiles.length > 0 && !isRecording && !pendingRecordingUri && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pendingFilesScroll} contentContainerStyle={styles.pendingFilesRow}>
                  {pendingFiles.map((f, idx) => (
                    <View key={`${f.uri}-${idx}`} style={styles.pendingChip}>
                      <Ionicons name="document-text" size={16} color="#FFFFFF" style={styles.pendingChipIcon} />
                      <Text numberOfLines={1} style={styles.pendingChipText}>{f.name}</Text>
                      <TouchableOpacity style={styles.pendingChipClose} onPress={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}>
                        <Ionicons name="close" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {(isRecording || pendingRecordingUri) ? (
                <View style={styles.recordingBar}>
                  {/* Cancel */}
                  <TouchableOpacity style={styles.recCircleButton} onPress={cancelPendingRecording}>
                    <Ionicons name="close" size={18} color="#0B6E8B" />
                  </TouchableOpacity>

                  {/* Middle pill */}
                  <View style={styles.recordingPill}>
                    <View style={styles.pillMeter} />
                    <Text style={styles.pillTime}>
                      {isRecording ? `${Math.floor(recordingDuration)}s` : `${Math.max(1, pendingRecordingDuration)}s`}
                    </Text>
                  </View>

                  {/* Send */}
                  <TouchableOpacity style={[styles.recCircleButton, !pendingRecordingUri && { opacity: 0.5 }]} onPress={sendPendingRecording} disabled={!pendingRecordingUri}>
                    <Ionicons name="send" size={18} color="#0B6E8B" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TextInput
                  style={[styles.textInput, { color: theme.colors.text }]}
                  placeholder="Message"
                  value={newMessage}
                  onChangeText={(text) => {
                    setNewMessage(text);
                    setIsTyping(text.length > 0);
                  }}
                  onFocus={() => {
                    if (newMessage.length > 0) {
                      setIsTyping(true);
                    }
                  }}
                  onBlur={() => {
                    if (newMessage.length === 0) {
                      setIsTyping(false);
                    }
                  }}
                  multiline={true}
                  maxLength={500}
                  editable={!sending && !uploading}
                  placeholderTextColor={theme.colors.textDisabled}
                  returnKeyType="send"
                  blurOnSubmit={true}
                  onSubmitEditing={handleSendMessage}
                />
              )}
            </View>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleEmojiPress}
            >
              <Ionicons name="happy-outline" size={28} color={theme.colors.primary} />
            </TouchableOpacity>

            {(newMessage.trim() !== "" || pendingFiles.length > 0) && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleMainSend}
                disabled={sending || uploading}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Ionicons name="send" size={28} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Enhanced Attachment Viewer Modal */}
          <Modal
            visible={viewerModalVisible}
            animationType="fade"
            transparent={true}
            statusBarTranslucent={true}
            onRequestClose={() => setViewerModalVisible(false)}
          >
            <View style={styles.viewerModalOverlay}>
              <View style={styles.viewerModalHeader}>
                <TouchableOpacity
                  style={styles.viewerCloseButton}
                  onPress={() => setViewerModalVisible(false)}
                >
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                {currentAttachment && (
                  <View style={styles.viewerHeaderInfo}>
                    <Text style={styles.viewerFileName} numberOfLines={1}>
                      {currentAttachment.file_name || "Image"}
                    </Text>
                    <Text style={styles.viewerFileSize}>
                      {currentAttachment.file_size &&
                        formatFileSize(currentAttachment.file_size)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.viewerActionButton}
                  onPress={() =>
                    saveImageToGallery(currentAttachment?.attachment_url || "")
                  }
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="download" size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.viewerContent}
                maximumZoomScale={3}
                minimumZoomScale={1}
                contentContainerStyle={styles.viewerScrollContent}
              >
                {currentAttachment?.attachment_url && (
                  <OptimizedImage
                    source={{ uri: resolveRemoteUri(currentAttachment.attachment_url) }}
                    style={styles.fullSizeImage}
                    resizeMode="contain"
                    cache="force-cache"
                    loaderColor="#FFFFFF"
                    loaderSize="large"
                  />
                )}
              </ScrollView>

              <View style={styles.viewerFooter}>
                <Text style={styles.viewerFooterText}>
                  Pinch to zoom. Tap download to save
                </Text>
              </View>
            </View>
          </Modal>

          {/* File Error Modal */}
          <Modal
            visible={fileErrorModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setFileErrorModalVisible(false)}
          >
            <View style={styles.centeredOverlay}>
              <View style={[styles.simpleModal, { backgroundColor: theme.colors.surface }]}>
                <Ionicons name="alert-circle" size={28} color={theme.colors.error} style={{ marginBottom: 8 }} />
                <Text style={[styles.simpleModalTitle, { color: theme.colors.text }]}>Something went wrong</Text>
                <Text style={[styles.simpleModalMessage, { color: theme.colors.textSecondary }]}>
                  {fileErrorMessage || "An unexpected error occurred."}
                </Text>
                <TouchableOpacity
                  style={[styles.simpleModalButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setFileErrorModalVisible(false)}
                >
                  <Text style={styles.simpleModalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={attachmentModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setAttachmentModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.attachmentModalTitle, { color: theme.colors.text }]}>Choose Attachment</Text>
                  <TouchableOpacity
                    onPress={() => setAttachmentModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.attachmentOptions}>
                  <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={takePhoto}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: "#4CAF50" },
                      ]}
                    >
                      <Ionicons name="camera" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.optionText, { color: theme.colors.text }]}>Camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={pickImage}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: "#2196F3" },
                      ]}
                    >
                      <Ionicons name="image" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.optionText, { color: theme.colors.text }]}>Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={pickDocument}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: "#FF9800" },
                      ]}
                    >
                      <Ionicons name="document" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.optionText, { color: theme.colors.text }]}>Document</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Emoji Picker Modal */}
          <Modal
            visible={emojiPickerVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setEmojiPickerVisible(false)}
          >
            <TouchableOpacity 
              style={styles.emojiModalOverlay}
              activeOpacity={1}
              onPress={() => setEmojiPickerVisible(false)}
            >
              <TouchableOpacity 
                activeOpacity={1}
                style={[styles.emojiModalContent, { backgroundColor: theme.colors.surface }]}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.attachmentModalTitle, { color: theme.colors.text }]}>Select Emoji</Text>
                  <TouchableOpacity
                    onPress={() => setEmojiPickerVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Category Tabs */}
                <View style={styles.emojiCategoryTabs}>
                  <TouchableOpacity
                    style={[styles.emojiCategoryTab, selectedEmojiCategory === 'recent' && styles.emojiCategoryTabActive]}
                    onPress={() => setSelectedEmojiCategory('recent')}
                  >
                    <Ionicons name="time-outline" size={24} color={selectedEmojiCategory === 'recent' ? theme.colors.primary : theme.colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emojiCategoryTab, selectedEmojiCategory === 'smileys' && styles.emojiCategoryTabActive]}
                    onPress={() => setSelectedEmojiCategory('smileys')}
                  >
                    <Text style={[styles.emojiCategoryIcon, { color: selectedEmojiCategory === 'smileys' ? theme.colors.primary : theme.colors.textSecondary }]}>😊</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emojiCategoryTab, selectedEmojiCategory === 'gestures' && styles.emojiCategoryTabActive]}
                    onPress={() => setSelectedEmojiCategory('gestures')}
                  >
                    <Text style={[styles.emojiCategoryIcon, { color: selectedEmojiCategory === 'gestures' ? theme.colors.primary : theme.colors.textSecondary }]}>👋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emojiCategoryTab, selectedEmojiCategory === 'animals' && styles.emojiCategoryTabActive]}
                    onPress={() => setSelectedEmojiCategory('animals')}
                  >
                    <Text style={[styles.emojiCategoryIcon, { color: selectedEmojiCategory === 'animals' ? theme.colors.primary : theme.colors.textSecondary }]}>🐶</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emojiCategoryTab, selectedEmojiCategory === 'food' && styles.emojiCategoryTabActive]}
                    onPress={() => setSelectedEmojiCategory('food')}
                  >
                    <Text style={[styles.emojiCategoryIcon, { color: selectedEmojiCategory === 'food' ? theme.colors.primary : theme.colors.textSecondary }]}>🍕</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emojiCategoryTab, selectedEmojiCategory === 'activities' && styles.emojiCategoryTabActive]}
                    onPress={() => setSelectedEmojiCategory('activities')}
                  >
                    <Text style={[styles.emojiCategoryIcon, { color: selectedEmojiCategory === 'activities' ? theme.colors.primary : theme.colors.textSecondary }]}>⚽</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emojiCategoryTab, selectedEmojiCategory === 'travel' && styles.emojiCategoryTabActive]}
                    onPress={() => setSelectedEmojiCategory('travel')}
                  >
                    <Text style={[styles.emojiCategoryIcon, { color: selectedEmojiCategory === 'travel' ? theme.colors.primary : theme.colors.textSecondary }]}>🚗</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emojiCategoryTab, selectedEmojiCategory === 'objects' && styles.emojiCategoryTabActive]}
                    onPress={() => setSelectedEmojiCategory('objects')}
                  >
                    <Text style={[styles.emojiCategoryIcon, { color: selectedEmojiCategory === 'objects' ? theme.colors.primary : theme.colors.textSecondary }]}>💡</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emojiCategoryTab, selectedEmojiCategory === 'symbols' && styles.emojiCategoryTabActive]}
                    onPress={() => setSelectedEmojiCategory('symbols')}
                  >
                    <Text style={[styles.emojiCategoryIcon, { color: selectedEmojiCategory === 'symbols' ? theme.colors.primary : theme.colors.textSecondary }]}>❤️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emojiCategoryTab, selectedEmojiCategory === 'flags' && styles.emojiCategoryTabActive]}
                    onPress={() => setSelectedEmojiCategory('flags')}
                  >
                    <Text style={[styles.emojiCategoryIcon, { color: selectedEmojiCategory === 'flags' ? theme.colors.primary : theme.colors.textSecondary }]}>🏁</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  ref={emojiScrollRef}
                  style={styles.emojiScroll} 
                  contentContainerStyle={styles.emojiScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Recent */}
                  {selectedEmojiCategory === 'recent' && (
                    <View style={styles.emojiGrid}>
                      {['😊', '❤️', '😂', '👍', '🙏', '😭', '🎉', '🔥', '💯', '✨', '😍', '🤔', '😢', '🥰', '😅', '😎', '💪', '👏', '🙌', '💕'].map((emoji, index) => (
                        <TouchableOpacity key={`recent-${index}`} style={styles.emojiButton} onPress={() => handleEmojiSelect(emoji)}>
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Smileys */}
                  {selectedEmojiCategory === 'smileys' && (
                    <View style={styles.emojiGrid}>
                      {[
                        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
                        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
                        '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
                        '🤐', '🤨', '😐', '😑', '😶', '🙄', '😬', '🤥', '😌', '😔',
                        '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
                        '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
                        '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰',
                        '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫',
                        '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩',
                        '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹',
                      ].map((emoji, index) => (
                        <TouchableOpacity key={`smiley-${index}`} style={styles.emojiButton} onPress={() => handleEmojiSelect(emoji)}>
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Gestures */}
                  {selectedEmojiCategory === 'gestures' && (
                    <View style={styles.emojiGrid}>
                      {[
                        '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
                        '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
                        '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
                        '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
                        '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅',
                        '👄', '💋', '🩸', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨',
                      ].map((emoji, index) => (
                        <TouchableOpacity key={`gesture-${index}`} style={styles.emojiButton} onPress={() => handleEmojiSelect(emoji)}>
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Animals */}
                  {selectedEmojiCategory === 'animals' && (
                    <View style={styles.emojiGrid}>
                      {[
                        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
                        '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
                        '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
                        '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
                        '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕',
                        '🐙', '🦑', '🦐', '🦀', '🐠', '🐟', '🐡', '🐬', '🐳', '🐋',
                        '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦏', '🦛',
                        '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏',
                        '🐑', '🐐', '🐕', '🐩', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢',
                        '🦩', '🕊', '🐇', '🦌', '🐀', '🐁', '🐿️', '🦔', '🦎', '🦇',
                      ].map((emoji, index) => (
                        <TouchableOpacity key={`animal-${index}`} style={styles.emojiButton} onPress={() => handleEmojiSelect(emoji)}>
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Food */}
                  {selectedEmojiCategory === 'food' && (
                    <View style={styles.emojiGrid}>
                      {[
                        '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐',
                        '🍈', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
                        '🥬', '🥒', '🌶️', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠',
                        '🥐', '🥖', '🥨', '🥯', '🍞', '🥚', '🍳', '🧀', '🥓', '🥩',
                        '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆',
                        '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲',
                        '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥',
                        '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰',
                        '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜',
                        '🍯', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂',
                      ].map((emoji, index) => (
                        <TouchableOpacity key={`food-${index}`} style={styles.emojiButton} onPress={() => handleEmojiSelect(emoji)}>
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Activities */}
                  {selectedEmojiCategory === 'activities' && (
                    <View style={styles.emojiGrid}>
                      {[
                        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
                        '🪀', '🏓', '🏸', '🏑', '🏒', '🥍', '🏏', '🥅', '⛳', '🪁',
                        '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️',
                        '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️',
                        '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵',
                        '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫',
                        '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼',
                        '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯',
                        '🎳', '🎮', '🎰', '🧩', '🎉', '🎊', '🎈', '🎁', '🎀', '🎂',
                      ].map((emoji, index) => (
                        <TouchableOpacity key={`activity-${index}`} style={styles.emojiButton} onPress={() => handleEmojiSelect(emoji)}>
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Travel */}
                  {selectedEmojiCategory === 'travel' && (
                    <View style={styles.emojiGrid}>
                      {[
                        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
                        '🛻', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🩼', '🛴', '🚲',
                        '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠',
                        '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆',
                        '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀',
                        '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓',
                        '⛽', '🚧', '🚦', '🚥', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰',
                        '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️',
                      ].map((emoji, index) => (
                        <TouchableOpacity key={`travel-${index}`} style={styles.emojiButton} onPress={() => handleEmojiSelect(emoji)}>
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Objects */}
                  {selectedEmojiCategory === 'objects' && (
                    <View style={styles.emojiGrid}>
                      {[
                        '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️',
                        '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥',
                        '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️',
                        '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋',
                        '🔌', '💡', '🔦', '🕯️', '🧯', '🛢️', '💸', '💵', '💴', '💶',
                        '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧',
                        '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '⛓️', '🧲', '🔫',
                        '💣', '🧨', '🪃', '🏹', '🔪', '⚔️', '🛡️', '🚬', '⚰️', '⚱️',
                        '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳️', '🩻',
                        '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡️',
                      ].map((emoji, index) => (
                        <TouchableOpacity key={`object-${index}`} style={styles.emojiButton} onPress={() => handleEmojiSelect(emoji)}>
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Symbols */}
                  {selectedEmojiCategory === 'symbols' && (
                    <View style={styles.emojiGrid}>
                      {[
                        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
                        '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️',
                        '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎',
                        '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑',
                        '♒', '♓', '⚛️', '☢️', '☣️', '🔴', '🟠', '🟡', '🟢', '🔵',
                        '🟣', '⚫', '⚪', '🟤', '⭐', '🌟', '✨', '💫', '⚡', '🔥',
                        '💧', '💦', '⛄', '☃️', '☄️', '💥', '✅', '❌', '➕', '➖',
                        '✖️', '➗', '©️', '®️', '™️', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣',
                      ].map((emoji, index) => (
                        <TouchableOpacity key={`symbol-${index}`} style={styles.emojiButton} onPress={() => handleEmojiSelect(emoji)}>
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Flags */}
                  {selectedEmojiCategory === 'flags' && (
                    <View style={styles.emojiGrid}>
                      {[
                        '🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏴‍☠️', '🇺🇸', '🇬🇧', '🇨🇦', '🇫🇷',
                        '🇩🇪', '🇮🇹', '🇪🇸', '🇵🇹', '🇷🇺', '🇨🇳', '🇯🇵', '🇰🇷', '🇮🇳', '🇦🇺',
                        '🇧🇷', '🇲🇽', '🇦🇷', '🇨🇱', '🇨🇴', '🇵🇪', '🇻🇪', '🇪🇨', '🇧🇴', '🇺🇾',
                        '🇵🇾', '🇬🇾', '🇸🇷', '🇫🇷', '🇬🇫', '🇵🇫', '🇲🇶', '🇬🇵', '🇷🇪', '🇾🇹',
                        '🇵🇲', '🇧🇱', '🇲🇫', '🇼🇫', '🇳🇨', '🇵🇳', '🇹🇰', '🇨🇽', '🇨🇨', '🇳🇺',
                        '🇳🇿', '🇹🇴', '🇼🇸', '🇫🇯', '🇻🇺', '🇰🇮', '🇹🇻', '🇳🇷', '🇵🇬', '🇸🇧',
                        '🇳🇫', '🇦🇺', '🇨🇰', '🇵🇫', '🇵🇳', '🇳🇿', '🇫🇯', '🇵🇬', '🇻🇺', '🇹🇴',
                      ].map((emoji, index) => (
                        <TouchableOpacity key={`flag-${index}`} style={styles.emojiButton} onPress={() => handleEmojiSelect(emoji)}>
                          <Text style={styles.emojiText}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </CurvedBackground>
  );
}
// Styles function that accepts scaledFontSize for dynamic text sizing
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: scaledFontSize(16),
  },
  // Dynamic header wrapper
  headerWrapper: {
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 15,
  },
  headerAvatarWrapper: {
    position: 'relative',
    marginRight: 16, // extra space so the status dot never overlaps text
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  headerAvatarText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  headerStatusIndicator: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  headerTextBlock: {
    flexShrink: 1,
    minWidth: 0,
  },
  onlineIndicator: {
    backgroundColor: "#4CAF50",
  },
  offlineIndicator: {
    backgroundColor: "#9E9E9E",
  },
  contactName: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  contactStatus: {
    fontSize: scaledFontSize(12),
  },
  onlineStatus: {
    color: "#4CAF50",
  },
  offlineStatus: {
    color: "#666",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: scaledFontSize(18),
    color: "#666",
    marginTop: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: scaledFontSize(14),
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 15,
    maxWidth: "100%",
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    marginHorizontal: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#859ce1ff",
    justifyContent: "center",
    alignItems: "center",
  },
  myAvatar: {
    backgroundColor: "#2196F3",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(14),
    fontWeight: "600",
  },
  messageBubble: {
    maxWidth: "100%",
    minWidth: 80,
    flexShrink: 1,
    padding: 12,
    borderRadius: 18,
    marginBottom: 4,
  },
  myMessage: {
    backgroundColor: "#DCF8C6",
    borderTopRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  messageText: {
    fontSize: scaledFontSize(16),
    textAlign: 'left',
    writingDirection: 'ltr',
    flexShrink: 1,
    includeFontPadding: false,
    // @ts-ignore Android-only prop to improve word wrapping
    textBreakStrategy: 'highQuality',
    marginBottom: 4,
  },
  myMessageText: {
    color: "#000000",
  },
  theirMessageText: {
    color: "#000000",
  },
  messageTime: {
    fontSize: scaledFontSize(11),
    alignSelf: "flex-end",
  },
  myMessageTime: {
    color: "#666",
  },
  theirMessageTime: {
    color: "#999",
  },
  // Dark file message bubble styles (match desired mock)
  myFileMessage: {
    backgroundColor: '#2C2F33',
    borderTopRightRadius: 4,
    minWidth: 220,
  },
  theirFileMessage: {
    backgroundColor: '#2C2F33',
    borderTopLeftRadius: 4,
    elevation: 0,
    shadowOpacity: 0,
    minWidth: 220,
  },
  // Bottom input section - all items in one row
  bottomInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  iconButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    backgroundColor: 'transparent',
  },
  textInput: {
    flex: 1,
    fontSize: scaledFontSize(16),
    paddingVertical: 8,
    maxHeight: 100,
  },
  // Attachment styles
  imageAttachment: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
  },
  attachmentImage: {
    width: 200,
    height: 150,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  imageText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(12),
    marginLeft: 4,
  },
  fileAttachment: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  // Inner layout for file content inside dark bubble
  fileBubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileTexts: {
    flex: 1,
  },
  fileNameDark: {
    color: '#FFFFFF',
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  fileSizeDark: {
    color: '#BFC7D1',
    fontSize: scaledFontSize(12),
    marginTop: 2,
  },
  fileIconContainer: {
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: scaledFontSize(14),
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: scaledFontSize(12),
    color: "#666",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: scaledFontSize(28),
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  modalMessage: {
    fontSize: scaledFontSize(16),
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  modalButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    minWidth: 140,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(17),
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  attachmentModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  attachmentModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  attachmentModalTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  attachmentOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  attachmentOption: {
    alignItems: "center",
    padding: 15,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  optionText: {
    fontSize: scaledFontSize(14),
    fontWeight: "500",
  },
  fileHint: {
    fontSize: scaledFontSize(10),
    color: "#888",
    marginTop: 2,
  },

  // Viewer Modal Styles
  viewerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  viewerModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  viewerCloseButton: {
    padding: 8,
  },
  viewerHeaderInfo: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 15,
  },
  viewerFileName: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    textAlign: "center",
  },
  viewerFileSize: {
    color: "#CCCCCC",
    fontSize: scaledFontSize(12),
    marginTop: 2,
  },
  viewerActionButton: {
    padding: 8,
  },
  viewerContent: {
    flex: 1,
  },
  viewerScrollContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullSizeImage: {
    width: "100%",
    height: "100%",
  },
  viewerFooter: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  viewerFooterText: {
    color: "#CCCCCC",
    fontSize: scaledFontSize(12),
  },
  centeredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Simple Modal styles
  simpleModal: {
    width: '80%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  simpleModalTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: '600',
    marginBottom: 6,
  },
  simpleModalMessage: {
    fontSize: scaledFontSize(14),
    textAlign: 'center',
    marginBottom: 14,
  },
  simpleModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  simpleModalButtonText: {
    color: '#FFFFFF',
    fontSize: scaledFontSize(16),
    fontWeight: '600',
  },
  // Emoji Picker styles
  emojiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  emojiModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    height: '75%',
  },
  emojiCategoryTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginBottom: 12,
  },
  emojiCategoryTab: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  emojiCategoryTabActive: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  emojiCategoryIcon: {
    fontSize: 22,
  },
  emojiScroll: {
    flex: 1,
  },
  emojiScrollContent: {
    paddingBottom: 20,
  },
  emojiSection: {
    marginBottom: 24,
  },
  emojiSectionTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
    marginBottom: 12,
    paddingLeft: 5,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  emojiText: {
    fontSize: 32,
  },
  // Recording indicator styles
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    marginRight: 10,
  },
  recordingText: {
    fontSize: scaledFontSize(16),
    fontWeight: '500',
  },
  // New recording toolbar styles
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recCircleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B9F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00CFE8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillControl: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0FBFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillMeter: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 3,
    marginHorizontal: 10,
  },
  pillTime: {
    color: '#0B6E8B',
    fontWeight: '600',
  },
  // Audio message bubble (for sent/received audio files)
  audioBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  audioPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 18,
    gap: 4,
  },
  audioBar: {
    width: 4,
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  audioDurationText: {
    fontSize: scaledFontSize(12),
    color: '#555',
  },
  // Pending file chips
  pendingFilesScroll: {
    maxHeight: 60,
    marginBottom: 6,
  },
  pendingFilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2F33',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pendingChipIcon: {
    marginRight: 6,
  },
  pendingChipText: {
    color: '#FFFFFF',
    maxWidth: 140,
  },
  pendingChipClose: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const getUTI = (extension: string): string => {
  const utiMap: { [key: string]: string } = {
    pdf: "com.adobe.pdf",
    doc: "com.microsoft.word.doc",
    docx: "org.openxmlformats.wordprocessingml.document",
    xls: "com.microsoft.excel.xls",
    xlsx: "org.openxmlformats.spreadsheetml.sheet",
    jpg: "public.jpeg",
    jpeg: "public.jpeg",
    png: "public.png",
    gif: "com.compuserve.gif",
    zip: "public.zip-archive",
    txt: "public.plain-text",
  };

  return utiMap[extension.toLowerCase()] || "public.data";
};
