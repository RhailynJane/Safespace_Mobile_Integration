import { useState, useRef, useEffect, useCallback } from "react";

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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import CurvedBackground from "../../../../components/CurvedBackground";
import { Message, Participant, messagingService } from "../../../../utils/sendbirdService";
import { Paths, File as FSFile } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";
import { useTheme } from "../../../../contexts/ThemeContext";
import * as MediaLibrary from "expo-media-library";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Extended Message type to include attachment properties
interface ExtendedMessage extends Message {
  attachment_url?: string;
  file_name?: string;
  file_size?: number;
}

export default function ChatScreen() {
  const { theme } = useTheme();
  const { userId } = useAuth();
  const params = useLocalSearchParams();
  const conversationId = params.id as string;
  const conversationTitle = params.title as string;
  const channelUrl = (params.channelUrl as string) || "";
  const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [contact, setContact] = useState<Participant | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [viewerModalVisible, setViewerModalVisible] = useState(false);
  const [currentAttachment, setCurrentAttachment] =
    useState<ExtendedMessage | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [userNearBottom, setUserNearBottom] = useState(true);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const didMarkReadRef = useRef(false);
  const [manualScrolling, setManualScrolling] = useState(false);
  const scrollIdleTimerRef = useRef<any>(null);

  // Get safe area insets for proper spacing
  const insets = useSafeAreaInsets();

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

  // Request permissions on component mount
  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Sorry, we need camera roll permissions to make this work!"
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
      console.log("❌ Missing conversationId or userId");
      setLoading(false);
      return;
    }

    try {
      // Update user's activity
      await updateUserActivity();

      // console.log(
      //   `💬 Loading messages for conversation ${conversationId}, user ${userId}`
      // );

      // Use direct backend API instead of messagingService
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}/messages?clerkUserId=${userId}&limit=50`
      );

      if (response.ok) {
        const result = await response.json();
        // console.log(`💬 Loaded ${result.data.length} messages`);
        setMessages(result.data);

      // If SendBird is enabled and we have a channel URL, mark messages as read once
      try {
        if (!didMarkReadRef.current && channelUrl && messagingService.isSendBirdEnabled()) {
          await messagingService.markAsRead(channelUrl);
          didMarkReadRef.current = true;
        }
      } catch (_e) {
        // ignore SB errors
      }

        // Get conversation details to find the other participant with online status
        const conversationsResponse = await fetch(
          `${API_BASE_URL}/api/messages/conversations/${userId}`
        );

        if (conversationsResponse.ok) {
          const conversationsResult = await conversationsResponse.json();
          const currentConversation = conversationsResult.data.find(
            (conv: any) => conv.id === conversationId
          );

          if (currentConversation) {
            const otherParticipant = currentConversation.participants.find(
              (p: Participant) => p.clerk_user_id !== userId
            );
            if (otherParticipant) {
              setContact(otherParticipant);
              // Set online status once and persist it
              setIsOnline(otherParticipant.online || false);
            }
          }
        }

        // Fallback if no contact found
        if (!contact) {
          const fallbackContact = {
            id: "unknown",
            clerk_user_id: "unknown",
            first_name: conversationTitle?.split(" ")[0] || "User",
            last_name: conversationTitle?.split(" ").slice(1).join(" ") || "",
            email: "",
            profile_image_url: undefined,
            online: false,
            last_active_at: null,
          };
          setContact(fallbackContact);
          setIsOnline(false);
        }
      } else {
        console.error("💬 Failed to load messages:", response.status);
        Alert.alert("Error", "Failed to load messages");
      }
    } catch (error) {
      console.error("💬 Error loading messages:", error);
      Alert.alert("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [
    conversationId,
    userId,
    conversationTitle,
    API_BASE_URL,
    contact,
    updateUserActivity,
    channelUrl,
  ]);

  // Load messages with 60-second polling
  useEffect(() => {
    if (!conversationId || !userId) return;

    loadMessages(); // Load immediately

    // Use a longer interval for polling
    const pollInterval = setInterval(() => {
      loadMessages();
    }, 60000); // 60 seconds

    return () => clearInterval(pollInterval);
  }, [conversationId, userId, loadMessages]);

  // Update online status based on last activity (every 10 seconds)
  useEffect(() => {
    if (!contact) return;

    const updateOnlineStatus = () => {
      if (contact.last_active_at) {
        const lastActive = new Date(contact.last_active_at);
        const now = new Date();
        const diffMinutes =
          (now.getTime() - lastActive.getTime()) / (1000 * 60);

        // Consider online if active in last 3 minutes
        const shouldBeOnline = diffMinutes <= 3;
        if (isOnline !== shouldBeOnline) {
          setIsOnline(shouldBeOnline);
        }
      }
    };

    updateOnlineStatus();
    const statusInterval = setInterval(updateOnlineStatus, 10000); // Check every 10 seconds

    return () => clearInterval(statusInterval);
  }, [contact, isOnline]);

  useEffect(() => {
    // Only auto-scroll if user is near bottom or last message is mine
    const last = messages[messages.length - 1];
    const lastIsMine = last ? last.sender.clerk_user_id === userId : false;
    if (!manualScrolling && (userNearBottom || lastIsMine)) {
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
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
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAttachment(result.assets[0].uri, "image");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
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

      if (result.assets?.[0]) {
        const asset = result.assets[0];
        await uploadAttachment(asset.uri, "file", asset.name);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  // Handle camera capture
  const takePhoto = async () => {
    try {
      setAttachmentModalVisible(false);

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Sorry, we need camera permissions to take photos!"
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAttachment(result.assets[0].uri, "image");
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
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

  // Upload attachment to server
  const uploadAttachment = async (
    fileUri: string,
    fileType: "image" | "file",
    fileName?: string
  ) => {
    if (!userId || !conversationId) return;

    try {
      setUploading(true);

      // Generate a descriptive filename if not provided
      const actualFileName =
        fileName ||
        (fileType === "image"
          ? `photo_${Date.now()}.jpg`
          : `document_${Date.now()}.file`);

      // Choose appropriate emoji and description
      const emoji = fileType === "image" ? "🖼️" : "📄";
      const description = fileType === "image" ? "Image" : "File";

      // console.log(`📤 Sharing ${description}: ${actualFileName}`);

      // Send message using your working messages API
      const messageResponse = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: userId,
            messageText: `${emoji} Shared ${description}: ${actualFileName}`,
            messageType: "text",
          }),
        }
      );

      if (messageResponse.ok) {
        const result = await messageResponse.json();

        // Update UI immediately
        setMessages((prev) => [...prev, result.data]);

        // Refresh messages after a short delay
        setTimeout(() => loadMessages(), 1000);

        Alert.alert("Success", `${description} shared successfully!`);
      } else {
        const errorText = await messageResponse.text();
        console.error("Server error:", errorText);
        Alert.alert("Error", "Failed to share file. Please try again.");
      }
    } catch (error) {
      console.error("Network error:", error);
      Alert.alert("Error", "Network error. Please check your connection.");
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
      // console.log(`💬 Sending message: "${newMessage}"`);

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
        // console.log("💬 Message sent successfully");
        setMessages((prev) => [...prev, result.data]);
        setNewMessage("");

        // Reload messages to ensure both parties see the same
        setTimeout(() => loadMessages(), 500);
      } else {
        console.error("💬 Failed to send message:", response.status);
        Alert.alert("Error", "Failed to send message");
      }
    } catch (error) {
      console.error("💬 Error sending message:", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
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
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
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
      setDownloading(true);

      // console.log("Downloading file:", { remoteUri, fileName });

      // Extract file extension
      const urlWithoutParams = remoteUri.split("?")[0];
      const fileExtension =
        (urlWithoutParams ?? "").split(".").pop()?.toLowerCase() || "file";
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      
      // Create file in cache directory
      const file = new FSFile(Paths.cache, `${safeFileName}.${fileExtension}`);
      const localUri = file.uri;

      // console.log("Download details:", { localUri, fileExtension });

      // Download file using fetch and write to file
      const response = await fetch(remoteUri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      await file.write(new Uint8Array(arrayBuffer));

      // console.log("Download complete:", { localUri, fileExtension });

      // Check if sharing is available
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType: getMimeType(fileExtension),
          dialogTitle: `Download ${fileName}`,
          UTI: getUTI(fileExtension), // For iOS
        });

        Alert.alert("Success", "File downloaded and shared successfully!");
      } else {
        Alert.alert("Success", "File downloaded successfully!");
        // If sharing not available, open the file directly
        await WebBrowser.openBrowserAsync(remoteUri);
      }
    } catch (error) {
      console.error("Download error:", error);

      let errorMessage = "Unable to download the file.";

      if (error instanceof Error) {
        if (error.message.includes("Network request failed")) {
          errorMessage = "Network error. Please check your connection.";
        } else if (error.message.includes("Invalid file URL")) {
          errorMessage = "The file link is invalid or broken.";
        } else if (error.message.includes("404")) {
          errorMessage = "File not found on server.";
        }
      }

      Alert.alert("Download Failed", errorMessage);
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

  // Save image to gallery
  const saveImageToGallery = async (imageUri: string) => {
    try {
      setDownloading(true);

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your media library to save images."
        );
        return;
      }

      let finalUri = imageUri;

      // If it's a remote URL, download it first
      if (imageUri.startsWith("http")) {
        const fileName = `image_${Date.now()}.jpg`;
        const imageFile = new FSFile(Paths.cache, fileName);
        
        // Download using fetch
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        await imageFile.write(new Uint8Array(arrayBuffer));
        
        finalUri = imageFile.uri;
      }

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(finalUri);
      await MediaLibrary.createAlbumAsync("Downloads", asset, false);

      Alert.alert("Success", "Image saved to your gallery!");
    } catch (error) {
      console.error("Save image error:", error);
      Alert.alert("Error", "Failed to save image to gallery");
    } finally {
      setDownloading(false);
    }
  };

  // Enhanced renderMessageContent function
  const renderMessageContent = (message: ExtendedMessage) => {
    // Handle image attachments
    if (message.message_type === "image" && message.attachment_url) {
      return (
        <TouchableOpacity
          style={styles.imageAttachment}
          onPress={() => handleViewAttachment(message)}
          onLongPress={() => {
            Alert.alert("Image Options", "What would you like to do?", [
              { text: "View", onPress: () => { handleViewAttachment(message); } },
              {
                text: "Save to Gallery",
                onPress: () => { saveImageToGallery(message.attachment_url!); },
              },
              {
                text: "Download",
                onPress: () => { handleDownloadFile(message); },
              },
              { text: "Cancel", style: "cancel" },
            ]);
          }}
        >
          <Image
            source={{ uri: message.attachment_url }}
            style={styles.attachmentImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <Ionicons name="expand" size={20} color="#FFFFFF" />
            <Text style={styles.imageText}>📷 Photo • Tap to view</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Handle file attachments
    if (message.message_type === "file" && message.attachment_url) {
      return (
        <TouchableOpacity
          style={styles.fileAttachment}
          onPress={() => handleDownloadFile(message)}
          onLongPress={() => {
            Alert.alert(
              "File Options",
              `File: ${message.file_name || "Unknown file"}`,
              [
                {
                  text: "Download & Share",
                  onPress: () => { handleDownloadFile(message); },
                },
                {
                  text: "Open in Browser",
                  onPress: () => {
                    WebBrowser.openBrowserAsync(message.attachment_url!);
                  },
                },
                { text: "Cancel", style: "cancel" },
              ]
            );
          }}
        >
          <View style={styles.fileIconContainer}>
            <Ionicons
              name={getFileIcon(message.file_name)}
              size={24}
              color="#4CAF50"
            />
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {message.file_name || "Download file"}
            </Text>
            {message.file_size && (
              <Text style={styles.fileSize}>
                {formatFileSize(message.file_size)}
              </Text>
            )}
            <Text style={styles.fileHint}>
              {getFileTypeText(message.file_name)} • Tap to download
            </Text>
          </View>
          <Ionicons name="download-outline" size={20} color="#666" />
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
        {message.message_text}
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

    try {
      setDownloading(true);

      const fileUri = message.attachment_url;
      const fileName = message.file_name || `file_${Date.now()}`;

      // console.log("Starting download:", { fileUri, fileName });

      // Show download confirmation
      Alert.alert(
        "Download File",
        `Download "${message.file_name || "this file"}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Download",
            onPress: () => {
              (async () => {
                try {
                  await downloadAndShareFile(fileUri, fileName);
                } catch (error) {
                  console.error("Download error:", error);
                  Alert.alert("Error", "Failed to download file");
                }
              })();
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error handling file:", error);
      Alert.alert("Error", "Failed to download file");
    } finally {
      setDownloading(false);
    }
  };

  // Render message content based on type
  // Handle viewing attachments
  const handleViewAttachment = async (message: ExtendedMessage) => {
    if (!message.attachment_url) {
      Alert.alert("Error", "No attachment URL found.");
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
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <CurvedBackground>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Fixed Header with dynamic height based on screen size */}
          <View style={[styles.headerWrapper, { height: headerHeight }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
              </TouchableOpacity>

              <View style={styles.contactInfo}>
                <View style={styles.headerAvatar}>
                  <Text style={styles.headerAvatarText}>
                    {getUserInitials(contact?.first_name, contact?.last_name)}
                  </Text>
                  {/* Online/Offline indicator in header */}
                  <View
                    style={[
                      styles.headerStatusIndicator,
                      isOnline
                        ? styles.onlineIndicator
                        : styles.offlineIndicator,
                    ]}
                  />
                </View>
                <View>
                  <Text style={styles.contactName}>{conversationTitle}</Text>
                  <Text
                    style={[
                      styles.contactStatus,
                      isOnline ? styles.onlineStatus : styles.offlineStatus,
                    ]}
                  >
                    {contact
                      ? getLastSeenText(contact.last_active_at, isOnline)
                      : "Offline"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push("../appointments/book")}
              >
                <Ionicons name="call-outline" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chat Messages */}
          <ScrollView
            style={styles.messagesContainer}
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
              const near = distanceFromBottom < 300; // px threshold
              if (near !== userNearBottom) setUserNearBottom(near);
              setShowScrollToLatest(!near && messages.length > 0);
              // If user is not near, assume manual scrolling is happening
              if (!near) {
                setManualScrolling(true);
              }
            }}
            scrollEventThrottle={100}
            onContentSizeChange={() => {
              if (!manualScrolling && userNearBottom && scrollViewRef.current) {
                scrollViewRef.current.scrollToEnd({ animated: true });
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
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={64} color={theme.colors.iconDisabled} />
                <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No messages yet</Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                  Start the conversation by sending a message
                </Text>
              </View>
            ) : (
              messages.map((message) => {
                const myMessage = isMyMessage(message);

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageContainer,
                      myMessage
                        ? styles.myMessageContainer
                        : styles.theirMessageContainer,
                    ]}
                  >
                    {/* Other user's avatar */}
                    {!myMessage && (
                      <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {getUserInitials(
                              message.sender.first_name,
                              message.sender.last_name
                            )}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Message bubble with file attachment */}
                    <View
                      style={[
                        styles.messageBubble,
                        myMessage ? styles.myMessage : styles.theirMessage,
                      ]}
                    >
                      {renderMessageContent(message)}
                      <Text
                        style={[
                          styles.messageTime,
                          myMessage
                            ? styles.myMessageTime
                            : styles.theirMessageTime,
                        ]}
                      >
                        {formatTime(message.created_at)}
                      </Text>
                    </View>

                    {/* My avatar */}
                    {myMessage && (
                      <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, styles.myAvatar]}>
                          <Text style={styles.avatarText}>
                            {getUserInitials(
                              message.sender.first_name,
                              message.sender.last_name
                            )}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {showScrollToLatest && (
            <TouchableOpacity
              style={styles.scrollToLatestButton}
              onPress={() => {
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollToEnd({ animated: true });
                }
                setShowScrollToLatest(false);
                setUserNearBottom(true);
              }}
            >
              <Ionicons name="arrow-down" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Message Input */}
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.borderLight }] }>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.background }] }>
              <TouchableOpacity
                style={styles.attachmentButton}
                onPress={() => setAttachmentModalVisible(true)}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Ionicons name="attach" size={24} color={theme.colors.primary} />
                )}
              </TouchableOpacity>

              <TextInput
                style={[styles.textInput, { color: theme.colors.text }]}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                maxLength={500}
                editable={!sending && !uploading}
                onSubmitEditing={handleSendMessage}
                returnKeyType="send"
                placeholderTextColor={theme.colors.textDisabled}
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: theme.colors.primary },
                  (newMessage.trim() === "" || sending || uploading) && { backgroundColor: theme.colors.borderLight },
                ]}
                onPress={handleSendMessage}
                disabled={
                  newMessage.trim() === "" || sending || uploading || !userId
                }
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name="send"
                    size={24}
                    color={newMessage.trim() === "" ? theme.colors.iconDisabled : "#FFFFFF"}
                  />
                )}
              </TouchableOpacity>
            </View>
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
                  <Image
                    source={{ uri: currentAttachment.attachment_url }}
                    style={styles.fullSizeImage}
                    resizeMode="contain"
                  />
                )}
              </ScrollView>

              <View style={styles.viewerFooter}>
                <Text style={styles.viewerFooterText}>
                  Pinch to zoom • Tap download to save
                </Text>
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
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Attachment</Text>
                  <TouchableOpacity
                    onPress={() => setAttachmentModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
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
                    <Text style={styles.optionText}>Camera</Text>
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
                    <Text style={styles.optionText}>Gallery</Text>
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
                    <Text style={styles.optionText}>Document</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </CurvedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor moved to theme via inline override
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    // color moved to theme via inline override
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
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    position: "relative",
  },
  headerAvatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerStatusIndicator: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  onlineIndicator: {
    backgroundColor: "#4CAF50",
  },
  offlineIndicator: {
    backgroundColor: "#9E9E9E",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
  },
  contactStatus: {
    fontSize: 12,
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
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: "600",
  },
  messageBubble: {
    maxWidth: "70%",
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
    fontSize: 16,
    marginBottom: 4,
  },
  myMessageText: {
    color: "#000000",
  },
  theirMessageText: {
    color: "#000000",
  },
  messageTime: {
    fontSize: 11,
    alignSelf: "flex-end",
  },
  myMessageTime: {
    color: "#666",
  },
  theirMessageTime: {
    color: "#999",
  },
  inputContainer: {
    padding: 15,
    // backgroundColor moved to theme via inline override
    borderTopWidth: 1,
    // borderTopColor moved to theme via inline override
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor moved to theme via inline override
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  attachmentButton: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxHeight: 100,
    fontSize: 16,
    // color moved to theme via inline override
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // backgroundColor moved to theme via inline override
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    // backgroundColor moved to theme via inline override
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
    fontSize: 12,
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
  fileIconContainer: {
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: "#666",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
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
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  fileHint: {
    fontSize: 10,
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
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  viewerFileSize: {
    color: "#CCCCCC",
    fontSize: 12,
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
    fontSize: 12,
  },
  scrollToLatestButton: {
    position: "absolute",
    right: 16,
    bottom: 90,
    backgroundColor: "#4CAF50",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
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
