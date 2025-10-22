# Dark Mode Implementation Guide

## ✅ What's Already Done

1. **ThemeContext** - Global theme state with AsyncStorage persistence
2. **All pages** - Have `useTheme` hook imported and available
3. **Global components** - AppHeader and BottomNavigation support dark mode

## 🎨 How to Apply Dark Mode to Your Pages

### Step 1: Import and use the theme hook (ALREADY DONE)

```typescript
import { useTheme } from "../../../../contexts/ThemeContext";

export default function YourPage() {
  const { theme, isDarkMode } = useTheme();
  // ... rest of component
}
```

### Step 2: Apply theme colors to your components

#### Available Theme Colors:
```typescript
theme.colors.background      // Page background (#F5F5F5 light, #121212 dark)
theme.colors.surface         // Card/container background (#FFFFFF light, #1E1E1E dark)
theme.colors.text            // Primary text (#333 light, #FFFFFF dark)
theme.colors.textSecondary   // Secondary text (#666 light, #B3B3B3 dark)
theme.colors.textDisabled    // Disabled text (#999 light, #666 dark)
theme.colors.border          // Border color (#E0E0E0 light, #333 dark)
theme.colors.borderLight     // Light border (#F0F0F0 light, #2A2A2A dark)
theme.colors.icon            // Icon color (#666 light, #B3B3B3 dark)
theme.colors.iconDisabled    // Disabled icon (#999 light, #666 dark)
theme.colors.primary         // Primary color (#4CAF50 - same in both)
theme.colors.accent          // Accent color (#7FDBDA - same in both)
theme.colors.error           // Error color (#FF6B6B - same in both)
```

### Step 3: Apply colors using inline styles

**Pattern:**
```typescript
<View style={[styles.container, { backgroundColor: theme.colors.background }]}>
  <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
    <Text style={[styles.title, { color: theme.colors.text }]}>Title</Text>
    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Subtitle</Text>
  </View>
</View>
```

### Complete Example:

```typescript
export default function ProfilePage() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView>
          {/* Card/Container */}
          <View style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
            {/* Text */}
            <Text style={[styles.name, { color: theme.colors.text }]}>John Doe</Text>
            <Text style={[styles.email, { color: theme.colors.textSecondary }]}>john@example.com</Text>
          </View>

          {/* Menu Section */}
          <View style={[styles.menuSection, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.menuItem, { borderBottomColor: theme.colors.borderLight }]}>
              <Ionicons name="settings" size={20} color={theme.colors.icon} />
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Settings</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Don't set backgroundColor here - apply it inline with theme
  },
  profileCard: {
    borderRadius: 15,
    padding: 20,
    margin: 20,
    // Don't set backgroundColor here - apply it inline with theme
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    // Don't set color here - apply it inline with theme
  },
  menuItem: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    // Don't set borderBottomColor here - apply it inline with theme
  },
});
```

## 📝 Checklist for Each Page

For EVERY component in your page:

- [ ] **Container/View**: Add `{ backgroundColor: theme.colors.background }` or `{ backgroundColor: theme.colors.surface }`
- [ ] **Text**: Add `{ color: theme.colors.text }` or `{ color: theme.colors.textSecondary }`
- [ ] **Icons**: Use `color={theme.colors.icon}`
- [ ] **Borders**: Add `{ borderColor: theme.colors.border }` or `{ borderColor: theme.colors.borderLight }`
- [ ] **Cards**: Add `{ backgroundColor: theme.colors.surface }`
- [ ] **TextInput**: Add `{ backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }`

## ❌ Common Mistakes to Avoid

1. **Don't use hardcoded colors in StyleSheet.create()**
   ```typescript
   // ❌ WRONG
   const styles = StyleSheet.create({
     container: {
       backgroundColor: "#FFFFFF", // Hardcoded - won't change with theme!
     }
   });
   
   // ✅ CORRECT
   const styles = StyleSheet.create({
     container: {
       // No backgroundColor here
     }
   });
   // Apply in JSX:
   <View style={[styles.container, { backgroundColor: theme.colors.surface }]} />
   ```

2. **Don't use hardcoded black/white text**
   ```typescript
   // ❌ WRONG
   <Text style={{ color: "#333" }}>Text</Text>
   
   // ✅ CORRECT
   <Text style={{ color: theme.colors.text }}>Text</Text>
   ```

3. **Don't forget to apply theme to nested components**
   ```typescript
   // ❌ WRONG - only outer view has theme
   <View style={{ backgroundColor: theme.colors.surface }}>
     <View style={styles.innerCard}>  {/* This stays white! */}
       <Text>Text</Text>  {/* This stays black! */}
     </View>
   </View>
   
   // ✅ CORRECT - all components have theme
   <View style={{ backgroundColor: theme.colors.surface }}>
     <View style={[styles.innerCard, { backgroundColor: theme.colors.surface }]}>
       <Text style={{ color: theme.colors.text }}>Text</Text>
     </View>
   </View>
   ```

## 🚀 Quick Fix Template

Replace these patterns in your code:

| Old (Hardcoded) | New (Themed) |
|----------------|--------------|
| `backgroundColor: "#FFFFFF"` | `backgroundColor: theme.colors.surface` |
| `backgroundColor: "#F5F5F5"` | `backgroundColor: theme.colors.background` |
| `color: "#333"` | `color: theme.colors.text` |
| `color: "#666"` | `color: theme.colors.textSecondary` |
| `color: "#999"` | `color: theme.colors.textDisabled` |
| `borderColor: "#E0E0E0"` | `borderColor: theme.colors.border` |
| `borderColor: "#F0F0F0"` | `borderColor: theme.colors.borderLight` |

## 📱 Testing Dark Mode

1. Go to Settings → Display & Accessibility → Dark Mode
2. Toggle the switch
3. Navigate to different pages
4. Verify:
   - Background changes to dark (#121212)
   - Cards/surfaces change to dark (#1E1E1E)
   - Text changes to white (#FFFFFF)
   - All elements are readable
   - Theme persists when navigating between pages
   - Theme persists when closing and reopening app
