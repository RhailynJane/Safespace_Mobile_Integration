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
import { PermissionsAndroid } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useAudioPlayer, RecordingOptions } from 'expo-audio';
import { Audio } from 'expo-av';
import CurvedBackground from "../../../../components/CurvedBackground";
import OptimizedImage from "../../../../components/OptimizedImage";
import { Participant, messagingService } from "../../../../utils/sendbirdService";
// activityApi removed; using Convex presence queries
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
import { useConvex, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Extended Message type to include attachment properties
interface ExtendedMessage {
  id: string;
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'audio';
  created_at: string;
  updated_at?: string;
  attachment_url?: string;
  file_name?: string;
  file_size?: number;
  sender: {
    clerk_user_id: string;
    first_name: string;
    last_name: string;
    profile_image_url?: string;
  };
}

export default function ChatScreen() {
  const { theme, scaledFontSize, isDarkMode, fontScale } = useTheme();
  const isFocused = useIsFocused();
  const { userId, getToken } = useAuth();
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

  // Live subscription with sender metadata (profiles + users)
  const rawMessages = useQuery(
    api.conversations.listMessagesWithProfiles as any,
    conversationId ? { conversationId: conversationId as any, limit: 200 } : (undefined as any)
  ) as any[] | undefined;
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
  const [attachmentSheetVisible, setAttachmentSheetVisible] = useState(false);
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
  const isRecordingRef = useRef(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<any>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingRecordingUri, setPendingRecordingUri] = useState<string | null>(null);
  const [pendingRecordingDuration, setPendingRecordingDuration] = useState(0);
  const [pendingFiles, setPendingFiles] = useState<Array<{ uri: string; name: string; size?: number }>>([]);
  const [showVoiceRecordOverlay, setShowVoiceRecordOverlay] = useState(false);
  const [showVoiceSendConfirm, setShowVoiceSendConfirm] = useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('smileys');
  const emojiScrollRef = useRef<ScrollView>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingMessageText, setEditingMessageText] = useState("");
    const [messageActionSheetVisible, setMessageActionSheetVisible] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ExtendedMessage | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalData, setStatusModalData] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
    confirm: undefined as undefined | { confirmText?: string; cancelText?: string; onConfirm: () => void },
    actions: undefined as undefined | Array<{ label: string; onPress: () => void; variant?: 'default' | 'primary' | 'danger' }>,
  });

  // Shared Convex client from provider
  const convex = useConvex();

  // Don't use the broken useAudioRecorder hook - use AudioModule directly
  const audioRecorderRef = useRef<any>(null);

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

  // Try to normalize URI from various recorder stop() shapes and hook fields
  const resolveRecorderUri = (stopResult: any): string | null => {
    const recorder = audioRecorderRef.current;
    const candidates = [
      stopResult?.uri,
      stopResult?.file?.uri,
      stopResult?.path,
      stopResult?.url,
      recorder?.uri,
      recorder?.recordingUri,
      recorder?.recording?.uri,
      recorder?.recording?.getURI?.(),
      recorder?._recording?.uri,
      recorder?._recording?.getURI?.(),
      typeof recorder?.getURI === 'function' ? recorder?.getURI() : undefined,
      typeof recorder?.recording?.getURI === 'function' ? recorder?.recording?.getURI() : undefined,
    ].filter(Boolean).filter((u: any) => u && u.length > 0);
    return (candidates.length > 0 ? String(candidates[0]) : null);
  };

  // Ensure microphone permission (Android requires runtime grant)
  const ensureMicPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS !== 'android') return true; // iOS/Web prompt automatically on first access
      const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      if (already) return true;
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone permission',
          message: 'SafeSpace needs access to your microphone to record voice messages.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
          buttonNeutral: 'Ask Me Later',
        }
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    } catch (_e) {
      return false;
    }
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
  // Keyboard offset should account for the header height
  const keyboardOffset = Platform.OS === 'ios' ? headerHeight : 0;

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

  // Initialize contact from params on mount
  useEffect(() => {
    if (!otherClerkIdParam) return;
    
    // Parse conversationTitle to get first/last name
    const titleParts = (conversationTitle || '').trim().split(' ');
    const firstName = titleParts[0] || '';
    const lastName = titleParts.slice(1).join(' ') || '';
    
    setContact({
      id: otherClerkIdParam,
      clerk_user_id: otherClerkIdParam,
      first_name: firstName,
      last_name: lastName,
      profile_image_url: profileImageUrlParam || undefined,
      online: initialOnlineParam === '1',
      last_active_at: initialLastActiveParam || null,
      email: '',
      presence: (initialPresenceParam as any) || (initialOnlineParam === '1' ? 'online' : 'offline'),
    });
  }, [otherClerkIdParam, conversationTitle, profileImageUrlParam, initialOnlineParam, initialLastActiveParam, initialPresenceParam]);

  // Update user activity via Convex (touch presence)
  const updateUserActivity = useCallback(async () => {
    if (!userId) return;
    try {
      await convex.mutation(api.conversations.touchActivity, { status: 'online' });
    } catch (error) {
      console.error('Error updating user activity (Convex):', error);
    }
  }, [userId, convex]);

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

  // Derive live messages when rawMessages changes
  useEffect(() => {
    if (!rawMessages) return;
    const loaded: ExtendedMessage[] = rawMessages.map((m: any) => ({
      id: m._id,
      message_type: m.messageType || 'text',
      message_text: m.body || '',
      created_at: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      updated_at: m.updatedAt ? new Date(m.updatedAt).toISOString() : undefined,
      attachment_url: m.attachmentUrl,
      file_name: m.fileName,
      file_size: m.fileSize,
      sender: {
        clerk_user_id: m.senderId || 'unknown',
        first_name: m.senderFirstName || '',
        last_name: m.senderLastName || '',
        profile_image_url: m.senderProfileImageUrl || undefined,
      },
    }));
    setMessages(loaded);
    setLoading(false);

    // Auto mark read for newest incoming message (throttled)
    const latest = loaded[loaded.length - 1];
    const latestId = latest ? String(latest.id) : null;
    const prevId = lastMessageIdRef.current;
    const nowTs = Date.now();
    const shouldMark = latestId && latestId !== prevId && !(latest && latest.sender.clerk_user_id === userId) && nowTs - lastMarkedAtRef.current > 2000;
    if (shouldMark) {
      lastMessageIdRef.current = latestId;
      lastMarkedAtRef.current = nowTs;
      convex.mutation(api.conversations.markRead, { conversationId: conversationId as any }).catch(() => {});
    }
  }, [rawMessages, userId, convex, conversationId]);

  // Load messages with fast polling while in the chat screen, unless live subscription is active
  // Removed polling; live subscription provides updates

  // When live messages are available, update UI and mark-as-read as needed
  // Live subscription removed (could be reintroduced with a Convex subscription hook later)

  // Poll presence status regularly while focused
  useEffect(() => {
    if (!isFocused || !otherClerkIdParam || otherClerkIdParam === "unknown") return;

    const updateOnlineStatus = async () => {
      try {
        const row = await convex.query(api.conversations.presenceForUser, { userId: otherClerkIdParam });
        if (row) {
          const status = (row.status as 'online' | 'away' | 'offline' | undefined) ?? 'offline';
          const lastSeen = row.lastSeen as number | undefined;
          setIsOnline(status === 'online');
          setPresence(status);
          if (lastSeen) {
            setContact((prev) => prev ? { ...prev, online: status === 'online', last_active_at: new Date(lastSeen).toISOString() } : prev);
          }
        } else {
          // No presence data, default to offline
          setIsOnline(false);
          setPresence('offline');
        }
      } catch (error) {
        console.error('Error fetching presence:', error);
        setIsOnline(false);
        setPresence('offline');
      }
    };

    // Initial check
    updateOnlineStatus();

    // Poll every 10 seconds while screen is focused
    const interval = setInterval(updateOnlineStatus, 10000);
    return () => clearInterval(interval);
  }, [isFocused, otherClerkIdParam, convex]);

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

      // Convex direct storage upload
      const finalFileName = `${finalNameBase}.${finalExt}`;
      try {
        const { uploadUrl } = await convex.action(api.storage.generateUploadUrl, {});
        // Fetch file data as blob
        const fileResponse = await fetch(uploadUri);
        const fileBlob = await fileResponse.blob();
        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': finalMime },
          body: fileBlob,
        });
        if (!uploadRes.ok) {
          console.error('📎 Storage upload failed:', uploadRes.status);
          showStatusModal('error', 'Upload failed', 'Could not upload file.');
          return;
        }
        const { storageId } = await uploadRes.json();
        // Create attachment message referencing storage
        await convex.mutation(api.conversations.sendAttachmentFromStorage, {
          conversationId: conversationId as any,
            storageId: storageId,
            fileName: finalFileName,
            fileSize: undefined,
            messageType: fileType === 'image' ? 'image' : 'file',
        });
  // Live subscription will refresh messages automatically
      } catch (convexErr) {
        console.error('📎 Convex upload error:', convexErr);
        showStatusModal('error', 'Upload failed', 'Unable to upload attachment.');
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
        // If editing, save the edit instead
        if (editingMessageId) {
          await saveEditedMessage();
          return;
        }

    if (newMessage.trim() === "" || sending || !userId || !conversationId) {
      return;
    }

    try {
      setSending(true);
      // console.log(`Sending message: "${newMessage}"`);

      // Update activity when sending message
      await updateUserActivity();

      // Convex send only
  await convex.mutation(api.conversations.sendMessage, { conversationId: conversationId as any, body: newMessage.trim(), messageType: 'text' });

      // Optimistic UI: clear input and refresh messages
      setNewMessage("");
      setIsTyping(false);
  // No manual reload needed; subscription updates list
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

  // Handle long press on message to show action sheet
  const handleMessageLongPress = (message: ExtendedMessage) => {
    // Only allow editing/deleting own messages
    // Allow editing only for text messages, but allow deleting for all message types
    if (message.sender.clerk_user_id === userId) {
      setSelectedMessage(message);
      setMessageActionSheetVisible(true);
    }
  };

  // Handle edit message
  const handleEditMessage = () => {
    if (selectedMessage) {
      setEditingMessageId(selectedMessage.id);
      setEditingMessageText(selectedMessage.message_text);
      setNewMessage(selectedMessage.message_text);
      setMessageActionSheetVisible(false);
    }
  };

  // Handle delete message
  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    setMessageActionSheetVisible(false);
    
    showConfirm(
      'Delete Message',
      'Are you sure you want to delete this message?',
      async () => {
        try {
          await convex.mutation(api.conversations.deleteMessage, {
            messageId: selectedMessage.id as any,
          });
          showStatusModal('success', 'Deleted', 'Message deleted successfully');
        } catch (error: any) {
          console.error('Delete message error:', error);
          showStatusModal('error', 'Error', error.message || 'Failed to delete message');
        }
      }
    );
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText("");
    setNewMessage("");
  };

  // Save edited message
  const saveEditedMessage = async () => {
    if (!editingMessageId || !newMessage.trim()) return;
    
    try {
      setSending(true);
      await convex.mutation(api.conversations.updateMessage, {
        messageId: editingMessageId as any,
        newText: newMessage.trim(),
      });
      setEditingMessageId(null);
      setEditingMessageText("");
      setNewMessage("");
      showStatusModal('success', 'Updated', 'Message updated successfully');
    } catch (error: any) {
      console.error('Update message error:', error);
      showStatusModal('error', 'Error', error.message || 'Failed to update message');
    } finally {
      setSending(false);
    }
  };

  // Handle voice recording (start/stop) - simplified and fixed structure
  const handleMicPress = async () => {
    // Show voice recording overlay
    setShowVoiceRecordOverlay(true);
  };

  const startVoiceRecording = async () => {
    try {
      const hasPerm = await ensureMicPermission();
      if (!hasPerm) {
        showStatusModal('error', 'Permission required', 'Please allow microphone access to record voice messages.');
        setShowVoiceRecordOverlay(false);
        return;
      }
      // Start recording
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      audioRecorderRef.current = recording;
      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
      console.log('🎤 Recording started');
    } catch (e: any) {
      console.error('❌ Audio recording error:', e);
      showStatusModal('error', 'Recording Error', e.message || 'Failed to record audio');
      setIsRecording(false);
      isRecordingRef.current = false;
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
      setShowVoiceRecordOverlay(false);
    }
  };

  const stopVoiceRecording = async () => {
    try {
      const recorder = audioRecorderRef.current;
      if (recorder) {
        await recorder.stopAndUnloadAsync();
        const uri = recorder.getURI();
        if (uri) {
          setPendingRecordingUri(uri);
          setPendingRecordingDuration(recordingDuration);
          console.log('🎤 Recording saved:', uri);
          // Show confirmation dialog
          setShowVoiceSendConfirm(true);
        }
      }
      setIsRecording(false);
      isRecordingRef.current = false;
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    } catch (e: any) {
      console.error('❌ Stop recording error:', e);
      setIsRecording(false);
      isRecordingRef.current = false;
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    }
  };


  // Cancel/remove pending recording (or abort active recording)
  const cancelPendingRecording = async () => {
    try {
      if (isRecording) {
        try { 
          const recorder = audioRecorderRef.current;
          if (recorder) {
            await recorder.stopAndUnloadAsync();
          }
          audioRecorderRef.current = null;
        } catch { /* noop */ }
        setIsRecording(false);
        isRecordingRef.current = false;
      }
      if (recordingTimerRef.current) { 
        clearInterval(recordingTimerRef.current); 
        recordingTimerRef.current = null; 
      }
      if (pendingRecordingUri) {
        await FileSystem.deleteAsync(pendingRecordingUri, { idempotent: true }).catch(() => {});
      }
    } finally {
      setPendingRecordingUri(null);
      setPendingRecordingDuration(0);
      setRecordingDuration(0);
    }
  };

  // Cleanup on unmount: stop any active recording and clear timers
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (isRecordingRef.current && audioRecorderRef.current) {
        try { audioRecorderRef.current.stopAndUnloadAsync(); } catch { /* noop */ }
      }
    };
  }, []);

  // Send the prepared recording
  const sendPendingRecording = async () => {
    if (!pendingRecordingUri) return;
    try {
      setUploading(true);
      // Use m4a extension for all platforms
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
      setRecordingDuration(0);
      setIsRecording(false);
      isRecordingRef.current = false;
      audioRecorderRef.current = null;
    }
  };

  // Send pending files and/or message
  const handleMainSend = async () => {
    if (sending || uploading) return;
    try {
      // If there's a pending voice recording, send it first
      if (pendingRecordingUri) {
        await sendPendingRecording();
      }
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
      console.log("Starting download:", { remoteUri, fileName });
      setDownloading(true);
      const resolvedUri = resolveRemoteUri(remoteUri);
      const urlWithoutParams = resolvedUri.split("?")[0];
      // Extract extension from filename only, not the full URL path
      const pathname = (urlWithoutParams ?? "").split('/').pop() || '';
      const parts = pathname.split('.');
      const fileExtension = (parts.length > 1 && parts[parts.length - 1]) ? parts[parts.length - 1]!.toLowerCase() : 'file';
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const baseName = safeFileName.replace(/\.[^/.]+$/, ""); // remove existing extension if present

      // Use legacy API shim to avoid runtime deprecation errors (SDK 54): download into cache directory
      const cacheDir = (FSLegacy as any).cacheDirectory || (FileSystem as any).cacheDirectory || '';
      const fileUri = `${cacheDir}download_${Date.now()}.${fileExtension}`;
      console.log("📥 Downloading to:", fileUri);
      await FSLegacy.downloadAsync(resolvedUri, fileUri);

      console.log("✅ Download complete, opening share sheet");

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: getMimeType(fileExtension),
          dialogTitle: `Share ${fileName}`,
          UTI: getUTI(fileExtension),
        });
        console.log("✓ Share sheet closed");
      } else {
        console.log("⚠️ Sharing not available, opening in browser");
        // Fallback: open in browser quietly
        await WebBrowser.openBrowserAsync(remoteUri);
      }
    } catch (error) {
      console.error("❌ Download error:", error);
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
    console.log("📤 shareUriEnsuringLocal called with:", uri);
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      console.log("⚠️ Sharing not available on this device");
      return false;
    }
    try {
      let localUri = uri;
      let ext = 'file';
      if (uri.startsWith('http')) {
        console.log("📤 Remote URI detected, downloading first...");
        const resolved = resolveRemoteUri(uri);
        const withoutParams = (resolved.split('?')[0] ?? resolved) as string;
        // Extract extension from URL path, not the full URL (avoid domain extensions)
        const pathname = withoutParams.split('/').pop() || '';
        const parts = pathname.split('.');
        ext = (parts.length > 1 && parts[parts.length - 1]) ? parts[parts.length - 1]!.toLowerCase() : 'file';
        const cacheDir = (FSLegacy as any).cacheDirectory || (FileSystem as any).cacheDirectory || '';
        const destUri = `${cacheDir}share_${Date.now()}.${ext}`;
        console.log("📤 Downloading to:", destUri);
        await FSLegacy.downloadAsync(resolved, destUri);
        localUri = destUri;
        console.log("✓ Download complete:", localUri);
      }
      console.log("📤 Opening share sheet for:", localUri);
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
    console.log("📼 saveImageToGallery called with:", imageUri);
    try {
      setDownloading(true);
      // Expo Go limitation: cannot grant full media access; fallback to share
      if (Constants?.appOwnership === 'expo') {
        console.log("🧏‍♂️ Running in Expo Go, using share fallback for gallery save");
        const shared = await shareUriEnsuringLocal(imageUri, `image_${Date.now()}`);
        if (!shared) {
          setFileErrorMessage("Saving to gallery isn't supported in Expo Go. Shared instead.");
          setFileErrorModalVisible(true);
        }
        return;
      }
      // Request permissions; if not available or rejected, fallback to share sheet
      try {
        console.log("🔐 Requesting media library permissions...");
        // Request only photo permission to avoid AUDIO manifest requirement on Android 13+
        const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
        console.log("🔐 Permission status:", status);
        if (status !== "granted") {
          console.log("⚠️ Permission denied, falling back to share");
          const shared = await shareUriEnsuringLocal(imageUri, `image_${Date.now()}`);
          if (shared) return;
          setFileErrorMessage("Cannot save without media permissions.");
          setFileErrorModalVisible(true);
          return;
        }
      } catch (_permErr) {
        console.error("⚠️ Permission request error:", _permErr);
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
        console.log("📤 Remote image, downloading first...");
        const resolved = resolveRemoteUri(imageUri);
        const withoutParams = (resolved.split('?')[0] ?? resolved) as string;
        // Extract extension from URL path, not the full URL (avoid domain extensions)
        const pathname = withoutParams.split('/').pop() || '';
        const parts = pathname.split('.');
        const ext = (parts.length > 1 && parts[parts.length - 1]) ? parts[parts.length - 1]!.toLowerCase() : 'jpg';
        const cacheDir = (FSLegacy as any).cacheDirectory || (FileSystem as any).cacheDirectory || '';
        const destUri = `${cacheDir}image_${Date.now()}.${ext}`;
        await FSLegacy.downloadAsync(resolved, destUri);
        finalUri = destUri;
        console.log("✓ Downloaded to:", finalUri);
      }

      console.log("📼 Creating media library asset...");
      const asset = await MediaLibrary.createAssetAsync(finalUri);
      await MediaLibrary.createAlbumAsync("Downloads", asset, false);
      console.log("✓ Image saved to gallery!");
    } catch (error) {
      console.error("❌ Save image error:", error);
      // Final fallback: try share if gallery save failed
      try {
        console.log("⚠️ Gallery save failed, trying share fallback...");
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
      const audioPlayer = useAudioPlayer(resolveRemoteUri(uri));
      
      useEffect(() => {
        // Animate bars when playing
        if (playing) {
          Animated.loop(
            Animated.stagger(100, barAnim.map(v =>
              Animated.sequence([
                Animated.timing(v, { toValue: 12, duration: 300, useNativeDriver: false }),
                Animated.timing(v, { toValue: 2, duration: 300, useNativeDriver: false }),
              ])
            ))
          ).start();
        } else {
          barAnim.forEach(v => v.setValue(4));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [playing]);

      useEffect(() => {
        // Listen to playback status
        if (audioPlayer.playing) {
          setPlaying(true);
        } else {
          setPlaying(false);
        }
      }, [audioPlayer.playing]);

      const toggle = async () => {
        try {
          if (audioPlayer.playing) {
            audioPlayer.pause();
            setPlaying(false);
          } else {
            audioPlayer.play();
            setPlaying(true);
          }
        } catch (error) {
          console.error('❌ Audio playback error:', error);
          showStatusModal('error', 'Playback Error', 'Failed to play audio');
        }
      };

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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
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

        {/* Message Action Sheet */}
        <Modal
          visible={messageActionSheetVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setMessageActionSheetVisible(false)}
        >
          <TouchableOpacity
            style={styles.attachmentModalOverlay}
            activeOpacity={1}
            onPress={() => setMessageActionSheetVisible(false)}
          >
            <View style={[styles.attachmentSheet, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.messageActionGrid}>
                {/* Only show Edit option for text messages */}
                {selectedMessage?.message_type === 'text' && (
                  <TouchableOpacity
                    style={styles.messageActionOption}
                    onPress={handleEditMessage}
                  >
                    <View style={[styles.messageActionIconCircle, { backgroundColor: '#007AFF' }]}>
                      <Ionicons name="create-outline" size={24} color="white" />
                    </View>
                    <Text style={[styles.attachmentLabel, { color: theme.colors.text }]}>Edit</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.messageActionOption}
                  onPress={handleDeleteMessage}
                >
                  <View style={[styles.messageActionIconCircle, { backgroundColor: '#FF3B30' }]}>
                    <Ionicons name="trash-outline" size={24} color="white" />
                  </View>
                  <Text style={[styles.attachmentLabel, { color: theme.colors.text }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
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
                      'This will remove the conversation and all messages. Continue?',
                      async () => {
                        try {
                          await convex.mutation(api.conversations.deleteConversation, { conversationId: conversationId as any });
                          router.back();
                        } catch (_e) {
                          showStatusModal('error', 'Delete failed', 'Please try again.');
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
                      handleMessageLongPress(item);
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

          {/* Editing Mode Banner - positioned above input */}
          {editingMessageId && (
            <View style={[styles.editingBanner, { backgroundColor: isDarkMode ? '#3A3B3C' : '#E8F4FD' }]}>
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.editingText, { color: theme.colors.text }]}>
                Editing message
              </Text>
              <TouchableOpacity onPress={cancelEdit} style={styles.editingCloseButton}>
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Message Input - Compact row with + button and text input */}
          <View style={[
            styles.bottomInputSection, 
            { 
              backgroundColor: 'transparent',
              // Add safe-area bottom padding so the input doesn't touch system navigation
              paddingBottom: Math.max(insets.bottom || 0, 8),
            }
          ]}>
            {/* Plus button to open attachment sheet - hide when editing */}
            {!editingMessageId && (
              <TouchableOpacity
                style={styles.plusButton}
                onPress={() => setAttachmentSheetVisible(true)}
              >
                <Ionicons name="add" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            )}

            <View style={[
              styles.compactInputWrapper,
              { 
                backgroundColor: isDarkMode ? '#3A3B3C' : '#F0F2F5',
                borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }
            ]}>
              <TextInput
                style={[styles.compactTextInput, { color: theme.colors.text }]}
                placeholder={editingMessageId ? "Edit message..." : "Write a message..."}
                value={newMessage}
                onChangeText={(text) => {
                  setNewMessage(text);
                  setIsTyping(text.length > 0);
                }}
                multiline={true}
                maxLength={500}
                editable={!sending && !uploading}
                placeholderTextColor={theme.colors.textSecondary}
                returnKeyType="send"
                blurOnSubmit={true}
                onSubmitEditing={handleSendMessage}
              />
            </View>

            {/* Mic button - hide when editing */}
            {!editingMessageId && (
              <TouchableOpacity
                style={styles.micButton}
                onPress={handleMicPress}
              >
                <Ionicons 
                  name={isRecording ? "stop-circle" : "mic"} 
                  size={24} 
                  color={isRecording ? "#FF0000" : theme.colors.primary} 
                />
              </TouchableOpacity>
            )}

            {(newMessage.trim() !== "" || pendingFiles.length > 0 || !!pendingRecordingUri) && (
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

        {/* Attachment Bottom Sheet */}
        <Modal
          visible={attachmentSheetVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAttachmentSheetVisible(false)}
        >
          <TouchableOpacity
            style={styles.attachmentModalOverlay}
            activeOpacity={1}
            onPress={() => setAttachmentSheetVisible(false)}
          >
            <View style={[styles.attachmentSheet, { backgroundColor: theme.colors.surface }]}>
              {/* Attachment Options Grid */}
              <View style={styles.attachmentGrid}>
                <View style={styles.attachmentRow}>
                  <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={() => {
                      setAttachmentSheetVisible(false);
                      pickDocument();
                    }}
                  >
                    <View style={[styles.attachmentIconCircle, { backgroundColor: '#007AFF' }]}>
                      <Ionicons name="document-text" size={24} color="white" />
                    </View>
                    <Text style={[styles.attachmentLabel, { color: theme.colors.text }]}>Document</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={() => {
                      setAttachmentSheetVisible(false);
                      takePhoto();
                    }}
                  >
                    <View style={[styles.attachmentIconCircle, { backgroundColor: '#FF3B30' }]}>
                      <Ionicons name="camera" size={24} color="white" />
                    </View>
                    <Text style={[styles.attachmentLabel, { color: theme.colors.text }]}>Camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.attachmentOption}
                    onPress={() => {
                      setAttachmentSheetVisible(false);
                      pickImage();
                    }}
                  >
                    <View style={[styles.attachmentIconCircle, { backgroundColor: '#34C759' }]}>
                      <Ionicons name="image" size={24} color="white" />
                    </View>
                    <Text style={[styles.attachmentLabel, { color: theme.colors.text }]}>Media</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Voice Recording Overlay */}
        <Modal
          visible={showVoiceRecordOverlay}
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (isRecording) {
              cancelPendingRecording();
            }
            setShowVoiceRecordOverlay(false);
          }}
        >
          <View style={styles.voiceOverlay}>
            {/* Contact Info */}
            <View style={styles.voiceContactSection}>
              <View style={styles.voiceAvatarWrapper}>
                {contact?.profile_image_url ? (
                  <OptimizedImage
                    source={{ uri: resolveRemoteUri(contact.profile_image_url) }}
                    style={styles.voiceAvatar}
                    resizeMode="cover"
                    cache="force-cache"
                    loaderSize="small"
                    showErrorIcon={false}
                  />
                ) : (
                  <View style={[styles.voiceAvatar, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.voiceAvatarText}>
                      {getUserInitials(contact?.first_name, contact?.last_name)}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.voiceContactName, { color: theme.colors.text }]}>
                {conversationTitle}
              </Text>
              <Text style={[styles.voiceContactRole, { color: theme.colors.textSecondary }]}>
                {contact?.email || ''}
              </Text>
            </View>

            {/* Cancel Button (top left) */}
            <TouchableOpacity
              style={styles.voiceCancelButton}
              onPress={() => {
                if (isRecording) {
                  cancelPendingRecording();
                }
                setShowVoiceRecordOverlay(false);
              }}
            >
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>

            {/* Recording Status */}
            {isRecording && (
              <View style={styles.voiceRecordingStatus}>
                <Text style={[styles.voiceStatusText, { color: '#4A9EFF' }]}>
                  Release to send
                </Text>
                <Text style={[styles.voiceStatusSubtext, { color: theme.colors.textSecondary }]}>
                  Slide away to cancel
                </Text>
                <Text style={[styles.voiceTimer, { color: '#FF0000' }]}>
                  ● {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}
                </Text>
              </View>
            )}

            {!isRecording && (
              <View style={styles.voiceRecordingStatus}>
                <Text style={[styles.voiceStatusText, { color: theme.colors.text }]}>
                  Hold to record
                </Text>
                <Text style={[styles.voiceStatusSubtext, { color: theme.colors.textSecondary }]}>
                  Slide away to cancel
                </Text>
              </View>
            )}

            {/* Mic Button */}
            <View style={styles.voiceMicContainer}>
              <TouchableOpacity
                style={[styles.voiceMicButton, { backgroundColor: isRecording ? '#4A9EFF' : '#4A9EFF' }]}
                onPressIn={startVoiceRecording}
                onPressOut={stopVoiceRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={48} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Voice Send Confirmation */}
        <Modal
          visible={showVoiceSendConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowVoiceSendConfirm(false)}
        >
          <View style={styles.confirmOverlay}>
            <View style={[styles.confirmDialog, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.confirmTitle, { color: theme.colors.text }]}>
                Send voice message?
              </Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: 'transparent' }]}
                  onPress={() => {
                    cancelPendingRecording();
                    setShowVoiceSendConfirm(false);
                    setShowVoiceRecordOverlay(false);
                  }}
                >
                  <Text style={[styles.confirmButtonText, { color: theme.colors.textSecondary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: 'transparent' }]}
                  onPress={async () => {
                    setShowVoiceSendConfirm(false);
                    setShowVoiceRecordOverlay(false);
                    await sendPendingRecording();
                  }}
                >
                  <Text style={[styles.confirmButtonText, { color: '#4A9EFF' }]}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  // Compact input styles
  plusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  compactInputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
  },
  compactTextInput: {
    fontSize: scaledFontSize(16),
    minHeight: 20,
    maxHeight: 80,
    textAlignVertical: 'top',
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  attachmentGrid: {
    gap: 20,
  },
  attachmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attachmentIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentLabel: {
    fontSize: scaledFontSize(12),
    fontWeight: '500',
  },
  gifText: {
    color: 'white',
    fontSize: scaledFontSize(14),
    fontWeight: 'bold',
  },
  // Voice recording overlay styles
  voiceOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  voiceContactSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  voiceAvatarWrapper: {
    marginBottom: 16,
  },
  voiceAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceAvatarText: {
    color: '#FFFFFF',
    fontSize: scaledFontSize(28),
    fontWeight: '600',
  },
  voiceContactName: {
    fontSize: scaledFontSize(18),
    fontWeight: '600',
    marginBottom: 4,
  },
  voiceContactRole: {
    fontSize: scaledFontSize(14),
  },
  voiceCancelButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceRecordingStatus: {
    alignItems: 'center',
    gap: 4,
  },
  voiceStatusText: {
    fontSize: scaledFontSize(16),
    fontWeight: '500',
  },
  voiceStatusSubtext: {
    fontSize: scaledFontSize(14),
  },
  voiceTimer: {
    fontSize: scaledFontSize(18),
    fontWeight: '600',
    marginTop: 8,
  },
  voiceMicContainer: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  voiceMicButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmDialog: {
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  confirmButtonText: {
    fontSize: scaledFontSize(16),
    fontWeight: '600',
  },
  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  editingText: {
    flex: 1,
    fontSize: scaledFontSize(14),
    fontWeight: '500',
  },
  editingCloseButton: {
    padding: 4,
  },
  messageActionGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 10,
  },
  messageActionOption: {
    alignItems: 'center',
    padding: 15,
  },
  messageActionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
