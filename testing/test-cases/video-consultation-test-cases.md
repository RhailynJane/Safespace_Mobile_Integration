# Video Consultations Test Cases (Updated for Convex Implementation)

## Test Case ID: TC-VID-P01
**Test Case Title:** Verify Video Consultations Screen Loading  
**Test Category:** UI Rendering  
**Priority:** High  

### Preconditions:
- App is running and user is authenticated via Clerk
- User has access to video consultations feature
- Convex backend is available and responsive

### Test Steps:
1. Navigate to Video Consultations screen
2. Verify loading state is displayed
3. Wait for Convex appointment data to load
4. Verify screen renders with proper UI elements

### Expected Results:
- Screen displays "Loading appointments..." message initially
- CurvedBackground component renders correctly
- Screen transitions from loading to content view
- Technical requirements section is visible
- Navigation elements are properly displayed

### Test Data:
- Authenticated user with valid Convex session
- Mock appointment data from Convex backend

---

## Test Case ID: TC-VID-P02
**Test Case Title:** Verify Upcoming Appointments Display  
**Test Category:** Data Display  
**Priority:** High  

### Preconditions:
- User is authenticated and has active Convex session
- User has upcoming video consultation appointments
- Current time is before appointment start time

### Test Steps:
1. Load Video Consultations screen
2. Verify upcoming appointments are filtered correctly
3. Check appointment details display (date, time, support worker)
4. Verify join button state based on appointment timing
5. Confirm organization-specific role labeling (SAIT vs CMHA)

### Expected Results:
- Only upcoming video consultation appointments are displayed
- Appointment details show correct information
- Join button is disabled if not within allowed time window
- Support worker names display with organization-specific labels
- Time calculations use Mountain Time zone correctly

### Test Data:
- Multiple appointments with different statuses
- Appointments within and outside join time window
- Different organization contexts (SAIT/CMHA)

---

## Test Case ID: TC-VID-P03
**Test Case Title:** Verify Appointment Join Time Restrictions  
**Test Category:** Business Logic  
**Priority:** High  

### Preconditions:
- User has upcoming video consultation appointment
- Current time varies relative to appointment time

### Test Steps:
1. Access appointment more than 10 minutes before scheduled time
2. Verify join button is disabled with appropriate message
3. Access appointment within 10 minutes before scheduled time
4. Verify join button becomes enabled
5. Access appointment after scheduled end time (60+ minutes after start)
6. Verify join button is disabled for late access

### Expected Results:
- Join button disabled more than 10 minutes before appointment
- Join button enabled 10 minutes before to 60 minutes after start
- Appropriate messaging for different time scenarios
- Time calculations accurate using Mountain Time zone
- UI clearly indicates when user can join the meeting

### Test Data:
- Appointment scheduled for specific Mountain Time
- Current time variations (early, on-time, late scenarios)

---

## Test Case ID: TC-VID-P04
**Test Case Title:** Verify Technical Requirements Display  
**Test Category:** Information Display  
**Priority:** Medium  

### Preconditions:
- User is on Video Consultations main screen
- Technical requirements data is available

### Test Steps:
1. Navigate to Video Consultations screen
2. Locate technical requirements section
3. Verify all required technical information is displayed
4. Check formatting and readability of requirements
5. Confirm requirements are relevant for video consultation setup

### Expected Results:
- Technical requirements section is visible and accessible
- Requirements include necessary hardware/software information
- Information is clearly formatted and easy to understand
- Requirements help users prepare for video consultations
- Section displays consistently across different screen sizes

### Test Data:
- Standard technical requirements for video consultations
- Various device types and screen sizes

---

## Test Case ID: TC-VID-P05
**Test Case Title:** Verify Navigation to Video Call Meeting  
**Test Category:** Navigation & Integration  
**Priority:** High  

### Preconditions:
- User has upcoming appointment within join time window
- Appointment has valid session ID and support worker details
- User is authenticated with Convex

### Test Steps:
1. Access appointment within allowed join time
2. Tap "Join" button for appointment
3. Verify navigation to video-call-meeting screen
4. Confirm proper parameters are passed (sessionId, supportWorkerId, etc.)
5. Verify audio option parameter is included

