# Messages Module Frontend Documentation

## Overview

The Messages module provides a comprehensive messaging system for users to communicate with contacts, support groups, and healthcare providers. The module features real-time chat interfaces, contact management, and intuitive navigation.

## Component Architecture

### File Structure
```
messages/
├── index.tsx                 # Main messages list screen
├── new-message.tsx          # New message/contact selection screen
└── message-chat-screen.tsx  # Individual chat interface
```

## Core Components

### 1. MessagesScreen (`index.tsx`)
**Purpose**: Main messages dashboard displaying conversation list.

**Key Features**:
- Conversation list with online status indicators
- Search functionality for conversations
- Unread message badges
- New message creation button
- Side menu navigation

**State Management**:
```typescript
const [sideMenuVisible, setSideMenuVisible] = useState(false);
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState("messages");
const [searchQuery, setSearchQuery] = useState("");
```

### 2. NewMessageScreen (`new-message.tsx`)
**Purpose**: Contact selection screen for starting new conversations.

**Key Features**:
- Contact search and filtering
- Online status indicators
- Recent contacts section
- Clean contact list interface

### 3. ChatScreen (`message-chat-screen.tsx`)
**Purpose**: Real-time chat interface for individual conversations.

**Key Features**:
- Message threading with avatars
- Real-time message sending
- Keyboard-avoiding view
- Message timestamps
- Attachment options

**State Management**:
```typescript
const [messages, setMessages] = useState(conversationMessages[contactId] || []);
const [newMessage, setNewMessage] = useState("");
```

## Database Integration Guide

### PostgreSQL Schema Recommendations

#### Users Table (Extended for Messaging)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    avatar_url TEXT,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for online status and last seen
CREATE INDEX idx_users_online ON users(is_online, last_seen_at);
```

#### Conversations Table
```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) CHECK (type IN ('direct', 'group')) DEFAULT 'direct',
    name VARCHAR(255), -- For group chats
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation participants (for both direct and group chats)
CREATE TABLE conversation_participants (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) CHECK (role IN ('member', 'admin')) DEFAULT 'member',
    UNIQUE(conversation_id, user_id)
);

-- Index for participant lookup
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
```

#### Messages Table
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) CHECK (message_type IN ('text', 'image', 'file')) DEFAULT 'text',
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;
```

#### User Conversation Settings
```sql
CREATE TABLE user_conversation_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    is_muted BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    last_read_message_id INTEGER REFERENCES messages(id),
    notification_preferences JSONB DEFAULT '{"push": true, "email": false}',
    UNIQUE(user_id, conversation_id)
);
```

### API Endpoints Specification

#### Conversations Endpoints
```typescript
// GET /api/conversations - Get user's conversations
interface GetConversationsParams {
  page?: number;
  limit?: number;
  search?: string;
}

// POST /api/conversations - Create new conversation
interface CreateConversationRequest {
  participantIds: string[]; // UUIDs of other participants
  type: 'direct' | 'group';
  name?: string; // For group chats
}

// GET /api/conversations/:id - Get specific conversation details
```

#### Messages Endpoints
```typescript
// GET /api/conversations/:id/messages - Get conversation messages
interface GetMessagesParams {
  conversationId: number;
  before?: string; // For pagination (timestamp)
  limit?: number;
}

// POST /api/conversations/:id/messages - Send new message
interface SendMessageRequest {
  conversationId: number;
  content: string;
  messageType?: 'text' | 'image' | 'file';
  attachmentUrl?: string;
}

// PUT /api/messages/:id/read - Mark message as read
```

#### Contacts Endpoints
```typescript
// GET /api/contacts - Get user's contacts
interface GetContactsParams {
  search?: string;
  onlineOnly?: boolean;
}

// POST /api/contacts - Add new contact
interface AddContactRequest {
  targetUserId: string;
}
```

### Real-time Features Implementation

#### WebSocket Events
```typescript
// WebSocket event types for real-time messaging
interface WebSocketEvents {
  'message:new': {
    conversationId: number;
    message: Message;
  };
  'message:read': {
    conversationId: number;
    messageId: number;
    userId: string;
  };
  'user:online': {
    userId: string;
    isOnline: boolean;
  };
  'typing:start': {
    conversationId: number;
    userId: string;
  };
  'typing:stop': {
    conversationId: number;
    userId: string;
  };
}
```

#### WebSocket Service Integration
```typescript
// websocket.service.ts
class MessageWebSocketService {
  private ws: WebSocket | null = null;
  
  connect(userId: string, token: string) {
    this.ws = new WebSocket(`${WS_URL}?userId=${userId}&token=${token}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };
  }
  
  private handleMessage(data: WebSocketMessage) {
    switch (data.type) {
      case 'message:new':
        // Update conversation with new message
        break;
      case 'user:online':
        // Update user online status
        break;
      case 'typing:start':
        // Show typing indicator
        break;
    }
  }
  
  sendMessage(conversationId: number, content: string) {
    this.ws?.send(JSON.stringify({
      type: 'message:send',
      conversationId,
      content
    }));
  }
  
  startTyping(conversationId: number) {
    this.ws?.send(JSON.stringify({
      type: 'typing:start',
      conversationId
    }));
  }
}
```

### Data Flow Integration

#### 1. Authentication Context Integration
Replace mock user data with actual authentication:
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  return useContext(AuthContext);
};

// In components, replace mock data:
const { user, profile } = useAuth();
```

