# Updated Self-Assessment Test Cases

Based on current Convex implementation and enhanced UI features.

## Test Case Updates Summary

### Major Changes Made:
1. **Backend Technology**: Updated from REST API to Convex queries/mutations
2. **New Features**: Summary bar with due status, stats, and trend visualization  
3. **History Display**: Sparkline charts and recent assessment list
4. **Enhanced Navigation**: Direct links to assessment history
5. **Improved Error Handling**: Convex-specific error scenarios

---

## **POSITIVE INTEGRATION TEST CASES**

### TC_ASSESS_INT_P01
**Requirements**: REQ-ASSESS-001, REQ-ASSESS-002, REQ-ASSESS-003  
**Description**: Complete end-to-end assessment submission  
**Preconditions**: User logged in, Convex backend running, user has valid Clerk ID  
**Test Steps**:
1. Navigate to Self-Assessment screen via router.push('/(app)/self-assessment')
2. Read SWEMWBS instructions "rate how you've been feeling over the last 2 weeks"
3. Answer all 7 questions by selecting response options (1-5 scale)
4. Tap "Submit Survey" button when enabled
**Expected Results**: 
- Green success modal appears with "Survey Submitted Successfully!" 
- Assessment saved via api.assessments.submitAssessment Convex mutation
- Total score calculated correctly (7-35 range)
- Assessment record created with completedAt timestamp
- nextDueDate set 6 months in future
- Activity logged with assessment_completed type
- Optional notification created if user settings allow

