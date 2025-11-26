# SafeSpace Backend Architecture

## Overview

SafeSpace is a mental health support platform built with a modern serverless architecture using **Convex** as the primary backend service. This document outlines the complete backend architecture, API structure, data flow, and connection processes.

## Architecture Stack

### Core Technologies
- **Backend Database & API**: [Convex](https://convex.dev) - Serverless backend-as-a-service
- **Authentication**: [Clerk](https://clerk.com) - User authentication and management
- **Frontend**: React Native with Expo
- **Real-time Communication**: Convex subscriptions (built-in WebSocket)
- **File Storage**: Convex File Storage
- **Video Calling**: Twilio Video SDK
- **Push Notifications**: Expo Push Notifications

### Legacy Components
- **Express.js Server**: Located in `/backend/` - Minimal server for specific integrations
  - Twilio video token generation
  - Push notification handling
  - External API integrations (quotes, affirmations)
  - **Note**: Main application logic has migrated to Convex

## Convex Backend Structure

### Database Schema (`convex/schema.ts`)

The Convex schema defines 20+ tables covering all application features:

#### **Core User Management**
```typescript
users: {
  clerkId: string,
  email: string,
  firstName: string,
  lastName: string,
  imageUrl: string,
  orgId: string, // Organization scoping
  // ... additional profile fields
}

profiles: {
  clerkId: string,
  // Extended demographic data (CMHA requirements)
  dateOfBirth, gender, pronouns, isLGBTQ,
  primaryLanguage, mentalHealthConcerns,
  ethnoculturalBackground, canadaStatus,
  // Emergency contacts
  emergencyContactName, emergencyContactPhone,
  // User preferences and settings
  preferences: { darkMode, notifications, reminders, ... }
}
```

#### **Real-time Messaging**
```typescript
conversations: { title, createdBy, participantKey }
conversationParticipants: { conversationId, userId, lastReadAt }
messages: { conversationId, senderId, body, attachmentUrl, storageId }
```

#### **Community Features**
```typescript
communityPosts: { authorId, title, content, category, mood, imageUrls }
postReactions: { postId, userId, emoji }
postBookmarks: { postId, userId }
```

#### **Mental Health Tracking**
```typescript
moods: { userId, moodType, intensity, factors, notes }
journalEntries: { clerkId, title, content, emotionType, tags }
assessments: { userId, assessmentType, responses, totalScore }
```

#### **Healthcare Services**
```typescript
appointments: { userId, supportWorker, date, time, type, status, meetingLink }
supportWorkers: { name, specialization, bio, hourlyRate }
videoCallSessions: { appointmentId, sessionStatus, duration, qualityIssues }
```

### Convex Functions Structure

#### **Queries** (Data Retrieval)
- `users.ts` - User profile and authentication queries
- `conversations.ts` - Message and conversation retrieval
- `posts.ts` - Community forum posts and reactions
- `moods.ts` - Mood history and statistics
- `appointments.ts` - Appointment scheduling and management
- `resources.ts` - Mental health resources and bookmarks

#### **Mutations** (Data Modification)
- User registration and profile updates
- Message sending and conversation management
- Post creation, reactions, and bookmarking
- Mood logging and journal entries
- Appointment booking and modifications
- Settings and preference updates

#### **Actions** (External Integration)
- File upload handling via Convex Storage
- Push notification sending
- External API calls (crisis resources, content)
- Email notifications and webhooks

## API Connection Process

### 1. **Client Authentication Flow**
```typescript
// 1. User authenticates via Clerk
const { user } = useUser(); // Clerk hook

// 2. Convex client automatically gets auth token
const convex = useConvex();

// 3. All queries/mutations include user context
const userProfile = useQuery(api.users.getCurrentUser);
```

### 2. **Data Flow Architecture**
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   React Native  │────│    Clerk     │────│     Convex      │
│   (Frontend)    │    │   (Auth)     │    │   (Backend)     │
└─────────────────┘    └──────────────┘    └─────────────────┘
         │                                           │
         └─────────────── WebSocket ─────────────────┘
              (Real-time subscriptions)
```

### 3. **Real-time Data Synchronization**
```typescript
// Automatic real-time updates via Convex subscriptions
const messages = useQuery(api.conversations.getMessages, { 
  conversationId 
}); // Updates automatically when new messages arrive

const onlineUsers = useQuery(api.presence.getOnlineUsers);
// Real-time presence tracking
```

## Key Features & Implementation

### **Real-time Messaging**
- **Connection**: WebSocket via Convex subscriptions
- **File Sharing**: Convex Storage integration
- **Presence Tracking**: Live user status updates
- **Read Receipts**: Tracked via `lastReadAt` timestamps

### **Community Forum**
- **Post Management**: Create, edit, delete with draft support
- **Reactions**: Emoji-based reactions with real-time updates
- **Bookmarking**: Save favorite posts
- **Categories**: Organized content (Stress, Support, Stories, etc.)

### **Mental Health Tracking**
- **Mood Logging**: 5-point scale with factors and notes
- **Journaling**: Template-based entries with emotion tracking
- **Assessments**: Standardized mental health questionnaires
- **Progress Analytics**: Historical data visualization

### **Healthcare Integration**
- **Appointment Booking**: Conflict detection and confirmation
- **Video Consultations**: Twilio integration for secure calls
- **Support Worker Profiles**: Specializations and availability
- **Session Analytics**: Call quality and duration tracking

### **Notification System**
```typescript
// Multi-channel notifications
notifications: {
  type: 'message' | 'appointment' | 'reminder' | 'system',
  title: string,
  message: string,
  isRead: boolean
}

// Granular user preferences
settings: {
  notifMessages: boolean,
  notifAppointments: boolean,
  moodReminderEnabled: boolean,
  // ... per-category toggles
}
```

## Security & Privacy

### **Authentication & Authorization**
- **Clerk Integration**: Secure user authentication
- **Row-level Security**: Convex functions enforce user-specific data access
- **Organization Scoping**: Multi-tenant data isolation via `orgId`

### **Data Protection**
- **HIPAA Compliance**: Secure handling of mental health data
- **Encryption**: All data encrypted at rest and in transit
- **Access Control**: Function-level permission checks

### **Privacy Features**
- **Anonymous Options**: Community posts can be anonymous
- **Data Sharing Controls**: Users control what's shared with support workers
- **Audit Trail**: Activity logging for healthcare compliance

## Development & Deployment

### **Local Development Setup**
```bash
# Install dependencies
npm install

# Start Convex development server
npx convex dev

# Run Expo development server
npm start
```

### **Environment Configuration**
```typescript
// Required environment variables
CONVEX_DEPLOYMENT=dev:project-name
EXPO_PUBLIC_CONVEX_URL=https://project.convex.cloud
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

// Optional integrations
TWILIO_ACCOUNT_SID=AC...
TWILIO_API_KEY=SK...
```

### **Deployment Process**
1. **Convex Backend**: Deploy via `npx convex deploy --prod`
2. **Schema Migrations**: Automatic via Convex migration system
3. **Frontend**: EAS Build for app store deployment
4. **Environment Promotion**: Separate dev/staging/prod environments

## Performance & Scalability

### **Convex Advantages**
- **Serverless Scaling**: Automatic scaling based on usage
- **Global Edge Network**: Low-latency data access worldwide
- **Real-time by Default**: WebSocket subscriptions built-in
- **ACID Transactions**: Consistent data operations
- **Optimistic Updates**: Instant UI feedback with conflict resolution

### **Optimization Strategies**
- **Query Indexing**: Strategic database indexes for fast queries
- **Data Pagination**: Efficient large dataset handling
- **Caching**: Convex automatic query result caching
- **File Optimization**: Image compression and CDN delivery

## Monitoring & Analytics

### **Application Monitoring**
- **Convex Dashboard**: Real-time function performance metrics
- **Error Tracking**: Automatic error logging and alerts
- **User Analytics**: Activity tracking and engagement metrics
- **Health Monitoring**: System status and uptime tracking

### **Mental Health Metrics**
- **Usage Analytics**: Feature adoption and engagement
- **Outcome Tracking**: Mood trends and assessment scores
- **Support Metrics**: Response times and satisfaction rates
- **Crisis Prevention**: Early warning system integration

## Integration Points

### **External Services**
- **Clerk**: User authentication and profile management
- **Twilio**: Video calling infrastructure
- **Expo**: Push notifications and app deployment
- **Crisis Hotlines**: Emergency support integrations

### **API Endpoints** (Legacy Express Server)
```
POST /api/twilio/token          # Generate video call tokens
POST /api/push/register         # Register push notification tokens
GET  /api/external/quote        # Fetch inspirational quotes
GET  /api/external/affirmation  # Fetch daily affirmations
```

## Future Considerations

### **Planned Enhancements**
- **AI Integration**: Mental health insights and recommendations
- **Telehealth Expansion**: Prescription and treatment tracking
- **Multi-language Support**: Internationalization framework
- **Offline Support**: Local data synchronization
- **Advanced Analytics**: Predictive mental health modeling

### **Migration Strategy**
- **Legacy API Deprecation**: Gradual migration from Express to Convex
- **Data Migration**: Automated tools for schema updates
- **Feature Flags**: Controlled rollout of new functionality
- **Backward Compatibility**: Maintaining API contracts during transitions

---

This architecture provides a robust, scalable, and secure foundation for mental health support services while maintaining real-time responsiveness and user privacy.