# Quick Start - SafeSpace Testing

## ⚡ 5-Minute Quick Start

### 1. Verify Installation
```powershell
# Check if all dependencies are installed
npm list jest @testing-library/react-native detox msw
```

### 2. Run Your First Test
```powershell
# Run all tests
npm test

# You should see sample tests passing
```

### 3. Run a Specific Test Module
```powershell
# Test mood tracking
npm test -- mood-tracking

# Test journal
npm test -- journal

# Test appointments
npm test -- appointments
```

---

## 🎯 Complete Your Assignment in 4 Steps

### Step 1: Add testID to Your Components (30 minutes)

Open your existing component files and add `testID` props:

**Example - Mood Tracking Button:**
```tsx
// In your mood-logging.tsx or similar file
<TouchableOpacity 
  testID="mood-happy"
  onPress={() => handleMoodSelect('happy')}
>
  <Text>😊 Happy</Text>
</TouchableOpacity>

<TouchableOpacity 
  testID="submit-mood-button"
  onPress={handleSubmit}
>
  <Text>Submit Mood</Text>
</TouchableOpacity>
```

**Components to Update:**
- [ ] Mood tracking buttons (`mood-happy`, `mood-sad`, `mood-anxious`, etc.)
- [ ] Journal buttons (`create-journal-button`, `save-journal-button`)
- [ ] Appointment buttons (`book-appointment-button`, `confirm-booking-button`)
- [ ] Form inputs (`journal-title-input`, `journal-content-input`)
- [ ] Navigation tabs (`mood-tracking-tab`, `journal-tab`, `appointments-tab`)

### Step 2: Implement Your First Real Test (1 hour)

Let's implement a real mood tracking test:

```tsx
// __tests__/screens/mood-tracking.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
// Import your actual component
import MoodLogging from '../../app/(app)/mood-tracking/mood-logging';

describe('Mood Tracking - Real Implementation', () => {
  it('should log a mood successfully', async () => {
    const { getByTestId, getByText } = render(<MoodLogging />);
    
    // Select happy mood
    const happyButton = getByTestId('mood-happy');
    fireEvent.press(happyButton);
    
    // Submit
    const submitButton = getByTestId('submit-mood-button');
    fireEvent.press(submitButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(getByText(/success/i)).toBeTruthy();
    }, { timeout: 3000 });
  });
});
```

### Step 3: Run Tests and Document Results (2 hours)

