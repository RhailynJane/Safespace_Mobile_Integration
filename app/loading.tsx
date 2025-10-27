/**
 * LLM Prompt: how to make a loading screen with animated circles and a progress counter that goes to 100% and then changes screens?
 * Reference: chat.deepseek.com
 */

import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../contexts/ThemeContext";

export default function LoadingScreen() {
  const { theme } = useTheme();
  // Track loading progress percentage
  const [progress, setProgress] = useState(1);


/**
 * LLM DeepSeek: 
 * Create a comprehensive React Native animation system with multiple animated circles 
 * that have different behaviors and timing patterns.
 */

  // Animation values for scaling effects on decorative circles
  const circle1Anim = new Animated.Value(1); // Primary large circle
  const circle2Anim = new Animated.Value(1); // Secondary medium circle
  const circle3Anim = new Animated.Value(1); // Tertiary small circle
  const circle4Anim = new Animated.Value(1); // Background pulse circle
  const circle5Anim = new Animated.Value(1); // Fast flickering circle
  const circle6Anim = new Animated.Value(1); // Moving circle (scale)
  const circle6Movement = new Animated.Value(0); // Moving circle (position)

  useEffect(() => {
    // Function to animate all decorative circles with various effects
    const animateCircles = () => {
      // Circle 1: Medium speed pulse animation (1 second cycle)
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle1Anim, {
            toValue: 1.2,  // Scale up to 120%
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(circle1Anim, {
            toValue: 1,   // Return to normal size
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Circle 2: Slower pulse animation (1.2 second cycle)
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle2Anim, {
            toValue: 1.3,  // Scale up to 130%
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(circle2Anim, {
            toValue: 1,   // Return to normal size
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Circle 3: Slow pulse animation (1.5 second cycle)
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle3Anim, {
            toValue: 1.1,  // Scale up to 110%
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(circle3Anim, {
            toValue: 1,   // Return to normal size
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Circle 4: Very slow background pulse (3 second cycle)
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle4Anim, {
            toValue: 1.4,  // Expand to 140%
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(circle4Anim, {
            toValue: 0.9,  // Contract to 90%
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Circle 5: Fast flickering effect (0.8 second cycle)
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle5Anim, {
            toValue: 1.5,  // Quickly expand to 150%
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(circle5Anim, {
            toValue: 0.7,  // Quickly contract to 70%
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Circle 6: Combined scale and vertical movement (1.5 second cycle)
      Animated.loop(
        Animated.sequence([
          // Phase 1: Scale up and move upward
          Animated.parallel([
            Animated.timing(circle6Anim, {
              toValue: 1.2,  // Scale to 120%
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(circle6Movement, {
              toValue: -30,  // Move 30px upward
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          // Phase 2: Scale down and return to original position
          Animated.parallel([
            Animated.timing(circle6Anim, {
              toValue: 0.8,  // Scale to 80%
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(circle6Movement, {
              toValue: 0,    // Return to original position
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    // Start all circle animations
    animateCircles();

    // Progress counter simulation - increments every 50ms
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Navigate to quote screen after brief delay when loading completes
          setTimeout(() => router.replace("/quote"), 500);
          return 100;
        }
        return prev + 2; // Increment progress by 2% each interval
      });
    }, 50); // Update every 50 milliseconds

    // Cleanup: stop interval when component unmounts
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Original decorative circles with scaling animations */}
        <Animated.View
          style={[styles.circle1, { transform: [{ scale: circle1Anim }] }]}
        />
        <Animated.View
          style={[styles.circle2, { transform: [{ scale: circle2Anim }] }]}
        />
        <Animated.View
          style={[styles.circle3, { transform: [{ scale: circle3Anim }] }]}
        />

        {/* Additional decorative circles with various effects */}
        <Animated.View
          style={[styles.circle4, { transform: [{ scale: circle4Anim }] }]}
        />
        <Animated.View
          style={[styles.circle5, { transform: [{ scale: circle5Anim }] }]}
        />
        <Animated.View
          style={[
            styles.circle6,
            {
              transform: [
                { scale: circle6Anim },        // Scale animation
                { translateY: circle6Movement }, // Vertical movement animation
              ],
            },
          ]}
        />

        {/* Progress percentage display */}
        <Text style={[styles.progressText, { color: theme.colors.text }]}>{progress}%</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container with soothing green background
  container: {
    flex: 1,
    backgroundColor: "#a7f3d0", // Soft green background
  },
  // Content area centered with relative positioning for absolute elements
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative", // Allows absolute positioning of circles
  },
  // Circle 1: Large decorative element in top-right
  circle1: {
    position: "absolute",
    top: 80,
    right: 40,
    width: 128,
    height: 128,
    backgroundColor: "#34d399", // Medium green
    borderRadius: 64,           // Perfect circle
    opacity: 0.3,               // Semi-transparent
  },
  // Circle 2: Medium decorative element in bottom-left
  circle2: {
    position: "absolute",
    bottom: 160,
    left: 32,
    width: 96,
    height: 96,
    backgroundColor: "#10b981", // Darker green
    borderRadius: 48,
    opacity: 0.4,
  },
  // Circle 3: Small decorative element in bottom-right
  circle3: {
    position: "absolute",
    bottom: 200,
    right: 64,
    width: 80,
    height: 80,
    backgroundColor: "#14b8a6", // Teal green
    borderRadius: 40,
    opacity: 0.2,
  },
  // Circle 4: Large background pulse circle
  circle4: {
    position: "absolute",
    top: "20%",
    left: "15%",
    width: 200,
    height: 200,
    backgroundColor: "rgba(52, 211, 153, 0.15)", // Very transparent green
    borderRadius: 100,
  },
  // Circle 5: Small fast-flickering circle
  circle5: {
    position: "absolute",
    top: "70%",
    right: "20%",
    width: 40,
    height: 40,
    backgroundColor: "rgba(20, 184, 166, 0.6)", // Semi-transparent teal
    borderRadius: 20,
  },
  // Circle 6: Medium circle with combined animations
  circle6: {
    position: "absolute",
    top: "30%",
    left: "60%",
    width: 70,
    height: 70,
    backgroundColor: "rgba(16, 185, 129, 0.35)", // Semi-transparent green
    borderRadius: 35,
  },
  // Progress percentage text styling
  progressText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff", // White text for contrast
  },
});