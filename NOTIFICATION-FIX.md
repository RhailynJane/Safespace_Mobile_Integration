# Notification Settings Fix for Messages and Post Reactions

## Problem
Messages and Post Reactions notifications were being sent even when users had disabled them in settings because the backend wasn't checking user preferences before sending push notifications.

## Solution Applied

### 1. Updated `notifyUserByIds` function
- Added `notificationType` parameter to specify the type of notification being sent
- Added logic to check user's notification settings from `user_settings` table before sending
- Checks both global `notificationsEnabled` and specific type flags:
  - `notifMessages` for message notifications
  - `notifPostReactions` for post reaction notifications
  - `notifAppointments` for appointment notifications
- Returns early (skips notification) if the specific notification type is disabled

### 2. Updated `notifyUserByClerkId` function
- Added `notificationType` parameter
- Passes the notification type to `notifyUserByIds`

### 3. Updated Message Notification Call
**Location:** Line ~3271 in `backend/src/index.ts`

**Before:**
```typescript
await notifyUserByClerkId(
  recipientId,
  'New message',
  result.message_text || 'You have a new message',
  { type: 'message', conversationId: Number.parseInt(conversationId) }
);
```

**After:**
```typescript
await notifyUserByClerkId(
  recipientId,
  'New message',
  result.message_text || 'You have a new message',
  { type: 'message', conversationId: Number.parseInt(conversationId) },
  'message'  // <-- notification type parameter
);
```

### 4. Update Post Reaction Notification Call (NEEDS TO BE DONE)
**Location:** Line ~1453 in `backend/src/index.ts`

**Current:**
```typescript
await notifyUserByClerkId(
  ownerClerkId,
  'New reaction on your post',
  `${emoji} ${reactorName} reacted to your post`,
  { postId: Number.parseInt(id), emoji, actorName: reactorName, actorClerkId: clerkUserId }
);
```

**Should be:**
```typescript
await notifyUserByClerkId(
  ownerClerkId,
  'New reaction on your post',
  `${emoji} ${reactorName} reacted to your post`,
  { postId: Number.parseInt(id), emoji, actorName: reactorName, actorClerkId: clerkUserId },
  'post_reaction'  // <-- Add this parameter
);
```

## Manual Fix Required
Since the automated patch failed, please manually add `, 'post_reaction'` as the 5th parameter to the `notifyUserByClerkId` call around line 1453 in `backend/src/index.ts`.

Find this code:
```typescript
await notifyUserByClerkId(
  ownerClerkId,
  'New reaction on your post',
  `${emoji} ${reactorName} reacted to your post`,
  { postId: Number.parseInt(id), emoji, actorName: reactorName, actorClerkId: clerkUserId }
);
```

And change it to:
```typescript
await notifyUserByClerkId(
  ownerClerkId,
  'New reaction on your post',
  `${emoji} ${reactorName} reacted to your post`,
  { postId: Number.parseInt(id), emoji, actorName: reactorName, actorClerkId: clerkUserId },
  'post_reaction'
);
```

## Testing
After making the manual fix and restarting the backend:
1. Go to Settings → Notifications
2. Toggle off "Messages" notifications
3. Have someone send you a message - you should NOT receive a push notification
4. Toggle off "Post Reactions" notifications
5. Have someone react to your post - you should NOT receive a push notification

The notifications will still appear in the bell icon (notifications list) but won't trigger push notifications to your device.
