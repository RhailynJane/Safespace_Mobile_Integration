// File: constants/theme.ts

export const Colors = {
  // Primary Colors
  primary: "#B2BE9C", // green
  secondary: "#F7A399", // Coral/peach

  // Background Colors
  background: "#FAFAFA", // Light gray background
  surface: "#FFFFFF", // White cards/surfaces
  surfaceSecondary: "#F5F5F5", // Light gray for tabs

  // Text Colors
  textPrimary: "#333333", // Dark gray for headings
  textSecondary: "#666666", // Medium gray for body text
  textTertiary: "#999999", // Light gray for placeholders

  // Status Colors
  error: "#FF6B6B", // Error red
  errorBackground: "#FFE8E8", // Light error background
  success: "#4CAF50", // Success green
  warning: "#FF9800", // Warning orange
  info: "#2196F3", // Info blue

  

  // Social Colors
  facebook: "#1877F2",
  google: "#DB4437",
  apple: "#000000",

  // Action Colors
  link: "#7FDBDA", // Same as primary for links
  disabled: "#CCCCCC", // Disabled state
  border: "#e0e0e0", // Added border color
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  huge: 40,
};

export const BorderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  pill: 25,
  circle: 50,
};

export const Typography = {
  title: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500" as const,
    color: Colors.textSecondary,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.textPrimary,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.surface,
  },
  link: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.link,
  },
};

export const Shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Common component styles that you can reuse throughout your app
export const CommonStyles = {
  // Primary button style
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.lg,
    alignItems: "center" as const,
    ...Shadows.small,
  },

  // Secondary button style
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.lg,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: Colors.primary,
    ...Shadows.small,
  },

  // Input container style
  inputContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.lg,
    height: 50,
    ...Shadows.small,
  },

  // Card style
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    ...Shadows.medium,
  },

  // Tab container style
  tabContainer: {
    flexDirection: "row" as const,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.pill,
    padding: 4,
  },

  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Content container for forms
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center" as const,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.huge,
  },
};