### Expected Results:
- Navigation successfully routes to video-call-meeting screen
- Session ID is properly passed as parameter
- Support worker information is correctly transferred
- Audio option (phone/none) is included in navigation
- Screen transition is smooth without errors

### Test Data:
- Valid appointment with session ID
- Support worker details from Convex
- Various audio option selections

---

## Test Case ID: TC-VID-P06
**Test Case Title:** Verify Error Handling for Connection Issues  
**Test Category:** Error Handling  
**Priority:** High  

### Preconditions:
- User attempts to access video consultations
- Network connectivity or Convex backend issues occur

### Test Steps:
1. Simulate network connectivity issues
2. Attempt to load Video Consultations screen
3. Verify appropriate error handling and user feedback
4. Test recovery when connectivity is restored
5. Verify graceful degradation of functionality

### Expected Results:
- Clear error messages for connection issues
- User is informed when appointments cannot be loaded
- Screen provides retry options when appropriate
- No crashes or undefined behavior during errors
- Graceful recovery when connection is restored

### Test Data:
- Simulated network failures
- Convex backend unavailability scenarios
- Various error response types

---

## Test Case ID: TC-VID-P07
**Test Case Title:** Verify Video Call Meeting Screen Initialization  
**Test Category:** Video Call Setup  
**Priority:** High  

### Preconditions:
- User successfully navigated from consultations list
- Valid session parameters are available
- Camera and microphone permissions may or may not be granted

### Test Steps:
1. Enter video call meeting screen with valid parameters
2. Verify Convex session attachment and tracking
3. Check initial audio/video state based on audioOption parameter
4. Verify SendBird call initialization (demo mode vs real mode)
5. Confirm UI elements are properly initialized

### Expected Results:
- Session is properly attached to Convex tracking system
- Audio state matches audioOption parameter from navigation
- Camera state initializes correctly (on by default)
- Call status shows "Connecting..." initially
- UI controls are responsive and properly labeled

### Test Data:
- Various audioOption values (phone, none)
- Different permission states for camera/microphone
- Valid session ID from appointment

---

## Test Case ID: TC-VID-P08
**Test Case Title:** Verify Camera Functionality and Permissions  
**Test Category:** Camera Integration  
**Priority:** High  

### Preconditions:
- User is in video call meeting screen
- Device has camera capability

### Test Steps:
1. Check initial camera permission status
2. Test camera permission request flow when needed
3. Verify camera preview displays correctly when permitted
4. Test camera toggle functionality (on/off)
5. Verify camera flip functionality (front/back)
6. Test camera expand to full screen functionality

### Expected Results:
- Permission requests are properly handled
- Camera preview shows real camera feed when permitted
- Camera toggle works correctly with visual feedback
- Front/back camera flip functions properly
- Full screen camera modal works correctly
- Appropriate fallback when permissions denied

### Test Data:
- Different camera permission states
- Front and back camera availability
- Various camera resolution capabilities

---

## Test Case ID: TC-VID-P09
**Test Case Title:** Verify Audio Controls and Options  
**Test Category:** Audio Integration  
**Priority:** High  

### Preconditions:
- User is in active video call meeting
- Audio option was selected during navigation

### Test Steps:
1. Verify initial microphone state matches audioOption
2. Test microphone toggle functionality
3. Verify audio state updates in Convex session tracking
4. Check microphone indicator in UI
5. Test audio settings persistence during call

### Expected Results:
- Initial mic state reflects audioOption (muted if 'none')
- Microphone toggle works with immediate visual feedback
- Convex session tracks audio state changes correctly
- UI clearly shows current microphone status
- Audio settings are maintained throughout call session

### Test Data:
- Different audioOption values ('phone', 'none')
- Microphone permission states
- Session tracking updates

---

## Test Case ID: TC-VID-P10
**Test Case Title:** Verify Interactive Features (Reactions, Hand Raise)  
**Test Category:** Interactive Elements  
**Priority:** Medium  

### Preconditions:
- User is in active video call meeting
- Video call is properly connected

### Test Steps:
1. Test raise hand functionality toggle
2. Verify emoji reaction panel opens correctly
3. Test sending emoji reactions with animations
4. Verify reactions display correctly on screen
5. Check interactive elements don't interfere with video

