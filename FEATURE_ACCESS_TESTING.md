# Feature Access Control - Testing Guide

## ✅ System Status: READY FOR TESTING

The feature access control system is now **fully integrated** into the mobile app. All infrastructure is in place and UI components are filtering based on organization settings.

---

## 🎯 What's Been Implemented

### Backend
- ✅ Web admin dashboard with feature toggles (8 features)
- ✅ Organization settings store enabled features in `settings.features` array
- ✅ Convex query `getFeatures` returns enabled features for user's organization
- ✅ Mobile app has `organizations.ts` with getFeatures query

### Frontend
- ✅ `FeatureAccessProvider` context wrapping entire app
- ✅ `useFeatureAccess()` hook available throughout app
- ✅ `hasFeature(name)` function to check feature availability
- ✅ **Bottom navigation tabs** filtered by features
- ✅ **Quick actions** on home screen filtered by features
- ✅ **Side menu items** filtered by features
- ✅ Test component available at `/feature-test` route

---

## 📋 Feature IDs

| Feature ID | Description | Mobile Components |
|-----------|-------------|-------------------|
| `appointments` | Appointments system | Tab, Menu item |
| `video_consultation` | Video consultations | Menu item |
| `mood_tracking` | Mood tracking | Quick action, Menu item |
| `crisis_support` | Crisis support | Quick action, Menu item |
| `resources` | Resources library | Quick action, Menu item |
| `community` | Community forum | Tab, Menu item |
| `messaging` | Direct messaging | Tab, Menu item |
| `assessments` | Self-assessments | Menu item (when due) |

---

## 🧪 How to Test

### Step 1: Verify Current State
1. Navigate to `/feature-test` in your mobile app
2. You should see **ALL 8 features enabled** (green checkmarks)
3. All tabs and menu items should be visible

### Step 2: Disable Features in Web Admin
1. Open **SafeSpaceApp_Web** (localhost:3000 or deployed URL)
2. Navigate to **Super Admin → Organizations**
3. Click on your organization (e.g., "TestOrg SafeSpace")
4. Click **Edit** button
5. Scroll to **Feature Access Control** section
6. **Disable** some features by toggling them OFF:
   - Turn OFF: `appointments`
   - Turn OFF: `video_consultation`
   - Turn OFF: `mood_tracking`
7. Click **Save Changes**

### Step 3: Verify Features Are Hidden in Mobile
1. **Reload your mobile app** (close and reopen or refresh)
2. Navigate to `/feature-test` to verify:
   - Enabled features should show ✅
   - Disabled features should show ⛔
3. Check **Home Screen**:
   - Bottom tabs: `Appointments` tab should be **hidden**
   - Quick actions: `Track Mood` should be **hidden**
4. Open **Side Menu** (hamburger icon):
   - `Appointments` should be **hidden**
   - `Video Consultations` should be **hidden**
   - `Mood Tracking` should be **hidden**

### Step 4: Re-enable Features
1. Go back to web admin
2. Toggle features back ON
3. Save changes
4. Reload mobile app
5. Verify tabs/menu items **reappear**

---

## 🔍 Debug Information

### Logs to Check
Look for these console logs in your mobile app:

```
=== FEATURE ACCESS DEBUG ===
[FeatureAccessProvider] ClerkId: user_xxxxx
[FeatureAccessProvider] Features from Convex: Array(8) or Array(N)
[FeatureAccessProvider] Features array: ["appointments","video_consultation",...]
============================
```

### Expected Behavior

**When features array is:**
- `undefined` = Loading state (all features allowed temporarily)
- `[]` (empty) = **Block ALL features** (none enabled)
- `["appointments", "messaging"]` = **Only allow those 2 features**

### Feature Check Logic
```typescript
hasFeature("appointments")
// Returns true if:
// - features is undefined (loading)
// - features includes "appointments"
// Returns false if:
// - features is empty array
// - features doesn't include "appointments"
```

---

## 🎨 UI Integration Points

### 1. Bottom Navigation (home.tsx)
```typescript
const { hasFeature } = useFeatureAccess();

const allTabs = [
  { id: "home", feature: null }, // Always visible
  { id: "appointments", feature: "appointments" },
  { id: "messages", feature: "messaging" },
  ...
];

const tabs = allTabs.filter(tab => !tab.feature || hasFeature(tab.feature));
```

### 2. Quick Actions (home.tsx)
```typescript
const allQuickActions = [
  { id: "mood", feature: "mood_tracking" },
  { id: "crisis", feature: "crisis_support" },
  { id: "resources", feature: "resources" },
  ...
];

const quickActions = allQuickActions.filter(
  action => !action.feature || hasFeature(action.feature)
);
```

### 3. Side Menu (AppHeader.tsx)
```typescript
const { hasFeature } = useFeatureAccess();

const baseMenuItems = [
  { title: "Appointments", show: hasFeature("appointments") },
  { title: "Video Consultations", show: hasFeature("video_consultation") },
  { title: "Mood Tracking", show: hasFeature("mood_tracking") },
  ...
];

const sideMenuItems = baseMenuItems.filter(item => item.show);
```

---

## 📊 Test Scenarios

### Scenario 1: Disable All Optional Features
**Setup:** Disable all features except core ones (home, profile, journal)
**Expected:**
- Only Home and Profile tabs visible
- No quick actions shown (or only journal if it has no feature flag)
- Side menu shows only: Dashboard, Profile, Journaling, Announcements, Sign Out

### Scenario 2: Enable Only Communication
**Setup:** Enable only `messaging` and `community`
**Expected:**
- Tabs: Home, Community, Messages, Profile
- Quick actions: None related to mood/crisis/resources
- Side menu: Messages and Community Forum visible

### Scenario 3: Clinical Features Only
**Setup:** Enable only `appointments`, `assessments`, `mood_tracking`
**Expected:**
- Tabs: Home, Appointments, Profile
- Quick actions: Track Mood
- Side menu: Appointments, Self-Assessment (if due), Mood Tracking

---

## 🐛 Troubleshooting

### Features Not Hiding
**Check:**
1. Did you save changes in web admin?
2. Did you reload the mobile app?
3. Is the mobile app connected to the same Convex deployment as web?
4. Check console for `[FeatureAccessProvider]` logs

### All Features Show as Blocked
**Likely cause:** Organization has `settings.features = []` (empty array)
**Fix:** In web admin, enable at least one feature and save

### Test Screen Shows Undefined
**Likely cause:** User not logged in or query not executing
**Check:** Console should show clerkId in debug logs

---

## ✅ Success Criteria

Feature access control is working when:

1. ✅ Debug logs show correct features array
2. ✅ Disabling a feature in web admin hides it in mobile
3. ✅ Re-enabling a feature makes it visible again
4. ✅ Tab navigation updates dynamically
5. ✅ Side menu filters correctly
6. ✅ Quick actions respect feature flags
7. ✅ No errors in console

---

## 📝 Next Steps (Optional)

- Add loading indicators while features query loads
- Add "Feature Disabled" screens for direct navigation attempts
- Cache features in AsyncStorage for offline access
- Add admin override/testing mode
- Integrate into more screens (video consultation, resources, etc.)

---

**Current Status:** ✅ READY FOR PRODUCTION TESTING
**Last Updated:** December 6, 2025
