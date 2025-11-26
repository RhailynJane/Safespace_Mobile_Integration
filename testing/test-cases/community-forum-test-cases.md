# Community Forum Test Cases

## Test Case ID: TC-FORUM-P01
**Test Case Title:** Verify a user can create a new discussion post  
**Test Category:** Post Creation  
**Priority:** High  
**Requirement ID:** REQ-FORUM-001

### Preconditions:
- User is logged in via Clerk authentication
- Forum access granted (user not suspended)
- Convex backend is available

### Test Steps:
1. Navigate to "Community Forum" screen
2. Tap "Create Post" button ('+' icon)
3. Select a category (e.g., "Self-Care")
4. Enter valid title in title field
5. Enter valid content in body field
6. Tap "Publish" button

### Expected Results:
- Post appears instantly in the forum newsfeed
- Post displays user's name, profile image, and timestamp
- Comment counter shows 0
- Post includes selected category badge
- User is redirected to success screen

### Test Data:
- Title: "Tips for managing daily stress"
- Content: "Here are some techniques that helped me..."
- Category: "Self-Care"

---

## Test Case ID: TC-FORUM-P02
**Test Case Title:** Verify post categories display correctly  
**Test Category:** Category Selection  
**Priority:** High  
**Requirement ID:** REQ-FORUM-001

### Preconditions:
- User logged in
- Categories loaded from Convex

### Test Steps:
1. Navigate to Community Forum
2. Tap "Create Post" button
3. Observe category selection screen

### Expected Results:
- All 9 categories display: Self-Care, Mindfulness, Stories, Support, Creative, Therapy, Stress, Affirmation, Awareness
- Each category shows icon/image
- Categories are scrollable if needed
- User can select one category before continuing

### Test Data:
- Available categories from CATEGORIES constant

---

## Test Case ID: TC-FORUM-P03
**Test Case Title:** Ensure empty post title triggers validation  
**Test Category:** Input Validation  
**Priority:** High  
**Requirement ID:** REQ-FORUM-001

### Preconditions:
- User logged in
- On create post content screen

### Test Steps:
1. Navigate to Create Post
2. Select category
3. Leave title field blank
4. Enter content in body field
5. Tap "Publish"

### Expected Results:
- System displays error modal: "Missing Information - Please add a title or content for your post"
- Post is not created
- User remains on create post screen

### Test Data:
- Title: "" (empty)
- Content: "Some content here"

---

## Test Case ID: TC-FORUM-P04
**Test Case Title:** Validate post length constraint (max 1000 characters)  
**Test Category:** Input Validation  
**Priority:** Medium  
**Requirement ID:** REQ-FORUM-004

### Preconditions:
- User logged in
- On create post content screen

### Test Steps:
1. Navigate to Create Post
2. Select category
3. Enter title
4. Enter exactly 1000 characters in content field
5. Tap "Publish"

### Expected Results:
- Character counter displays "1000/1000" in warning color
- Post successfully created with full 1000 characters
- No truncation occurs
- Content displays completely in post

### Test Data:
- Content: 1000 character string
- Validation: Character counter turns orange at 800, red at 900

---

## Test Case ID: TC-FORUM-P05
**Test Case Title:** Verify user can save post as draft  
**Test Category:** Draft Management  
**Priority:** Medium  
**Requirement ID:** REQ-FORUM-002

### Preconditions:
- User logged in
- On create post content screen

### Test Steps:
1. Navigate to Create Post
2. Select category
3. Enter title and/or content
4. Tap "Save Draft" button
5. Navigate to "My Posts" tab

### Expected Results:
- Success message: "Your post has been saved as a draft"
- User redirected to forum main screen
- Draft visible in "My Posts" view with draft indicator
- Draft persisted to Convex database

### Test Data:
- Title: "Draft post title"
- Content: "Partial content..."

---

## Test Case ID: TC-FORUM-P06
**Test Case Title:** Verify user can attach photos to post  
**Test Category:** Media Upload  
**Priority:** Medium  
**Requirement ID:** REQ-FORUM-007

### Preconditions:
- User logged in
- Photo library permission granted
- On create post content screen

### Test Steps:
1. Navigate to Create Post
2. Select category
3. Tap photo attachment button
4. Select 1-3 photos from library
5. Verify photos display in preview
6. Tap "Publish"

### Expected Results:
- Photo picker opens successfully
- Selected photos display as thumbnails (max 3)
- Photos are compressed and uploaded
- Published post displays photos in gallery format
- Error shown if attempting to add more than 3 photos

### Test Data:
- Maximum photos: 3
- Supported formats: JPG, PNG

---

## Test Case ID: TC-FORUM-P07
**Test Case Title:** Verify user can select mood/feeling for post  
**Test Category:** Mood Selection  
**Priority:** Low  
**Requirement ID:** REQ-FORUM-009

