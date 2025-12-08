# Activity Log Date Filter Fix

## Problem
The "Today" filter in the activity log was not showing results, even though "All Dates" displayed appointment_created events.

## Root Cause
The `getUserActivities` query did not support date range filtering, so the frontend date filters had no effect on the backend data.

## Solution

### Backend Changes (✅ COMPLETED)

#### 1. Updated `getUserActivities` Query
**Files Modified:**
- `c:/mobile-android-safespace/SafeSpace-android/convex/activities.ts`
- `c:/safespace-integration/SafeSpaceApp_Web/convex/activities.ts`

**Changes:**
- Added optional `startDate` and `endDate` parameters (Unix timestamps in milliseconds)
- Implemented date range filtering logic
- Applied limit after filtering for accurate results

**New Signature:**
```typescript
export const getUserActivities = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()), // Unix timestamp (ms)
    endDate: v.optional(v.number()),   // Unix timestamp (ms)
  },
  handler: async (ctx, { userId, limit = 50, startDate, endDate }) => {
    // ... filtering logic
  },
});
```

#### 2. Added `recordActivity` Mutation
**Purpose:** Generic mutation to record any activity type (appointment_created, appointment_cancelled, etc.)

```typescript
export const recordActivity = mutation({
  args: {
    userId: v.string(),
    activityType: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { userId, activityType, metadata }) => {
    // ... insert activity
  },
});
```

#### 3. Added Automatic Activity Logging for Appointments
**File:** `c:/safespace-integration/SafeSpaceApp_Web/convex/appointments.ts`

**Changes:**
- Both `create` and `createAppointment` mutations now automatically log `appointment_created` activities
- Activity includes metadata: appointmentId, date, time, type, supportWorkerId

---

## Frontend Implementation Required

### Step 1: Locate the Activity Log Screen
The activity log screen needs to be found (likely in `app/(app)/(tabs)/profile/` or a similar location).

### Step 2: Update Date Filter Logic

#### Calculate Date Ranges
```typescript
// Helper function to get date range based on filter
const getDateRange = (filter: 'today' | 'last7days' | 'last30days' | 'all') => {
  const now = new Date();
  
  switch (filter) {
    case 'today': {
      // Start of today (00:00:00)
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      // End of today (23:59:59.999)
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      return {
        startDate: startOfDay.getTime(),
        endDate: endOfDay.getTime(),
      };
    }
    
    case 'last7days': {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      
      return {
        startDate: sevenDaysAgo.getTime(),
        endDate: endOfToday.getTime(),
      };
    }
    
    case 'last30days': {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      
      return {
        startDate: thirtyDaysAgo.getTime(),
        endDate: endOfToday.getTime(),
      };
    }
    
    case 'all':
    default:
      return {}; // No date filtering
  }
};
```

#### Update Convex Query Call
```typescript
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

// In your component:
const [dateFilter, setDateFilter] = useState<'today' | 'last7days' | 'last30days' | 'all'>('all');

// Calculate date range based on current filter
const dateRange = useMemo(() => getDateRange(dateFilter), [dateFilter]);

// Query activities with date filter
const activities = useQuery(
  api.activities.getUserActivities,
  user?.id
    ? {
        userId: user.id,
        limit: 100,
        ...dateRange, // Spread startDate/endDate if present
      }
    : undefined
);
```

### Step 3: Verify Timezone Handling

**IMPORTANT:** Ensure date calculations use the correct timezone:
- Appointments use Mountain Time (America/Denver)
- Activity timestamps are stored in UTC (Unix milliseconds)
- Frontend date filters should use local device time or Mountain Time for consistency

#### Example with Timezone:
```typescript
// If you need Mountain Time specifically:
const getMountainTimeRange = (filter: 'today' | 'last7days' | 'last30days' | 'all') => {
  const timeZone = 'America/Denver';
  
  // Get current time in Mountain Time
  const nowMST = new Date(new Date().toLocaleString('en-US', { timeZone }));
  
  switch (filter) {
    case 'today': {
      const startOfDay = new Date(nowMST);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(nowMST);
      endOfDay.setHours(23, 59, 59, 999);
      
      return {
        startDate: startOfDay.getTime(),
        endDate: endOfDay.getTime(),
      };
    }
    // ... other cases
  }
};
```

---

## Testing the Fix

### Test Case 1: Today Filter
1. Create a new appointment today
2. Navigate to Activity Log
3. Select "Today" filter
4. ✅ Verify the `appointment_created` activity appears

### Test Case 2: Date Range Filters
1. Create appointments on different dates (if possible):
   - Today
   - 3 days ago
   - 10 days ago
   - 35 days ago
2. Test each filter:
   - "Today" → Shows only today's activities
   - "Last 7 Days" → Shows activities from today and 3 days ago
   - "Last 30 Days" → Shows activities from today, 3 days ago, and 10 days ago
   - "All Dates" → Shows all activities including 35 days ago

### Test Case 3: Empty Results
1. Select "Today" filter when no activities exist today
2. ✅ Verify appropriate "No activities found" message displays

---

## Deployment

1. **Deploy Convex Changes:**
   ```powershell
   cd c:\safespace-integration\SafeSpaceApp_Web
   npx convex dev --typecheck=disable
   ```

2. **Deploy Mobile Convex Changes (if separate):**
   ```powershell
   cd c:\mobile-android-safespace\SafeSpace-android
   npx convex deploy
   ```

3. **Test in Development:**
   - Build and run the mobile app
   - Navigate to Activity Log
   - Test all date filters

---

## Additional Activity Types to Track

Consider logging these activity types for a complete activity history:

```typescript
// In appointment mutations:
- "appointment_created" ✅ (already implemented)
- "appointment_cancelled"
- "appointment_rescheduled"
- "appointment_completed"

// In other modules:
- "mood_logged"
- "journal_created"
- "assessment_completed"
- "post_created"
- "post_reacted"
```

**Example:**
```typescript
// When cancelling an appointment:
await ctx.db.insert("activities", {
  userId: appointment.userId,
  activityType: "appointment_cancelled",
  metadata: {
    appointmentId: appointment._id,
    appointmentDate: appointment.date,
    appointmentTime: appointment.time,
    reason: cancellationReason,
    timestamp: Date.now(),
  },
  createdAt: Date.now(),
});
```

---

## Next Steps

1. ✅ Backend queries updated (COMPLETE)
2. ⏳ **Find and update the Activity Log screen component**
3. ⏳ **Implement frontend date filtering using `getDateRange()` helper**
4. ⏳ **Test all date filters**
5. ⏳ **Deploy to production**

---

## Questions or Issues?

If the Activity Log screen is in a different location or uses a different implementation, please share:
1. The file path of the Activity Log screen
2. A screenshot of the current code that renders the activity list
3. How the date filter dropdown is currently implemented

This will help ensure the frontend integration matches the backend changes.
