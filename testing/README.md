# SafeSpace Testing Suite - Complete Setup Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Installation Complete](#installation-complete)
3. [Running Tests](#running-tests)
4. [Test Documentation](#test-documentation)
5. [Assignment Requirements Mapping](#assignment-requirements-mapping)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This testing suite provides comprehensive testing capabilities for the SafeSpace mobile application, including:

- ✅ **Functional Testing** with Jest + React Native Testing Library
- ✅ **End-to-End Testing** with Detox
- ✅ **Performance Testing** with custom tools and Artillery
- ✅ **API Mocking** with MSW (Mock Service Worker)
- ✅ **Test Documentation Templates** (Figure 12.1a/12.1b)
- ✅ **Defect Tracking** spreadsheet and templates

---

## ✅ Installation Complete

All testing tools and frameworks have been installed:

### Installed Packages
```json
{
  "devDependencies": {
    "@testing-library/react-native": "^13.3.3",
    "@testing-library/jest-native": "^5.4.3",
    "jest": "latest",
    "jest-expo": "latest",
    "@types/jest": "latest",
    "react-test-renderer": "latest",
    "detox": "latest",
    "detox-expo-helpers": "latest",
    "msw": "latest"
  }
}
```

### Configuration Files Created
- ✅ `jest.config.js` - Jest configuration
- ✅ `jest.setup.js` - Jest setup with MSW
- ✅ `.detoxrc.js` - Detox E2E configuration
- ✅ `e2e/jest.config.js` - E2E test configuration
- ✅ `e2e/init.js` - E2E initialization

### Test Files Created
- ✅ Sample component tests in `__tests__/components/`
- ✅ Sample screen tests in `__tests__/screens/`
- ✅ E2E user journey tests in `e2e/`
- ✅ API mock handlers in `testing/mocks/`

---

## 🚀 Running Tests

### Unit & Integration Tests (Jest)

```powershell
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- __tests__/screens/mood-tracking.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="mood"
```

### End-to-End Tests (Detox)

#### Prerequisites for E2E Testing
1. **For iOS:**
   - Install Xcode
   - Install iOS Simulator

2. **For Android:**
   - Install Android Studio
   - Create Android Emulator (Pixel 7 API 34)
   - Start emulator: `emulator -avd Pixel_7_API_34`

#### Running E2E Tests

```powershell
# Build iOS app for testing
npm run test:e2e:build:ios

# Run iOS E2E tests
npm run test:e2e:ios

# Build Android app for testing
npm run test:e2e:build:android

# Run Android E2E tests
npm run test:e2e:android
```

### Performance Tests

```powershell
# Run performance test suite
npm run test:performance

# Run API load tests
npm run test:load

# Generate HTML report from load test
npm run test:load:report
```

---

## 📚 Test Documentation

### Templates Location
All documentation templates are in `testing/documentation/`:

1. **Daily Test Summary** (`daily-test-summary-template.md`)
   - Based on Figure 12.1a from textbook
   - Documents daily testing outcomes
   - Tracks test execution by module

2. **Test Execution Progress Tracking** (`test-execution-progress-tracking.md`)
   - Based on Figure 12.1b from textbook
   - Tracks attempted vs successful test cases
   - Analyzes defect-free ratio

3. **Defect Tracking Spreadsheet** (`defect-tracking-spreadsheet.md`)
   - Complete defect tracking system
   - Severity codes (S1-S4)
   - Priority levels (P1-P4)
   - Sample defects included
   - Defect backlog management

### Performance Testing Documentation
- **Performance Testing Guide** (`testing/performance/performance-testing-guide.md`)
  - Comprehensive guide to performance testing
  - Performance metrics and targets
  - Test scenarios and procedures

---

## 📊 Assignment Requirements Mapping

### Part A: Test Execution (95 marks)

#### 1. Test Environment Setup ✅
- **Location:** Configuration files in project root
- **Completed:**
  - Jest configured for functional testing
  - Detox configured for E2E testing
  - MSW configured for API mocking
  - Performance test tools configured

#### 2a. Functional Testing (35 marks) ✅
- **Location:** `__tests__/screens/` and `__tests__/components/`
- **Completed:**
  - Test structure for all major features
  - API mocking with MSW
  - Sample test cases for:
    - Mood Tracking
    - Journal Entries
    - Appointments
    - Authentication
    - Profile Management

#### 2b. Performance Testing (35 marks) ✅
- **Location:** `testing/performance/`
- **Completed:**
  - Performance testing guide
  - Performance test runner
  - Load testing configuration
  - Metrics defined:
    - App launch time
    - Screen transitions
    - API response times
    - Memory usage
    - FPS monitoring

#### 2d. Document Testing Outcomes (10 marks) ✅
- **Location:** `testing/documentation/daily-test-summary-template.md`
- **Completed:**
  - Daily summary template (Figure 12.1a)
  - Test results by module
  - Defects summary section
  - Environment details

#### 2e. Defect Tracking (10 marks) ✅
- **Location:** `testing/documentation/defect-tracking-spreadsheet.md`
- **Completed:**
  - Comprehensive defect tracking template
  - Severity codes defined (S1-S4)
  - Priority levels defined (P1-P4)
  - 10 sample defects included
  - Defect statistics
  - Code branch naming conventions

#### 2f. Test Case Execution Progress Tracking (5 marks) ✅
- **Location:** `testing/documentation/test-execution-progress-tracking.md`
- **Completed:**
  - Progress tracking template (Figure 12.1b)
  - Daily progress chart
  - Module-by-module tracking
  - Attempted vs unsuccessful ratio
  - Test velocity analysis

#### 2g. Defect Backlog (Optional) ✅
- **Location:** Included in defect tracking spreadsheet
- **Completed:**
  - Backlog tracking section
  - Backlog statistics
  - Action plan for backlog reduction

---

## 🔧 Test Implementation Guide

### Step 1: Implement Component Tests

Update `__tests__/components/SafeSpaceLogo.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import SafeSpaceLogo from '../../components/SafeSpaceLogo';

describe('SafeSpaceLogo Component', () => {
  it('should render without crashing', () => {
    const { getByTestId } = render(<SafeSpaceLogo />);
    expect(getByTestId('safespace-logo')).toBeTruthy();
  });
});
```

**Note:** Add `testID="safespace-logo"` to your SafeSpaceLogo component.

### Step 2: Implement Screen Tests

For each feature (Mood Tracking, Journal, etc.), implement the tests in `__tests__/screens/`.

Example for Mood Tracking:

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import MoodLogging from '../../app/(app)/mood-tracking/mood-logging';

describe('Mood Logging Feature', () => {
  it('should submit mood entry successfully', async () => {
    const { getByTestId } = render(<MoodLogging />);
    
    fireEvent.press(getByTestId('mood-happy'));
    fireEvent.press(getByTestId('submit-mood-button'));
    
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeTruthy();
    });
  });
});
```

### Step 3: Add testID to Components

Add `testID` props to your components for E2E testing:

```tsx
<TouchableOpacity testID="mood-happy" onPress={handleMoodSelect}>
  <Text>😊 Happy</Text>
</TouchableOpacity>
```

### Step 4: Run and Document Tests

1. Run tests: `npm test`
2. Document results in `testing/documentation/daily-test-summary-template.md`
3. Track defects in `testing/documentation/defect-tracking-spreadsheet.md`
4. Update progress in `testing/documentation/test-execution-progress-tracking.md`

---

## 🎓 Using the Documentation Templates

### Daily Testing (Figure 12.1a)

1. Copy `testing/documentation/daily-test-summary-template.md`
2. Rename to `daily-test-summary-YYYY-MM-DD.md`
3. Fill in:
   - Test execution results (Pass/Fail/Blocked)
   - Defects found
   - Environment details
   - Notes and observations

### Progress Tracking (Figure 12.1b)

1. Use `testing/documentation/test-execution-progress-tracking.md`
2. Update daily:
   - Total tests executed
   - Pass/fail counts
   - Calculate success rate
3. Analyze:
   - Attempted vs successful ratio
   - Defect detection rate
   - Software quality indicators

### Defect Tracking

1. Use `testing/documentation/defect-tracking-spreadsheet.md`
2. For each defect:
   - Assign unique ID (DEF-XXX)
   - Set severity (S1-S4)
   - Set priority (P1-P4)
   - Document steps to reproduce
   - Track status through lifecycle

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Jest Tests Not Running
```powershell
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
rm -rf node_modules
npm install --legacy-peer-deps
```

#### 2. MSW Mock Handlers Not Working
Check that:
- MSW server is started in `jest.setup.js`
- Handlers are properly exported from `testing/mocks/handlers.ts`
- API URLs match your actual API endpoints

#### 3. Detox E2E Tests Failing
```powershell
# Rebuild the app
npm run test:e2e:build:ios
# or
npm run test:e2e:build:android

# Check that emulator/simulator is running
# iOS: Simulator should be open
# Android: Check with `adb devices`
```

#### 4. Performance Tests Timing Out
- Increase timeout in test: `jest.setTimeout(10000)`
- Check backend server is running: `npm run dev`
- Verify API endpoints are accessible

---

## 📈 Test Coverage Goals

Current coverage targets (configured in `jest.config.js`):

| Metric | Target |
|--------|--------|
| Branches | 50% |
| Functions | 50% |
| Lines | 50% |
| Statements | 50% |

To view coverage:
```powershell
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory.

---

## 🔄 Continuous Testing Workflow

### Daily Testing Routine
1. **Morning:** Run full test suite (`npm test`)
2. **During Development:** Use watch mode (`npm run test:watch`)
3. **Before Commit:** Run tests and check coverage
4. **End of Day:** Document results in daily summary

### Weekly Testing Routine
1. **Monday:** Plan test cases for the week
2. **Wednesday:** Run E2E tests (`npm run test:e2e`)
3. **Friday:** Run performance tests (`npm run test:performance`)
4. **Weekend:** Update progress tracking and analyze trends

---

## 📝 Assignment Submission Checklist

For your Assignment 3 submission, ensure you have:

- [ ] Completed functional tests for all major features
- [ ] Executed performance tests and documented results
- [ ] Filled out daily test summary for each testing day
- [ ] Updated test execution progress tracking
- [ ] Documented all defects in tracking spreadsheet
- [ ] Assigned severity codes to all defects
- [ ] Analyzed defect-free ratio
- [ ] Created defect backlog (if applicable)
- [ ] Included screenshots/evidence of test execution
- [ ] Prepared peer assessment forms

---

## 🎯 Next Steps

1. **Review Sample Tests:** Examine tests in `__tests__/` directory
2. **Add testID Props:** Update your components with testID attributes
3. **Run Sample Tests:** Execute `npm test` to see tests in action
4. **Implement Real Tests:** Replace TODO placeholders with actual test logic
5. **Document Results:** Use templates in `testing/documentation/`
6. **Track Defects:** Log all issues in defect tracking spreadsheet
7. **Generate Reports:** Run coverage and performance tests

---

## 📞 Support

If you encounter any issues:
1. Check the Troubleshooting section above
2. Review test examples in `__tests__/` directory
3. Consult the testing guide in `testing/performance/`
4. Check MSW handlers in `testing/mocks/handlers.ts`

---

**Testing Suite Created:** November 1, 2025  
**Last Updated:** November 1, 2025  
**Version:** 1.0.0
