// utils/sendbirdService.ts
import activityApi from "./activityApi";
import { getApiBaseUrl } from './apiBaseUrl';

const API_BASE_URL = getApiBaseUrl();

// SendBird Configuration
const SENDBIRD_APP_ID = process.env.EXPO_PUBLIC_SENDBIRD_APP_ID;
const SENDBIRD_API_TOKEN = process.env.EXPO_PUBLIC_SENDBIRD_API_TOKEN;

// Type definitions
export type ConversationType = "direct" | "group";
export type MessageType = "text" | "image" | "file";

export interface Conversation {
  id: string;
  title: string;
  conversation_type: ConversationType;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  participants: Participant[];
  channel_url?: string;
}

export interface Participant {
  id: string;
  clerk_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url?: string;
  online: boolean;
  last_active_at: string | null;
}

export interface Message {
  id: string;
  message_text: string;
  message_type: MessageType;
  created_at: string;
  sender: Participant;
  message_id?: string;
}

export interface Contact {
  id: string;
  clerk_user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_image_url: string;
  role: string;
  online: boolean;
  has_existing_conversation: boolean;
  last_active_at?: string | null;
  city?: string;
  state?: string;
}

// SendBird Service
class SendBirdService {
  private appId: string | null = null;
  private userId: string | null = null;
  private accessToken: string | null = null;

  public getUserId(): string | null {
    return this.userId;
  }

  async initialize(userId: string, accessToken?: string): Promise<boolean> {
    try {
      if (!SENDBIRD_APP_ID) {
        console.log("SendBird App ID not configured");
        return false;
      }

      this.appId = SENDBIRD_APP_ID;
      this.userId = userId;
      this.accessToken = accessToken || null;

      console.log("SendBird initialized for user:", userId);
      return true;
    } catch (error) {
      console.log("SendBird initialization failed:", error);
      return false;
    }
  }