### Preconditions:
- User logged in
- On create post content screen

### Test Steps:
1. Navigate to Create Post
2. Select category
3. Tap mood/feeling selector
4. Choose mood (e.g., "Happy 😃")
5. Observe mood indicator updates
6. Publish post

### Expected Results:
- Mood picker displays all 9 moods with emojis
- Selected mood displays next to user's name
- Mood persists in published post
- Mood is optional (can be left unselected)

### Test Data:
- Moods: Ecstatic, Happy, Content, Neutral, Displeased, Frustrated, Annoyed, Angry, Furious

---

## Test Case ID: TC-FORUM-P08
**Test Case Title:** Verify reply submission to existing discussion works  
**Test Category:** Post Interaction  
**Priority:** High  
**Requirement ID:** REQ-FORUM-003

### Preconditions:
- User logged in
- At least one post exists in forum

### Test Steps:
1. Navigate to Community Forum
2. Tap on an existing post to open post details
3. Type "Thanks for sharing" in reply field
4. Tap "Reply" button

### Expected Results:
- Reply appears below the post immediately
- Reply shows author's name, profile image, and timestamp
- Post's reply counter increments by 1
- Reply persisted to Convex database

### Test Data:
- Reply content: "Thanks for sharing"

---

## Test Case ID: TC-FORUM-P09
**Test Case Title:** Verify user can toggle post privacy  
**Test Category:** Privacy Settings  
**Priority:** Medium  
**Requirement ID:** REQ-FORUM-008

### Preconditions:
- User logged in
- On create post content screen

### Test Steps:
1. Navigate to Create Post
2. Select category
3. Locate privacy toggle switch
4. Toggle privacy to "Private"
5. Publish post

### Expected Results:
- Privacy toggle displays "Public" or "Private" state
- Private posts show lock icon indicator
- Private posts only visible to user and their connections
- Privacy setting persisted correctly

### Test Data:
- Default: Public
- Toggle: Private

---

## Test Case ID: TC-FORUM-P10
**Test Case Title:** Verify user can browse posts by category filter  
**Test Category:** Navigation & Filtering  
**Priority:** High  
**Requirement ID:** REQ-FORUM-010

### Preconditions:
- User logged in
- Multiple posts exist across different categories

### Test Steps:
1. Navigate to Community Forum
2. Observe "Browse By" category pills
3. Tap "Mindfulness" category
4. Observe filtered results

### Expected Results:
- All categories display in horizontal scrollable list
- "All" category selected by default showing all posts
- Tapping category filters posts to that category only
- Selected category highlighted visually
- Post count updates based on filter

### Test Data:
- Categories: All, Self-Care, Mindfulness, Stories, Support, Creative, Therapy, Stress, Affirmation, Awareness, Bookmarks

---

## Test Case ID: TC-FORUM-P11
**Test Case Title:** Verify user can react to posts with emojis  
**Test Category:** Post Interaction  
**Priority:** Medium  
**Requirement ID:** REQ-FORUM-011

### Preconditions:
- User logged in
- At least one post exists

### Test Steps:
1. Navigate to Community Forum
2. Locate a post
3. Tap reaction icon (heart, thumbs up, etc.)
4. Observe reaction counter updates

### Expected Results:
- Reaction options display (like, love, support)
- Selected reaction highlights
- Reaction counter increments
- User can change reaction (previous removed, new added)
- Reaction persisted to Convex

### Test Data:
- Reactions: Like, Love, Celebrate, Support, Insightful

---

## Test Case ID: TC-FORUM-P12
**Test Case Title:** Verify user can enter post title  
**Test Category:** Input Fields  
**Priority:** High  
**Requirement ID:** REQ-FORUM-001

### Preconditions:
- User logged in
- On create post content screen

### Test Steps:
1. Navigate to Create Post
2. Select category
3. Tap title input field
4. Enter text

### Expected Results:
- Title field accepts text input
- Character limit displayed and enforced (if applicable)
- Placeholder text guides user
- Input persists when switching between fields

### Test Data:
- Sample title: "My wellness journey"

---

## Test Case ID: TC-FORUM-P13
**Test Case Title:** Verify user can select category type  
**Test Category:** Category Selection  
**Priority:** High  
**Requirement ID:** REQ-FORUM-005

### Preconditions:
- User logged in
- On category selection screen

### Test Steps:
1. Navigate to Create Post (category selection)
2. Tap "Self-Care" category card
3. Tap "Continue" button

### Expected Results:
- Category card highlights when selected
- Only one category can be selected at a time
- "Continue" button enabled after selection
- User navigated to content creation screen
- Selected category displayed in header/breadcrumb

### Test Data:
- Selected category: "Self-Care"

---

