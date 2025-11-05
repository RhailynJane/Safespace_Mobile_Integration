# Test Suite for (app) Screens

## Overview
Comprehensive test coverage for all screens in the `app/(app)` directory, following Jest + React Native Testing Library patterns established in the Home screen tests.

## Created Test Files

### 1. Crisis Support (`crisis-support.test.tsx`)
**Coverage:**
- Screen rendering and UI elements
- Emergency contact buttons (911, 988, Distress Center)
- Phone call linking with Linking API
- Website navigation
- Immediate coping strategies display
- 5-4-3-2-1 grounding technique
- Error handling for unsupported devices
- Loading states
- Modal feedback

**Key Tests:**
- ✅ Renders crisis support screen correctly
- ✅ Handles 911 emergency call
- ✅ Handles crisis hotline call (988)
- ✅ Handles distress center call
- ✅ Website navigation
- ✅ Error modal when calling not supported
- ✅ Displays all coping strategies
- ✅ Shows grounding technique steps
- ✅ Snapshot test

### 2. Notifications (`notifications.test.tsx`)
**Coverage:**
- Screen rendering and notification list
- API integration for loading notifications
- Mark as read functionality
- Mark all as read
- Clear all notifications
- Pull-to-refresh
- Empty states
- Error handling
- Notification type icons

**Key Tests:**
- ✅ Renders notifications screen correctly
- ✅ Displays empty state when no notifications
- ✅ Displays notifications list
- ✅ Shows unread count correctly
- ✅ Marks notification as read when tapped
- ✅ Marks all notifications as read
- ✅ Clears all notifications
- ✅ Error modal on load failure
- ✅ Network error handling
- ✅ Snapshot test

### 3. Change Password (`change-password.test.tsx`)
**Coverage:**
- Form rendering and validation
- Password visibility toggle
- Field validation (empty, mismatch, length)
- Clerk authentication integration
- Success/error handling
- Loading states
- Button disable during submission

**Key Tests:**
- ✅ Renders change password screen correctly
- ✅ Displays password requirements
- ✅ Toggles password visibility
- ✅ Shows error when fields are empty
- ✅ Shows error when passwords don't match
- ✅ Shows error when password too short
- ✅ Successfully changes password with valid inputs
- ✅ Shows error message on update failure
- ✅ Shows loading state during password change
- ✅ Disables button while loading
- ✅ Snapshot test

### 4. Resources (`resources.test.tsx`)
**Coverage:**
- Resource listing and loading
- Category filtering
- Search functionality
- Featured resource display
- Navigation to detail screen
- Daily affirmation and quote buttons
- Empty states
- Error handling
- Pull-to-refresh

**Key Tests:**
- ✅ Renders resources screen correctly
- ✅ Loads and displays resources
- ✅ Displays category filters
- ✅ Filters resources by category
- ✅ Searches resources with debouncing
- ✅ Displays featured resource
- ✅ Navigates to resource detail
- ✅ Shows empty state when no resources
- ✅ Error modal on load failure
- ✅ Pull-to-refresh support
- ✅ Clears category filter
- ✅ Clears search
- ✅ Snapshot test

### 5. Self Assessment (`self-assessment.test.tsx`)
**Coverage:**
- Survey rendering (Warwick-Edinburgh scale)
- Question and response display
- Response selection
- Score calculation
- Validation (incomplete survey)
- Submission to backend
- Success/error handling
- User authentication check

**Key Tests:**
- ✅ Renders self assessment screen correctly
- ✅ Displays all survey questions (7 questions)
- ✅ Displays response options (5 levels)
- ✅ Allows selecting responses
- ✅ Shows alert when submitting incomplete survey
- ✅ Successfully submits completed survey
- ✅ Calculates correct score (7-35 range)
- ✅ Shows success modal after submission
- ✅ Shows error alert on submission failure
- ✅ Shows error when user not logged in
- ✅ Allows changing answers before submission
- ✅ Snapshot test

### 6. Video Consultations (`video-consultations.test.tsx`)
**Coverage:**
- Screen rendering
- Upcoming appointments display
- Join meeting functionality
- Technical requirements display
- Support worker information
- Appointment details (time, date, status)

**Key Tests:**
- ✅ Renders video consultations screen correctly
- ✅ Displays upcoming appointments
- ✅ Shows join meeting button
- ✅ Navigates to video call screen
- ✅ Displays technical requirements
- ✅ Shows appointment time and date
- ✅ Displays support worker information
- ✅ Shows appointment status
- ✅ Snapshot test

## Test Patterns Used

### 1. Provider Wrapper
All tests use the custom `render` function from `test-utils.tsx` that wraps components with:
- `ThemeProvider` for theme context
- `SafeAreaProvider` with stable `initialMetrics`

