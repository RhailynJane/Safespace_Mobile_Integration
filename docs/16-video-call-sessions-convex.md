# Video Call Sessions - Convex Integration

## Overview
This document describes the complete Convex integration for video call session tracking. The system tracks the full lifecycle of video calls including connection time, duration, settings changes, and quality issues.

## Table of Contents
- [Schema Design](#schema-design)
- [Convex Module Functions](#convex-module-functions)
- [Hook: useConvexVideoSession](#hook-useconvexvideosession)
- [Integration Patterns](#integration-patterns)
- [Session Lifecycle](#session-lifecycle)
- [Analytics & Queries](#analytics--queries)
- [Testing](#testing)

---

## Schema Design

### Table: `videoCallSessions`

Located in: `convex/schema.ts` (lines 120-145)

```typescript
videoCallSessions: defineTable({
  // Appointment Link
  appointmentId: v.optional(v.id("appointments")), // Optional link to appointment

  // User Information
  userId: v.string(), // User participating in the call
  supportWorkerName: v.string(), // Name of support worker
  supportWorkerId: v.optional(v.string()), // ID of support worker

  // Session Status & Timing
  sessionStatus: v.union(
    v.literal("connecting"), // Pre-call screen, not connected yet
    v.literal("connected"),  // Call in progress
    v.literal("ended"),      // Call ended normally
    v.literal("failed")      // Connection failed
  ),
  joinedAt: v.string(),      // ISO timestamp when user joined pre-call
  connectedAt: v.optional(v.string()), // ISO timestamp when call connected
  endedAt: v.optional(v.string()),     // ISO timestamp when call ended
  duration: v.optional(v.number()),    // Duration in seconds (calculated on end)

  // Settings & Quality
  audioOption: v.optional(v.string()), // "wifi", "cellular", etc.
  cameraEnabled: v.optional(v.boolean()),
  micEnabled: v.optional(v.boolean()),
  qualityIssues: v.optional(v.array(v.string())), // Track issues reported

  // Metadata
  endReason: v.optional(v.string()),   // "user_ended", "timeout", etc.
  metadata: v.optional(v.any()),       // Extensible field for additional data

  // Timestamps
  createdAt: v.string(),
  updatedAt: v.string(),
})
```

### Indexes (5 total)

All indexes include `_creationTime` for efficient sorting:

1. **by_user**: `["userId", "_creationTime"]`
   - Use case: Get all sessions for a user
   - Example: User's call history

2. **by_appointment**: `["appointmentId", "_creationTime"]`
   - Use case: Find sessions for specific appointment
   - Example: Verify appointment completion

3. **by_status**: `["sessionStatus", "_creationTime"]`
   - Use case: Find active or failed sessions
   - Example: Monitor ongoing calls

4. **by_user_and_date**: `["userId", "createdAt", "_creationTime"]`
   - Use case: User sessions within date range
   - Example: Monthly call analytics

5. **by_support_worker**: `["supportWorkerId", "_creationTime"]`
   - Use case: Sessions by support worker
   - Example: Worker performance metrics

---

## Convex Module Functions

Located in: `convex/videoCallSessions.ts` (254 lines)

### Mutations (5)

#### 1. `startSession`
**Purpose**: Create new session when user joins pre-call screen

**Parameters**:
```typescript
{
  userId: string,
  supportWorkerName: string,
  supportWorkerId?: string,
  appointmentId?: Id<"appointments">,
  audioOption?: string
}
```

**Returns**: `Id<"videoCallSessions">` (session ID)

**Behavior**:
- Creates session with status "connecting"
- Sets joinedAt to current timestamp
- Initializes default settings (camera/mic enabled)
- Returns sessionId for tracking

**Example**:
```typescript
const sessionId = await startSession({
  userId: "user123",
  supportWorkerName: "Dr. Smith",
  supportWorkerId: "worker456",
  appointmentId: appointmentId,
  audioOption: "wifi"
});
```

---

#### 2. `markConnected`
**Purpose**: Update session when call successfully connects

**Parameters**:
```typescript
{
  sessionId: Id<"videoCallSessions">
}
```

**Returns**: `Id<"videoCallSessions">`

**Behavior**:
- Updates status to "connected"
- Sets connectedAt timestamp
- Updates updatedAt

**Example**:
```typescript
await markConnected({ sessionId });
```

---

#### 3. `endSession`
**Purpose**: End session and calculate duration

**Parameters**:
```typescript
{
  sessionId: Id<"videoCallSessions">,
  endReason?: string
}
```

**Returns**: Session object with duration

**Behavior**:
- Updates status to "ended"
- Sets endedAt timestamp
- **Calculates duration**: (endedAt - connectedAt) in seconds
- If has appointmentId: updates appointment status to "completed"
- Stores endReason if provided

**Duration Calculation**:
```typescript
if (session.connectedAt) {
  const connectedTime = new Date(session.connectedAt).getTime();
  const endTime = new Date(endedAt).getTime();
  duration = Math.floor((endTime - connectedTime) / 1000); // seconds
}
```

**Example**:
```typescript
const result = await endSession({
  sessionId,
  endReason: "user_ended"
});
console.log(`Call duration: ${result.duration} seconds`);
```

---

#### 4. `updateSessionSettings`
**Purpose**: Update camera/mic settings during call

**Parameters**:
```typescript
{
  sessionId: Id<"videoCallSessions">,
  cameraEnabled?: boolean,
  micEnabled?: boolean,
  audioOption?: string
}
```

**Returns**: Updated session object

**Behavior**:
- Updates only provided fields
- Preserves existing settings for omitted fields
- Updates updatedAt timestamp

**Example**:
```typescript
await updateSessionSettings({
  sessionId,
  cameraEnabled: false, // User turned off camera
  micEnabled: true
});
```

---

#### 5. `reportQualityIssue`
**Purpose**: Track quality problems during call

**Parameters**:
```typescript
{
  sessionId: Id<"videoCallSessions">,
  issue: string
}
```

**Returns**: Updated session object

**Behavior**:
- Appends issue to qualityIssues array
- Creates array if doesn't exist
- Preserves all previous issues
- Updates updatedAt

**Example**:
```typescript
await reportQualityIssue({
  sessionId,
  issue: "Audio choppy at 14:32"
});
```

---

### Queries (3)

#### 6. `getUserSessions`
**Purpose**: Get user's call history with pagination

**Parameters**:
```typescript
{
  userId: string,
  limit?: number  // Default: 50
}
```

**Returns**: Array of session objects, newest first

**Behavior**:
- Uses by_user index for efficiency
- Filters by userId
- Orders by _creationTime descending
- Limits results

**Example**:
```typescript
const sessions = await getUserSessions({
  userId: "user123",
  limit: 10
});
```

---

#### 7. `getCallStats`
**Purpose**: Get analytics for user's calls

**Parameters**:
```typescript
{
  userId: string
}
```

**Returns**:
```typescript
{
  totalSessions: number,
  completedSessions: number,
  failedSessions: number,
  totalDuration: number,        // Total seconds
  averageDuration: number,      // Average seconds per call
  totalQualityIssues: number
}
```

**Behavior**:
- Fetches all user sessions (no limit)
- Calculates statistics:
  - Count by status (completed, failed)
  - Sum durations
  - Average duration
  - Total quality issues reported

**Example**:
```typescript
const stats = await getCallStats({ userId: "user123" });
console.log(`Total calls: ${stats.totalSessions}`);
console.log(`Average duration: ${stats.averageDuration} seconds`);
console.log(`Failed calls: ${stats.failedSessions}`);
```

---

#### 8. `getActiveSession`
**Purpose**: Find user's current active session

**Parameters**:
```typescript
{
  userId: string
}
```

**Returns**: Session object or null

**Behavior**:
- Uses by_user index
- Filters for status "connecting" or "connected"
- Returns most recent active session
- Returns null if no active session

**Use Case**: Resume interrupted calls, prevent duplicate sessions

**Example**:
```typescript
const activeSession = await getActiveSession({ userId: "user123" });
if (activeSession) {
  console.log(`Resuming session ${activeSession._id}`);
}
```

---

## Hook: useConvexVideoSession

Located in: `utils/hooks/useConvexVideoSession.ts` (175 lines)

### Purpose
Reusable React hook for video call session management with Convex-first pattern and graceful fallback.

### Usage

```typescript
import { useConvexVideoSession } from '@/utils/hooks/useConvexVideoSession';

const {
  sessionId,
  loading,
  error,
  isUsingConvex,
  startSession,
  markConnected,
  endSession,
  updateSettings,
  reportQualityIssue
} = useConvexVideoSession(convexClient);
```

### Methods

#### `startSession`
```typescript
startSession({
  appointmentId?: Id<"appointments">,
  supportWorkerName: string,
  supportWorkerId?: string,
  audioOption?: string
}): Promise<Id<"videoCallSessions"> | null>
```

**Behavior**:
- Gets userId from AsyncStorage
- Calls Convex mutation
- Stores sessionId in state
- Returns sessionId or null on error
- Logs warning on failure (non-blocking)

**Example**:
```typescript
const newSessionId = await startSession({
  supportWorkerName: appointment.supportWorkerName,
  appointmentId: appointment._id,
  audioOption: selectedAudio
});
```

---

#### `markConnected`
```typescript
markConnected(sessionIdParam?: Id<"videoCallSessions">): Promise<void>
```

**Parameters**:
- `sessionIdParam`: Optional, uses hook's sessionId if omitted

**Behavior**:
- Marks session as connected
- Updates connectedAt timestamp
- Fails gracefully on error

**Example**:
```typescript
// Use current sessionId
await markConnected();

// Or pass specific sessionId
await markConnected(customSessionId);
```

---

#### `endSession`
```typescript
endSession({
  sessionIdToEnd?: Id<"videoCallSessions">,
  endReason?: string
}): Promise<void>
```

**Parameters**:
- `sessionIdToEnd`: Optional, uses hook's sessionId if omitted
- `endReason`: Optional reason string

**Behavior**:
- Ends session
- Calculates duration
- Updates appointment if linked
- Clears sessionId from state
- Logs result

**Example**:
```typescript
await endSession({
  endReason: isDemoMode ? 'demo_ended' : 'user_ended'
});
```

---

#### `updateSettings`
```typescript
updateSettings({
  cameraEnabled?: boolean,
  micEnabled?: boolean,
  audioOption?: string
}): Promise<void>
```

**Behavior**:
- Updates session settings
- Only updates provided fields
- Requires active sessionId

**Example**:
```typescript
await updateSettings({ cameraEnabled: false });
```

---

#### `reportQualityIssue`
```typescript
reportQualityIssue(issue: string): Promise<void>
```

**Behavior**:
- Appends issue to session
- Requires active sessionId
- Useful for debugging

**Example**:
```typescript
await reportQualityIssue('Audio lag detected');
```

---

### State Properties

- **`sessionId`**: Current session ID or null
- **`loading`**: Boolean, true during operations
- **`error`**: Error string or null
- **`isUsingConvex`**: Boolean, true if Convex available

---

## Integration Patterns

### Pre-Call Screen Pattern
**File**: `app/(app)/video-consultations/video-call.tsx`

**Steps**:
1. Initialize Convex client
2. Initialize video session hook
3. Start session when user clicks "Join Now"
4. Pass sessionId via navigation params

**Code Example**:
```typescript
// 1. Initialize Convex client
useEffect(() => {
  const initConvex = async () => {
    const url = await AsyncStorage.getItem('convexUrl');
    if (url) {
      setConvexClient(new ConvexReactClient(url));
    }
  };
  initConvex();
}, []);

// 2. Initialize hook
const { startSession } = useConvexVideoSession(convexClient);

// 3. Start session on join
const handleStartMeeting = async () => {
  const sessionId = await startSession({
    supportWorkerName: appointment.supportWorkerName,
    appointmentId: appointment._id,
    audioOption: selectedAudio
  });
  
  router.push({
    pathname: '/(app)/video-consultations/video-call-meeting',
    params: {
      appointmentId: appointment._id,
      sessionId: sessionId || '', // 4. Pass sessionId
      isDemoMode: 'false'
    }
  });
};
```

---

### Meeting Screen Pattern
**File**: `app/(app)/video-consultations/video-call-meeting.tsx`

**Steps**:
1. Receive sessionId from route params
2. Initialize Convex client and hook
3. Mark connected when call establishes
4. Update settings when camera/mic toggle
5. End session when call terminates

**Code Example**:
```typescript
// 1. Get sessionId from params
const { sessionId: sessionIdParam } = useLocalSearchParams();

// 2. Initialize Convex and hook
const {
  markConnected,
  endSession,
  updateSettings,
  isUsingConvex
} = useConvexVideoSession(convexClient);

// 3. Mark connected when call starts
const startCallTimer = useCallback(() => {
  if (isUsingConvex && sessionIdParam) {
    markConnected(sessionIdParam);
  }
  // ... timer logic
}, [isUsingConvex, sessionIdParam, markConnected]);

// 4. Update settings on toggle
const handleToggleCamera = useCallback(async () => {
  const newState = !isCameraOn;
  setIsCameraOn(newState);
  
  if (isUsingConvex && sessionIdParam) {
    await updateSettings({ cameraEnabled: newState });
  }
}, [isCameraOn, isUsingConvex, sessionIdParam, updateSettings]);

// 5. End session on call end
const endCall = useCallback(async () => {
  if (isUsingConvex && sessionIdParam) {
    await endSession({
      sessionIdToEnd: sessionIdParam,
      endReason: isDemoMode ? 'demo_ended' : 'user_ended'
    });
  }
  router.back();
}, [isUsingConvex, sessionIdParam, isDemoMode, endSession]);
```

---

## Session Lifecycle

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PRE-CALL SCREEN (video-call.tsx)                        │
├─────────────────────────────────────────────────────────────┤
│ User clicks "Join Now"                                      │
│   ↓                                                         │
│ startSession({                                              │
│   userId: "user123",                                        │
│   supportWorkerName: "Dr. Smith",                           │
│   appointmentId: appointment._id,                           │
│   audioOption: "wifi"                                       │
│ })                                                          │
│   ↓                                                         │
│ Convex creates record:                                      │
│   - sessionStatus: "connecting"                             │
│   - joinedAt: "2024-01-15T10:30:00Z"                       │
│   - cameraEnabled: true                                     │
│   - micEnabled: true                                        │
│   ↓                                                         │
│ Returns sessionId: "k1234abcd"                              │
│   ↓                                                         │
│ Navigate to meeting screen with sessionId param             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. MEETING SCREEN (video-call-meeting.tsx)                 │
├─────────────────────────────────────────────────────────────┤
│ Receive sessionId from params                               │
│   ↓                                                         │
│ Call connects successfully                                  │
│   ↓                                                         │
│ markConnected(sessionId)                                    │
│   ↓                                                         │
│ Convex updates record:                                      │
│   - sessionStatus: "connected"                              │
│   - connectedAt: "2024-01-15T10:30:15Z"                    │
│   ↓                                                         │
│ [User interacts during call...]                             │
│   ↓                                                         │
│ User toggles camera off                                     │
│   ↓                                                         │
│ updateSettings({ cameraEnabled: false })                    │
│   ↓                                                         │
│ Convex updates: cameraEnabled: false                        │
│   ↓                                                         │
│ [Quality issue detected]                                    │
│   ↓                                                         │
│ reportQualityIssue("Audio choppy")                          │
│   ↓                                                         │
│ Convex appends to qualityIssues array                       │
│   ↓                                                         │
│ User clicks "End Call"                                      │
│   ↓                                                         │
│ endSession({                                                │
│   sessionIdToEnd: sessionId,                                │
│   endReason: "user_ended"                                   │
│ })                                                          │
│   ↓                                                         │
│ Convex updates record:                                      │
│   - sessionStatus: "ended"                                  │
│   - endedAt: "2024-01-15T10:45:30Z"                        │
│   - duration: 915 (seconds, calculated)                     │
│   - Appointment status → "completed" (if linked)            │
│   ↓                                                         │
│ Navigate back to consultations                              │
└─────────────────────────────────────────────────────────────┘
```

### Status Transitions

```
connecting → connected → ended   (Normal flow)
connecting → failed              (Connection error)
connected → failed               (Unexpected disconnect)
```

---

## Analytics & Queries

### User Call History

```typescript
const sessions = await getUserSessions({
  userId: "user123",
  limit: 10
});

sessions.forEach(session => {
  console.log(`Call on ${session.joinedAt}`);
  console.log(`Duration: ${session.duration}s`);
  console.log(`Status: ${session.sessionStatus}`);
});
```

### Call Statistics Dashboard

```typescript
const stats = await getCallStats({ userId: "user123" });

// Display in UI:
// Total Calls: 45
// Completed: 42
// Failed: 3
// Total Time: 1h 23m (4,980 seconds)
// Average Duration: 111 seconds
// Quality Issues: 5 reported
```

### Find Active Session (Resume Call)

```typescript
const activeSession = await getActiveSession({ userId: "user123" });

if (activeSession) {
  // User has active call, allow resume
  router.push({
    pathname: '/video-call-meeting',
    params: { sessionId: activeSession._id }
  });
} else {
  // No active call, start new session
  const newSessionId = await startSession({ ... });
}
```

### Support Worker Performance

```typescript
// Get all sessions for a support worker
const workerSessions = await ctx.db
  .query("videoCallSessions")
  .withIndex("by_support_worker", q => 
    q.eq("supportWorkerId", "worker456")
  )
  .collect();

// Calculate metrics:
// - Total calls handled
// - Average duration
// - Quality issues rate
// - Failed call percentage
```

---

## Testing

### Manual Testing Checklist

#### Pre-Call Screen (video-call.tsx)
- [ ] Convex client initializes on mount
- [ ] Session starts when clicking "Join Now"
- [ ] SessionId is passed to meeting screen
- [ ] Session created with status "connecting"
- [ ] JoinedAt timestamp is accurate

#### Meeting Screen (video-call-meeting.tsx)
- [ ] SessionId received from params
- [ ] Session marked "connected" when call establishes
- [ ] ConnectedAt timestamp is accurate
- [ ] Camera toggle updates session
- [ ] Mic toggle updates session
- [ ] Quality issues can be reported
- [ ] Session ends when leaving call
- [ ] Duration calculated correctly
- [ ] EndReason stored properly

#### Edge Cases
- [ ] Session tracking works without appointmentId
- [ ] Session tracking works with appointmentId
- [ ] Appointment marked "completed" after call ends
- [ ] Failed connections update status to "failed"
- [ ] Demo mode sessions track correctly
- [ ] Network errors fail gracefully (non-blocking)

#### Analytics
- [ ] getUserSessions returns correct history
- [ ] getCallStats calculates totals correctly
- [ ] getActiveSession finds ongoing calls
- [ ] Quality issues accumulate in array
- [ ] Duration calculation handles timezone correctly

---

## Key Features

### 1. **Comprehensive Tracking**
- Full lifecycle: connecting → connected → ended
- Precise timestamps: joinedAt, connectedAt, endedAt
- Automatic duration calculation
- Settings history (camera, mic, audio)
- Quality issue reporting

### 2. **Appointment Integration**
- Optional link to appointments via appointmentId
- Automatic appointment completion on session end
- Verify appointment fulfillment via session records

### 3. **Analytics Ready**
- Total sessions, duration, failures
- Average call duration
- Quality issues tracking
- Support worker performance metrics

### 4. **Graceful Fallback**
- Convex-first pattern with error handling
- Non-blocking: call works even if tracking fails
- Logs warnings for debugging
- Works with or without appointmentId

### 5. **Real-Time Capabilities**
- Live session status updates
- Active session detection
- Prevent duplicate sessions
- Resume interrupted calls

---

## Migration Notes

### Changes from REST API
- **Before**: No session tracking, only appointment status
- **After**: Full session lifecycle tracking with analytics
- **Breaking**: None (additive only)
- **Compatibility**: Works alongside existing appointment system

### Database Impact
- **New Table**: videoCallSessions (5 indexes)
- **Schema Deployment**: Completed successfully (2.39s)
- **Data Migration**: Not required (new feature)

---

## Future Enhancements

### Potential Improvements
1. **Session Recording Links**: Store recording URLs
2. **Participant Tracking**: Multi-user call support
3. **Chat Integration**: Link chat messages to sessions
4. **Screen Sharing**: Track screen share events
5. **Network Stats**: Bandwidth, latency, packet loss
6. **Session Ratings**: Post-call user satisfaction
7. **Automatic Reconnection**: Resume session after disconnect

### Analytics Dashboard Ideas
- Daily/weekly/monthly call volume charts
- Peak usage hours heatmap
- Average call duration trends
- Quality issues by time of day
- Support worker leaderboard
- User engagement metrics

---

## Related Documentation
- [Appointments Convex Integration](./06-appointments.md)
- [Video Consultations Screen](./13-video-consultation.md)
- [Convex Schema Design](../convex/schema.ts)
- [Testing Guide](../testing/README.md)

---

**Last Updated**: January 2024  
**Integration Status**: ✅ Complete (Zero TypeScript errors)  
**Total Features on Convex**: 14/14 (100%)
