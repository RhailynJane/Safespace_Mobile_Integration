# Convex Integration Status - SafeSpace App

## 📊 Integration Overview

This document tracks the status of Convex integration across all SafeSpace features.

---

## ✅ COMPLETED Convex Integrations

### 1. **Mood Tracking** ✅
**Status:** Fully integrated with optimistic UI  
**Files:**
- `convex/schema.ts` - moods table with 10 fields
- `convex/moods.ts` - 5 queries + 3 mutations
- `utils/moodApi.ts` - Convex-first pattern
- `app/(app)/mood-tracking/*.tsx` - Live subscriptions

**Features:**
- Real-time mood entries with intensity/factors
- Optimistic deletion with sorted rollback
- LiveMoodStats component on dashboard
- Share with support worker option
- 7-day trend analysis

**Pattern:** Convex → REST API → Local AsyncStorage

---

### 2. **Notifications** ✅
**Status:** Fully integrated with optimistic UI  
**Files:**
- `convex/schema.ts` - notifications table
- `convex/notifications.ts` - 6 queries + 4 mutations
- `utils/notificationsApi.ts` - Convex-first pattern
- Live notification badge in AppHeader

**Features:**
- Real-time notification updates
- Optimistic markAsRead, markAllAsRead, clearAll
- Unread count live subscription
- Push notification integration
- Activity log creation

**Pattern:** Convex → REST API fallback

---

### 3. **Resources** ✅
**Status:** Fully integrated (read-only)  
**Files:**
- `convex/schema.ts` - resources table (12 fields)
- `convex/resources.ts` - 7 queries + 4 mutations
- `utils/resourcesApi.ts` - Triple fallback
- `scripts/seed-resources.ts` - 24 resources seeded

**Features:**
- Real-time resource library
- External API integration (quotes/affirmations)
- Category filtering and search
- Daily quote/affirmation
- Live subscriptions for updates

**Pattern:** Convex → External API → Local static data

---

### 4. **Appointments** ✅
**Status:** Fully integrated with optimistic UI  
**Files:**
- `convex/schema.ts` - appointments table (15 fields)
- `convex/appointments.ts` - 7 queries + 4 mutations
- `utils/appointmentsApiNew.ts` - Convex-first pattern
- `utils/hooks/useConvexAppointments.ts` - Custom hook
- `app/(app)/(tabs)/appointments/**/*.tsx` - Multiple screens

**Features:**
- Real-time appointment calendar
- Optimistic cancel with rollback
- Support worker profiles
- Meeting link support
- Rescheduling and cancellation

**Pattern:** Convex → REST API fallback

---

### 5. **Self-Assessments** ✅
**Status:** Fully integrated  
**Files:**
- `convex/schema.ts` - assessments table (9 fields)
- `convex/assessments.ts` - 5 queries + 2 mutations
- `utils/assessmentsApi.ts` - Convex-first pattern
- `app/(app)/self-assessment/index.tsx` - Updated

**Features:**
- SWEMWBS assessment tracking
- 6-month interval reminders
- Trend analysis (improving/stable/declining)
- Score range: 7-35
- Notification on completion

**Pattern:** Convex → Local AsyncStorage fallback

---

### 6. **Video Consultations** ✅
**Status:** Fully integrated (leverages appointments)  
**Files:**
- Uses existing appointments Convex module
- `app/(app)/video-consultations/index.tsx` - Updated to useQuery

**Features:**
- Real-time upcoming appointments display
- Meeting link from appointments
- Live updates when appointments change
- No duplicate data model needed

**Pattern:** Reuses appointments via Convex

---

## ⏳ PENDING Convex Integrations

### 7. **Journal/Diary** ⏳
**Status:** Not yet integrated  
**Current Implementation:** REST API (`utils/journalApi.ts`)  
**Files Affected:**
- `app/(app)/journal/index.tsx`
- `app/(app)/journal/journal-create.tsx`
- `app/(app)/journal/journal-edit/[id].tsx`
- `app/(app)/journal/journal-entry/[id].tsx`
- `app/(app)/journal/journal-history.tsx`

**Would Need:**
```typescript
// convex/schema.ts
defineTable({
  userId: v.string(),
  title: v.string(),
  content: v.string(),
  mood: v.optional(v.string()),
  tags: v.optional(v.array(v.string())),
  isPrivate: v.boolean(),
  shareWithSupportWorker: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user", ["userId", "createdAt"])
.index("by_user_and_private", ["userId", "isPrivate", "createdAt"])
```