  // SendBird API helper methods
  private async sendbirdApiRequest(
    endpoint: string,
    options: RequestInit = {}
  ) {
    if (!this.appId || !SENDBIRD_API_TOKEN) {
      throw new Error("SendBird not properly configured");
    }

    const baseUrl = `https://api-${this.appId}.sendbird.com/v3`;

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Api-Token": SENDBIRD_API_TOKEN,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `SendBird API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return response.json();
    } catch (error) {
      console.log("SendBird API request failed:", error);
      throw error;
    }
  }

  // Create or update SendBird user
  async createOrUpdateUser(userData: {
    user_id: string;
    nickname: string;
    profile_url?: string;
  }): Promise<{ success: boolean; data?: any }> {
    try {
      // Ensure profile_url is always provided to avoid 400105
      const safeProfileUrl =
        userData.profile_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.nickname || userData.user_id)}&background=666&color=fff&size=60`;

      const result = await this.sendbirdApiRequest("/users", {
        method: "POST",
        body: JSON.stringify({
          user_id: userData.user_id,
          nickname: userData.nickname,
          profile_url: safeProfileUrl,
          issue_access_token: true,
        }),
      });

      return { success: true, data: result };
    } catch (error) {
      console.log("Create/Update SendBird user failed:", error);
      return { success: false };
    }
  }

  // Create group channel (conversation)
  async createGroupChannel(
    userIds: string[],
    name?: string,
    isDistinct: boolean = true
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const result = await this.sendbirdApiRequest("/group_channels", {
        method: "POST",
        body: JSON.stringify({
          user_ids: userIds,
          name: name,
          is_distinct: isDistinct,
          operator_ids: userIds.slice(0, 1), // First user as operator
        }),
      });

      return { success: true, data: result };
    } catch (error) {
      console.log("Create group channel failed:", error);
      return { success: false };
    }
  }

  // Send message to channel
  async sendMessageToChannel(
    channelUrl: string,
    messageData: {
      message_type: string;
      user_id: string;
      message: string;
    }
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const result = await this.sendbirdApiRequest(
        `/group_channels/${channelUrl}/messages`,
        {
          method: "POST",
          body: JSON.stringify(messageData),
        }
      );

      return { success: true, data: result };
    } catch (error) {
      console.log("Send message failed:", error);
      return { success: false };
    }
  }

  // List user's group channels
  async listUserChannels(
    userId: string
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const result = await this.sendbirdApiRequest(
        `/users/${userId}/my_group_channels?limit=100`
      );

      return { success: true, data: result };
    } catch (error) {
      console.log("List user channels failed:", error);
      return { success: false };
    }
  }

  // List messages in channel
  async listChannelMessages(
    channelUrl: string,
    limit: number = 100
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const result = await this.sendbirdApiRequest(
        `/group_channels/${channelUrl}/messages?limit=${limit}&message_ts=0&order=asc`
      );

      return { success: true, data: result };
    } catch (error) {
      console.log("List channel messages failed:", error);
      return { success: false };
    }
  }

  // Mark messages as read
  async markAsRead(
    channelUrl: string,
    userId: string
  ): Promise<{ success: boolean }> {
    try {
      await this.sendbirdApiRequest(
        `/group_channels/${channelUrl}/messages/mark_as_read`,
        {
          method: "PUT",
          body: JSON.stringify({
            user_id: userId,
          }),
        }
      );

      return { success: true };
    } catch (error) {
      console.log("Mark as read failed:", error);
      return { success: false };
    }
  }

  // Search users in SendBird
  async searchSendBirdUsers(
    query: string
  ): Promise<{ success: boolean; data?: any }> {
    try {
      const result = await this.sendbirdApiRequest(
        `/users?nickname=${encodeURIComponent(query)}&limit=50`
      );

      return { success: true, data: result };
    } catch (error) {
      console.log("Search SendBird users failed:", error);
      return { success: false };
    }
  }
}

// Main Messaging Service - Hybrid Implementation (Your Backend + SendBird)
class MessagingService {
  private readonly sendbirdService: SendBirdService;
  private readonly useSendBird: boolean = false;
  private sendbirdInitialized: boolean = false;

  constructor() {
    this.sendbirdService = new SendBirdService();
    this.useSendBird =
      !!process.env.EXPO_PUBLIC_SENDBIRD_APP_ID &&
      !!process.env.EXPO_PUBLIC_SENDBIRD_API_TOKEN;
  }

  async initializeSendBird(
    userId: string,
    accessToken?: string,
    profileUrl?: string
  ): Promise<boolean> {
    if (!this.useSendBird) {
      console.log(
        "SendBird not configured - set EXPO_PUBLIC_SENDBIRD_APP_ID and EXPO_PUBLIC_SENDBIRD_API_TOKEN"
      );
      return false;
    }

    try {
      this.sendbirdInitialized = await this.sendbirdService.initialize(
        userId,
        accessToken
      );

      if (this.sendbirdInitialized) {
        // Create/update user in SendBird
        await this.sendbirdService.createOrUpdateUser({
          user_id: userId,
          nickname: `User ${userId}`, // You can customize this
          profile_url: profileUrl,
        });
      }

      console.log(
        "SendBird initialization:",
        this.sendbirdInitialized ? "success" : "failed"
      );
      return this.sendbirdInitialized;
    } catch (error) {
      console.log("SendBird initialization error");
      this.sendbirdInitialized = false;
      return false;
    }
  }

  async getConversations(
    userId: string
  ): Promise<{ success: boolean; data: Conversation[] }> {
    if (!this.sendbirdInitialized) {
      // Fallback to your backend
      return this.getConversationsFromBackend(userId);
    }

    try {
      const result = await this.sendbirdService.listUserChannels(userId);

      if (result.success && result.data) {
        const conversations: Conversation[] = result.data.channels.map(
          (channel: any) => ({
            id: channel.channel_url,
            title:
              channel.name || `Chat with ${channel.member_count - 1} users`,
            conversation_type: "group",
            updated_at: new Date(channel.created_at * 1000).toISOString(),
            last_message: channel.last_message?.message || "",
            last_message_time: channel.last_message?.created_at
              ? new Date(channel.last_message.created_at * 1000).toISOString()
              : "",
            unread_count: channel.unread_message_count || 0,
            participants:
              channel.members?.map((member: any) => ({
                id: member.user_id,
                clerk_user_id: member.user_id,
                first_name: member.nickname || member.user_id,
                last_name: "",
                email: `${member.user_id}@sendbird.com`,
                profile_image_url: member.profile_url,
                online: member.is_online || false,
              })) || [],
            channel_url: channel.channel_url,
          })
        );

        return { success: true, data: conversations };
      }

      // Fallback to backend if SendBird fails
      return this.getConversationsFromBackend(userId);
    } catch (error) {
      console.log("Get conversations from SendBird failed, using backend");
      return this.getConversationsFromBackend(userId);
    }
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page = 1
  ): Promise<{
    success: boolean;
    data: Message[];
    pagination: { page: number; limit: number; hasMore: boolean };
  }> {
    if (!this.sendbirdInitialized) {
      return this.getMessagesFromBackend(conversationId, userId, page);
    }

    try {
      const result = await this.sendbirdService.listChannelMessages(
        conversationId
      );

      if (result.success && result.data) {
        const messages: Message[] = result.data.messages.map((msg: any) => ({
          id: msg.message_id.toString(),
          message_text: msg.message || "File message",
          message_type: msg.type === "FILE" ? "file" : "text",
          created_at: new Date(msg.created_at * 1000).toISOString(),
          sender: {
            id: msg.user?.user_id || "unknown",
            clerk_user_id: msg.user?.user_id || "unknown",
            first_name: msg.user?.nickname || "User",
            last_name: "",
            email: `${msg.user?.user_id || "unknown"}@sendbird.com`,
            profile_image_url: msg.user?.profile_url,
            online: false,
          },
          message_id: msg.message_id,
        }));

        // Mark as read
        await this.sendbirdService.markAsRead(conversationId, userId);

        return {
          success: true,
          data: messages,
          pagination: { page, limit: 100, hasMore: false },
        };
      }

      return this.getMessagesFromBackend(conversationId, userId, page);
    } catch (error) {
      console.log("Get messages from SendBird failed, using backend");
      return this.getMessagesFromBackend(conversationId, userId, page);
    }
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    messageData: {
      messageText: string;
      messageType?: MessageType;
    }
  ): Promise<{ success: boolean; data: Message }> {
    if (!this.sendbirdInitialized) {
      return this.sendMessageToBackend(conversationId, userId, messageData);
    }

    try {
      const result = await this.sendbirdService.sendMessageToChannel(
        conversationId,
        {
          message_type: "MESG",
          user_id: userId,
          message: messageData.messageText,
        }
      );

      if (result.success && result.data) {
        const message: Message = {
          id: result.data.message_id.toString(),
          message_text: result.data.message,
          message_type: "text",
          created_at: new Date(result.data.created_at * 1000).toISOString(),
          sender: {
            id: userId,
            clerk_user_id: userId,
            first_name: "You",
            last_name: "",
            email: `${userId}@sendbird.com`,
            profile_image_url: undefined,
            online: false,
            last_active_at: null, // Add the missing property
          },
          message_id: result.data.message_id,
        };

        return { success: true, data: message };
      }

      throw new Error("Failed to send message via SendBird");
    } catch (error) {
      console.log("Send message via SendBird failed, using backend");
      return this.sendMessageToBackend(conversationId, userId, messageData);
    }
  }

  async createConversation(
    userId: string,
    data: {
      participantIds: string[];
      conversationType: ConversationType;
      title?: string;
    }
  ): Promise<{ success: boolean; data: any }> {
    // Always use backend for conversation creation to ensure we get a database ID
    // that works with all our endpoints. SendBird integration is optional.
    return this.createConversationInBackend(userId, data);
  }

  // Backend fallback methods
  private async getConversationsFromBackend(
    userId: string
  ): Promise<{ success: boolean; data: Conversation[] }> {
    try { await activityApi.heartbeat(userId); } catch (_e) { /* ignore */ }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${userId}`
      );

      if (!response.ok) throw new Error("Backend request failed");

      const result = await response.json();
      return { success: true, data: result.data || [] };
    } catch (error) {
      console.log("Backend fallback failed for getConversations");
      return { success: true, data: [] };
    }
  }

  private async getMessagesFromBackend(
  conversationId: string,
  userId: string,
  page = 1
): Promise<{
  success: boolean;
  data: Message[];
  pagination: { page: number; limit: number; hasMore: boolean };
}> {
  try { await activityApi.heartbeat(userId); } catch (_e) { /* ignore */ }
  try {
    console.log(`📨 Getting messages from backend for conversation ${conversationId}`);
    
    const response = await fetch(
      `${API_BASE_URL}/api/messages/conversations/${conversationId}/messages?clerkUserId=${userId}&page=${page}&limit=50`
    );

    if (!response.ok) {
      console.log(`📨 Backend request failed: ${response.status}`);
      throw new Error(`Backend request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      console.log(`📨 Backend returned error: ${result.message}`);
      throw new Error(result.message);
    }
    
    console.log(`📨 Successfully loaded ${result.data?.length || 0} messages from backend`);
    
    return {
      success: true,
      data: result.data || [],
      pagination: result.pagination || { page, limit: 50, hasMore: false },
    };
  } catch (error) {
    console.log("📨 Backend fallback failed for getMessages:", error);
    return {
      success: false,
      data: [],
      pagination: { page, limit: 50, hasMore: false },
    };
  }
}

  private async sendMessageToBackend(
    conversationId: string,
    userId: string,
    messageData: {
      messageText: string;
      messageType?: MessageType;
    }
  ): Promise<{ success: boolean; data: Message }> {
    try { await activityApi.heartbeat(userId); } catch (_e) { /* ignore */ }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: userId,
            messageText: messageData.messageText,
            messageType: messageData.messageType || "text",
          }),
        }
      );

      if (!response.ok) throw new Error("Backend request failed");

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.log("Backend fallback failed for sendMessage");
      return {
        success: false,
        data: this.createErrorResponse("Failed to send message"),
      };
    }
  }

  private async createConversationInBackend(
    userId: string,
    data: {
      participantIds: string[];
      conversationType: ConversationType;
      title?: string;
    }
  ): Promise<{ success: boolean; data: any }> {
    try { await activityApi.heartbeat(userId); } catch (_e) { /* ignore */ }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkUserId: userId,
            participantIds: data.participantIds,
            title: data.title,
            conversationType: data.conversationType,
          }),
        }
      );

      if (!response.ok) throw new Error("Backend request failed");

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (error) {
      console.log("Backend fallback failed for createConversation");
      return {
        success: true,
        data: { id: `conv_${Date.now()}`, channel_url: `conv_${Date.now()}` },
      };
    }
  }

  async getContacts(
    userId: string
  ): Promise<{ success: boolean; data: Contact[] }> {
    try { await activityApi.heartbeat(userId); } catch (_e) { /* ignore */ }
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/contacts/${userId}`
      );

      if (!response.ok) throw new Error("Backend request failed");

      const result = await response.json();
      return { success: true, data: result.data || [] };
    } catch (error) {
      console.log("Get contacts failed");
      return { success: true, data: [] };
    }
  }

  async searchUsers(
    userId: string,
    query: string
  ): Promise<{ success: boolean; data: Contact[] }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/search-users/${userId}?q=${encodeURIComponent(
          query
        )}`
      );

      if (!response.ok) throw new Error("Backend request failed");

      const result = await response.json();
      return { success: true, data: result.data || [] };
    } catch (error) {
      console.log("Search users failed");
      return { success: true, data: [] };
    }
  }

  async markAsRead(conversationId: string): Promise<{ success: boolean }> {
    if (!this.sendbirdInitialized) {
      return { success: false };
    }

    try {
      return await this.sendbirdService.markAsRead(
        conversationId,
        this.sendbirdService.getUserId() || ""
      );
    } catch (error) {
      console.log("Mark as read failed");
      return { success: false };
    }
  }

  isSendBirdEnabled(): boolean {
    return this.sendbirdInitialized;
  }

  private createErrorResponse(message: string): Message {
    return {
      id: "error",
      message_text: message,
      message_type: "text",
      created_at: new Date().toISOString(),
      sender: {
        id: "system",
        clerk_user_id: "system",
        first_name: "System",
        last_name: "",
        email: "system@sendbird.com",
        profile_image_url: undefined,
        online: false,
        last_active_at: null
      },
    };
  }
}



export const messagingService = new MessagingService();
