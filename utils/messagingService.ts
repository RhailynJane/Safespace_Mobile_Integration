import { Platform } from 'react-native';

const getApiBaseUrl = (): string => {
  // Use environment variable if available
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Platform-specific localhost URLs
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return "http://10.0.2.2:3001";
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost directly
    return "http://localhost:3001";
  } else if (Platform.OS === 'web') {
    // Web can use localhost
    return "http://localhost:3001";
  }

  return "http://localhost:3001";
};

const API_BASE_URL = getApiBaseUrl();

export interface Conversation {
  id: string;
  title: string;
  conversation_type: 'direct' | 'group';
  updated_at: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  participants: Participant[];
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
  message_type: 'text' | 'image' | 'file';
  created_at: string;
  sender: Participant;
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

class MessagingService {
  // Use consistent conversation IDs
  private readonly mockConversations: Conversation[] = [
    {
      id: '1', // Simple numeric ID that matches the mock messages
      title: 'Eric Young',
      conversation_type: 'direct',
      updated_at: new Date().toISOString(),
      last_message: "I'm glad you're feeling okay now.",
      last_message_time: new Date(Date.now() - 30 * 60000).toISOString(),
      unread_count: 0,
      participants: [
        {
          id: 'user_2',
          clerk_user_id: 'user_2',
          first_name: 'Eric',
          last_name: 'Young',
          email: 'eric@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=Eric+Young&background=4CAF50&color=fff&size=60',
          online: true
        }
      ]
    },
    {
      id: '2', // Simple numeric ID that matches the mock messages
      title: 'Support Group',
      conversation_type: 'group',
      updated_at: new Date().toISOString(),
      last_message: 'Jenny: I found this article really helpful...',
      last_message_time: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
      unread_count: 3,
      participants: [
        {
          id: 'user_3',
          clerk_user_id: 'user_3',
          first_name: 'Jenny',
          last_name: 'Wilson',
          email: 'jenny@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=Jenny+Wilson&background=2196F3&color=fff&size=60',
          online: false
        },
        {
          id: 'user_4',
          clerk_user_id: 'user_4',
          first_name: 'Mike',
          last_name: 'Johnson',
          email: 'mike@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=FF9800&color=fff&size=60',
          online: true
        }
      ]
    },
    {
      id: '3', 
      title: 'Dr. Sarah Johnson',
      conversation_type: 'direct',
      updated_at: new Date().toISOString(),
      last_message: "Let's schedule our next appointment.",
      last_message_time: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      unread_count: 1,
      participants: [
        {
          id: 'user_5',
          clerk_user_id: 'user_5',
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=9C27B0&color=fff&size=60',
          online: false
        }
      ]
    }
  ];

  private readonly mockContacts: Contact[] = [
    {
      id: 'contact_1',
      clerk_user_id: 'user_2',
      first_name: 'Eric',
      last_name: 'Young',
      email: 'eric@example.com',
      profile_image_url: 'https://ui-avatars.com/api/?name=Eric+Young&background=4CAF50&color=fff&size=50',
      role: 'support_worker',
      online: true,
      has_existing_conversation: true
    },
    {
      id: 'contact_2',
      clerk_user_id: 'user_3',
      first_name: 'Jenny',
      last_name: 'Wilson',
      email: 'jenny@example.com',
      profile_image_url: 'https://ui-avatars.com/api/?name=Jenny+Wilson&background=2196F3&color=fff&size=50',
      role: 'client',
      online: false,
      has_existing_conversation: true
    },
    {
      id: 'contact_3',
      clerk_user_id: 'user_5',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah@example.com',
      profile_image_url: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=9C27B0&color=fff&size=50',
      role: 'therapist',
      online: false,
      has_existing_conversation: true
    },
    {
      id: 'contact_4',
      clerk_user_id: 'user_6',
      first_name: 'David',
      last_name: 'Chen',
      email: 'david@example.com',
      profile_image_url: 'https://ui-avatars.com/api/?name=David+Chen&background=F44336&color=fff&size=50',
      role: 'support_worker',
      online: true,
      has_existing_conversation: false
    },
    {
      id: 'contact_5',
      clerk_user_id: 'user_7',
      first_name: 'Maria',
      last_name: 'Garcia',
      email: 'maria@example.com',
      profile_image_url: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=607D8B&color=fff&size=50',
      role: 'client',
      online: false,
      has_existing_conversation: false
    }
  ];

