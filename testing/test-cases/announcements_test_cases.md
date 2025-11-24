# Announcements Feature - Test Cases

**Feature:** Announcements Screen  
**Component:** `app/(app)/announcements/index.tsx`  
**Test Suite:** `__tests__/screens/announcements.test.tsx`  
**Created:** November 23, 2025

---

## Overview

The Announcements screen displays organization-specific announcements to authenticated users. It supports multi-organization functionality (CMHA Calgary, CMHA Edmonton, SAIT, Unaffiliated), real-time updates via Convex, read/unread tracking, expandable announcement cards, and automatic seeding of sample data.

---

## Test Categories

### 1. Authentication & Authorization Tests
### 2. Organization Management Tests
### 3. Announcement Display Tests
### 4. Read/Unread Functionality Tests
### 5. User Interaction Tests
### 6. Data Management Tests
### 7. UI/UX Tests
### 8. Navigation Tests
### 9. Error Handling Tests

---

## Positive Test Cases

### Category 1: Authentication & Authorization

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-P01 | High | User not authenticated | Display "Sign in Required" message with lock icon |
| TC-ANNOUNCE-P02 | High | User authenticated successfully | Display announcements screen with user's organization |
| TC-ANNOUNCE-P03 | Medium | User ID available in auth context | Fetch and display announcements for user's organization |

---

