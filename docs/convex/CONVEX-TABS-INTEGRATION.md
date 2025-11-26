# Convex Integration Across All Tabs

## Overview

This document provides a comprehensive guide to Convex integration across all main tab screens in the SafeSpace app. Each tab now has real-time capabilities powered by Convex while maintaining backward compatibility with REST APIs.

## Architecture

### Dual-Mode Integration Pattern
All tabs follow a consistent pattern:
1. **Convex-First**: Attempt to use Convex when `EXPO_PUBLIC_CONVEX_URL` is configured
2. **Graceful Fallback**: Fall back to REST API if Convex is unavailable
3. **Non-Blocking**: Never block user interactions due to Convex failures
4. **Optimistic Updates**: Update UI immediately for better UX

### Configuration
```env
# .env file
EXPO_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
```

## Tab-by-Tab Integration

### 1. Home Tab (`app/(app)/(tabs)/home.tsx`)

**Status**: ✅ Integrated

**Convex Features**:
- Real-time mood entry sync
- Live activity tracking
- Presence-aware user status
- Resource recommendations

**Convex Functions Used**:
- `moods.getRecentMoods` - Fetch user's recent mood entries
- `moods.getMoodStats` - Get mood distribution and trends
- `presence.heartbeat` - Update user online status
- `activities.recordActivity` - Track user interactions

**Hook**: `useConvexMoods(userId, convexClient)`

**Example Usage**:
```typescript
import { useConvexMoods } from '../../../utils/hooks/useConvexMoods';

// In component
const { moods, stats, recordMood } = useConvexMoods(user?.id, convexClient);

// Display recent moods
{moods.map(mood => (
  <MoodCard key={mood.id} mood={mood} />
))}

// Record new mood
await recordMood({
  moodType: 'happy',
  moodEmoji: '😊',
  moodLabel: 'Happy',
  notes: 'Great day!'
});
```

**Data Flow**:
1. Component mounts → Load recent moods from Convex
2. User tracks mood → Mutation to Convex → Real-time update
3. Convex fails → Seamless fallback to REST API

---

### 2. Community Forum Tab (`app/(app)/(tabs)/community-forum/index.tsx`)

**Status**: 🔄 Partially Integrated

**Already Integrated**:
- ✅ Trending feed via `posts.list`
- ✅ My Posts via `posts.myPosts`
- ✅ Reactions via `posts.react` and `posts.listReactions`

**Pending**:
- ⏳ Full CRUD operations (create, edit, delete)
- ⏳ Categories management
- ⏳ Bookmarks system

**Convex Functions Used**:
- `posts.list` - Fetch trending community posts
- `posts.myPosts` - Get user's posts including drafts
- `posts.react` - Add emoji reactions to posts
- `posts.listReactions` - Get all reactions for a post

**Implementation**:
```typescript
// Already integrated in community-forum/index.tsx
if (convexClient && selectedCategory === "Trending") {
  const { api } = await import("../../../../convex/_generated/api");
  const items = await convexClient.query(api.posts.list, { limit: 20 });
  // Map and display posts
}
```

**Next Steps**:
1. Complete `posts.create`, `posts.update`, `posts.delete` mutations
2. Add categories to schema and queries
3. Implement bookmarks with Convex

---

### 3. Appointments Tab (`app/(app)/(tabs)/appointments/index.tsx`)

**Status**: ⏳ Ready for Integration

**Convex Features to Add**:
- Real-time appointment updates
- Status change notifications
- Appointment statistics
- Next appointment tracking

**Convex Schema**:
```typescript
appointments: defineTable({
  userId: v.string(),
  supportWorker: v.string(),
  date: v.string(),
  time: v.string(),
  type: v.string(), // 'Video' | 'In-Person' | 'Phone'
  status: v.string(), // 'upcoming' | 'past' | 'cancelled'
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

**Available Functions** (`convex/appointments.ts`):
- `getUserAppointments(userId)` - Get all user appointments
- `getUpcomingAppointments(userId, limit)` - Get upcoming appointments
- `getAppointmentStats(userId)` - Get statistics (upcoming, completed, cancelled)
- `createAppointment(...)` - Create new appointment
- `updateAppointmentStatus(appointmentId, status)` - Change status
- `deleteAppointment(appointmentId)` - Delete appointment

**Integration Example**:
```typescript
// In appointments/index.tsx
import { ConvexReactClient } from 'convex/react';

const [convexClient, setConvexClient] = useState<ConvexReactClient | null>(null);

useEffect(() => {
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
  if (isAbsoluteHttpUrl(convexUrl)) {
    const client = new ConvexReactClient(convexUrl!);
    client.setAuth(async () => {
      const token = await (getToken?.() ?? Promise.resolve(undefined));
      return token ?? undefined;
    });
    setConvexClient(client);
  }
}, [isSignedIn]);

