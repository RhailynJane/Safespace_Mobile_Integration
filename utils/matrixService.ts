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
const MATRIX_HOMESERVER_URL = process.env.EXPO_PUBLIC_MATRIX_HOMESERVER_URL || 'https://matrix.org';

// Type aliases
type ConversationType = 'direct' | 'group';
type MessageType = 'text' | 'image' | 'file';

export interface Conversation {
  id: string;
  title: string;
  conversation_type: ConversationType;
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  participants: Participant[];
  matrix_room_id?: string;
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
  matrix_event_id?: string;
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

// Matrix Protocol Service
class MatrixService {
  private accessToken: string | null = null;
  private userId: string | null = null;
  private readonly deviceId: string | null = null;

  async initialize(userId: string, accessToken?: string): Promise<boolean> {
    try {
      if (accessToken) {
        this.accessToken = accessToken;
        this.userId = userId;
        
        const valid = await this.verifyToken();
        if (valid) {
          await this.storeAccessToken(userId, accessToken);
          return true;
        }
      }
      
      const storedToken = await this.getStoredAccessToken(userId);
      if (storedToken) {
        this.accessToken = storedToken;
        this.userId = userId;
        const valid = await this.verifyToken();
        return valid;
      }
      
      return false;
    } catch (error) {
      console.error('Matrix initialization failed:', error);
      return false;
    }
  }