### Category 2: Organization Management

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-P04 | High | Display organization from Clerk metadata | Show organization badge with correct color and label |
| TC-ANNOUNCE-P05 | High | CMHA Calgary organization | Display green badge (#4CAF50) with "CMHA Calgary" label |
| TC-ANNOUNCE-P06 | High | CMHA Edmonton organization | Display teal badge (#7CB9A9) with "CMHA Edmonton" label |
| TC-ANNOUNCE-P07 | High | SAIT organization | Display blue badge (#0055A4) with "SAIT" label |
| TC-ANNOUNCE-P08 | Medium | Unaffiliated organization | Display primary color badge with "Unaffiliated" label |
| TC-ANNOUNCE-P09 | High | Clerk metadata org differs from Convex | Sync org to Convex using syncCurrentUserOrg mutation |
| TC-ANNOUNCE-P10 | Medium | Organization subtitle display | Show full organization name in banner subtitle |
| TC-ANNOUNCE-P11 | Low | Organization stat display | Show organization name in stats container |

---

### Category 3: Announcement Display

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-P12 | High | Empty announcements list | Display "No announcements yet" with megaphone icon |
| TC-ANNOUNCE-P13 | High | Announcements list with items | Display all announcements in FlatList |
| TC-ANNOUNCE-P14 | High | Announcement card structure | Display title, body, time, icon, and expand control |
| TC-ANNOUNCE-P15 | Medium | Announcement title display | Show title with bold font (700 weight), 16px size |
| TC-ANNOUNCE-P16 | Medium | Announcement body display | Show body text with 14px size, line height 22 |
| TC-ANNOUNCE-P17 | Medium | Announcement time display | Show relative time (e.g., "Today", "Yesterday") |
| TC-ANNOUNCE-P18 | Low | Announcement icon display | Show megaphone icon in circular badge |
| TC-ANNOUNCE-P19 | High | Loading state | Display spinner with "Loading announcements..." text |
| TC-ANNOUNCE-P20 | Medium | List scrolling | Enable vertical scrolling with hidden scroll indicator |

---

### Category 4: Read/Unread Functionality

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-P21 | High | Unread announcement | Display green left border (4px, #4CAF50) and "NEW" badge |
| TC-ANNOUNCE-P22 | High | Read announcement | Display gray left border with no "NEW" badge |
| TC-ANNOUNCE-P23 | High | Unread count display | Show correct count of unread announcements in stats |
| TC-ANNOUNCE-P24 | High | Total count display | Show total number of announcements in stats |
| TC-ANNOUNCE-P25 | High | Mark as read on expand | Mark announcement as read when expanded |
| TC-ANNOUNCE-P26 | Medium | Icon color for unread | Show green megaphone icon (#4CAF50) |
| TC-ANNOUNCE-P27 | Medium | Icon color for read | Show gray megaphone icon |
| TC-ANNOUNCE-P28 | Medium | Icon background for unread | Show light green background (#E8F5E9) |
| TC-ANNOUNCE-P29 | Medium | Icon background for read | Show gray background |
| TC-ANNOUNCE-P30 | High | User ID in readBy array | Check if userId exists in announcement.readBy |

---

### Category 5: User Interaction

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-P31 | High | Tap announcement card | Toggle expand/collapse state |
| TC-ANNOUNCE-P32 | High | Expand announcement | Show full body text and "Show less ▲" control |
| TC-ANNOUNCE-P33 | High | Collapse announcement | Show truncated body (3 lines) and "Read more ▼" control |
| TC-ANNOUNCE-P34 | High | Tap "Read more" control | Expand announcement and mark as read |
| TC-ANNOUNCE-P35 | Medium | Tap "Show less" control | Collapse announcement to 3 lines |
| TC-ANNOUNCE-P36 | Medium | Multiple announcements expanded | Allow multiple cards to be expanded simultaneously |
| TC-ANNOUNCE-P37 | Low | Press announcement pressable | Trigger onPress handler correctly |

---

### Category 6: Data Management

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-P38 | High | Query announcements by org | Fetch announcements filtered by orgId |
| TC-ANNOUNCE-P39 | High | Active announcements only | Query with activeOnly: true parameter |
| TC-ANNOUNCE-P40 | Medium | Limit announcements to 100 | Query with limit: 100 parameter |
| TC-ANNOUNCE-P41 | High | Auto-seed on empty data | Call seedSampleAnnouncements when length === 0 |
| TC-ANNOUNCE-P42 | High | Auto-reseed on old data | Call clearAndReseed when length === 2 (old seed) |
| TC-ANNOUNCE-P43 | Medium | Prevent duplicate seeding | Track seeded state to avoid multiple seed calls |
| TC-ANNOUNCE-P44 | High | Mark announcement as read mutation | Call markAsRead with announcementId |
| TC-ANNOUNCE-P45 | Medium | Sync org to Convex | Call syncCurrentUserOrg when Clerk org differs |

---

### Category 7: UI/UX

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-P46 | High | Stats container display | Show organization, unread count, and total count |
| TC-ANNOUNCE-P47 | Medium | Stats container styling | Rounded corners (16px), shadow, white/surface background |
| TC-ANNOUNCE-P48 | Medium | Card styling | Rounded corners (16px), padding, shadow, left border |
| TC-ANNOUNCE-P49 | Low | Icon sizes | Organization icon: 20px, megaphone: 20px, empty state: 64px |
| TC-ANNOUNCE-P50 | Medium | Organization banner display | Show org ribbon icon, label, and subtitle |
| TC-ANNOUNCE-P51 | Medium | Organization banner colors | Apply org-specific color (green/teal/blue/primary) |
| TC-ANNOUNCE-P52 | Low | Dividers in stats | Show vertical dividers between stat boxes |
| TC-ANNOUNCE-P53 | High | Theme integration | Apply theme colors to text, backgrounds, borders |
| TC-ANNOUNCE-P54 | Medium | Empty state styling | Center content with icon, title, subtitle |
| TC-ANNOUNCE-P55 | Low | Text truncation | Truncate org name in stats with ellipsis |

---

### Category 8: Navigation

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-P56 | High | Display AppHeader | Show "Announcements" title with back button |
| TC-ANNOUNCE-P57 | High | Display BottomNavigation | Show 5 tabs (Home, Community, Appointments, Messages, Profile) |
| TC-ANNOUNCE-P58 | High | Tap Home tab | Call router.replace("/(app)/(tabs)/home") |
| TC-ANNOUNCE-P59 | High | Tap Community tab | Call router.push("/(app)/(tabs)/community-forum") |
| TC-ANNOUNCE-P60 | Medium | Tap Appointments tab | Call router.push("/(app)/(tabs)/appointments") |
| TC-ANNOUNCE-P61 | Medium | Tap Messages tab | Call router.push("/(app)/(tabs)/messages") |
| TC-ANNOUNCE-P62 | Medium | Tap Profile tab | Call router.push("/(app)/(tabs)/profile") |
| TC-ANNOUNCE-P63 | Low | Active tab state | Update activeTab state on tab press |

---

## Negative Test Cases

### Category 9: Error Handling

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-N01 | High | userId is null/undefined | Display "Sign in Required" screen |
| TC-ANNOUNCE-N02 | High | Convex query returns undefined | Display loading spinner |
| TC-ANNOUNCE-N03 | Medium | Convex query returns empty array | Display "No announcements yet" empty state |
| TC-ANNOUNCE-N04 | High | Invalid orgId value | Fallback to "cmha-calgary" default |
| TC-ANNOUNCE-N05 | Medium | Clerk publicMetadata missing orgId | Use Convex org value or fallback |
| TC-ANNOUNCE-N06 | Medium | Both Clerk and Convex org undefined | Use "cmha-calgary" fallback |
| TC-ANNOUNCE-N07 | High | markAsRead mutation fails | Catch error silently, don't crash UI |
| TC-ANNOUNCE-N08 | High | seedSampleAnnouncements mutation fails | Reset seeded state to false, allow retry |
| TC-ANNOUNCE-N09 | Medium | syncCurrentUserOrg mutation fails | Catch error silently, don't crash UI |
| TC-ANNOUNCE-N10 | Low | Announcement missing id field | Handle gracefully with keyExtractor |
| TC-ANNOUNCE-N11 | Low | Announcement missing title | Display empty title |
| TC-ANNOUNCE-N12 | Low | Announcement missing body | Display empty body |
| TC-ANNOUNCE-N13 | Low | Announcement missing time | Display empty time string |
| TC-ANNOUNCE-N14 | Low | readBy array is undefined | Treat as unread (show NEW badge) |
| TC-ANNOUNCE-N15 | Medium | Invalid orgId in query args | Skip query or fallback |

---

## Edge Cases

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-E01 | Medium | Very long announcement title | Truncate to 2 lines with numberOfLines prop |
| TC-ANNOUNCE-E02 | Medium | Very long announcement body | Truncate to 3 lines when collapsed |
| TC-ANNOUNCE-E03 | Low | Very long org name | Truncate with ellipsis in stats container |
| TC-ANNOUNCE-E04 | Medium | 100+ announcements | Display all with scroll, limit query to 100 |
| TC-ANNOUNCE-E05 | Low | All announcements read | Show unread count as 0 |
| TC-ANNOUNCE-E06 | Low | All announcements unread | Show all with NEW badges |
| TC-ANNOUNCE-E07 | Medium | Switch organization mid-session | Re-fetch announcements for new org |
| TC-ANNOUNCE-E08 | Low | Screen width changes (rotation) | Responsive layout adapts |
| TC-ANNOUNCE-E09 | Medium | Dark theme enabled | Apply dark theme colors correctly |
| TC-ANNOUNCE-E10 | Low | Rapid tap on expand control | Handle state updates correctly |

---

## Performance Test Cases

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-PERF01 | Medium | Load 100 announcements | Render within 2 seconds |
| TC-ANNOUNCE-PERF02 | Low | Scroll through 100 items | Smooth scrolling with no jank |
| TC-ANNOUNCE-PERF03 | Low | Expand/collapse multiple items | Instant state updates (<100ms) |
| TC-ANNOUNCE-PERF04 | Medium | Initial component mount | Render loading state within 500ms |
| TC-ANNOUNCE-PERF05 | Low | Query data fetch | Display results within 1 second |

---

## Accessibility Test Cases

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-A01 | Medium | Screen reader compatibility | All text readable by screen readers |
| TC-ANNOUNCE-A02 | Low | High contrast mode | Sufficient contrast ratios (WCAG AA) |
| TC-ANNOUNCE-A03 | Low | Large text mode | UI adapts to larger text sizes |
| TC-ANNOUNCE-A04 | Medium | Touch target sizes | All pressable areas ≥44x44 dp |

---

## Integration Test Cases

| Test Case ID | Priority | Test Scenario | Expected Result |
|--------------|----------|---------------|-----------------|
| TC-ANNOUNCE-INT01 | High | Convex listByOrg query | Fetch announcements successfully |
| TC-ANNOUNCE-INT02 | High | Convex getMyOrg query | Retrieve user's organization |
| TC-ANNOUNCE-INT03 | High | Convex markAsRead mutation | Update announcement read status |
| TC-ANNOUNCE-INT04 | Medium | Convex seedSampleAnnouncements | Create sample announcements |
| TC-ANNOUNCE-INT05 | Medium | Convex clearAndReseed | Clear old data and reseed |
| TC-ANNOUNCE-INT06 | Medium | Convex syncCurrentUserOrg | Sync org from Clerk to Convex |
| TC-ANNOUNCE-INT07 | High | Clerk auth userId | Access user ID for queries |
| TC-ANNOUNCE-INT08 | High | Clerk publicMetadata | Read orgId from user metadata |

---

## Summary Statistics

| Category | Total Cases | High Priority | Medium Priority | Low Priority |
|----------|-------------|---------------|-----------------|--------------|
| **Positive Tests** | 63 | 32 | 24 | 7 |
| **Negative Tests** | 15 | 7 | 6 | 2 |
| **Edge Cases** | 10 | 0 | 5 | 5 |
| **Performance** | 5 | 1 | 3 | 1 |
| **Accessibility** | 4 | 1 | 2 | 1 |
| **Integration** | 8 | 5 | 3 | 0 |
| **TOTAL** | **105** | **46** | **43** | **16** |

---

## Test Execution Priority

### Phase 1 (Critical - Must Pass for Production)
- All High Priority test cases (46 cases)
- Focus areas: Authentication, Organization sync, Read/Unread tracking, Data fetching

### Phase 2 (Important - Should Pass for Production)
- All Medium Priority test cases (43 cases)
- Focus areas: UI/UX validation, Navigation, Error handling

### Phase 3 (Nice to Have - Can defer)
- All Low Priority test cases (16 cases)
- Focus areas: Visual polish, Edge cases, Performance optimizations

---

## Test Data Requirements

### Sample Organizations
```javascript
const testOrgs = [
  { id: "cmha-calgary", label: "CMHA Calgary", color: "#4CAF50" },
  { id: "cmha-edmonton", label: "CMHA Edmonton", color: "#7CB9A9" },
  { id: "sait", label: "SAIT", color: "#0055A4" },
  { id: "unaffiliated", label: "Unaffiliated", color: "#primary" }
];
```

### Sample Announcements
```javascript
const testAnnouncements = [
  {
    id: "a1",
    title: "Welcome to SafeSpace",
    body: "We're excited to have you here! Explore our mental health resources.",
    time: "Today",
    orgId: "sait",
    readBy: [],
    isActive: true
  },
  {
    id: "a2",
    title: "New Support Groups Starting",
    body: "Join our weekly peer support groups. Registration opens Monday.",
    time: "Yesterday",
    orgId: "sait",
    readBy: ["test-user-id"],
    isActive: true
  },
  {
    id: "a3",
    title: "Campus Mental Health Week",
    body: "Participate in workshops, wellness activities, and free counseling sessions. This is a longer body text to test the expand/collapse functionality with multiple lines of content that should be truncated when collapsed.",
    time: "2 days ago",
    orgId: "sait",
    readBy: [],
    isActive: true
  }
];
```

### Sample User Data
```javascript
const testUser = {
  userId: "test-user-id",
  orgId: "sait",
  clerkMetadata: { orgId: "sait" },
  convexOrg: "sait"
};
```

---

## Test Environment Setup

### Required Mocks
1. **Convex React Hooks:**
   - `useQuery` for announcements list, user org
   - `useMutation` for markAsRead, seed, clearAndReseed, syncCurrentUserOrg

2. **Clerk Authentication:**
   - `useAuth` for userId
   - `useUser` for publicMetadata.orgId

3. **Expo Router:**
   - `router.push()` for navigation
   - `router.replace()` for home tab

4. **React Native Components:**
   - Dimensions.get("window") for width
   - FlatList rendering and scrolling
   - Pressable touch events

### Test Utilities
- `renderWithProviders()` - Wraps component in ThemeProvider, NotificationsProvider
- `waitFor()` - Async operations (query loading, mutations)
- `fireEvent.press()` - User interactions
- `act()` - State updates

---

## Notes

1. **Organization Sync Logic:** Clerk publicMetadata is the source of truth; Convex org is synced automatically when different.

2. **Auto-Seeding Behavior:**
   - Seeds when announcements.length === 0 (empty state)
   - Reseeds when announcements.length === 2 (old seed data)
   - Prevents duplicate seeding with `seeded` state flag

3. **Read/Unread Tracking:**
   - Announcements marked as read when expanded
   - userId checked in announcement.readBy array
   - Unread count computed via useMemo for performance

4. **Theme Integration:**
   - All colors use theme.colors for dark mode support
   - Organization banners use org-specific colors (#4CAF50, #7CB9A9, #0055A4)

5. **Query Optimization:**
   - Query skipped when userId is null (not authenticated)
   - Queries use stable references via useMemo to prevent rerenders

---

**Document Version:** 1.0  
**Last Updated:** November 23, 2025  