## Test Case ID: TC-FORUM-P14
**Test Case Title:** Verify user can write and publish post content  
**Test Category:** Post Creation  
**Priority:** High  
**Requirement ID:** REQ-FORUM-004

### Preconditions:
- User logged in
- Category selected
- On content creation screen

### Test Steps:
1. Enter title
2. Enter content in body field
3. Tap "Publish" button
4. Wait for success confirmation

### Expected Results:
- Content field accepts multi-line text
- Post published successfully to Convex
- Post visible in newsfeed with timestamp
- Post displays author info correctly
- Followers receive notification (if implemented)

### Test Data:
- Title: "Daily mindfulness practice"
- Content: "I've been practicing meditation for 10 minutes daily..."

---

## Test Case ID: TC-FORUM-P15
**Test Case Title:** Verify user can edit existing post  
**Test Category:** Post Management  
**Priority:** High  
**Requirement ID:** REQ-FORUM-006

### Preconditions:
- User logged in
- User has created at least one post

### Test Steps:
1. Navigate to "My Posts" tab
2. Tap menu icon (⋮) on a post
3. Tap "Edit" option
4. Modify title or content
5. Tap "Save" button

### Expected Results:
- Edit screen pre-fills with existing content
- Changes save successfully to Convex
- Updated post displays immediately
- Edit history tracked (timestamp updated)
- "Edited" indicator shows on post

### Test Data:
- Original: "First post"
- Updated: "Updated post content"

---

## Test Case ID: TC-FORUM-P16
**Test Case Title:** Verify user can delete post  
**Test Category:** Post Management  
**Priority:** High  
**Requirement ID:** REQ-FORUM-006

### Preconditions:
- User logged in
- User has created at least one post

### Test Steps:
1. Navigate to "My Posts" or find own post
2. Tap menu icon (⋮) on post
3. Tap "Delete" option
4. Confirm deletion in modal

### Expected Results:
- Confirmation modal displays: "Delete this post?"
- After confirmation, post removed from UI immediately
- Post deleted from Convex database
- Deletion action logged
- Related notifications/comments removed

### Test Data:
- Post to delete: User's own post

---

## Test Case ID: TC-FORUM-P17
**Test Case Title:** Verify user can bookmark/save posts  
**Test Category:** Post Interaction  
**Priority:** Medium  
**Requirement ID:** REQ-FORUM-012

### Preconditions:
- User logged in
- At least one post exists

### Test Steps:
1. Navigate to Community Forum
2. Locate a post
3. Tap bookmark/save icon
4. Navigate to "Bookmarks" filter
5. Verify post appears

### Expected Results:
- Bookmark icon toggles state (filled/unfilled)
- Post saved to user's bookmarks in Convex
- "Bookmarks" category filter shows saved posts only
- Bookmark persists across sessions
- User can unbookmark by tapping again

### Test Data:
- Action: Bookmark a post

---

## Test Case ID: TC-FORUM-P18
**Test Case Title:** Ensure banned/suspended users cannot post  
**Test Category:** Access Control  
**Priority:** High  
**Requirement ID:** REQ-FORUM-001

### Preconditions:
- User account status = "Suspended" or "Banned"
- User attempts to access forum

### Test Steps:
1. Log in with suspended account
2. Navigate to Community Forum
3. Attempt to tap "Create Post" button
4. (If accessible) Try to publish a post

### Expected Results:
- Create Post button disabled or hidden for suspended users
- If attempted, error message displays: "Your account is restricted from posting"
- Access control enforced at API level (Convex mutation check)
- User can still view posts but cannot interact

### Test Data:
- User status: Suspended

---

## Test Case ID: TC-FORUM-N01
**Test Case Title:** Verify cannot post with empty title  
**Test Category:** Negative Testing - Validation  
**Priority:** High  
**Requirement ID:** REQ-FORUM-001

### Preconditions:
- User logged in
- On create post content screen

### Test Steps:
1. Navigate to Create Post
2. Select category
3. Leave title field blank
4. Leave content field blank
5. Tap "Publish"

### Expected Results:
- Error modal displays: "Missing Information"
- Error message: "Please add a title or content for your post"
- Publish action blocked
- Focus returned to form
- Post not created in database

### Test Data:
- Title: "" (empty)
- Content: "" (empty)

---

## Test Case ID: TC-FORUM-N02
**Test Case Title:** Verify cannot post with empty content  
**Test Category:** Negative Testing - Validation  
**Priority:** High  
**Requirement ID:** REQ-FORUM-001

### Preconditions:
- User logged in
- On create post content screen

### Test Steps:
1. Navigate to Create Post
2. Select category
3. Enter valid title
4. Leave content field completely blank
5. Tap "Publish"

### Expected Results:
- Error modal displays: "Missing Information"
- Error message: "Please add a title or content for your post"
- Publish blocked
- User remains on create screen

