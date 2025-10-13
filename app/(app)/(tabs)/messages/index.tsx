import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import { messagingService, Conversation, Participant } from "../../../../utils/matrixService";

export default function MessagesScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [matrixStatus, setMatrixStatus] = useState<string>("Initializing...");

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const initializeMessaging = useCallback(async () => {
    try {
      // Replace with actual user ID and token from your auth system
      const userId = "current_user";
      const accessToken = process.env.EXPO_PUBLIC_MATRIX_ACCESS_TOKEN;
      
      const matrixInitialized = await messagingService.initializeMatrix(userId, accessToken);
      setMatrixStatus(matrixInitialized ? "Matrix Connected" : "Matrix Not Available");
      
      if (matrixInitialized) {
        await loadConversations();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to initialize messaging:", error);
      setMatrixStatus("Connection Failed");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeMessaging();
  }, [initializeMessaging]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const result = await messagingService.getConversations("current_user");
      if (result.success) {
        setConversations(result.data);
      } else {
        console.log("Failed to load conversations");
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const getAvatarUrl = (participants: Participant[]) => {
    const firstParticipant = participants[0];
    if (firstParticipant?.profile_image_url) {
      return firstParticipant.profile_image_url;
    }
    return "https://ui-avatars.com/api/?name=User&background=666&color=fff&size=60";
  };

  const getDisplayName = (conversation: Conversation) => {
    if (conversation.title && conversation.title !== `Room ${conversation.id}`) {
      return conversation.title;
    }
    if (conversation.participants.length > 0) {
      const participant = conversation.participants[0];
      return `${participant?.first_name ?? ""} ${participant?.last_name ?? ""}`.trim() || participant?.id || "Unknown Participant";
    }
    return "Unknown";
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading messages...</Text>
        <Text style={styles.statusText}>{matrixStatus}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CurvedBackground>
        {/* Fixed AppHeader usage - remove subtitle if not supported */}
        <AppHeader 
          title="Messages" 
          showBack={true}
        />

        {/* Status display as separate component */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusSubtitle}>{matrixStatus}</Text>
        </View>

        {/* New Message Button */}
        <View>
          <TouchableOpacity
            style={styles.newMessageButton}
            onPress={() => router.push("../messages/new-message")}
          >
            <LinearGradient
              colors={['#5296EA', '#489EEA', '#459EEA', '#4896EA']}
              style={styles.newMessageButtonGradient}
            >
              <Text style={styles.newMessageButtonText}>+ New Message</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9E9E9E"
          />
          <Ionicons
            name="search"
            size={22}
            color="#333"
            style={styles.searchIcon}
          />
        </View>

        {/* Connection Status */}
        <View style={[
          styles.statusIndicator,
          { 
            backgroundColor: messagingService.isMatrixEnabled() ? '#4CAF50' : '#FF9800',
            display: messagingService.isMatrixEnabled() ? 'none' : 'flex'
          }
        ]}>
          <Ionicons 
            name={messagingService.isMatrixEnabled() ? "checkmark-circle" : "warning"} 
            size={16} 
            color="#FFF" 
          />
          <Text style={styles.statusIndicatorText}>
            {matrixStatus}
          </Text>
        </View>

        {/* Conversation List */}
        <View style={styles.conversationContainer}>
          <ScrollView 
            style={styles.conversationList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#4CAF50']}
              />
            }
          >
            {conversations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={64} color="#CCCCCC" />
                <Text style={styles.emptyStateText}>
                  {messagingService.isMatrixEnabled() ? "No conversations yet" : "Matrix Not Connected"}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {messagingService.isMatrixEnabled() 
                    ? "Start a new conversation to begin messaging" 
                    : "Check your Matrix configuration to enable messaging"
                  }
                </Text>
                {!messagingService.isMatrixEnabled() && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={initializeMessaging}
                  >
                    <Text style={styles.retryButtonText}>Retry Connection</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              conversations.map((conversation) => (
                <TouchableOpacity
                  key={conversation.id}
                  style={styles.conversationItem}
                  onPress={() => router.push({
                    pathname: "../messages/message-chat-screen",
                    params: { 
                      id: conversation.id,
                      title: getDisplayName(conversation)
                    }
                  })}
                >
                  <View style={styles.avatarContainer}>
                    <Image
                      source={{ uri: getAvatarUrl(conversation.participants) }}
                      style={styles.avatar}
                    />
                    {conversation.participants.some(p => p.online) && (
                      <View style={styles.onlineIndicator} />
                    )}
                  </View>

                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.conversationName}>
                        {getDisplayName(conversation)}
                      </Text>
                      <Text style={styles.conversationTime}>
                        {formatTime(conversation.updated_at)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.conversationMessage,
                        conversation.unread_count > 0 && styles.unreadMessage,
                      ]}
                      numberOfLines={1}
                    >
                      {conversation.last_message || "No messages yet"}
                    </Text>
                    <Text style={styles.participantsText}>
                      {conversation.participants.length === 1 
                        ? conversation.participants[0]?.email ?? "Unknown Email"
                        : `${conversation.participants.length} participants`
                      }
                    </Text>
                  </View>

                  {conversation.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {conversation.unread_count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </CurvedBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  statusContainer: {
    alignItems: "center",
    marginTop: 5,
  },
  statusSubtitle: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  statusText: {
    marginTop: 5,
    fontSize: 14,
    color: "#999",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    backgroundColor: "#fff",
    marginTop: 10,
    margin: 15,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: "grey",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    fontStyle: "italic",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    padding: 8,
    borderRadius: 20,
    justifyContent: "center",
    marginBottom: 10,
    gap: 8,
  },
  statusIndicatorText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  conversationContainer: {
    flex: 1,
    backgroundColor: "rgba(250, 250, 250, 0.8)", 
    borderWidth: 1,
    margin: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 10,
    borderColor: "rgba(0, 0, 0, 0.1)",
    marginBottom: 100,
    marginTop: 5,
  },
  conversationList: {
    flex: 1,
    paddingHorizontal: 5,
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
    marginHorizontal: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingBottom: 10,
    paddingTop: 3,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    width: "100%",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 60,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#333",
  },
  conversationTime: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#000",
  },
  conversationMessage: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 2,
  },
  unreadMessage: {
    color: "#333",
    fontWeight: "500",
  },
  participantsText: {
    fontSize: 12,
    color: "#999",
  },
  unreadBadge: {
    backgroundColor: "#4CAF50",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  unreadCount: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  newMessageButton: {
    marginHorizontal: 40,
    marginTop: 10,
    marginBottom: 15,
    shadowColor: "grey",
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 0.75,
    shadowRadius: 2,
    elevation: 3,
  },
  newMessageButtonGradient: {
    width: "100%",
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  newMessageButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
});