### TC_ASSESS_INT_P02  
**Requirements**: REQ-ASSESS-004  
**Description**: Assessment due status display when overdue  
**Preconditions**: User completed assessment 7+ months ago  
**Test Steps**:
1. Open Self-Assessment screen
2. Observe summary bar at top of screen
**Expected Results**: 
- Summary bar shows alert-circle icon in orange (#FFA000)
- Text displays "Assessment due" 
- Due status retrieved via api.assessments.isAssessmentDue query
- Returns {isDue: true, daysUntilDue: negative number}

### TC_ASSESS_INT_P03
**Requirements**: REQ-ASSESS-004  
**Description**: Assessment not due - status display  
**Preconditions**: User completed assessment 2 months ago  
**Test Steps**:
1. Open Self-Assessment screen  
2. Check summary bar due status
**Expected Results**:
- Summary bar shows checkmark-circle icon in theme primary color
- Text displays "Due in Xd" (where X = days remaining)
- api.assessments.isAssessmentDue returns {isDue: false, daysUntilDue: positive number}

### TC_ASSESS_INT_P04
**Requirements**: REQ-ASSESS-004  
**Description**: First-time user sees assessment due  
**Preconditions**: Brand new user, never completed assessment  
**Test Steps**:
1. Complete signup process with new Clerk account
2. Navigate to Self-Assessment screen
**Expected Results**:
- Summary bar shows alert-circle icon 
- Text displays "Assessment due"
- api.assessments.isAssessmentDue returns {isDue: true, daysUntilDue: 0}
- No history section displayed (user has no previous assessments)

### TC_ASSESS_INT_P05
**Requirements**: REQ-ASSESS-002  
**Description**: Minimum score submission (7 points)  
**Preconditions**: User on assessment screen  
**Test Steps**:
1. Answer all 7 questions with "None of the time" (value 1)
2. Tap "Submit Survey" button
**Expected Results**: 
- Total score calculated as 7 (7 × 1 = 7)
- Convex mutation successful with totalScore: 7
- Assessment record saved with correct score

### TC_ASSESS_INT_P06  
**Requirements**: REQ-ASSESS-002  
**Description**: Maximum score submission (35 points)  
**Preconditions**: User on assessment screen  
**Test Steps**:
1. Answer all 7 questions with "All of the time" (value 5)  
2. Submit assessment
**Expected Results**:
- Total score calculated as 35 (7 × 5 = 35)
- Assessment saved with totalScore: 35
- Success modal displays

### TC_ASSESS_INT_P07
**Requirements**: REQ-ASSESS-001  
**Description**: Progress counter updates dynamically  
**Preconditions**: User on assessment screen  
**Test Steps**:
1. Start with no questions answered
2. Answer questions progressively (1, then 2, then 3, etc.)
3. Observe submit button text changes
**Expected Results**:
- Button text updates: "0/7 Answered" → "1/7 Answered" → "2/7 Answered" etc.
- Button remains disabled (grayed out) until all 7 answered
- When complete, text changes to "Submit Survey" and button becomes enabled

### TC_ASSESS_INT_P08
**Requirements**: REQ-ASSESS-004  
**Description**: Navigate to assessment history  
**Preconditions**: User with previous assessments on assessment screen  
**Test Steps**:
1. Look for summary bar with "View History" link
2. Tap "View History" link
**Expected Results**: 
- Navigates to /(app)/self-assessment/history route
- History page displays past assessment records

### TC_ASSESS_INT_P09
**Requirements**: REQ-ASSESS-003  
**Description**: Return to home after successful submission  
**Preconditions**: Success modal displayed after submission  
**Test Steps**:
1. Complete and submit assessment successfully
2. Success modal appears
3. Tap "Return to Home" button in modal
**Expected Results**:
- Modal closes (setShowSuccessModal(false))
- Navigates to /(app)/(tabs)/home via router.replace
- Assessment no longer shows as due on home screen

### TC_ASSESS_INT_P10
**Requirements**: REQ-ASSESS-001  
**Description**: Radio button selection behavior  
**Preconditions**: User answering questions  
**Test Steps**:
1. For Question 1, tap "Often" option
2. For same question, tap "Some of the time" option
3. Verify selection state
**Expected Results**:
- First selection ("Often") becomes unselected
- New selection ("Some of the time") becomes active with visual feedback
- Only one option selected per question (radio button behavior)
- Internal state updated correctly in responses object

### TC_ASSESS_INT_P11
**Requirements**: REQ-ASSESS-001  
**Description**: All questions display with SWEMWBS content  
**Preconditions**: User on assessment screen  
**Test Steps**:
1. Scroll through all question blocks
2. Read each question text and verify response options
**Expected Results**: 
- 7 questions visible with correct SWEMWBS text:
  - "I've been feeling optimistic about the future"
  - "I've been feeling useful" 
  - "I've been feeling relaxed"
  - "I've been dealing with problems well"
  - "I've been thinking clearly"
  - "I've been feeling close to other people"
  - "I've been able to make up my own mind about things"
- Each question numbered 1-7
- All questions have same 5 response options

### TC_ASSESS_INT_P12
**Requirements**: REQ-ASSESS-001  
**Description**: Response options display correctly  
**Preconditions**: User viewing any question  
**Test Steps**: 
1. Examine response options for any question
**Expected Results**: 
- 5 options visible with correct labels and values:
  - "None of the time" (value: 1)
  - "Rarely" (value: 2) 
  - "Some of the time" (value: 3)
  - "Often" (value: 4)
  - "All of the time" (value: 5)
- Options display as radio buttons with proper styling

### TC_ASSESS_INT_P13
**Requirements**: REQ-ASSESS-003  
**Description**: Assessment data persists in Convex database  
**Preconditions**: Assessment submitted successfully  
**Test Steps**:
1. Submit complete assessment 
2. Check Convex database via dashboard or query
**Expected Results**:
- Record exists in "assessments" table
- Fields present: userId, assessmentType: 'SWEMWBS', responses (JSON array), totalScore, completedAt, nextDueDate, createdAt, updatedAt
- Responses stored as array of {question: string, answer: number} objects
- Total score matches manual calculation
- Timestamps are valid

### TC_ASSESS_INT_P14
**Requirements**: REQ-ASSESS-005  
**Description**: Assessment history retrieval  
**Preconditions**: User completed multiple assessments  
**Test Steps**:
1. Call api.assessments.getAssessmentHistory query with user ID
**Expected Results**: 
- Returns array of assessment records
- Ordered by completion date (newest first) 
- Limited to specified number (default 10)
- Each record includes id, totalScore, completedAt, assessmentType

### TC_ASSESS_INT_P15
**Requirements**: REQ-ASSESS-005  
**Description**: Latest assessment retrieval  
**Preconditions**: User has assessment history  
**Test Steps**:
1. Call api.assessments.getLatestAssessment query  
**Expected Results**:
- Returns single most recent assessment object
- Includes all fields: responses, totalScore, dates, etc.
- Returns null if user has no assessments

### TC_ASSESS_INT_P16 *(New)*
**Requirements**: REQ-ASSESS-005  
**Description**: Assessment statistics calculation  
**Preconditions**: User with multiple completed assessments  
**Test Steps**:
1. View assessment screen with existing history
2. Observe summary bar statistics
**Expected Results**:
- Summary shows "Last score: X/35" 
- Shows "Avg: Y.Z" (average rounded to 1 decimal)
- Shows trend icon and text: "Improving"/"Stable"/"Declining"
- Trend calculated by comparing latest to previous score (>2 point difference)

### TC_ASSESS_INT_P17 *(New)*  
**Requirements**: REQ-ASSESS-005  
**Description**: History sparkline visualization  
**Preconditions**: User with 3+ previous assessments  
**Test Steps**:
1. Open assessment screen  
2. Look for "Your Recent Scores" section above questions
**Expected Results**:
- Sparkline chart displays with bars representing scores
- Bar heights proportional to scores (normalized 7-35 range)
- Colors reflect trend (green=improving, red=declining, blue=stable)
- Recent assessment list shows up to 5 entries with dates and scores

### TC_ASSESS_INT_P18 *(New)*
**Requirements**: REQ-ASSESS-004  
**Description**: Due status updates immediately after submission  
**Preconditions**: Assessment just submitted  
**Test Steps**:
1. Submit assessment successfully
2. Return to assessment screen  
3. Check due status in summary bar
**Expected Results**:
- api.assessments.isAssessmentDue now returns {isDue: false}
- Summary bar shows checkmark icon and "Due in 180d" (approximately)
- Due date calculation based on 6-month interval

---

## **NEGATIVE TEST CASES**

### TC_ASSESS_INT_N01
**Requirements**: REQ-ASSESS-001  
**Description**: Cannot submit incomplete assessment  
**Preconditions**: User answered only 5 out of 7 questions  
**Test Steps**:
1. Answer only 5 questions randomly
2. Try to tap submit button  
**Expected Results**:
- Button shows "5/7 Answered" text
- Button remains disabled (grayed background)
- No click response, no API call made
- Alert shown: "Incomplete Survey - Please answer all questions before submitting"

### TC_ASSESS_INT_N02
**Requirements**: REQ-ASSESS-003  
**Description**: Handle Convex backend connection failure  
**Preconditions**: Convex backend offline or network disconnected  
**Test Steps**:
1. Complete all 7 questions
2. Tap "Submit Survey" button
**Expected Results**:
- Convex mutation fails with network/connection error  
- Error caught in try/catch block
- Alert displays: "Submission Error - Failed to submit assessment. Please try again."
- User remains on assessment screen, can retry

### TC_ASSESS_INT_N03  
**Requirements**: REQ-ASSESS-003  
**Description**: Handle Convex database error  
**Preconditions**: Convex function throws internal error  
**Test Steps**:
1. Complete assessment
2. Submit with database in error state  
**Expected Results**:
- Convex mutation rejects with error
- Frontend catches error appropriately  
- User sees "Failed to submit assessment" alert

### TC_ASSESS_INT_N04
**Requirements**: REQ-ASSESS-003  
**Description**: Handle user not authenticated  
**Preconditions**: User's Clerk authentication expired  
**Test Steps**:
1. Complete assessment
2. Submit when user.id is null/undefined  
**Expected Results**:
- Frontend validation catches missing user ID
- Alert shows: "Error - User not found. Please try again."
- No Convex mutation attempted

### TC_ASSESS_INT_N05
**Requirements**: REQ-ASSESS-001  
**Description**: Handle rapid multiple submit attempts  
**Preconditions**: All questions answered  
**Test Steps**:
1. Tap "Submit Survey" button  
2. Immediately tap 5 more times rapidly before response  
**Expected Results**: 
- First tap initiates submission (loading state)
- Subsequent taps ignored (button disabled during submission)
- Only one Convex mutation call made
- Single success modal appears

### TC_ASSESS_INT_N06 *(New)*
**Requirements**: REQ-ASSESS-004  
**Description**: Handle assessment due status query failure  
**Preconditions**: Convex query fails or times out  
**Test Steps**:
1. Open assessment screen
2. api.assessments.isAssessmentDue query fails
**Expected Results**:
- Error logged to console
- Summary bar shows "Checking due status..." as fallback
- User can still complete assessment normally
- Other queries (stats, history) may still work independently

### TC_ASSESS_INT_N07 *(New)*
**Requirements**: REQ-ASSESS-005  
**Description**: Handle statistics query failure gracefully  
**Preconditions**: User on assessment screen, stats query fails  
**Test Steps**:
1. Open assessment screen when api.assessments.getAssessmentStats fails
**Expected Results**:
- Summary bar shows "No assessments yet" for score section
- Trend and average sections not displayed
- Assessment functionality still works
- History section may still display if that query succeeds

---

## **REMOVED/OBSOLETE TEST CASES**

The following test cases are **no longer applicable** due to architecture changes:

- **TC_API_ASSESS_P01-P07**: All REST API endpoint tests removed (replaced by Convex functions)
- **TC_API_ASSESS_N01-N07**: REST API error handling tests removed  
- **TC_DB_ASSESS_P01-P04**: Direct database tests removed (Convex handles database layer)
- **TC_ASSESS_INT_P19**: Superseded by TC_ASSESS_INT_P18 (updated for Convex)
- **TC_ASSESS_INT_P20**: Multi-user isolation now handled automatically by Convex user context
- **TC_ASSESS_INT_N03**: Database connection tests now Convex-specific
- **TC_ASSESS_INT_N08**: Response validation now handled by Convex schema validation  
- **TC_ASSESS_INT_N11**: Assessment check API failure now covered by N06
- **TC_ASSESS_INT_N15**: Zero questions scenario covered by N01

---

## **IMPLEMENTATION NOTES**

### Convex Functions Used:
- `api.assessments.submitAssessment` - Submit new assessment
- `api.assessments.isAssessmentDue` - Check if assessment is due  
- `api.assessments.getLatestAssessment` - Get most recent assessment
- `api.assessments.getAssessmentStats` - Get statistics and trends
- `api.assessments.getAssessmentHistory` - Get paginated history

### Key UI Components:
- **Summary Bar**: Shows due status, latest score, average, trend
- **History Section**: Sparkline chart + recent assessment list  
- **Question Blocks**: 7 SWEMWBS questions with radio button responses
- **Submit Button**: Dynamic text showing progress, disabled until complete
- **Success Modal**: Confirmation with navigation back to home

### Testing Considerations:
- Mock Convex functions using `useQuery` and `useMutation` mocks
- Test both loading states (undefined) and error states for queries
- Verify proper Clerk user integration for authentication
- Test theme context integration for proper styling
- Validate proper navigation routing behavior