### Test Data:
- Title: "Valid title"
- Content: "" (empty)

---

## Test Case ID: TC-FORUM-N03
**Test Case Title:** Verify cannot proceed without selecting category  
**Test Category:** Negative Testing - Validation  
**Priority:** High  
**Requirement ID:** REQ-FORUM-001

### Preconditions:
- User logged in
- On category selection screen

### Test Steps:
1. Navigate to Create Post
2. Do not select any category
3. Tap "Continue" button

### Expected Results:
- Error modal displays: "Selection Required"
- Error message: "Please select a category to continue"
- Navigation blocked
- User remains on category selection screen
- Continue button disabled until selection made

### Test Data:
- Selected category: None

---

## Test Case ID: TC-FORUM-N04
**Test Case Title:** Verify maximum photo limit enforced  
**Test Category:** Negative Testing - Media  
**Priority:** Medium  
**Requirement ID:** REQ-FORUM-007

### Preconditions:
- User logged in
- On create post content screen
- Photo library permission granted

### Test Steps:
1. Navigate to Create Post
2. Tap photo attachment button
3. Attempt to select 4 or more photos

### Expected Results:
- Error modal displays after 3rd photo: "Maximum Photos"
- Error message: "You can only add up to 3 photos"
- 4th photo selection blocked
- Only first 3 photos display in preview

### Test Data:
- Attempt to add: 4 photos
- Maximum allowed: 3 photos

---

## Test Case ID: TC-FORUM-N05
**Test Case Title:** Verify character limit validation (>1000 characters)  
**Test Category:** Negative Testing - Validation  
**Priority:** Medium  
**Requirement ID:** REQ-FORUM-004

### Preconditions:
- User logged in
- On create post content screen

### Test Steps:
1. Navigate to Create Post
2. Enter title
3. Enter content exceeding 1000 characters
4. Observe character counter

### Expected Results:
- Character counter displays warning at 800 chars (orange)
- Character counter displays error at 900+ chars (red)
- Input field may limit further typing at 1000 chars
- Visual feedback indicates limit reached
- Publish may be blocked if over limit

### Test Data:
- Content length: 1001+ characters

---

## Test Case ID: TC-FORUM-N06
**Test Case Title:** Verify unauthenticated user cannot create posts  
**Test Category:** Negative Testing - Authentication  
**Priority:** High  
**Requirement ID:** REQ-FORUM-001

### Preconditions:
- User not logged in (Clerk session expired or invalid)

### Test Steps:
1. Access Community Forum without valid authentication
2. Attempt to tap "Create Post" button

### Expected Results:
- Create Post button hidden or disabled
- If attempted via deep link, redirect to login screen
- Error message: "Sign In Required - Please sign in to create posts"
- No API call made to Convex

### Test Data:
- User: Unauthenticated

---

## Coverage Summary

### Functional Areas Covered:
1. **Post Creation & Publishing** - TC-FORUM-P01, TC-FORUM-P12, TC-FORUM-P13, TC-FORUM-P14
2. **Category Selection & Filtering** - TC-FORUM-P02, TC-FORUM-P10, TC-FORUM-P13
3. **Input Validation** - TC-FORUM-P03, TC-FORUM-P04, TC-FORUM-N01, TC-FORUM-N02, TC-FORUM-N03, TC-FORUM-N05
4. **Draft Management** - TC-FORUM-P05
5. **Media Upload** - TC-FORUM-P06, TC-FORUM-N04
6. **Mood/Feeling Selection** - TC-FORUM-P07
7. **Post Interactions** - TC-FORUM-P08, TC-FORUM-P11, TC-FORUM-P17
8. **Privacy Settings** - TC-FORUM-P09
9. **Post Management (Edit/Delete)** - TC-FORUM-P15, TC-FORUM-P16
10. **Access Control** - TC-FORUM-P18, TC-FORUM-N06

### Priority Distribution:
- **High Priority**: 15 test cases (critical functionality)
- **Medium Priority**: 6 test cases (enhanced features)
- **Low Priority**: 1 test case (optional features)

### Test Type Distribution:
- **Positive Tests**: 18 (TC-FORUM-P01 to TC-FORUM-P18)
- **Negative Tests**: 6 (TC-FORUM-N01 to TC-FORUM-N06)

### Integration Points:
- Convex backend for data persistence (posts, categories, reactions, bookmarks)
- Clerk authentication for user identity and access control
- Expo ImagePicker for photo attachment
- React Navigation for screen transitions
- AsyncStorage for profile image caching

### Notes:
- All test cases assume Convex backend is operational
- Privacy/permission tests require appropriate device/simulator settings
- Photo upload tests require image assets or mock data
- Suspended user testing requires test account with modified status