**Estimated Effort:** Medium (similar to moods)  
**Priority:** High (core therapeutic feature)

---

### 8. **Community Forum** ⏳
**Status:** Partially integrated  
**Current Implementation:** REST API (`utils/communityForumApi.ts`)  
**Files Affected:**
- `app/(app)/(tabs)/community-forum/index.tsx` - Already has useConvexPosts hook!
- `app/(app)/(tabs)/community-forum/post-detail.tsx`
- `app/(app)/(tabs)/community-forum/create/index.tsx`
- `app/(app)/(tabs)/community-forum/edit.tsx`

**Note:** I see `useConvexPosts` hook already exists! Let me check if this is already integrated:

**Would Need:**
```typescript
// convex/schema.ts
defineTable({
  userId: v.string(),
  authorName: v.string(),
  title: v.string(),
  content: v.string(),
  category: v.string(),
  tags: v.optional(v.array(v.string())),
  reactions: v.optional(v.any()), // JSON object of reactions
  commentCount: v.number(),
  status: v.string(), // "draft" | "published"
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user", ["userId", "createdAt"])
.index("by_category", ["category", "createdAt"])
.index("by_status", ["status", "createdAt"])

// Comments table
defineTable({
  postId: v.id("posts"),
  userId: v.string(),
  authorName: v.string(),
  content: v.string(),
  createdAt: v.number(),
})
.index("by_post", ["postId", "createdAt"])
```

**Estimated Effort:** High (complex with reactions, comments, bookmarks)  
**Priority:** Medium (social feature, not critical path)

---

### 9. **Profile/Settings** ⏳
**Status:** Not yet integrated  
**Current Implementation:** REST API (`utils/profileApi.ts`, `utils/settingsApi.ts`)  
**Files Affected:**
- `app/(app)/(tabs)/profile/index.tsx` - Already has useConvexProfile hook!
- `app/(app)/(tabs)/profile/edit.tsx`
- `app/(app)/(tabs)/profile/settings.tsx`

**Note:** I see `useConvexProfile` hook exists! Let me check status.

**Would Need:**
```typescript
// convex/schema.ts - User Profiles
defineTable({
  userId: v.string(), // Clerk user ID
  firstName: v.string(),
  lastName: v.string(),
  email: v.string(),
  phoneNumber: v.optional(v.string()),
  location: v.optional(v.string()),
  profileImageUrl: v.optional(v.string()),
  bio: v.optional(v.string()),
  emergencyContact: v.optional(v.any()),
  preferences: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_user", ["userId"])
.index("by_email", ["email"])

// Settings table
defineTable({
  userId: v.string(),
  theme: v.string(), // "light" | "dark" | "auto"
  notifications: v.boolean(),
  emailNotifications: v.boolean(),
  pushNotifications: v.boolean(),
  textSize: v.string(),
  language: v.string(),
  updatedAt: v.number(),
})
.index("by_user", ["userId"])
```

**Estimated Effort:** Low-Medium (straightforward CRUD)  
**Priority:** Medium (user data management)

---

### 10. **Activity Tracking** ⏳
**Status:** Not yet integrated  
**Current Implementation:** REST API (`utils/activityApi.ts`)  
**Used By:** Multiple screens for logging user actions

**Would Need:**
```typescript
// convex/schema.ts
defineTable({
  userId: v.string(),
  activityType: v.string(),
  description: v.string(),
  metadata: v.optional(v.any()),
  timestamp: v.number(),
})
.index("by_user", ["userId", "timestamp"])
.index("by_type", ["activityType", "timestamp"])
```

**Estimated Effort:** Low (simple logging)  
**Priority:** Low (analytics/tracking)

---

### 11. **Crisis Support** ⏳
**Status:** Not yet integrated  
**Current Implementation:** REST API (`utils/crisisService.ts`)  
**Files Affected:**
- `app/(app)/crisis-support/index.tsx`

**Note:** This might be intentionally kept on REST API for reliability/regulatory compliance.

**Would Need:**
```typescript
// convex/schema.ts
defineTable({
  resourceType: v.string(), // "hotline" | "text" | "chat" | "emergency"
  name: v.string(),
  description: v.string(),
  phoneNumber: v.optional(v.string()),
  url: v.optional(v.string()),
  availability: v.string(),
  category: v.string(),
  priority: v.number(),
})
.index("by_category", ["category", "priority"])
.index("by_type", ["resourceType", "priority"])
```

