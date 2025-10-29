# Activity Tracking Implementation

## Overview
Implemented comprehensive user activity tracking to support online/offline status for messaging features.

## Database Changes

### New Fields in `users` Table
- `last_login_at` - Timestamp when user successfully logged in
- `last_logout_at` - Timestamp when user explicitly logged out  
- `last_active_at` - Timestamp of last user activity (already existed)

### Migration
- Created: `prisma/migrations/20251022120000_add_login_logout_timestamps/migration.sql`

## Backend API Endpoints

### POST `/api/users/login-activity`
Records successful login
- Updates: `last_login_at`, `last_active_at`
- Body: `{ clerkUserId: string }`

### POST `/api/users/logout-activity`
Records logout
- Updates: `last_logout_at`
- Body: `{ clerkUserId: string }`

### POST `/api/users/heartbeat`
Updates activity timestamp
- Updates: `last_active_at`
- Body: `{ clerkUserId: string }`

### GET `/api/users/status/:clerkUserId`
Returns online status and timestamps
- Response: `{ online: boolean, last_active_at, last_login_at, last_logout_at }`

### POST `/api/users/status-batch`
Returns status for multiple users
- Body: `{ clerkUserIds: string[] }`
- Response: `{ [userId]: { online, last_active_at, last_login_at, last_logout_at } }`

## Online Status Logic

A user is considered **online** when:
```
(NOW - last_active_at <= 2 minutes) 
AND 
(last_logout_at is NULL OR last_logout_at < last_active_at)
```

## Client Integration

### Login Tracking
**File**: `app/(auth)/login.tsx`
- Calls `activityApi.recordLogin()` after successful Clerk authentication
- Uses actual Clerk user ID (not session ID)

### Logout Tracking
Implemented in all sign-out handlers:

1. **AppHeader Component** (`components/AppHeader.tsx`)
   - Used across the entire app
   - Records logout before clearing AsyncStorage

2. **Profile Screen** (`app/(app)/(tabs)/profile/index.tsx`)
   - Main profile logout button
   - Replaced old fetch call with `activityApi.recordLogout()`

3. **Appointments Book** (`app/(app)/(tabs)/appointments/book.tsx`)
   - Side menu logout
   - Added logout tracking

4. **Appointments Confirmation** (`app/(app)/(tabs)/appointments/confirmation.tsx`)
   - Side menu logout
   - Added logout tracking

### Heartbeat Tracking
**File**: `utils/sendbirdService.ts`

Automatic heartbeats on:
- `getConversationsFromBackend()` - Loading conversation list
- `getMessagesFromBackend()` - Loading messages
- `sendMessageToBackend()` - Sending a message
- `getContacts()` - Loading contacts
- `createConversationInBackend()` - Creating conversation

## Client Utilities

### activityApi (`utils/activityApi.ts`)
```typescript
activityApi.recordLogin(clerkUserId)      // Record login
activityApi.recordLogout(clerkUserId)     // Record logout
activityApi.heartbeat(clerkUserId)        // Update activity
activityApi.status(clerkUserId)           // Get single user status
activityApi.statusBatch([...userIds])     // Get multiple users status
```

## Testing

### Manual Test Script
**File**: `test/test-activity-api.ps1`

```powershell
.\test-activity-api.ps1 -ClerkUserId "user_xxx"
```

Verifies:
1. Login sets timestamps
2. Heartbeat updates activity
3. Status correctly shows online
4. Logout sets timestamp
5. Status correctly shows offline after logout

## Usage Examples

### Check if User is Online
```typescript
const status = await activityApi.status(userId);
if (status?.online) {
  // Show green dot
}
```

### Get Status for Conversation Participants
```typescript
const participantIds = conversation.participants.map(p => p.clerk_user_id);
const statuses = await activityApi.statusBatch(participantIds);

participants.forEach(p => {
  const isOnline = statuses[p.clerk_user_id]?.online;
  // Display online indicator
});
```

## Notes

- All logout tracking includes error handling - app continues to logout even if tracking fails
- Heartbeats are non-blocking - errors are silently ignored
- Login tracking happens after successful Clerk authentication
- 2-minute online window is configurable in backend logic
