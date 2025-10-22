# Dark Mode Implementation Guide

## Overview
The app now has global dark mode support using React Context. The theme can be toggled from the Profile Settings page and applies across all pages.

## How It Works

### 1. Theme Context (`contexts/ThemeContext.tsx`)
The global theme provider manages dark mode state and provides theme colors to all components.

```typescript
import { useTheme } from '../contexts/ThemeContext';

const { theme, isDarkMode, setDarkMode, toggleDarkMode } = useTheme();
```

### 2. Available Theme Colors
```typescript
theme.colors = {
  background: string;      // Main background color
  surface: string;         // Card/surface background
  text: string;           // Primary text color
  textSecondary: string;  // Secondary text color
  textDisabled: string;   // Disabled text color
  border: string;         // Border color
  borderLight: string;    // Light border color
  icon: string;           // Icon color
  iconDisabled: string;   // Disabled icon color
  primary: string;        // Primary brand color (#4CAF50)
  accent: string;         // Accent color (#7FDBDA)
  error: string;          // Error color (#FF6B6B)
}
```

## How to Add Dark Mode to Any Page

### Step 1: Import the Theme Hook
```typescript
import { useTheme } from '../../../contexts/ThemeContext';
```

### Step 2: Use the Theme in Your Component
```typescript
export default function YourScreen() {
  const { theme } = useTheme();
  
  // Your component code...
}
```

### Step 3: Apply Theme Colors to Styles
Use inline style objects with theme colors:

```typescript
// Container/Background
<View style={[styles.container, { backgroundColor: theme.colors.background }]}>

// Surface/Cards
<View style={[styles.card, { backgroundColor: theme.colors.surface }]}>

// Text
<Text style={[styles.title, { color: theme.colors.text }]}>Title</Text>
<Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Subtitle</Text>

// Borders
<View style={[styles.divider, { borderColor: theme.colors.border }]}>

// Icons
<Ionicons name="home" size={24} color={theme.colors.icon} />
```

## Complete Example

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';

export default function ExampleScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Hello World
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          This supports dark mode!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
});
```

## Pages Already Updated
- ✅ `app/(app)/(tabs)/profile/settings.tsx` - Full dark mode support
- ✅ `app/(app)/(tabs)/home.tsx` - Partial dark mode support (example)

## Pages That Need Updating
Apply the same pattern to these pages:
- [ ] `app/(app)/(tabs)/appointments/index.tsx`
- [ ] `app/(app)/(tabs)/community-forum/index.tsx`
- [ ] `app/(app)/(tabs)/messages/index.tsx`
- [ ] `app/(app)/(tabs)/profile/index.tsx`
- [ ] `app/(app)/(tabs)/profile/edit.tsx`
- [ ] All journal pages
- [ ] All mood tracking pages
- [ ] All resource pages
- [ ] All assessment pages

## Best Practices

### 1. Always Use Theme Colors
❌ Don't hardcode colors:
```typescript
<View style={{ backgroundColor: '#FFFFFF' }}>
```

✅ Use theme colors:
```typescript
<View style={{ backgroundColor: theme.colors.surface }}>
```

### 2. Combine Styles Correctly
```typescript
// Combine static styles with dynamic theme colors
<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
```

### 3. Update Both Light and Dark Elements
Make sure to update:
- Backgrounds
- Text colors
- Icon colors
- Border colors
- Any hardcoded colors

### 4. Test Both Modes
Always test your changes in both light and dark mode to ensure readability.

## Toggling Dark Mode

Users can toggle dark mode from:
**Profile → Settings → Display & Accessibility → Dark Mode**

The setting is saved to AsyncStorage and persists across app restarts.

## Technical Details

### Theme Storage
- Theme preference is stored in AsyncStorage as `appDarkMode`
- Automatically loads on app start
- Syncs with backend via settings API

### Provider Hierarchy
```
ClerkProvider
  └── SafeAreaProvider
      └── ThemeProvider  ← Global theme context
          └── App Components
```

### Performance
The theme context uses React Context API, which efficiently updates only components that consume the theme when dark mode is toggled.