#### 2. API Service Layer
Create service functions for messaging operations:
```typescript
// services/conversationService.ts
export const conversationService = {
  getConversations: async (params: GetConversationsParams) => {
    const response = await api.get('/conversations', { params });
    return response.data;
  },
  
  getConversationMessages: async (conversationId: number, params?: GetMessagesParams) => {
    const response = await api.get(`/conversations/${conversationId}/messages`, { params });
    return response.data;
  },
  
  sendMessage: async (conversationId: number, messageData: SendMessageRequest) => {
    const response = await api.post(`/conversations/${conversationId}/messages`, messageData);
    return response.data;
  },
  
  markAsRead: async (messageId: number) => {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  }
};
```

#### 3. State Management with Real Data
Update components to use real data from API:
```typescript
// In MessagesScreen component
const [conversations, setConversations] = useState<Conversation[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadConversations();
}, [searchQuery]);

const loadConversations = async () => {
  try {
    const conversationsData = await conversationService.getConversations({
      search: searchQuery || undefined
    });
    setConversations(conversationsData);
  } catch (error) {
    console.error('Failed to load conversations:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 4. Chat Screen with Real-time Updates
```typescript
// In ChatScreen component
useEffect(() => {
  loadMessages();
  setupWebSocket();
  
  return () => {
    // Cleanup WebSocket connection
  };
}, [contactId]);

const setupWebSocket = () => {
  const wsService = new MessageWebSocketService();
  wsService.connect(user.id, token);
  
  wsService.on('message:new', (data) => {
    if (data.conversationId === parseInt(contactId)) {
      setMessages(prev => [...prev, data.message]);
    }
  });
};
```

### Advanced Features Implementation

#### 1. Message Status Indicators
```sql
-- Extended messages table for delivery status
ALTER TABLE messages ADD COLUMN delivery_status VARCHAR(20) 
CHECK (delivery_status IN ('sent', 'delivered', 'read')) DEFAULT 'sent';

-- Update status when message is delivered/read
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true THEN
    NEW.delivery_status = 'read';
  ELSIF NEW.delivery_status = 'sent' THEN
    NEW.delivery_status = 'delivered';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_status_trigger
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_message_status();
```

#### 2. Typing Indicators
```typescript
// Typing indicators table
CREATE TABLE typing_indicators (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_typing BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

// Frontend implementation
const [isTyping, setIsTyping] = useState(false);
const typingTimeoutRef = useRef<NodeJS.Timeout>();

const handleTextChange = (text: string) => {
  setNewMessage(text);
  
  if (!isTyping) {
    wsService.startTyping(conversationId);
    setIsTyping(true);
  }
  
  clearTimeout(typingTimeoutRef.current);
  typingTimeoutRef.current = setTimeout(() => {
    wsService.stopTyping(conversationId);
    setIsTyping(false);
  }, 1000);
};
```

#### 3. Message Search and Filtering
```sql
-- Full-text search setup for messages
ALTER TABLE messages ADD COLUMN search_vector tsvector;
UPDATE messages SET search_vector = to_tsvector('english', content);
CREATE INDEX idx_messages_search ON messages USING gin(search_vector);

-- Search function
CREATE OR REPLACE FUNCTION search_messages(query TEXT, conversation_id INTEGER)
RETURNS TABLE(id INTEGER, content TEXT, rank REAL) AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.content, ts_rank(m.search_vector, plainto_tsquery('english', query)) as rank
  FROM messages m
  WHERE m.conversation_id = search_messages.conversation_id
    AND m.search_vector @@ plainto_tsquery('english', query)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Partitioning for large message tables
CREATE TABLE messages_2024 PARTITION OF messages 
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Connection pooling configuration
-- Consider using PgBouncer for connection pooling
```

#### 2. Frontend Optimization
```typescript
// Virtual scrolling for large message lists
import { FlashList } from '@shopify/flash-list';

const MessageList = ({ messages }) => (
  <FlashList
    data={messages}
    renderItem={({ item }) => <MessageItem message={item} />}
    estimatedItemSize={100}
    inverted // For chat-like reverse scrolling
  />
);

// Message caching strategy
const messageCache = new Map();
const getCachedMessages = (conversationId: number) => {
  if (messageCache.has(conversationId)) {
    return messageCache.get(conversationId);
  }
  // Fetch from API and cache
};
```

### Security Considerations

#### 1. Message Validation
```typescript
// Content validation service
export const messageValidation = {
  validateContent: (content: string) => {
    if (content.trim().length === 0) {
      throw new Error('Message content cannot be empty');
    }
    
    if (content.length > 5000) {
      throw new Error('Message too long');
    }
    
    // Sanitize content to prevent XSS
    return DOMPurify.sanitize(content);
  },
  
  checkRateLimit: (userId: string) => {
    // Implement rate limiting per user
    const messageCount = getMessageCountLastMinute(userId);
    if (messageCount > 60) {
      throw new Error('Rate limit exceeded');
    }
  }
};
```

#### 2. Privacy and Access Control
```sql
-- Row-level security for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversation_access_policy ON conversations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = id 
    AND cp.user_id = current_user_id()
  )
);
```