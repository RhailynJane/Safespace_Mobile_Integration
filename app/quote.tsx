import { router } from "expo-router";
import { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * QuoteScreen - Splash screen displaying an inspirational quote
 * Shows a branded logo with animation and an inspiring mental health quote
 * Automatically transitions to onboarding after 4 seconds
 */
export default function QuoteScreen() {
  // Animation value for fade-in effect (0 = invisible, 1 = fully visible)
  const fadeAnim = new Animated.Value(0);
  // Animation value for slide-up effect (starts 20px down, slides to 0)
  const slideAnim = new Animated.Value(20);

  useEffect(() => {
    // Start parallel animations for fade-in and slide-up effects
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, // Fade from invisible to visible
        duration: 1000, // 1 second animation
        useNativeDriver: true, // Use native driver for better performance
      }),
      Animated.timing(slideAnim, {
        toValue: 0, // Slide from 20px down to original position
        duration: 1000, // 1 second animation
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate to onboarding after 4 seconds
    const timer = setTimeout(() => {
      router.replace("/onboarding"); // Replace current screen to prevent back navigation
    }, 4000);

    // Cleanup timer when component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo with fade-in animation */}
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <View style={styles.logo}>
            {/* Outer white circle */}
            <View style={styles.logoInner}>
              {/* Inner teal circle */}
              <View style={styles.logoCenter} />
              {/* Center white circle - creates layered logo effect */}
            </View>
          </View>
        </Animated.View>

        {/* Quote container with fade-in and slide-up animations */}
        <Animated.View
          style={[
            styles.quoteContainer,
            {
              opacity: fadeAnim, // Fade-in effect
              transform: [{ translateY: slideAnim }], // Slide-up effect
            },
          ]}
        >
          {/* Main inspirational quote */}
          <Text style={styles.quote}>
            "Healing takes time, and asking for help is a courageous step."
          </Text>
          {/* Quote attribution */}
          <Text style={styles.author}>— Mariska Hargitay</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container with warm peach background
  container: {
    flex: 1,
    backgroundColor: "#fed7aa", // Warm peach color for calming effect
  },

  // Content container - centers all elements
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32, // Side padding for text readability
  },

  // Container for logo with bottom spacing
  logoContainer: {
    marginBottom: 32, // Space between logo and quote
  },

  // Outer logo circle (white background)
  logo: {
    width: 64,
    height: 64,
    backgroundColor: "#ffffff",
    borderRadius: 32, // Perfect circle (half of width/height)
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000", // Drop shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8, // Android shadow
  },

  // Inner logo circle (teal color)
  logoInner: {
    width: 40,
    height: 40,
    backgroundColor: "#14b8a6", // Teal brand color
    borderRadius: 20, // Perfect circle
    justifyContent: "center",
    alignItems: "center",
  },

  // Center logo circle (white) - creates layered effect
  logoCenter: {
    width: 24,
    height: 24,
    backgroundColor: "#ffffff",
    borderRadius: 12, // Perfect circle
  },

  // Container for quote and author text
  quoteContainer: {
    alignItems: "center", // Center-align quote content
  },

  // Main quote text styling
  quote: {
    fontSize: 20,
    fontWeight: "500", // Medium weight for readability
    color: "#374151", // Dark gray for good contrast
    textAlign: "center",
    lineHeight: 28, // Increased line height for better readability
    marginBottom: 24, // Space between quote and author
  },

  // Author attribution text styling
  author: {
    fontSize: 14, // Smaller font for attribution
    color: "#6b7280", // Medium gray for subtle appearance
    fontStyle: "italic", // Italic style for attribution convention
  },
});
