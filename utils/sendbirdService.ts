import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'android') {
    return "http://10.0.2.2:3001";
  } else if (Platform.OS === 'ios') {
    return "http://localhost:3001";
  } else if (Platform.OS === 'web') {
    return "http://localhost:3001";
  }

  return "http://localhost:3001";
};

const API_BASE_URL = getApiBaseUrl();

// SendBird Configuration
const SENDBIRD_APP_ID = process.env.EXPO_PUBLIC_SENDBIRD_APP_ID;
const SENDBIRD_API_TOKEN = process.env.EXPO_PUBLIC_SENDBIRD_API_TOKEN;

// Type definitions
export type ConversationType = 'direct' | 'group';
export type MessageType = 'text' | 'image' | 'file';

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
  city?: string;
  state?: string;
}

// SendBird Service
class SendBirdService {
  private appId: string | null = null;
  private userId: string | null = null;
  private accessToken: string | null = null;
  private readonly sendbird: any = null;

  async initialize(userId: string, accessToken?: string): Promise<boolean> {
    try {
      if (!SENDBIRD_APP_ID) {
        console.log('SendBird App ID not configured');
        return false;
      }

      this.appId = SENDBIRD_APP_ID;
      this.userId = userId;
      this.accessToken = accessToken || null;

      console.log('SendBird initialized for user:', userId);
      return true;
    } catch (error) {
      console.log('SendBird initialization failed:', error);
      return false;
    }
  }

