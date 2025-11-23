# Updated Messages Test Cases - Convex Implementation

## Test Case Overview
Updated test cases based on current Convex implementation replacing SendBird functionality.

## Messages Main Screen Test Cases

### TC-MSG-P01: Verify Messages Screen Display
**Objective**: Verify that the messages screen displays correctly with all UI elements
**Preconditions**: 
- User is authenticated via Clerk
- App is connected to Convex backend
- User has proper permissions

**Test Steps**:
1. Navigate to Messages tab
2. Verify screen loads without errors
3. Check that search bar is displayed with placeholder text
4. Verify filter tabs are visible (All, Unread, Read)
5. Confirm new message button (+) is present
6. Check loading state or conversation list displays

**Expected Result**: 
- Messages screen renders successfully
- All UI components are visible and properly styled
- Search functionality is available
- Filter tabs respond to touch
- New message button is accessible

**Test Data**: N/A
**Status**: Pass/Fail
**Notes**: Uses Convex queries for conversation loading

---

### TC-MSG-P02: Verify Search Functionality
**Objective**: Test search functionality for conversations
**Preconditions**: 
- User is on messages screen
- Multiple conversations exist
- Search feature is enabled

**Test Steps**:
1. Tap on search bar
2. Enter search text for existing conversation
3. Verify search results update in real-time
4. Clear search and verify results reset
5. Search for non-existent conversation
6. Verify appropriate empty state

**Expected Result**: 
- Search filters conversations in real-time
- Results match search criteria
- Clear search resets to full conversation list
- Empty state displays for no matches
- Search is case-insensitive

**Test Data**: Existing conversation names/participants
**Status**: Pass/Fail
**Notes**: Uses Convex searchConversations query

---

### TC-MSG-P03: Verify Filter Tabs (All/Unread/Read)
**Objective**: Test conversation filtering functionality
**Preconditions**: 
- User has conversations with mixed read/unread status
- Filter tabs are visible

**Test Steps**:
1. Verify "All" tab shows all conversations
2. Tap "Unread" tab and verify only unread conversations display
3. Tap "Read" tab and verify only read conversations display
4. Switch between tabs and verify correct filtering
5. Verify active tab is visually highlighted

**Expected Result**: 
- Each filter shows appropriate conversations
- Tab switching works smoothly
- Visual indicators show active tab
- Conversation counts are accurate
- Filter state persists during session

**Test Data**: Conversations with various read states
**Status**: Pass/Fail
**Notes**: Uses AsyncStorage for read status persistence

---

### TC-MSG-P04: Verify New Message Navigation
**Objective**: Test navigation to new message screen
**Preconditions**: 
- User is on messages main screen
- New message button is visible

**Test Steps**:
1. Tap the new message button (+)
2. Verify navigation to new message modal screen
3. Check that modal displays properly
4. Verify close button functionality
5. Test back navigation to messages screen

**Expected Result**: 
- New message modal opens successfully
- Modal displays with proper header and close button
- User can navigate back to messages screen
- Modal presentation is smooth
- Screen state is preserved on return

**Test Data**: N/A
**Status**: Pass/Fail
**Notes**: Uses expo-router for navigation

---

### TC-MSG-P05: Verify Conversation List Display
**Objective**: Test conversation list rendering and interaction
**Preconditions**: 
- User has existing conversations
- Convex backend is accessible

**Test Steps**:
1. Verify conversations load from Convex
2. Check conversation item displays (avatar, name, last message, timestamp)
3. Verify online status indicators
4. Test conversation item tap navigation
5. Check unread message indicators

**Expected Result**: 
- Conversations load via Convex API
- Each conversation shows complete information
- Online presence indicators work correctly
- Tapping conversation navigates to chat
- Unread badges display accurately

**Test Data**: Existing conversations with various states
**Status**: Pass/Fail
**Notes**: Uses api.conversations.listForUserEnriched query

---

## New Message Screen Test Cases

### TC-MSG-P06: Verify New Message Screen Display
**Objective**: Test new message screen UI and functionality
**Preconditions**: 
- User navigated from messages main screen
- Modal presentation is active

**Test Steps**:
1. Verify modal displays with proper header
2. Check "To:" field is present and focusable
3. Verify suggested users section loads
4. Test search input functionality
5. Confirm close button works

**Expected Result**: 
- Modal renders with complete UI
- Search input accepts text and triggers search
- Suggested users load from Convex
- User can close modal and return
- Auto-focus on search field works

**Test Data**: N/A
**Status**: Pass/Fail
**Notes**: Uses Convex api.profiles.searchUsers

---

### TC-MSG-P07: Verify User Search Functionality
**Objective**: Test user search in new message screen
**Preconditions**: 
- User is in new message modal
- Search input is active

**Test Steps**:
1. Enter user email/name in search field
2. Verify debounced search triggers (500ms delay)
3. Check search results display correctly
4. Test user selection and conversation creation
5. Verify search results clear on selection

**Expected Result**: 
- Search triggers after debounce delay
- Results show matching users
- User selection creates conversation
- Navigation to chat screen occurs
- Search state resets properly

**Test Data**: Valid user emails/names in system
**Status**: Pass/Fail
**Notes**: Uses Convex searchUsers with debouncing

---

### TC-MSG-P08: Verify Suggested Users Display
**Objective**: Test suggested users functionality
**Preconditions**: 
- New message screen is open
- Search field is empty

**Test Steps**:
1. Verify suggested users section appears
2. Check users load from Convex
3. Verify user avatars and names display
4. Test online status indicators
5. Confirm user selection works

