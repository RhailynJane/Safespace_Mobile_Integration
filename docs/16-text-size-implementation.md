# Text Size Implementation Guide

## Overview
The text size feature allows users to adjust the font size across the entire app from the Settings screen. This guide explains how the feature works and how to implement it in your components.

## Architecture

### 1. ThemeContext Enhancement
The `ThemeContext` includes text size management with four sizes:

```typescript
interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  textSize: string;              // "Extra Small" | "Small" | "Medium" | "Large"
  setTextSize: (size: string) => void;
  fontScale: number;             // 0.85, 0.95, 1.0, 1.15
  scaledFontSize: (baseSize: number) => number;  // Helper function
}
```

### 2. Font Scaling
Font scales are defined as follows:
- **Extra Small**: 0.85x
- **Small**: 0.95x
- **Medium**: 1.0x (default)
- **Large**: 1.15x

The `scaledFontSize` function takes a base font size and multiplies it by the current scale:
```typescript
scaledFontSize(16) // Returns: 13.6 (XS), 15.2 (S), 16 (M), 18.4 (L)
```

## How to Use Text Size in Components

## Settings UI (Slider)

Text size is controlled via a slider with four steps and labels:

```typescript
const textSizeLabels = ["Extra Small", "Small", "Medium", "Large"] as const;
type TextSizeLabel = typeof textSizeLabels[number];

// Conversion helpers
const textSizeToSlider = (size: string) => Math.max(0, textSizeLabels.indexOf(size as TextSizeLabel));
const sliderToTextSize = (val: number): TextSizeLabel => textSizeLabels[Math.min(textSizeLabels.length-1, Math.max(0, Math.round(val)))] as TextSizeLabel;

// In Settings screen
const { setTextSize } = useTheme();
const [textSizeSlider, setTextSizeSlider] = useState<number>(textSizeToSlider(textSize));

<Slider
  minimumValue={0}
  maximumValue={3}
  step={1}
  value={textSizeSlider}
  onValueChange={setTextSizeSlider}
  onSlidingComplete={(val) => setTextSize(sliderToTextSize(val))}
/>

<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  {textSizeLabels.map((lbl) => (
    <Text key={lbl}>{lbl}</Text>
  ))}
</View>
```

Notes:
- The slider updates ThemeContext immediately on release.
- The current size is persisted to AsyncStorage and applied globally.
- A StatusModal is used for save errors; a small selection modal replaces alert-based pickers.

### Method 1: Dynamic Styles with useMemo (Recommended)

This is the best approach for performance as it only recalculates styles when text size changes.

```typescript
import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function MyComponent() {
  const { theme, scaledFontSize } = useTheme();
  
  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);
  
  return (
    <View>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Hello World
      </Text>
    </View>
  );
}

// Styles function that accepts scaledFontSize
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  title: {
    fontSize: scaledFontSize(24),  // Base size of 24, scales to 21.6, 24, or 28.8
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: scaledFontSize(16),  // Base size of 16, scales to 14.4, 16, or 19.2
    fontWeight: '400',
  },
  body: {
    fontSize: scaledFontSize(14),  // Base size of 14, scales to 12.6, 14, or 16.8
  },
});
```

### Method 2: Inline Styles (For Simple Cases)

For components with just a few text elements:

```typescript
export default function SimpleComponent() {
  const { theme, scaledFontSize } = useTheme();
  
  return (
    <View>
      <Text style={{ 
        fontSize: scaledFontSize(18), 
        color: theme.colors.text 
      }}>
        Hello World
      </Text>
    </View>
  );
}
```

### Method 3: Combining with Existing Styles

If you already have static styles, combine them with scaled font sizes:

```typescript
export default function MixedComponent() {
  const { theme, scaledFontSize } = useTheme();
  
  return (
    <View>
      <Text style={[
        staticStyles.title,
        { 
          fontSize: scaledFontSize(20), 
          color: theme.colors.text 
        }
      ]}>
        Scaled Text
      </Text>
    </View>
  );
}

const staticStyles = StyleSheet.create({
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    // fontSize is set dynamically, not here
  },
});
```

## Implementation Checklist

To implement text size across your app, update each screen file:

### Already Implemented
- ✅ `contexts/ThemeContext.tsx` - Core text size logic (XS/S/M/L with scales 0.85/0.95/1.0/1.15)
- ✅ `app/(app)/(tabs)/profile/settings.tsx` - Slider UI with labels, StatusModal for errors, selection modal for pickers
- ✅ `app/(app)/(tabs)/home.tsx` - Example of using `scaledFontSize`

### To Be Implemented
Apply the pattern to these files:

#### App Screens
- [ ] `app/(app)/(tabs)/(tabs)/_layout.tsx`
- [ ] `app/(app)/(tabs)/community-forum/*.tsx`
- [ ] `app/(app)/(tabs)/appointments/*.tsx`
- [ ] `app/(app)/(tabs)/messages/*.tsx`
- [ ] `app/(app)/(tabs)/profile/*.tsx` (edit.tsx, index.tsx, etc.)
- [ ] `app/(app)/journal/*.tsx`
- [ ] `app/(app)/mood-tracking/*.tsx`
- [ ] `app/(app)/crisis-support/*.tsx`
- [ ] `app/(app)/resources/*.tsx`
- [ ] `app/(app)/self-assessment/*.tsx`
- [ ] `app/(app)/video-consultations/*.tsx`
- [ ] `app/(app)/notifications/*.tsx`

#### Auth Screens
- [ ] `app/(auth)/*.tsx` (login.tsx, signup.tsx, etc.)

#### Onboarding
- [ ] `app/onboarding.tsx`
- [ ] `app/quote.tsx`

#### Components
- [ ] `components/AppHeader.tsx`
- [ ] `components/BottomNavigation.tsx`
- [ ] `components/CurvedBackground.tsx`
- [ ] All signup components
- [ ] Any modal components

## Font Size Guidelines

### Recommended Base Font Sizes

Use these standard base sizes for consistency:

| Element Type | Base Size | Purpose |
|-------------|-----------|---------|
| Large Heading | 28-32px | Page titles, hero text |
| Heading | 24px | Section headers |
| Subheading | 18-20px | Subsection headers |
| Body Text | 14-16px | Main content, paragraphs |
| Small Text | 12px | Labels, captions |
| Tiny Text | 10px | Footnotes, timestamps |

### Example Usage
```typescript
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  pageTitle: {
    fontSize: scaledFontSize(28),     // Large Heading
  },
  sectionHeader: {
    fontSize: scaledFontSize(24),     // Heading
  },
  cardTitle: {
    fontSize: scaledFontSize(18),     // Subheading
  },
  bodyText: {
    fontSize: scaledFontSize(16),     // Body Text
  },
  label: {
    fontSize: scaledFontSize(14),     // Body/Small Text
  },
  caption: {
    fontSize: scaledFontSize(12),     // Small Text
  },
  timestamp: {
    fontSize: scaledFontSize(10),     // Tiny Text
  },
});
```

## Testing

### Test Different Text Sizes
1. Go to Profile → Settings
2. Under "Display" section, change Text Size
3. Navigate through different screens
4. Verify that:
   - All text scales appropriately
   - Layout doesn't break
   - Text remains readable
   - Buttons still work
   - No text overflow issues

### Known Considerations
- **Button Heights**: May need adjustment if text becomes too large
- **Fixed Height Containers**: Consider using `minHeight` instead of `height`
- **Multi-line Text**: Use `numberOfLines` prop to prevent overflow
- **Icons**: Generally should NOT scale (keep icons at fixed sizes)

## Performance Optimization

The implementation uses `useMemo` to ensure styles are only recalculated when text size changes, not on every render.

```typescript
// Good - Only recalculates when scaledFontSize changes
const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

// Bad - Recalculates on every render
const styles = createStyles(scaledFontSize);
```

## Persistence

Text size is automatically:
1. Saved to AsyncStorage when changed
2. Loaded on app startup by ThemeContext
3. Synced to backend via settingsAPI using the actual Clerk user ID
4. Applied globally across all components that use `useTheme()`

Tip: Pass the `user.id` from Clerk to your settings fetch/save calls to avoid falling back to a placeholder ID.

## Common Pitfalls

### ❌ Don't Do This
```typescript
// Hard-coded font size - won't scale
const styles = StyleSheet.create({
  text: {
    fontSize: 16,  // This won't change with user preference
  },
});
```

### ✅ Do This Instead
```typescript
// Scalable font size
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  text: {
    fontSize: scaledFontSize(16),  // Scales with user preference
  },
});
```

## Example: Converting an Existing Component

### Before (Static Styles)
```typescript
export default function MyScreen() {
  const { theme } = useTheme();
  
  return (
    <View>
      <Text style={styles.title}>Title</Text>
      <Text style={styles.body}>Body text</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 16,
  },
});
```

### After (Dynamic Styles)
```typescript
import { useMemo } from 'react';

export default function MyScreen() {
  const { theme, scaledFontSize } = useTheme();
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);
  
  return (
    <View>
      <Text style={[styles.title, { color: theme.colors.text }]}>Title</Text>
      <Text style={[styles.body, { color: theme.colors.text }]}>Body text</Text>
    </View>
  );
}

const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  title: {
    fontSize: scaledFontSize(24),
    fontWeight: 'bold',
  },
  body: {
    fontSize: scaledFontSize(16),
  },
});
```

## Summary

1. Import `useMemo` from React
2. Get `scaledFontSize` from `useTheme()`
3. Convert your StyleSheet to a function that accepts `scaledFontSize`
4. Use `useMemo` to create styles
5. Replace all `fontSize` values with `scaledFontSize(baseSize)`
6. Test with different text size settings

This implementation ensures a consistent, accessible experience for all users regardless of their text size preference!
