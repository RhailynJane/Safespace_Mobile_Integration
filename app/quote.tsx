import { router } from "expo-router";
import { useEffect } from "react";
import { Animated, StyleSheet, Text, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";
/**
 * LLM Prompt: how to make a splash screen in react native that shows my logo and a quote, then automatically goes to the next screen after a few seconds?
 * Reference; chat.deepseek.com
 */

/**
 * QuoteScreen - Displays an inspirational mental health quote with smooth animations
 * Features a welcoming screen that shows the SafeSpace logo and an encouraging message
 * Automatically transitions to the onboarding flow after a brief display period
 */
export default function QuoteScreen() {
  const { theme } = useTheme();
  // Animation control values for entrance effects
  const fadeAnim = new Animated.Value(0);        // Controls opacity (0 = invisible, 1 = fully visible)
  const slideAnim = new Animated.Value(20);      // Controls vertical slide distance (pixels)
  const logoScaleAnim = new Animated.Value(0.8); // Controls logo scale (0.8 = 80% size, 1 = full size)

  useEffect(() => {
    // Start all entrance animations simultaneously for a polished effect
    Animated.parallel([
      // Fade animation: elements gradually become visible
      Animated.timing(fadeAnim, {
        toValue: 1,         // Fully visible
        duration: 1000,     // 1 second duration
        useNativeDriver: true, // Optimize performance
      }),
      // Slide animation: quote moves up from slightly below its final position
      Animated.timing(slideAnim, {
        toValue: 0,         // Final position (no offset)
        duration: 1000,     // 1 second duration
        useNativeDriver: true,
      }),
      // Scale animation: logo grows from 80% to 100% size
      Animated.timing(logoScaleAnim, {
        toValue: 1,         // Full size (100%)
        duration: 1000,     // 1 second duration
        useNativeDriver: true,
      }),
    ]).start();

    // Set timer to automatically navigate to onboarding after 4 seconds
    // This gives users enough time to read the quote while maintaining flow
    const timer = setTimeout(() => {
      router.replace("/onboarding");
    }, 4000);

    // Cleanup: clear the timer if component unmounts before navigation
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Animated SafeSpace Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,        // Apply fade animation
              transform: [{ scale: logoScaleAnim }], // Apply scale animation
            },
          ]}
        >
          <Image
            source={require("../assets/images/safespace-logo.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="SafeSpace logo"
          />
        </Animated.View>

        {/* Animated Quote Container with Text Content */}
        <Animated.View
          style={[
            styles.quoteContainer,
            {
              opacity: fadeAnim,        // Apply fade animation
              transform: [{ translateY: slideAnim }], // Apply slide animation
            },
          ]}
        >
          {/* Inspirational quote text */}
          <Text style={[styles.quote, { color: theme.colors.text }]}>
            "Healing takes time, and asking for help is a courageous step."
          </Text>
          {/* Quote author attribution */}
          <Text style={[styles.author, { color: theme.colors.textSecondary }]}>— Mariska Hargitay</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container with warm, welcoming background color
  container: {
    flex: 1,
    backgroundColor: "#fed7aa", // Warm peach background for comforting feel
  },
  // Content area centered both vertically and horizontally
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32, // Side padding for smaller screens
  },
  // Container for the logo with fixed dimensions
  logoContainer: {
    marginBottom: 32,      // Space between logo and quote
    width: 150,            // Fixed width for logo container
    height: 150,           // Fixed height for logo container
  },
  // Logo image styling - fills its container
  logo: {
    width: "100%",         // Fill container width
    height: "100%",        // Fill container height
    // Subtle shadow for depth and visual appeal
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  // Container for quote text with centered alignment
  quoteContainer: {
    alignItems: "center",  // Center text horizontally
  },
  // Main quote text styling
  quote: {
    fontSize: 20,          // Readable size for quote text
    fontWeight: "500",     // Medium weight for emphasis
    color: "#374151",      // Dark gray for good readability
    textAlign: "center",   // Center-aligned text
    lineHeight: 28,        // Comfortable line spacing
    marginBottom: 24,      // Space between quote and author
  },
  // Author attribution text styling
  author: {
    fontSize: 14,          // Smaller than quote text
    color: "#6b7280",      // Medium gray for secondary information
    fontStyle: "italic",   // Italicized for attribution style
  },
});