// Fetch appointments
const fetchAppointments = async () => {
  if (convexClient && user?.id) {
    try {
      const { api } = await import("../../../../convex/_generated/api");
      const stats = await convexClient.query(api.appointments.getAppointmentStats, {
        userId: user.id
      });
      setUpcomingCount(stats.upcomingCount);
      setCompletedCount(stats.completedCount);
      setNextAppointment(stats.nextAppointment);
    } catch (e) {
      // Fallback to REST API
    }
  }
};
```

---

### 4. Messages Tab (`app/(app)/(tabs)/messages/index.tsx`)

**Status**: ⏳ Ready for Integration

**Convex Features to Add**:
- Real-time message delivery
- Live conversation list updates
- Presence indicators
- Unread count tracking

**Convex Schema**:
```typescript
conversations: defineTable({
  title: v.optional(v.string()),
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})

conversationParticipants: defineTable({
  conversationId: v.id("conversations"),
  userId: v.string(),
  role: v.optional(v.string()),
  joinedAt: v.number(),
  lastReadAt: v.optional(v.number()),
})

messages: defineTable({
  conversationId: v.id("conversations"),
  senderId: v.string(),
  body: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

**Integration Strategy**:
1. Create `useConvexMessages` hook
2. Replace polling with Convex subscriptions
3. Use `convex.query` for initial load
4. Use `convex.mutation` for sending messages
5. Subscribe to conversation updates for real-time UI

**Hook Structure**:
```typescript
export function useConvexMessages(userId: string, convexClient: ConvexReactClient | null) {
  return {
    conversations: [], // Real-time conversation list
    loadConversations: async () => {},
    sendMessage: async (conversationId, body) => {},
    markAsRead: async (conversationId) => {},
    isUsingConvex: Boolean(convexClient),
  };
}
```

---

### 5. Profile Tab (`app/(app)/(tabs)/profile/index.tsx`)

**Status**: ⏳ Ready for Integration

**Convex Features to Add**:
- Real-time profile sync
- Presence status
- Activity history
- Preference management

**Convex Schema**:
```typescript
profiles: defineTable({
  clerkId: v.string(),
  phoneNumber: v.optional(v.string()),
  location: v.optional(v.string()),
  bio: v.optional(v.string()),
  profileImageUrl: v.optional(v.string()),
  preferences: v.optional(v.object({
    theme: v.optional(v.string()),
    notifications: v.optional(v.boolean()),
  })),
  updatedAt: v.number(),
})
```

**Available Functions** (`convex/profiles.ts`):
- `getProfile(clerkId)` - Get user profile
- `syncProfile(...)` - Update or create profile
- `updateProfileImage(clerkId, profileImageUrl)` - Update avatar
- `updatePreferences(clerkId, preferences)` - Update settings

**Integration Example**:
```typescript
// In profile/index.tsx
const syncProfileToConvex = async () => {
  if (convexClient && user?.id) {
    try {
      const { api } = await import("../../../../convex/_generated/api");
      await convexClient.mutation(api.profiles.syncProfile, {
        clerkId: user.id,
        phoneNumber: profileData.phoneNumber,
        location: profileData.location,
        profileImageUrl: profileData.profileImageUrl,
      });
      console.log('✅ Profile synced to Convex');
    } catch (e) {
      console.warn('Profile sync failed:', e);
      // Non-blocking - continue with local data
    }
  }
};
```

---

## Complete Convex Schema

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User Management
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  // Presence Tracking
  presence: defineTable({
    userId: v.string(),
    status: v.string(), // 'online' | 'away' | 'offline'
    lastSeen: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_lastSeen", ["lastSeen"]),

  // Mood Tracking
  moods: defineTable({
    userId: v.string(),
    moodType: v.string(),
    moodEmoji: v.optional(v.string()),
    moodLabel: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_user_and_date", ["userId", "createdAt"]),

  // Appointments
  appointments: defineTable({
    userId: v.string(),
    supportWorker: v.string(),
    date: v.string(),
    time: v.string(),
    type: v.string(),
    status: v.string(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_status", ["status"]),

  // Messaging
  conversations: defineTable({
    title: v.optional(v.string()),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_createdAt", ["createdAt"]),

  conversationParticipants: defineTable({
    conversationId: v.id("conversations"),
    userId: v.string(),
    role: v.optional(v.string()),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    body: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_createdAt", ["createdAt"]),

  // Community Forum
  communityPosts: defineTable({
    authorId: v.string(),
    title: v.string(),
    content: v.string(),
    isDraft: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["authorId"])
    .index("by_createdAt", ["createdAt"]),

  postReactions: defineTable({
    postId: v.id("communityPosts"),
    userId: v.string(),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_post", ["postId"])
    .index("by_user", ["userId"]),

  // User Profiles
  profiles: defineTable({
    clerkId: v.string(),
    phoneNumber: v.optional(v.string()),
    location: v.optional(v.string()),
    bio: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    preferences: v.optional(v.object({
      theme: v.optional(v.string()),
      notifications: v.optional(v.boolean()),
    })),
    updatedAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  // Activity Tracking
  activities: defineTable({
    userId: v.string(),
    activityType: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["activityType"])
    .index("by_user_and_date", ["userId", "createdAt"]),
});
```

## Testing Strategy

### Unit Tests
- Test Convex client creation
- Test query/mutation wrappers
- Test fallback mechanisms
- Test error handling

### Integration Tests
- Test real-time updates
- Test presence tracking
- Test concurrent modifications
- Test network failures

### Manual Testing Checklist

**Home Tab**:
- [ ] Recent moods load from Convex
- [ ] Recording mood updates UI in real-time
- [ ] Fallback to REST works when Convex disabled
- [ ] Presence status shows correctly

**Community Forum**:
- [ ] Trending feed loads from Convex
- [ ] My Posts shows drafts and published
- [ ] Reactions update in real-time
- [ ] Fallback handles Convex errors gracefully

**Appointments**:
- [ ] Appointment list loads correctly
- [ ] Creating appointment syncs to Convex
- [ ] Status changes reflect immediately
- [ ] Statistics update in real-time

**Messages**:
- [ ] Conversation list loads from Convex
- [ ] Sending message updates both sender and receiver
- [ ] Presence indicators work
- [ ] Unread counts accurate

**Profile**:
- [ ] Profile loads from Convex
- [ ] Image upload syncs to Convex
- [ ] Preferences save correctly
- [ ] Activity history displays

## Performance Considerations

### Optimizations
1. **Query Caching**: Convex automatically caches query results
2. **Incremental Loading**: Use `limit` parameter for pagination
3. **Selective Indexes**: Only index frequently queried fields
4. **Batch Operations**: Group related mutations when possible

### Monitoring
- Track query response times
- Monitor mutation success rates
- Log fallback frequency
- Alert on persistent Convex failures

## Troubleshooting

### Common Issues

**Issue**: Convex queries return empty results
**Solution**: Ensure `EXPO_PUBLIC_CONVEX_URL` is set and user is authenticated

**Issue**: Mutations fail silently
**Solution**: Check auth token is being passed correctly via `setAuth()`

**Issue**: Real-time updates not working
**Solution**: Verify Convex client is initialized and queries are reactive

**Issue**: Performance degradation
**Solution**: Add appropriate indexes, use pagination, avoid fetching large datasets

### Debug Mode
```typescript
// Enable Convex debug logging
if (__DEV__) {
  console.log('🔧 Convex Client:', convexClient);
  console.log('🔧 Convex URL:', process.env.EXPO_PUBLIC_CONVEX_URL);
}
```

## Migration Path

### Phase 1: Schema & Functions (✅ Complete)
- [x] Define all schemas
- [x] Create mood functions
- [x] Create appointment functions
- [x] Create profile functions
- [x] Create message functions (partial)

### Phase 2: Hooks & Utilities (🔄 In Progress)
- [x] `useConvexMoods` hook
- [ ] `useConvexAppointments` hook
- [ ] `useConvexMessages` hook
- [ ] `useConvexProfile` hook

### Phase 3: Tab Integration (⏳ Next)
- [x] Home tab
- [x] Community Forum (partial)
- [ ] Appointments tab
- [ ] Messages tab
- [ ] Profile tab

### Phase 4: Testing & Optimization (⏳ Future)
- [ ] Unit tests for all hooks
- [ ] Integration tests for real-time features
- [ ] Performance benchmarking
- [ ] Production deployment

## Documentation Updates

After completing integration:
1. Update `docs/convex-setup.md` with tab-specific details
2. Add API documentation for all Convex functions
3. Create video tutorials for developers
4. Document common patterns and best practices

## Conclusion

This comprehensive Convex integration brings real-time capabilities to all major features of the SafeSpace app while maintaining backward compatibility and graceful degradation. Each tab follows consistent patterns, making the codebase maintainable and extensible.

**Key Benefits**:
- ⚡ Real-time updates across all features
- 🔄 Automatic sync between devices
- 📊 Live presence tracking
- 🛡️ Robust fallback mechanisms
- 🎯 Non-blocking error handling
- 📱 Optimized for mobile performance

**Next Steps**:
1. Complete appointment tab integration
2. Complete messages tab integration
3. Complete profile tab integration
4. Add comprehensive test coverage
5. Deploy to production with monitoring
