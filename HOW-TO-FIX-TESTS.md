# 🔧 Test Implementation Guide

## Current Status
```
Test Suites: 11 failed, 4 passed, 15 total
Tests:       132 failed, 44 passed, 176 total
```

**Why tests are failing:** The test files have TypeScript errors because they're using placeholder props that don't match your actual component interfaces. This is EXPECTED and EASY to fix!

---

## 🎯 Step-by-Step Fix Guide

### Step 1: Add testIDs to Your Components (30 minutes)

This is the **most important step**. Without testIDs, tests can't find elements.

#### Example: Update your Home screen

**Before:**
```tsx
// app/(app)/(tabs)/home.tsx
export default function HomeScreen() {
  return (
    <View>
      <Text>Welcome</Text>
      <TouchableOpacity onPress={() => navigate('mood-tracking')}>
        <Text>Track Mood</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**After:**
```tsx
// app/(app)/(tabs)/home.tsx
export default function HomeScreen() {
  return (
    <View testID="home-screen">
      <ScrollView testID="home-scroll-view">
        <Text testID="welcome-text">Welcome</Text>
        <TouchableOpacity 
          testID="quick-access-mood"
          onPress={() => navigate('mood-tracking')}
        >
          <Text>Track Mood</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="crisis-support-button">
          <Text>Crisis Support</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
```

#### testIDs Needed for Each File

**Home Tab** (`app/(app)/(tabs)/home.tsx`):
```
- home-screen
- home-scroll-view
- home-loading
- quick-access-mood
- quick-access-journal
- quick-access-appointments
- quick-access-resources
- crisis-support-button
- daily-quote
```

**Community Forum** (`app/(app)/(tabs)/community-forum/index.tsx`):
```
- community-forum
- create-post-button
- forum-search
- category-filter
- category-anxiety
- posts-list
```

**Messages** (`app/(app)/(tabs)/messages/index.tsx`):
```
- messages-screen
- messages-search
- new-message-button
- conversations-list
- conversation-{id}
- delete-conversation-{id}
- online-indicator-{id}
```

**Profile** (`app/(app)/(tabs)/profile/index.tsx`):
```
- profile-screen
- profile-scroll-view
- user-avatar
- edit-profile-button
- settings-option
- help-support-option
- logout-button
- notification-toggle
- change-avatar-button
- avatar-picker-modal
```

**Components** need testIDs too:
```
AppHeader: app-header, back-button, header-action-button
BottomNavigation: bottom-navigation, nav-tab-{name}, nav-icon-{name}
StatusModal: status-modal, modal-close-button, status-icon-{type}
TimePickerModal: time-picker-modal, hour-picker, minute-picker, etc.
```

---

### Step 2: Fix TypeScript Errors (Read Component Props)

The tests fail because they're using props that don't match your actual components. Let's fix them:

#### Example: AppHeader Component

**First, check your actual component:**
```tsx
// Read: components/AppHeader.tsx
export default function AppHeader({ title, showBack, onBackPress }: AppHeaderProps) {
  // ... component code
}
```

**Then update the test to match:**
```tsx
// __tests__/components/AppHeader.test.tsx
it('should render without crashing', () => {
  const { getByTestId } = render(<AppHeader title="Test Title" />);
  expect(getByTestId('app-header')).toBeTruthy();
});
```

#### Common Fixes Needed:

1. **Navigation prop for screens:**
   ```tsx
   // If your screen uses useNavigation() hook, no prop needed:
   render(<HomeScreen />)
   
   // If it expects navigation prop:
   const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
   render(<HomeScreen navigation={mockNavigation} />)
   ```

2. **Component exports:**
   ```tsx
   // If component uses default export:
   import AppHeader from '../../components/AppHeader';
   
   // If component uses named export:
   import { AppHeader } from '../../components/AppHeader';
   ```

3. **Props mismatch:**
   - Read the actual component file
   - Check what props it expects (TypeScript interface/type)
   - Update test to match exactly

---

### Step 3: Run Tests One File at a Time

Don't try to fix everything at once! Fix and test incrementally:

```powershell
# Test one file
npm test -- SafeSpaceLogo.test.tsx

# Once passing, move to next
npm test -- AppHeader.test.tsx

# Fix errors, then test again
npm test -- AppHeader.test.tsx
```

---

## 🚀 Quick Fix Workflow

### For Each Test File:

1. **Read the actual component/screen file**
   - What props does it expect?
   - What's the interface/type definition?
   - Is it default or named export?

2. **Update the test imports**
   ```tsx
   // Match your actual exports
   import ComponentName from '../../path/to/Component';
   // or
   import { ComponentName } from '../../path/to/Component';
   ```

3. **Fix the render calls**
   ```tsx
   // Remove props that don't exist
   // Add required props
   render(<Component requiredProp="value" />)
   ```

4. **Add testIDs to the actual component**
   - Go to the component file
   - Add testID props to elements tests need

5. **Run the test**
   ```powershell
   npm test -- FileName.test.tsx
   ```

6. **Debug failures**
   - Read error messages carefully
   - They tell you exactly what's wrong
   - Fix one error at a time

---

## 📋 Priority Order (Do These First)

### High Priority (Components you already have):
1. ✅ **SafeSpaceLogo** - Already passing!
2. **AppHeader** - Simple, good practice
3. **BottomNavigation** - Navigation critical
4. **CurvedBackground** - Simple styling component
5. **OptimizedImage** - Simple image component

### Medium Priority (Main features):
6. **Home tab** - Dashboard is important
7. **Profile tab** - User management
8. **Mood tracking screen** - Core feature
9. **Journal screen** - Core feature
10. **Appointments screen** - Core feature

### Lower Priority (Complex or less critical):
11. Messages tab
12. Community Forum tab
13. StatusModal
14. TimePickerModal
15. SignUpForm components

---

## 🔍 Debugging Tips

### When a test fails:

1. **Read the error message** - It tells you exactly what's wrong:
   ```
   Cannot find element with testID="home-screen"
   → Add testID="home-screen" to your component
   
   Property 'navigation' does not exist
   → Remove navigation prop or use useNavigation() hook
   
   Cannot find module 'AppHeader'
   → Check import path or export type
   ```

2. **Check the component first** - Don't guess, look at the actual code:
   ```powershell
   # Open the component file and read it
   code components/AppHeader.tsx
   ```

3. **Use console.log in tests** (debugging):
   ```tsx
   it('test name', () => {
     const { debug } = render(<Component />);
     debug(); // Prints component tree
   });
   ```

4. **Run with verbose output**:
   ```powershell
   npm test -- --verbose AppHeader.test.tsx
   ```

---

## ✅ Example: Complete Fix for One Component

Let's fix AppHeader completely:

### 1. Read the actual component:
```powershell
code components/AppHeader.tsx
```

Assume it looks like this:
```tsx
interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export default function AppHeader({ 
  title, 
  showBackButton, 
  onBackPress 
}: AppHeaderProps) {
  return (
    <View testID="app-header">
      {showBackButton && (
        <TouchableOpacity testID="back-button" onPress={onBackPress}>
          <Text>Back</Text>
        </TouchableOpacity>
      )}
      <Text>{title}</Text>
    </View>
  );
}
```

### 2. Update the test file:
```tsx
// __tests__/components/AppHeader.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AppHeader from '../../components/AppHeader'; // Default export

describe('AppHeader Component', () => {
  it('should render without crashing', () => {
    const { getByTestId } = render(<AppHeader title="Test Title" />);
    expect(getByTestId('app-header')).toBeTruthy();
  });

  it('should display the correct title', () => {
    const { getByText } = render(<AppHeader title="Dashboard" />);
    expect(getByText('Dashboard')).toBeTruthy();
  });

  it('should render back button when showBackButton is true', () => {
    const mockOnBackPress = jest.fn();
    const { getByTestId } = render(
      <AppHeader 
        title="Details" 
        showBackButton={true}
        onBackPress={mockOnBackPress} 
      />
    );
    expect(getByTestId('back-button')).toBeTruthy();
  });

  it('should call onBackPress when back button is pressed', () => {
    const mockOnBackPress = jest.fn();
    const { getByTestId } = render(
      <AppHeader 
        title="Details" 
        showBackButton={true}
        onBackPress={mockOnBackPress} 
      />
    );
    
    fireEvent.press(getByTestId('back-button'));
    expect(mockOnBackPress).toHaveBeenCalledTimes(1);
  });
});
```

### 3. Run the test:
```powershell
npm test -- AppHeader.test.tsx
```

### 4. Verify it passes:
```
PASS  __tests__/components/AppHeader.test.tsx
  ✓ should render without crashing (25 ms)
  ✓ should display the correct title (10 ms)
  ✓ should render back button when showBackButton is true (8 ms)
  ✓ should call onBackPress when back button is pressed (12 ms)
```

---

## 🎯 Success Checklist

For each test file:
- [ ] Read the actual component/screen source code
- [ ] Understand its props interface
- [ ] Add testIDs to the component
- [ ] Update test imports (default vs named)
- [ ] Fix props in render() calls
- [ ] Remove props that don't exist
- [ ] Add required props
- [ ] Run the test
- [ ] Fix any remaining errors
- [ ] Verify all tests pass

---

## 📞 Need Help?

If stuck on a specific test:

1. **Share the error message** - Copy the exact error
2. **Share the component code** - Show the actual component
3. **Share the test code** - Show what you tried

Most errors are simple fixes once you see the actual component props!

---

## 🎓 Remember

- **Tests are templates** - They need customization for YOUR components
- **TypeScript helps you** - Errors show exactly what's wrong
- **One at a time** - Fix incrementally, don't batch
- **testIDs are critical** - Without them, tests can't find elements
- **Read the component first** - Don't guess the props

---

**You've got this! 💪**

Start with SafeSpaceLogo (already passing), then AppHeader (simplest), then work through the list. Each one will get easier as you learn the pattern!