  // SendBird API helper methods
  private async sendbirdApiRequest(endpoint: string, options: RequestInit = {}) {
    if (!this.appId) {
      throw new Error('SendBird not initialized');
    }

    const baseUrl = `https://api-${this.appId}.sendbird.com/v3`;
    
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Api-Token': SENDBIRD_API_TOKEN || '',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`SendBird API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.log('SendBird API request failed:', error);
      throw error;
    }
  }

  async getConversations(): Promise<{ success: boolean; data: Conversation[] }> {
    if (!this.userId) {
      return { success: false, data: [] };
    }

    try {
      // Get user's group channels
      const response = await this.sendbirdApiRequest(`/users/${this.userId}/my_group_channels?limit=100`);
      
      if (!response.channels || response.channels.length === 0) {
        return { success: true, data: [] };
      }

      const conversationsPromises = response.channels.map(async (channel: any) => ({
        id: channel.channel_url,
        title: channel.name || this.getChannelTitle(channel),
        conversation_type: channel.member_count > 2 ? 'group' : 'direct',
        updated_at: new Date(channel.last_message?.created_at || channel.created_at).toISOString(),
        last_message: channel.last_message?.message || 'No messages yet',
        last_message_time: new Date(channel.last_message?.created_at || channel.created_at).toISOString(),
        unread_count: channel.unread_message_count || 0,
        participants: await this.getChannelParticipants(channel),
        channel_url: channel.channel_url,
      }));

      const conversations = await Promise.all(conversationsPromises);

      return {
        success: true,
        data: conversations,
      };
    } catch (error) {
      console.log('Get conversations - no conversations found or network issue');
      return { success: true, data: [] }; // Return empty array instead of error
    }
  }

  private getChannelTitle(channel: any): string {
    if (channel.name) return channel.name;
    
    // For direct messages, use participant names
    if (channel.members && channel.members.length > 0) {
      const otherMembers = channel.members.filter((member: any) => member.user_id !== this.userId);
      if (otherMembers.length > 0) {
        return otherMembers.map((member: any) => member.nickname || member.user_id).join(', ');
      }
    }
    
    return `Chat ${channel.channel_url}`;
  }

  private async getChannelParticipants(channel: any): Promise<Participant[]> {
    try {
      const members = channel.members || [];
      return members.map((member: any) => ({
        id: member.user_id,
        clerk_user_id: member.user_id,
        first_name: member.nickname?.split(' ')[0] || member.user_id,
        last_name: member.nickname?.split(' ').slice(1).join(' ') || '',
        email: member.metadata?.email || `${member.user_id}@sendbird.com`,
        profile_image_url: member.profile_url,
        online: member.connection_status === 'online',
      }));
    } catch (error) {
      console.log('Get channel participants error');
      return [];
    }
  }

  async getMessages(channelUrl: string, limit = 50): Promise<{ success: boolean; data: Message[] }> {
    if (!this.userId) {
      return { success: false, data: [] };
    }

    try {
      const response = await this.sendbirdApiRequest(`/group_channels/${channelUrl}/messages?message_ts=${Date.now()}&limit=${limit}&reverse=true`);
      
      if (!response.messages || response.messages.length === 0) {
        return { success: true, data: [] };
      }

      const messages: Message[] = response.messages.map((msg: any) => ({
        id: msg.message_id.toString(),
        message_text: msg.message,
        message_type: this.mapMessageType(msg.type, msg.data),
        created_at: new Date(msg.created_at).toISOString(),
        sender: {
          id: msg.user.user_id,
          clerk_user_id: msg.user.user_id,
          first_name: msg.user.nickname?.split(' ')[0] || msg.user.user_id,
          last_name: msg.user.nickname?.split(' ').slice(1).join(' ') || '',
          email: msg.user.metadata?.email || `${msg.user.user_id}@sendbird.com`,
          profile_image_url: msg.user.profile_url,
          online: msg.user.connection_status === 'online',
        },
        message_id: msg.message_id,
      }));

      // Use toReversed instead of reverse() to avoid mutation
      const reversedMessages = messages.toReversed();

      return {
        success: true,
        data: reversedMessages,
      };
    } catch (error) {
      console.log('Get messages - no messages found or network issue');
      return { success: true, data: [] }; // Return empty array instead of error
    }
  }

  async sendMessage(channelUrl: string, messageText: string): Promise<{ success: boolean; data: Message }> {
    if (!this.userId) {
      return { success: false, data: this.createErrorResponse('User not authenticated') };
    }

    try {
      const response = await this.sendbirdApiRequest(`/group_channels/${channelUrl}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message_type: 'MESG',
          user_id: this.userId,
          message: messageText,
        }),
      });

      return {
        success: true,
        data: {
          id: response.message_id.toString(),
          message_text: messageText,
          message_type: 'text',
          created_at: new Date(response.created_at).toISOString(),
          sender: {
            id: this.userId,
            clerk_user_id: this.userId,
            first_name: 'You',
            last_name: '',
            email: `${this.userId}@sendbird.com`,
            profile_image_url: undefined,
            online: true,
          },
          message_id: response.message_id,
        },
      };
    } catch (error) {
      console.log('Send message failed:', error);
      return { success: false, data: this.createErrorResponse('Failed to send message') };
    }
  }

  async createDirectMessage(userIds: string[]): Promise<{ success: boolean; data: any }> {
    if (!this.userId) {
      return { success: false, data: null };
    }

    try {
      // Include current user in the channel
      const allUserIds = [this.userId, ...userIds];
      
      const response = await this.sendbirdApiRequest('/group_channels', {
        method: 'POST',
        body: JSON.stringify({
          user_ids: allUserIds,
          is_distinct: true, // Create distinct channel for the same users
          operator_ids: [this.userId],
        }),
      });

      return {
        success: true,
        data: {
          id: response.channel_url,
          channel_url: response.channel_url,
        },
      };
    } catch (error) {
      console.log('Create direct message failed:', error);
      return { success: false, data: null };
    }
  }

  async createGroupChannel(userIds: string[], name: string): Promise<{ success: boolean; data: any }> {
    if (!this.userId) {
      return { success: false, data: null };
    }

    try {
      const allUserIds = [this.userId, ...userIds];
      
      const response = await this.sendbirdApiRequest('/group_channels', {
        method: 'POST',
        body: JSON.stringify({
          user_ids: allUserIds,
          name: name,
          is_distinct: false,
          operator_ids: [this.userId],
        }),
      });

      return {
        success: true,
        data: {
          id: response.channel_url,
          channel_url: response.channel_url,
        },
      };
    } catch (error) {
      console.log('Create group channel failed:', error);
      return { success: false, data: null };
    }
  }

  async searchUsers(query: string): Promise<{ success: boolean; data: any[] }> {
    if (!this.userId) {
      return { success: false, data: [] };
    }

    try {
      const response = await this.sendbirdApiRequest(`/users?limit=50&nickname=${encodeURIComponent(query)}`);
      
      if (!response.users || response.users.length === 0) {
        return { success: true, data: [] };
      }

      const users = response.users.map((user: any) => ({
        id: user.user_id,
        clerk_user_id: user.user_id,
        first_name: user.nickname?.split(' ')[0] || user.user_id,
        last_name: user.nickname?.split(' ').slice(1).join(' ') || '',
        email: user.metadata?.email || `${user.user_id}@sendbird.com`,
        profile_image_url: user.profile_url,
        online: user.connection_status === 'online',
      }));

      return {
        success: true,
        data: users,
      };
    } catch (error) {
      console.log('Search users - no users found or network issue');
      return { success: true, data: [] };
    }
  }

  async markAsRead(channelUrl: string): Promise<{ success: boolean }> {
    if (!this.userId) {
      return { success: false };
    }

    try {
      await this.sendbirdApiRequest(`/group_channels/${channelUrl}/messages/mark_as_read`, {
        method: 'PUT',
        body: JSON.stringify({
          user_id: this.userId,
        }),
      });

      return { success: true };
    } catch (error) {
      console.log('Mark as read failed:', error);
      return { success: false };
    }
  }

  private mapMessageType(messageType: string, data: any): MessageType {
    switch (messageType) {
      case 'FILE':
        return data?.type?.includes('image') ? 'image' : 'file';
      case 'MESG':
      default:
        return 'text';
    }
  }

  private createErrorResponse(message: string): Message {
    return {
      id: 'error',
      message_text: message,
      message_type: 'text',
      created_at: new Date().toISOString(),
      sender: {
        id: 'system',
        clerk_user_id: 'system',
        first_name: 'System',
        last_name: '',
        email: 'system@sendbird.com',
        profile_image_url: undefined,
        online: false,
      },
    };
  }
}

// Main Messaging Service - SendBird Implementation
class MessagingService {
  private readonly sendbirdService: SendBirdService;
  private readonly useSendBird: boolean = false;
  private sendbirdInitialized: boolean = false;

  constructor() {
    this.sendbirdService = new SendBirdService();
    this.useSendBird = !!process.env.EXPO_PUBLIC_SENDBIRD_APP_ID;
  }

  async initializeSendBird(userId: string, accessToken?: string): Promise<boolean> {
    if (!this.useSendBird) {
      console.log('SendBird not configured - set EXPO_PUBLIC_SENDBIRD_APP_ID');
      return false;
    }

    try {
      this.sendbirdInitialized = await this.sendbirdService.initialize(userId, accessToken);
      console.log('SendBird initialization:', this.sendbirdInitialized ? 'success' : 'failed');
      return this.sendbirdInitialized;
    } catch (error) {
      console.log('SendBird initialization error');
      this.sendbirdInitialized = false;
      return false;
    }
  }

  async getConversations(userId: string): Promise<{ success: boolean; data: Conversation[] }> {
    if (!this.sendbirdInitialized) {
      return { success: false, data: [] };
    }

    try {
      const result = await this.sendbirdService.getConversations();
      return result;
    } catch (error) {
      console.log('Get conversations failed - no conversations available');
      return { success: true, data: [] }; // Return empty array instead of error
    }
  }

  async getMessages(conversationId: string, userId: string, page = 1): Promise<{ 
    success: boolean; 
    data: Message[];
    pagination: { page: number; limit: number; hasMore: boolean };
  }> {
    if (!this.sendbirdInitialized) {
      return { 
        success: false, 
        data: [],
        pagination: { page, limit: 50, hasMore: false }
      };
    }

    try {
      const result = await this.sendbirdService.getMessages(conversationId);
      return {
        ...result,
        pagination: { page, limit: 50, hasMore: false }
      };
    } catch (error) {
      console.log('Get messages failed - no messages available');
      return { 
        success: true, 
        data: [],
        pagination: { page, limit: 50, hasMore: false }
      };
    }
  }

  async sendMessage(conversationId: string, userId: string, messageData: {
    messageText: string;
    messageType?: MessageType;
  }): Promise<{ success: boolean; data: Message }> {
    if (!this.sendbirdInitialized) {
      return { 
        success: false, 
        data: this.createErrorResponse('SendBird not initialized')
      };
    }

    try {
      const result = await this.sendbirdService.sendMessage(conversationId, messageData.messageText);
      return result;
    } catch (error) {
      console.log('Send message failed');
      return { 
        success: false, 
        data: this.createErrorResponse('Failed to send message')
      };
    }
  }

  async createConversation(userId: string, data: {
    participantIds: string[];
    conversationType: ConversationType;
    title?: string;
  }): Promise<{ success: boolean; data: any }> {
    if (!this.sendbirdInitialized) {
      return { success: false, data: null };
    }

    try {
      if (data.conversationType === 'group' && data.title) {
        return await this.sendbirdService.createGroupChannel(data.participantIds, data.title);
      } else {
        return await this.sendbirdService.createDirectMessage(data.participantIds);
      }
    } catch (error) {
      console.log('Create conversation failed');
      return { success: false, data: null };
    }
  }

  async getContacts(userId: string): Promise<{ success: boolean; data: Contact[] }> {
    // SendBird doesn't have a direct contacts concept
    return { success: true, data: [] };
  }

  async searchUsers(userId: string, query: string): Promise<{ success: boolean; data: any[] }> {
    if (!this.sendbirdInitialized) {
      return { success: false, data: [] };
    }

    try {
      return await this.sendbirdService.searchUsers(query);
    } catch (error) {
      console.log('Search users failed');
      return { success: false, data: [] };
    }
  }

  async markAsRead(conversationId: string): Promise<{ success: boolean }> {
    if (!this.sendbirdInitialized) {
      return { success: false };
    }

    try {
      return await this.sendbirdService.markAsRead(conversationId);
    } catch (error) {
      console.log('Mark as read failed');
      return { success: false };
    }
  }

  isSendBirdEnabled(): boolean {
    return this.sendbirdInitialized;
  }

  private createErrorResponse(message: string): Message {
    return {
      id: 'error',
      message_text: message,
      message_type: 'text',
      created_at: new Date().toISOString(),
      sender: {
        id: 'system',
        clerk_user_id: 'system',
        first_name: 'System',
        last_name: '',
        email: 'system@sendbird.com',
        profile_image_url: undefined,
        online: false,
      },
    };
  }
}

export const messagingService = new MessagingService();