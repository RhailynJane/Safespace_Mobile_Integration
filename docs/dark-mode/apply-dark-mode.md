# Auto-Apply Dark Mode Script

## Automated Find & Replace Patterns

Use your editor's "Find and Replace in Files" feature with these patterns:

### 1. Container Backgrounds
**Find:** `style={[styles.container, { backgroundColor: theme.colors.background }]}`
**Replace:** `style={[styles.container, { backgroundColor: theme.colors.background }]}`

**Find:** `style={styles.card}`
**Replace:** `style={[styles.card, { backgroundColor: theme.colors.surface }]}`

**Find:** `style={styles.section}`
**Replace:** `style={[styles.section, { backgroundColor: theme.colors.surface }]}`

### 2. Text Colors  
**Find:** `style={styles.title}`
**Replace:** `style={[styles.title, { color: theme.colors.text }]}`

**Find:** `style={styles.subtitle}`
**Replace:** `style={[styles.subtitle, { color: theme.colors.textSecondary }]}`

**Find:** `style={styles.label}`
**Replace:** `style={[styles.label, { color: theme.colors.text }]}`

**Find:** `style={styles.description}`
**Replace:** `style={[styles.description, { color: theme.colors.textSecondary }]}`

### 3. Borders
**Find:** `borderBottomColor: "#`  
**Replace:** `borderBottomColor: theme.colors.borderLight`

**Find:** `borderColor: "#`
**Replace:** `borderColor: theme.colors.border`

### 4. Icons (Hardcoded Colors)
**Find:** `color="#666"`
**Replace:** `color={theme.colors.icon}`

**Find:** `color="#999"`
**Replace:** `color={theme.colors.iconDisabled}`

**Find:** `color="#333"`
**Replace:** `color={theme.colors.text}`

## Manual Review Checklist

After automated replacements, manually check each file for:

1. **Already has theme applied?** (Don't duplicate)
2. **Color should stay fixed?** (e.g., error red, success green)
3. **Icon colors in JSX?** Change to `color={theme.colors.icon}`
4. **Nested styles?** Apply theme to all levels

## Priority Files (Do These First)

1. Appointments - High user interaction
   - `app/(app)/(tabs)/appointments/**/*.tsx`

2. Messages - High visibility
   - `app/(app)/(tabs)/messages/**/*.tsx`

3. Community Forum - Content heavy
   - `app/(app)/(tabs)/community-forum/**/*.tsx`

4. Journal - Personal content
   - `app/(app)/journal/**/*.tsx`

5. Profile Edit - Forms and inputs
   - `app/(app)/(tabs)/profile/edit.tsx`

## Files Already Done ✅
- settings.tsx
- profile/index.tsx  
- home.tsx (partially - just updated)

## Quick Test After Each File
1. Toggle dark mode in Settings
2. Navigate to the updated page
3. Check: Background dark? Text visible? Cards visible?
4. Navigate away and back - still dark?