```powershell
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

**Document your results:**
1. Open `testing/documentation/daily-test-summary-template.md`
2. Copy it to `daily-test-summary-2025-11-01.md`
3. Fill in:
   - Test cases executed
   - Pass/Fail status
   - Any defects found

### Step 4: Track Defects (1 hour)

When you find bugs during testing:

1. Open `testing/documentation/defect-tracking-spreadsheet.md`
2. Add a new row:

```markdown
| DEF-011 | 2025-11-01 | Mood Tracking | MT-001 | S2 | P1 | Open | 
Mood not saving to database | 
1. Select mood<br>2. Press submit<br>3. Check database | 
Mood saved in database | 
Error: "Database connection failed" | 
iOS 17.0, iPhone 15 Pro | 
Dev Team | | | | | No | 
Database config issue |
```

3. Assign severity:
   - **S1 (Critical):** App crashes, data loss
   - **S2 (High):** Major feature broken
   - **S3 (Medium):** Feature partially works
   - **S4 (Low):** Minor cosmetic issues

---

## 🧪 Complete Test Examples

### Example 1: Button Press Test
```tsx
it('should navigate to journal create screen', () => {
  const { getByTestId } = render(<JournalScreen />);
  const createButton = getByTestId('create-journal-button');
  
  fireEvent.press(createButton);
  
  // Verify navigation happened (adjust based on your navigation setup)
  expect(mockNavigate).toHaveBeenCalledWith('journal-create');
});
```

### Example 2: Form Input Test
```tsx
it('should accept text input in journal title', () => {
  const { getByTestId } = render(<JournalCreateScreen />);
  const titleInput = getByTestId('journal-title-input');
  
  fireEvent.changeText(titleInput, 'My Test Journal');
  
  expect(titleInput.props.value).toBe('My Test Journal');
});
```

### Example 3: API Integration Test (with MSW)
```tsx
it('should load mood history from API', async () => {
  const { getByText } = render(<MoodHistoryScreen />);
  
  // Wait for API call to complete (MSW will intercept and return mock data)
  await waitFor(() => {
    expect(getByText('Great day!')).toBeTruthy(); // From mock data
  });
});
```

### Example 4: Error Handling Test
```tsx
it('should display error message on API failure', async () => {
  // Override MSW handler for this test
  server.use(
    http.get('http://localhost:3000/api/mood', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );
  
  const { getByText } = render(<MoodHistoryScreen />);
  
  await waitFor(() => {
    expect(getByText(/error/i)).toBeTruthy();
  });
});
```

---

## 📊 Performance Testing Quick Start

### Run Performance Tests
```powershell
# Start your backend server first
npm run dev

# In another terminal, run performance tests
npm run test:performance
```

### Expected Output
```
🚀 Starting Performance Tests...

Testing API endpoints...
✅ API GET /api/mood - 245ms (Target: 500ms)
✅ API GET /api/journal - 312ms (Target: 500ms)
❌ API GET /api/appointments - 587ms (Target: 500ms)

Testing database operations...
✅ Query 100 journal entries - 85ms (Target: 100ms)

# Performance Test Report
Total Tests: 4
Passed: 3
Failed: 1
Pass Rate: 75.00%
```

### Document Performance Results
1. Copy the output
2. Add to `testing/documentation/daily-test-summary-template.md`
3. Note any failures as defects

---

## 🎓 For Your Assignment Submission

### What to Include:

1. **Test Code** (`__tests__/` directory)
   - At least 10 test cases per major feature
   - Evidence of functional testing

2. **Daily Test Summaries** (one per day of testing)
   - Filled out `daily-test-summary-YYYY-MM-DD.md`
   - Include all modules tested

3. **Test Progress Tracking**
   - Updated `test-execution-progress-tracking.md`
   - Show daily progress
   - Calculate attempted vs successful ratio

4. **Defect Tracking**
   - Complete `defect-tracking-spreadsheet.md`
   - At least 5-10 defects documented
   - Severity codes assigned

5. **Performance Test Results**
   - Run `npm run test:performance`
   - Document results
   - Compare against targets

6. **Screenshots/Evidence**
   - Test execution results
   - Coverage reports
   - Performance metrics

---

## 🚨 Common Test Patterns

### Pattern 1: Testing User Flow
```tsx
describe('Complete User Journey', () => {
  it('should allow user to log mood, view history, and create journal', async () => {
    // 1. Log mood
    const { getByTestId } = render(<MoodLogging />);
    fireEvent.press(getByTestId('mood-happy'));
    fireEvent.press(getByTestId('submit-mood-button'));
    
    // 2. Navigate to history
    fireEvent.press(getByTestId('view-history-button'));
    
    // 3. Verify mood appears
    await waitFor(() => {
      expect(getByText('happy')).toBeTruthy();
    });
  });
});
```

### Pattern 2: Testing Validation
```tsx
it('should show error when title is empty', () => {
  const { getByTestId, getByText } = render(<JournalCreate />);
  
  // Try to submit without title
  fireEvent.press(getByTestId('save-journal-button'));
  
  expect(getByText(/title is required/i)).toBeTruthy();
});
```

### Pattern 3: Testing Lists
```tsx
it('should display all mood entries', async () => {
  const { getAllByTestId } = render(<MoodHistory />);
  
  await waitFor(() => {
    const moodEntries = getAllByTestId('mood-entry');
    expect(moodEntries.length).toBeGreaterThan(0);
  });
});
```

---

## ⏱️ Time Management for Assignment

| Task | Time | Priority |
|------|------|----------|
| Add testID to components | 30 min | HIGH |
| Write functional tests | 3 hours | HIGH |
| Run and document tests | 2 hours | HIGH |
| Performance testing | 1 hour | MEDIUM |
| Defect tracking | 1 hour | HIGH |
| Progress tracking | 30 min | MEDIUM |
| Screenshots/evidence | 30 min | MEDIUM |
| **Total** | **8.5 hours** | |

---

## ✅ Pre-Submission Checklist

Before submitting your assignment:

- [ ] All test files are in `__tests__/` directory
- [ ] Tests are running: `npm test` shows results
- [ ] Daily summaries completed (one per day)
- [ ] Progress tracking updated
- [ ] Defect tracking spreadsheet filled
- [ ] Performance tests executed and documented
- [ ] Screenshots captured
- [ ] Peer assessment completed
- [ ] All files committed to Git

---

## 🎉 You're Ready!

Your testing environment is fully set up. Now:

1. Start adding `testID` to your components
2. Implement the test cases
3. Run tests and document results
4. Track defects
5. Submit your assignment

Good luck with your testing! 🚀