  // Updated mock messages with consistent IDs (1, 2, 3)
  private readonly mockMessages: { [conversationId: string]: Message[] } = {
    '1': [ // Matches conversation ID '1'
      {
        id: 'msg_1_1',
        message_text: "Hi Eric, I scheduled an appointment with you for this month.",
        message_type: 'text',
        created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        sender: {
          id: 'current_user',
          clerk_user_id: 'current_user',
          first_name: 'You',
          last_name: '',
          email: 'you@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=You&background=666&color=fff&size=28',
          online: true
        }
      },
      {
        id: 'msg_1_2',
        message_text: "Hi there. Yes, I saw it. Let's talk then.",
        message_type: 'text',
        created_at: new Date(Date.now() - 60 * 60000).toISOString(),
        sender: {
          id: 'user_2',
          clerk_user_id: 'user_2',
          first_name: 'Eric',
          last_name: 'Young',
          email: 'eric@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=Eric+Young&background=4CAF50&color=fff&size=28',
          online: true
        }
      },
      {
        id: 'msg_1_3',
        message_text: "I'm glad you're feeling okay now.",
        message_type: 'text',
        created_at: new Date(Date.now() - 30 * 60000).toISOString(),
        sender: {
          id: 'user_2',
          clerk_user_id: 'user_2',
          first_name: 'Eric',
          last_name: 'Young',
          email: 'eric@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=Eric+Young&background=4CAF50&color=fff&size=28',
          online: true
        }
      }
    ],
    '2': [ // Matches conversation ID '2'
      {
        id: 'msg_2_1',
        message_text: "Jenny: I found this article really helpful for managing anxiety during stressful times.",
        message_type: 'text',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
        sender: {
          id: 'user_3',
          clerk_user_id: 'user_3',
          first_name: 'Jenny',
          last_name: 'Wilson',
          email: 'jenny@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=Jenny+Wilson&background=2196F3&color=fff&size=28',
          online: false
        }
      },
      {
        id: 'msg_2_2',
        message_text: "Mike: Thanks for sharing Jenny! This was exactly what I needed to read today.",
        message_type: 'text',
        created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
        sender: {
          id: 'user_4',
          clerk_user_id: 'user_4',
          first_name: 'Mike',
          last_name: 'Johnson',
          email: 'mike@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=FF9800&color=fff&size=28',
          online: true
        }
      },
      {
        id: 'msg_2_3',
        message_text: "Yes, I've been practicing the techniques daily and they really help!",
        message_type: 'text',
        created_at: new Date(Date.now() - 12 * 60 * 60000).toISOString(),
        sender: {
          id: 'current_user',
          clerk_user_id: 'current_user',
          first_name: 'You',
          last_name: '',
          email: 'you@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=You&background=666&color=fff&size=28',
          online: true
        }
      }
    ],
    '3': [ // Matches conversation ID '3'
      {
        id: 'msg_3_1',
        message_text: "Hi Dr. Johnson, I wanted to follow up on our last session.",
        message_type: 'text',
        created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
        sender: {
          id: 'current_user',
          clerk_user_id: 'current_user',
          first_name: 'You',
          last_name: '',
          email: 'you@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=You&background=666&color=fff&size=28',
          online: true
        }
      },
      {
        id: 'msg_3_2',
        message_text: "Hello! Yes, I've reviewed your progress. Let's schedule our next appointment.",
        message_type: 'text',
        created_at: new Date(Date.now() - 20 * 60 * 60000).toISOString(),
        sender: {
          id: 'user_5',
          clerk_user_id: 'user_5',
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah@example.com',
          profile_image_url: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=9C27B0&color=fff&size=28',
          online: false
        }
      }
    ]
  };