**Expected Result**: 
- Suggested users load automatically
- User information displays completely
- Online status shows correctly
- User selection starts conversation
- Self is excluded from suggestions

**Test Data**: Available users in system
**Status**: Pass/Fail
**Notes**: Loads up to 20 suggested users via Convex

---

## Chat Screen Test Cases

### TC-MSG-P09: Verify Chat Screen Display
**Objective**: Test individual chat screen functionality
**Preconditions**: 
- User navigated to specific conversation
- Conversation ID is valid

**Test Steps**:
1. Verify chat screen loads with conversation
2. Check message history displays
3. Verify message input field is present
4. Test send button functionality
5. Check attachment button works

**Expected Result**: 
- Chat loads with message history
- Messages display in chronological order
- Input field allows text entry
- Send functionality works
- Attachment options are available

**Test Data**: Existing conversation with messages
**Status**: Pass/Fail
**Notes**: Uses Convex messages and conversations queries

---

### TC-MSG-P10: Verify Message Sending
**Objective**: Test message composition and sending
**Preconditions**: 
- User is in active chat screen
- Keyboard is accessible

**Test Steps**:
1. Type message in input field
2. Tap send button
3. Verify message appears in chat
4. Check message timestamp
5. Confirm message saves to Convex

**Expected Result**: 
- Text input accepts message content
- Send button is enabled when text present
- Message appears immediately in chat
- Timestamp is accurate
- Message persists in conversation

**Test Data**: Sample text message content
**Status**: Pass/Fail
**Notes**: Uses Convex sendMessage mutation

---

### TC-MSG-P11: Verify File Attachment Functionality
**Objective**: Test file attachment capabilities
**Preconditions**: 
- User is in chat screen
- Device has file access permissions

**Test Steps**:
1. Tap attachment button
2. Select file from device picker
3. Verify file validation (size, type)
4. Confirm file upload process
5. Check file message display

**Expected Result**: 
- File picker opens correctly
- Selected files pass validation
- Upload progress shows if needed
- File messages display with proper icons
- Files are downloadable/viewable

**Test Data**: Various file types (images, documents, etc.)
**Status**: Pass/Fail
**Notes**: Supports multiple file types with validation

---

### TC-MSG-N01: Verify Error Handling - Network Issues
**Objective**: Test behavior during network connectivity problems
**Preconditions**: 
- App is running normally
- Network can be disabled/limited

**Test Steps**:
1. Disable network connection
2. Attempt to load messages
3. Try to send a message
4. Reconnect network
5. Verify recovery behavior

**Expected Result**: 
- Appropriate error messages display
- App doesn't crash on network errors
- Messages queue for sending when offline
- Automatic retry on reconnection
- User is informed of connection status

**Test Data**: N/A
**Status**: Pass/Fail
**Notes**: Convex handles connection management

---

### TC-MSG-N02: Verify Error Handling - Invalid Conversation
**Objective**: Test behavior with invalid conversation IDs
**Preconditions**: 
- User attempts to access non-existent conversation

**Test Steps**:
1. Navigate with invalid conversation ID
2. Verify error handling
3. Check user feedback
4. Test navigation back to messages list
5. Confirm no app crash occurs

**Expected Result**: 
- Invalid conversation handled gracefully
- Clear error message shown to user
- Navigation remains functional
- App stability maintained
- Fallback to messages list works

**Test Data**: Invalid/non-existent conversation IDs
**Status**: Pass/Fail
**Notes**: Uses Convex query error handling

---

### TC-MSG-N03: Verify Error Handling - File Upload Failures
**Objective**: Test behavior when file uploads fail
**Preconditions**: 
- User is attempting file attachment
- File upload can fail (large file, network issue)

**Test Steps**:
1. Select large file exceeding limits
2. Attempt upload during poor connectivity
3. Verify error messages display
4. Test retry functionality
5. Confirm graceful failure handling

**Expected Result**: 
- File size limits enforced
- Network errors handled gracefully
- Clear error messages provided
- Retry options available where appropriate
- No data loss on failure

**Test Data**: Oversized files, network interruption scenarios
**Status**: Pass/Fail
**Notes**: File validation and error handling implemented

---

## Real-Time Features Test Cases

### TC-MSG-P12: Verify Real-Time Message Updates
**Objective**: Test real-time message synchronization
**Preconditions**: 
- Multiple users in same conversation
- Convex real-time subscriptions active

**Test Steps**:
1. Have second user send message
2. Verify message appears without refresh
3. Check timestamp accuracy
4. Test typing indicators if implemented
5. Verify read status updates

**Expected Result**: 
- Messages appear instantly
- No manual refresh needed
- Timestamps are synchronized
- Real-time features work smoothly
- Read status updates correctly

**Test Data**: Multi-user test scenario
**Status**: Pass/Fail
**Notes**: Convex provides real-time subscriptions

---

### TC-MSG-P13: Verify Presence Indicators
**Objective**: Test online/offline status indicators
**Preconditions**: 
- Multiple users available for testing
- Presence tracking enabled

**Test Steps**:
1. Verify online indicators in conversation list
2. Check presence in chat headers
3. Test status changes (online/offline)
4. Verify last active timestamps
5. Confirm presence accuracy

**Expected Result**: 
- Online status displays correctly
- Status changes reflect in real-time
- Last active times are accurate
- Visual indicators are clear
- Presence data is reliable

**Test Data**: Multiple user accounts for testing
**Status**: Pass/Fail
**Notes**: Uses Convex presence tracking system