### Expected Results:
- Raise hand toggle works with visual indicator
- Emoji panel opens with available emoji options
- Reactions animate properly on screen
- Multiple reactions can be sent simultaneously
- Interactive elements overlay video without blocking controls

### Test Data:
- Various emoji reactions from available set
- Multiple simultaneous interactions
- Different screen orientations

---

## Test Case ID: TC-VID-P11
**Test Case Title:** Verify Quality Issue Reporting  
**Test Category:** Quality Management  
**Priority:** Medium  

### Preconditions:
- User is in active video call meeting
- Convex session is properly tracked

### Test Steps:
1. Open quality issue reporting modal
2. Test preset quality issue selection
3. Test custom quality issue text input
4. Submit quality issue report
5. Verify issue is reported to Convex system

### Expected Results:
- Quality modal opens with preset options
- Custom text input works for detailed descriptions
- Issue submission provides user feedback
- Convex system receives quality reports correctly
- Modal closes after successful submission

### Test Data:
- Preset quality issues (audio cutting, video freezing, etc.)
- Custom quality issue descriptions
- Various quality issue scenarios

---

## Test Case ID: TC-VID-P12
**Test Case Title:** Verify Call Duration and Session Tracking  
**Test Category:** Session Management  
**Priority:** High  

### Preconditions:
- User successfully connects to video call
- Convex session tracking is active

### Test Steps:
1. Verify call duration timer starts when connected
2. Check duration display format (MM:SS)
3. Verify Convex session tracks connection status
4. Test session updates for settings changes
5. Confirm duration continues accurately throughout call

### Expected Results:
- Duration timer starts only when call is established
- Time format displays correctly (MM:SS)
- Convex session records connection timestamps
- Session updates reflect real-time changes
- Duration tracking is accurate and consistent

### Test Data:
- Various call durations (short and long)
- Connection state changes
- Settings modifications during call

---

## Test Case ID: TC-VID-P13
**Test Case Title:** Verify Call Termination and Cleanup  
**Test Category:** Session Cleanup  
**Priority:** High  

### Preconditions:
- User is in active video call meeting
- Session is tracked in Convex system

### Test Steps:
1. Initiate call termination through "Leave" button
2. Confirm termination through modal dialog
3. Verify Convex session is properly ended
4. Check navigation back to consultations list
5. Verify cleanup of resources (camera, timers, etc.)

### Expected Results:
- Leave button triggers confirmation modal
- Session ends properly in Convex with correct reason
- Navigation returns to consultations screen
- All resources are cleaned up (no memory leaks)
- Duration timer stops and resets

### Test Data:
- Various call durations before termination
- Different termination methods (user action, app backgrounding)
- Session cleanup verification

---

## Test Case ID: TC-VID-P14
**Test Case Title:** Verify Background/Foreground Handling  
**Test Category:** App Lifecycle  
**Priority:** High  

### Preconditions:
- User is in active video call meeting
- App lifecycle events can be triggered

### Test Steps:
1. Put app in background during video call
2. Verify call is automatically ended
3. Check Convex session is marked as ended
4. Bring app back to foreground
5. Verify proper cleanup and navigation

### Expected Results:
- App backgrounding automatically ends the call
- Convex session tracks the background termination
- User is returned to consultations screen on foreground
- No zombie sessions or resource leaks
- Clean recovery when app returns to foreground

### Test Data:
- Various background/foreground scenarios
- Different call states when backgrounding occurs
- Session tracking during lifecycle changes

---

## Coverage Summary

### Functional Areas Covered:
1. **Screen Loading & Rendering** - TC-VID-P01, TC-VID-P04
2. **Appointment Management** - TC-VID-P02, TC-VID-P03, TC-VID-P05
3. **Video Call Integration** - TC-VID-P07, TC-VID-P08, TC-VID-P09
4. **Interactive Features** - TC-VID-P10, TC-VID-P11
5. **Session Management** - TC-VID-P12, TC-VID-P13, TC-VID-P14
6. **Error Handling** - TC-VID-P06

### Priority Distribution:
- **High Priority**: 10 test cases (critical functionality)
- **Medium Priority**: 4 test cases (enhanced features)

### Integration Points:
- Convex backend integration for appointments and session tracking
- Clerk authentication for user management
- SendBird for video call infrastructure
- Camera and microphone device permissions
- React Navigation for screen transitions