**Estimated Effort:** Low (read-only resources)  
**Priority:** LOW - Consider keeping on REST for reliability

---

### 12. **Help/Support** ⏳
**Status:** Not yet integrated  
**Current Implementation:** REST API (`utils/helpService.ts`)  
**Files Affected:**
- `app/(app)/(tabs)/profile/help-support.tsx`

**Would Need:**
```typescript
// convex/schema.ts
defineTable({
  sectionId: v.string(),
  title: v.string(),
  icon: v.string(),
  items: v.array(v.any()),
  order: v.number(),
})
.index("by_order", ["order"])
```

**Estimated Effort:** Low (static content)  
**Priority:** Low

---

## 🚫 OUT OF SCOPE for Convex

### **Messages/Chat** 🚫
**Reason:** Uses SendBird SDK (external service)  
**Status:** Will remain on SendBird  
**Files:**
- `app/(app)/(tabs)/messages/*.tsx`
- `lib/sendbird-service.ts`

**Justification:** SendBird provides:
- Real-time messaging infrastructure
- Message history and persistence
- Read receipts and typing indicators
- File/media sharing
- Professional chat features

**Decision:** Keep on SendBird, not duplicate in Convex

---

## 📈 Integration Priority Ranking

Based on user impact and feature importance:

### **HIGH PRIORITY** (Should integrate next)
1. **Journal/Diary** - Core therapeutic feature, user data
2. **Profile/Settings** - User account management (check existing hooks first!)

### **MEDIUM PRIORITY**
3. **Community Forum** - Social engagement (check useConvexPosts status!)
4. **Activity Tracking** - User behavior analytics

### **LOW PRIORITY**
5. **Help/Support** - Static content
6. **Crisis Support** - Consider keeping on REST for reliability

---

## 🔍 Investigation Needed

### Existing Hooks Found:
I noticed these hooks already exist but need to verify integration status:

1. **`utils/hooks/useConvexProfile.ts`** - Profile management
   - Is this already integrated?
   - Need to check if profile screens are using it

2. **`utils/hooks/useConvexPosts.ts`** - Community forum
   - Is this already integrated?
   - Need to check if forum screens are using it

**TODO:** Investigate these existing hooks to see if integration is already partially complete!

---

## 📊 Current Statistics

**Completed:** 6/12 major features (50%)  
**In Progress:** 0  
**Pending:** 6 features  
**Out of Scope:** 1 feature (Messages)  

**Convex Tables Created:** 6
- moods
- notifications
- resources
- appointments
- assessments
- (appointments reused for video consultations)

**Convex Modules:** 6
- `convex/moods.ts`
- `convex/notifications.ts`
- `convex/resources.ts`
- `convex/appointments.ts`
- `convex/assessments.ts`
- `convex/presence.ts` (utility)

---

## 🎯 Recommended Next Steps

### Immediate Actions:
1. **Investigate existing hooks** - Check useConvexProfile and useConvexPosts
2. **Journal Integration** - High priority, core feature
3. **Profile/Settings** - If not already done via useConvexProfile

### Medium-term:
4. **Community Forum** - If not already done via useConvexPosts
5. **Activity Tracking** - Simple logging integration

### Long-term:
6. **Help/Support** - Static content migration
7. **Crisis Support** - Evaluate if REST is better for this use case

---

## 🛠️ Integration Pattern

All integrations follow the **Convex-First Pattern**:

```typescript
async function getData() {
  try {
    // 1. Try Convex first (real-time, fastest)
    const result = await convexClient.query(api.module.query, args);
    return result;
  } catch (convexError) {
    // 2. Fallback to REST API
    try {
      const response = await fetch(`${API_URL}/api/endpoint`);
      return response.json();
    } catch (restError) {
      // 3. Fallback to local storage
      const cached = await AsyncStorage.getItem('cache_key');
      return cached ? JSON.parse(cached) : defaultValue;
    }
  }
}
```

**Benefits:**
- Real-time updates when online
- Graceful degradation when Convex unavailable
- Offline support via AsyncStorage
- Consistent user experience

---

**Last Updated:** ${new Date().toISOString()}  
**Integration Progress:** 50% complete  
**Next Review:** After investigating existing hooks