### 2. Mock Strategy
- **Clerk Auth**: Mocked `useUser` and `useSignIn` hooks
- **Expo Router**: Mocked `router.push`, `router.replace`, `useFocusEffect`
- **React Native APIs**: Mocked `Linking`, `Alert`, `AsyncStorage`
- **Custom APIs**: Mocked `moodApi`, `resourcesApi`, `assessmentTracker`, etc.
- **Fetch**: Global `fetch` mock for API calls

### 3. Test Structure
```typescript
describe('ScreenName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
  });

  it('renders screen correctly', () => {
    render(<Screen />);
    expect(screen.getByText('Title')).toBeTruthy();
  });

  it('handles user interaction', async () => {
    render(<Screen />);
    const button = screen.getByText('Action');
    fireEvent.press(button);
    await waitFor(() => {
      expect(mockFunction).toHaveBeenCalled();
    });
  });

  it('matches snapshot', () => {
    const tree = render(<Screen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
```

## Running Tests

### Individual Test Files
```powershell
# Crisis Support
npm test -- __tests__/screens/crisis-support.test.tsx --watchAll=false

# Notifications
npm test -- __tests__/screens/notifications.test.tsx --watchAll=false

# Change Password
npm test -- __tests__/screens/change-password.test.tsx --watchAll=false

# Resources
npm test -- __tests__/screens/resources.test.tsx --watchAll=false

# Self Assessment
npm test -- __tests__/screens/self-assessment.test.tsx --watchAll=false

# Video Consultations
npm test -- __tests__/screens/video-consultations.test.tsx --watchAll=false
```

### All Screen Tests
```powershell
npm test -- __tests__/screens --watchAll=false
```

### With Coverage
```powershell
npm test -- __tests__/screens --coverage --watchAll=false
```

## Coverage Summary

| Screen | Test File | Tests | Coverage Areas |
|--------|-----------|-------|----------------|
| Crisis Support | crisis-support.test.tsx | 11 | Emergency calls, navigation, UI display |
| Notifications | notifications.test.tsx | 14 | API integration, CRUD operations, UI states |
| Change Password | change-password.test.tsx | 11 | Form validation, Clerk integration, states |
| Resources | resources.test.tsx | 13 | Filtering, search, API integration, navigation |
| Self Assessment | self-assessment.test.tsx | 12 | Survey flow, validation, scoring, submission |
| Video Consultations | video-consultations.test.tsx | 9 | Appointments display, meeting join, UI |
| **Total** | **6 files** | **70 tests** | **Complete (app) screen coverage** |

## Existing Test Files
- ✅ `home.test.tsx` - Dashboard/home screen
- ✅ `appointments.test.tsx` - Appointments management
- ✅ `journal.test.tsx` - Journal entries
- ✅ `mood-tracking.test.tsx` - Mood logging

## Test Execution Notes

1. **Environment Setup**: Tests use `IS_TEST_ENV` guards in screens to skip async operations
2. **Mock Consistency**: All mocks defined in `jest.setup.cjs` are applied globally
3. **Async Handling**: Use `waitFor` for async operations and API calls
4. **Snapshot Tests**: Included for visual regression detection
5. **Error Cases**: Both network errors and validation errors are covered

## Next Steps

1. **Run Tests**: Execute all screen tests to verify they pass
   ```powershell
   npm test -- __tests__/screens --watchAll=false
   ```

2. **Update Snapshots** (if UI changed):
   ```powershell
   npm test -- __tests__/screens -u --watchAll=false
   ```

3. **Coverage Report**:
   ```powershell
   npm test -- __tests__/screens --coverage --watchAll=false
   ```

4. **Integration Tests**: Consider adding E2E tests with Detox for full user flows

5. **CI/CD**: Add these tests to your CI pipeline for automated validation

## Best Practices Applied

- ✅ Isolated unit tests (no cross-test dependencies)
- ✅ Clear test descriptions (what, not how)
- ✅ Async/await patterns for timing-sensitive operations
- ✅ Error boundary testing
- ✅ Accessibility considerations (testID usage)
- ✅ Snapshot tests for visual regression
- ✅ Mock cleanup in `beforeEach`
- ✅ Realistic user interaction patterns
- ✅ Both happy path and error scenarios

## Known Limitations

1. **Visual Tests**: Snapshot tests don't validate actual UI rendering; consider visual regression tools
2. **Animation Tests**: Animation values not tested in detail (useNativeDriver limitations)
3. **Linking/External**: Real device linking not tested (mocked)
4. **Network Timing**: Real network delays not simulated
5. **Deep Navigation**: Multi-level navigation flows tested separately in integration tests

## Maintenance

- Update mocks when APIs change
- Regenerate snapshots after intentional UI changes
- Keep test data realistic but minimal
- Review and refactor brittle tests regularly
- Add tests for new features immediately