  private async verifyToken(): Promise<boolean> {
    if (!this.accessToken || !this.userId) return false;
    
    try {
      const response = await fetch(
        `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/account/whoami`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  async getConversations(): Promise<{ success: boolean; data: Conversation[] }> {
    if (!this.accessToken) {
      return { success: false, data: [] };
    }

    try {
      const response = await fetch(
        `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/joined_rooms`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get rooms: ${response.status}`);
      }

      const data = await response.json();
      const rooms: string[] = data.joined_rooms;

      const roomDetails = await Promise.all(
        rooms.map(async (roomId: string) => {
          return await this.getRoomDetails(roomId);
        })
      );

      return {
        success: true,
        data: roomDetails.filter((room): room is Conversation => room !== null),
      };
    } catch (error) {
      console.error('Get conversations error:', error);
      return { success: false, data: [] };
    }
  }

  private async getRoomDetails(roomId: string): Promise<Conversation | null> {
    try {
      const stateEvents = await this.fetchRoomStateEvents(roomId);
      if (!stateEvents) return this.createDefaultRoomDetails(roomId);

      const { name, members } = this.processStateEvents(stateEvents, roomId);

      const { last_message, last_message_time } = await this.fetchLastMessage(roomId);

      return {
        id: roomId,
        title: name,
        conversation_type: members.length > 2 ? 'group' : 'direct',
        updated_at: last_message_time,
        last_message: last_message,
        last_message_time: last_message_time,
        unread_count: 0,
        participants: members.filter(member => member.id !== this.userId),
        matrix_room_id: roomId,
      };
    } catch (error) {
      console.error('Get room details error:', error);
      return this.createDefaultRoomDetails(roomId);
    }
  }

  private async fetchRoomStateEvents(roomId: string): Promise<any[] | null> {
    try {
      const response = await fetch(
        `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/rooms/${roomId}/state`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Fetch room state events error:', error);
      return null;
    }
  }

  private processStateEvents(stateEvents: any[], roomId: string): { name: string; members: Participant[] } {
    let name = `Room ${roomId}`;
    const members: Participant[] = [];

    for (const event of stateEvents) {
      if (event.type === 'm.room.name' && event.content.name) {
        name = event.content.name;
      } else if (event.type === 'm.room.member' && event.content.membership === 'join') {
        members.push({
          id: event.state_key,
          clerk_user_id: event.state_key,
          first_name: event.content.displayname || this.extractDisplayName(event.state_key),
          last_name: '',
          email: `${event.state_key}@matrix.org`,
          profile_image_url: event.content.avatar_url,
          online: false,
        });
      }
    }

    return { name, members };
  }

  private async fetchLastMessage(roomId: string): Promise<{ last_message: string; last_message_time: string }> {
    try {
      const response = await fetch(
        `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/rooms/${roomId}/messages?dir=b&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const messagesData = await response.json();
        if (messagesData.chunk.length > 0) {
          const lastMsg = messagesData.chunk[0];
          if (lastMsg.type === 'm.room.message' && lastMsg.content.body) {
            return {
              last_message: lastMsg.content.body,
              last_message_time: new Date(lastMsg.origin_server_ts).toISOString(),
            };
          }
        }
      }
    } catch (error) {
      console.error('Fetch last message error:', error);
    }

    return {
      last_message: 'No messages yet',
      last_message_time: new Date().toISOString(),
    };
  }

  private createDefaultRoomDetails(roomId: string): Conversation {
    return {
      id: roomId,
      title: `Room ${roomId}`,
      conversation_type: 'direct',
      updated_at: new Date().toISOString(),
      last_message: 'No messages yet',
      last_message_time: new Date().toISOString(),
      unread_count: 0,
      participants: [],
      matrix_room_id: roomId,
    };
  }

  async getMessages(roomId: string, limit = 50): Promise<{ success: boolean; data: Message[] }> {
    if (!this.accessToken) {
      return { success: false, data: [] };
    }

    try {
      const response = await fetch(
        `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/rooms/${roomId}/messages?dir=b&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return { success: false, data: [] };
      }

      const data = await response.json();
      const messages = data.chunk
        .filter((event: any) => event.type === 'm.room.message')
        .map((event: any) => ({
          id: event.event_id,
          message_text: event.content.body || '',
          message_type: this.mapMessageType(event.content.msgtype),
          created_at: new Date(event.origin_server_ts).toISOString(),
          sender: {
            id: event.sender,
            clerk_user_id: event.sender,
            first_name: this.extractDisplayName(event.sender),
            last_name: '',
            email: `${event.sender}@matrix.org`,
            profile_image_url: event.content.avatar_url || undefined,
            online: false
          },
          matrix_event_id: event.event_id,
        }));

      return {
        success: true,
        data: messages.reverse(),
      };
    } catch (error) {
      console.error('Get messages error:', error);
      return { success: false, data: [] };
    }
  }

  async sendMessage(roomId: string, messageText: string): Promise<{ success: boolean; data: Message }> {
    if (!this.accessToken) {
      return { success: false, data: this.createErrorResponse() };
    }

    try {
      const txnId = Date.now().toString();
      
      const response = await fetch(
        `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/rooms/${roomId}/send/m.room.message/${txnId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            msgtype: 'm.text',
            body: messageText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          id: data.event_id,
          message_text: messageText,
          message_type: 'text',
          created_at: new Date().toISOString(),
          sender: {
            id: this.userId!,
            clerk_user_id: this.userId!,
            first_name: this.extractDisplayName(this.userId!),
            last_name: '',
            email: `${this.userId}@matrix.org`,
            profile_image_url: undefined,
            online: true
          },
          matrix_event_id: data.event_id,
        },
      };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, data: this.createErrorResponse() };
    }
  }

  async createDirectMessage(userIds: string[]): Promise<{ success: boolean; data: any }> {
    if (!this.accessToken) {
      return { success: false, data: null };
    }

    try {
      const response = await fetch(
        `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/createRoom`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            visibility: 'private',
            is_direct: true,
            invite: userIds,
            preset: 'trusted_private_chat',
            name: `Chat with ${userIds.join(', ')}`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create room: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          id: data.room_id,
          matrix_room_id: data.room_id,
        },
      };
    } catch (error) {
      console.error('Create room error:', error);
      return { success: false, data: null };
    }
  }

  async searchUsers(query: string): Promise<{ success: boolean; data: any[] }> {
    if (!this.accessToken) {
      return { success: false, data: [] };
    }

    try {
      const response = await fetch(
        `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/user_directory/search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            search_term: query,
            limit: 50,
          }),
        }
      );

      if (!response.ok) {
        return { success: true, data: [] };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.results || [],
      };
    } catch (error) {
      console.error('Search users error:', error);
      return { success: true, data: [] };
    }
  }

  private mapMessageType(msgtype: string): MessageType {
    switch (msgtype) {
      case 'm.image':
        return 'image';
      case 'm.file':
        return 'file';
      default:
        return 'text';
    }
  }

  private extractDisplayName(userId: string): string {
    const regex = /^@([^:]+):/;
    const match = regex.exec(userId);
    return match?.[1] || userId;
  }

  private createErrorResponse(): Message {
    return {
      id: 'error',
      message_text: 'Failed to send message',
      message_type: 'text',
      created_at: new Date().toISOString(),
      sender: {
        id: 'system',
        clerk_user_id: 'system',
        first_name: 'System',
        last_name: '',
        email: 'system@matrix.org',
        profile_image_url: undefined,
        online: false
      }
    };
  }

  private async storeAccessToken(userId: string, token: string): Promise<void> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem(`matrix_token_${userId}`, token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  private async getStoredAccessToken(userId: string): Promise<string | null> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      return await AsyncStorage.default.getItem(`matrix_token_${userId}`);
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }

  // Method to get user profile
  async getUserProfile(userId: string): Promise<{ success: boolean; data: Participant | null }> {
    if (!this.accessToken) {
      return { success: false, data: null };
    }

    try {
      const response = await fetch(
        `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/profile/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return { success: false, data: null };
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          id: userId,
          clerk_user_id: userId,
          first_name: data.displayname || this.extractDisplayName(userId),
          last_name: '',
          email: `${userId}@matrix.org`,
          profile_image_url: data.avatar_url,
          online: false
        }
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { success: false, data: null };
    }
  }

  // Method to leave a room
  async leaveRoom(roomId: string): Promise<{ success: boolean }> {
    if (!this.accessToken) {
      return { success: false };
    }

    try {
      const response = await fetch(
        `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/rooms/${roomId}/leave`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      return { success: response.ok };
    } catch (error) {
      console.error('Leave room error:', error);
      return { success: false };
    }
  }

  // Method to get room members
  async getRoomMembers(roomId: string): Promise<{ success: boolean; data: Participant[] }> {
    if (!this.accessToken) {
      return { success: false, data: [] };
    }

    try {
      const response = await fetch(
        `${MATRIX_HOMESERVER_URL}/_matrix/client/r0/rooms/${roomId}/members`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return { success: false, data: [] };
      }

      const data = await response.json();
      const members = data.chunk
        .filter((member: any) => member.content.membership === 'join')
        .map((member: any) => ({
          id: member.state_key,
          clerk_user_id: member.state_key,
          first_name: member.content.displayname || this.extractDisplayName(member.state_key),
          last_name: '',
          email: `${member.state_key}@matrix.org`,
          profile_image_url: member.content.avatar_url,
          online: false
        }));

      return { success: true, data: members };
    } catch (error) {
      console.error('Get room members error:', error);
      return { success: false, data: [] };
    }
  }
}

// Main Messaging Service - Pure Matrix Implementation
class MessagingService {
  private readonly matrixService: MatrixService;
  private readonly useMatrix: boolean = false;
  private matrixInitialized: boolean = false;

  constructor() {
    this.matrixService = new MatrixService();
    this.useMatrix = !!process.env.EXPO_PUBLIC_MATRIX_HOMESERVER_URL;
  }

  async initializeMatrix(userId: string, accessToken?: string): Promise<boolean> {
    if (!this.useMatrix) {
      console.log('Matrix not configured - set EXPO_PUBLIC_MATRIX_HOMESERVER_URL');
      return false;
    }

    try {
      this.matrixInitialized = await this.matrixService.initialize(userId, accessToken);
      console.log('Matrix initialization:', this.matrixInitialized ? 'success' : 'failed');
      return this.matrixInitialized;
    } catch (error) {
      console.error('Matrix initialization error:', error);
      this.matrixInitialized = false;
      return false;
    }
  }

  async getConversations(clerkUserId: string): Promise<{ success: boolean; data: Conversation[] }> {
    if (!this.matrixInitialized) {
      return { success: false, data: [] };
    }

    try {
      const result = await this.matrixService.getConversations();
      return result;
    } catch (error) {
      console.error('Matrix getConversations failed:', error);
      return { success: false, data: [] };
    }
  }

  async getMessages(conversationId: string, clerkUserId: string, page = 1): Promise<{ 
    success: boolean; 
    data: Message[];
    pagination: { page: number; limit: number; hasMore: boolean };
  }> {
    if (!this.matrixInitialized) {
      return { 
        success: false, 
        data: [],
        pagination: { page, limit: 50, hasMore: false }
      };
    }

    try {
      const result = await this.matrixService.getMessages(conversationId);
      return {
        ...result,
        pagination: { page, limit: 50, hasMore: false }
      };
    } catch (error) {
      console.error('Matrix getMessages failed:', error);
      return { 
        success: false, 
        data: [],
        pagination: { page, limit: 50, hasMore: false }
      };
    }
  }

  async sendMessage(conversationId: string, clerkUserId: string, messageData: {
    messageText: string;
    messageType?: MessageType;
  }): Promise<{ success: boolean; data: Message }> {
    if (!this.matrixInitialized) {
      return { 
        success: false, 
        data: this.createErrorResponse('Matrix not initialized')
      };
    }

    try {
      const result = await this.matrixService.sendMessage(conversationId, messageData.messageText);
      return result;
    } catch (error) {
      console.error('Matrix sendMessage failed:', error);
      return { 
        success: false, 
        data: this.createErrorResponse('Failed to send message')
      };
    }
  }

  async createConversation(clerkUserId: string, data: {
    participantIds: string[];
    conversationType: ConversationType;
    title?: string;
  }): Promise<{ success: boolean; data: any }> {
    if (!this.matrixInitialized) {
      return { success: false, data: null };
    }

    try {
      const matrixUserIds = data.participantIds.map(id => `@${id}:${new URL(MATRIX_HOMESERVER_URL).hostname}`);
      return await this.matrixService.createDirectMessage(matrixUserIds);
    } catch (error) {
      console.error('Matrix createConversation failed:', error);
      return { success: false, data: null };
    }
  }

  async getContacts(clerkUserId: string): Promise<{ success: boolean; data: Contact[] }> {
    // Matrix doesn't have a direct contacts concept
    // You would need to implement this based on your user directory
    return { success: true, data: [] };
  }

  async searchUsers(clerkUserId: string, query: string): Promise<{ success: boolean; data: any[] }> {
    if (!this.matrixInitialized) {
      return { success: false, data: [] };
    }

    try {
      return await this.matrixService.searchUsers(query);
    } catch (error) {
      console.error('Matrix search failed:', error);
      return { success: false, data: [] };
    }
  }

  async getUserProfile(userId: string): Promise<{ success: boolean; data: Participant | null }> {
    if (!this.matrixInitialized) {
      return { success: false, data: null };
    }

    try {
      return await this.matrixService.getUserProfile(userId);
    } catch (error) {
      console.error('Get user profile failed:', error);
      return { success: false, data: null };
    }
  }

  async leaveConversation(conversationId: string): Promise<{ success: boolean }> {
    if (!this.matrixInitialized) {
      return { success: false };
    }

    try {
      return await this.matrixService.leaveRoom(conversationId);
    } catch (error) {
      console.error('Leave conversation failed:', error);
      return { success: false };
    }
  }

  async getConversationMembers(conversationId: string): Promise<{ success: boolean; data: Participant[] }> {
    if (!this.matrixInitialized) {
      return { success: false, data: [] };
    }

    try {
      return await this.matrixService.getRoomMembers(conversationId);
    } catch (error) {
      console.error('Get conversation members failed:', error);
      return { success: false, data: [] };
    }
  }

  isMatrixEnabled(): boolean {
    return this.matrixInitialized;
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
        email: 'system@matrix.org',
        profile_image_url: undefined,
        online: false
      }
    };
  }
}

export const messagingService = new MessagingService();