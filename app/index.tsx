/**
 * LLM Prompt: Add concise inline comments to this React Native component. 
 * Reference: chat.deepseek.com
 */

import { router } from "expo-router";
import { useEffect } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SafeSpaceLogo from "../components/SafeSpaceLogo";
import { useTheme } from "../contexts/ThemeContext";

export default function SplashScreen() {
  const { theme } = useTheme();
  // Animation values for entrance effects
  const fadeAnim = new Animated.Value(0); // Controls opacity (0 = invisible, 1 = fully visible)
  const scaleAnim = new Animated.Value(0.8); // Controls scale (0.8 = 80% size, 1 = full size)

  useEffect(() => {
    // Run fade-in and scale-up animations simultaneously
    Animated.parallel([
      // Fade animation: gradually becomes visible over 800ms
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Scale animation: grows from 80% to 100% size over 800ms
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to loading screen after 2 seconds
    const timer = setTimeout(() => {
      router.replace("/loading");
    }, 2000);

    // Cleanup: clear timer if component unmounts
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Animated container for logo with fade and scale effects */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim, // Apply fade animation
              transform: [{ scale: scaleAnim }], // Apply scale animation
            },
          ]}
        >
          <SafeSpaceLogo size={100} />
        </Animated.View>

        {/* App title with fade animation only */}
        <Animated.Text style={[styles.title, { opacity: fadeAnim, color: theme.colors.text }]}>
          SafeSpace
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container with light background
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  // Content area centered both vertically and horizontally
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  // Container for logo with spacing below
  logoContainer: {
    marginBottom: 32,
  },
  // App title styling
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
  },
});