import { router } from "expo-router";
import { useEffect } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SafeSpaceLogo from "../components/SafeSpaceLogo";

/**
 * SplashScreen Component
 *
 * The initial screen users see when opening the app. Features a clean,
 * minimalist design with the SafeSpace logo and app name that fade in
 * and scale up simultaneously for a polished entrance animation.
 *
 * Features:
 * - Simultaneous fade-in and scale-up animations (800ms duration)
 * - Clean light gray background
 * - Centered logo and app name
 * - Automatic navigation to loading screen after 2 seconds
 * - Uses parallel animations for smooth visual effect
 */
export default function SplashScreen() {
  // Animation values for entrance effects
  const fadeAnim = new Animated.Value(0); // Opacity: starts invisible (0), fades to visible (1)
  const scaleAnim = new Animated.Value(0.8); // Scale: starts small (0.8x), grows to full size (1.0x)

  useEffect(() => {
    // ENTRANCE ANIMATION
    // Run fade-in and scale-up animations simultaneously for polished effect
    Animated.parallel([
      // FADE-IN ANIMATION
      // Logo and title gradually become visible over 800ms
      Animated.timing(fadeAnim, {
        toValue: 1, // Final opacity: fully visible
        duration: 800, // Animation duration: 800 milliseconds
        useNativeDriver: true, // Better performance for opacity animations
      }),

      // SCALE-UP ANIMATION
      // Logo and title grow from 80% to 100% size over 800ms
      Animated.timing(scaleAnim, {
        toValue: 1, // Final scale: normal size (100%)
        duration: 800, // Animation duration: 800 milliseconds (matches fade)
        useNativeDriver: true, // Better performance for transform animations
      }),
    ]).start(); // Start both animations immediately

    // AUTO-NAVIGATION TIMER
    // Navigate to loading screen after splash screen display time
    const timer = setTimeout(() => {
      router.replace("/loading"); // Navigate to loading screen
    }, 2000); // 2-second delay (800ms animation + 1200ms display time)

    // CLEANUP FUNCTION
    // Clear timer if component unmounts before timeout completes
    // Prevents navigation attempts on unmounted components
    return () => clearTimeout(timer);
  }, []); // Empty dependency array: run once on component mount

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 
          ANIMATED LOGO CONTAINER
          Applies both fade and scale animations to the logo
          Logo grows from 80% to 100% size while fading in
        */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim, // Apply fade-in animation
              transform: [{ scale: scaleAnim }], // Apply scale-up animation
            },
          ]}
        >
          {/* SafeSpace logo component with 80px size */}
          <SafeSpaceLogo size={80} />
        </Animated.View>

        {/* 
          ANIMATED APP TITLE
          Large "SafeSpace" text that fades in with the logo
          Only applies opacity animation (no scaling for text)
        */}
        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
          SafeSpace
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // MAIN CONTAINER
  // Light gray background for clean, professional appearance
  container: {
    flex: 1,
    backgroundColor: "#f9fafb", // Very light gray background
  },

  // CONTENT WRAPPER
  // Centers logo and title vertically and horizontally on screen
  content: {
    flex: 1,
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally
    paddingHorizontal: 32, // Side padding for smaller screens
  },

  // LOGO CONTAINER
  // Provides spacing between logo and title text
  logoContainer: {
    marginBottom: 32, // Space below logo, above title text
  },

  // APP TITLE TEXT
  // Large, bold "SafeSpace" text in dark color
  title: {
    fontSize: 32, // Large text for brand prominence
    fontWeight: "bold", // Bold weight for strong brand presence
    color: "#111827", // Very dark gray (almost black) for good contrast
  },
});