  // Get all conversations for a user
  async getConversations(clerkUserId: string): Promise<{ success: boolean; data: Conversation[] }> {
    console.log('Loading mock conversations for user:', clerkUserId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const conversations = this.mockConversations.map(conv => ({
      ...conv,
      updated_at: new Date().toISOString() // Always show as recent
    }));

    console.log(`Returning ${conversations.length} mock conversations with IDs:`, conversations.map(c => c.id));
    return {
      success: true,
      data: conversations
    };
  }

  // Get messages for a conversation - FIXED with better error handling
  async getMessages(conversationId: string, clerkUserId: string, page = 1): Promise<{ 
    success: boolean; 
    data: Message[];
    pagination: { page: number; limit: number; hasMore: boolean };
  }> {
    console.log('Loading messages for conversation ID:', conversationId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Check if conversation exists in our mock data
    const conversationExists = this.mockConversations.some(conv => conv.id === conversationId);
    if (!conversationExists) {
      console.log(`Conversation ${conversationId} not found in mock data. Available IDs:`, this.mockConversations.map(c => c.id));
      return {
        success: true,
        data: [],
        pagination: {
          page,
          limit: 50,
          hasMore: false
        }
      };
    }

    const messages = this.mockMessages[conversationId] || [];
    
    console.log(`Returning ${messages.length} messages for conversation ${conversationId}`);
    return {
      success: true,
      data: messages,
      pagination: {
        page,
        limit: 50,
        hasMore: false
      }
    };
  }

  // Send a message
  async sendMessage(conversationId: string, clerkUserId: string, messageData: {
    messageText: string;
    messageType?: 'text' | 'image' | 'file';
  }): Promise<{ success: boolean; data: Message }> {
    console.log('Sending message to conversation:', conversationId, messageData.messageText);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const newMessage: Message = {
      id: `msg_${conversationId}_${Date.now()}`,
      message_text: messageData.messageText,
      message_type: messageData.messageType || 'text',
      created_at: new Date().toISOString(),
      sender: {
        id: clerkUserId,
        clerk_user_id: clerkUserId,
        first_name: 'You',
        last_name: '',
        email: `${clerkUserId}@example.com`,
        profile_image_url: 'https://ui-avatars.com/api/?name=You&background=666&color=fff&size=28',
        online: true
      }
    };

    // Add to mock messages
    this.mockMessages[conversationId] ??= [];
    this.mockMessages[conversationId].push(newMessage);

    // Update conversation last message
    const conversation = this.mockConversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.last_message = messageData.messageText;
      conversation.last_message_time = new Date().toISOString();
      conversation.updated_at = new Date().toISOString();
    }

    console.log('Message sent successfully to conversation:', conversationId);
    return {
      success: true,
      data: newMessage
    };
  }

  // Create a new conversation
  async createConversation(clerkUserId: string, data: {
    participantIds: string[];
    conversationType: 'direct' | 'group';
    title?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId,
          ...data
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Create conversation failed:', error);
      throw error;
    }
  }

  // Get available contacts
  async getContacts(clerkUserId: string): Promise<{ success: boolean; data: Contact[] }> {
    console.log('Loading mock contacts for user:', clerkUserId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      data: this.mockContacts
    };
  }

  // Search contacts
  async searchContacts(clerkUserId: string, query: string): Promise<{ success: boolean; data: Contact[] }> {
    console.log('Searching contacts with query:', query);
    
    await new Promise(resolve => setTimeout(resolve, 300));

    const filteredContacts = this.mockContacts.filter(contact =>
      contact.first_name.toLowerCase().includes(query.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(query.toLowerCase()) ||
      contact.email.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      data: filteredContacts
    };
  }

  async searchUsers(clerkUserId: string, query: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/search-users/${clerkUserId}?q=${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error('Search users failed:', error);
      throw error;
    }
  }

  // Get a specific conversation by ID
  async getConversation(conversationId: string, clerkUserId: string): Promise<{ success: boolean; data: Conversation | null }> {
    console.log('Getting conversation by ID:', conversationId);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const conversation = this.mockConversations.find(conv => conv.id === conversationId);
    
    return {
      success: true,
      data: conversation || null
    };
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, clerkUserId: string): Promise<{ success: boolean }> {
    console.log('Marking messages as read for conversation:', conversationId);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const conversation = this.mockConversations.find(conv => conv.id === conversationId);
    if (conversation) {
      conversation.unread_count = 0;
    }
    
    return {
      success: true
    };
  }
}

export const messagingService = new MessagingService();