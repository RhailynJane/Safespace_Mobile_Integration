import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * LoadingScreen Component
 *
 * An animated loading screen with three floating circles that scale in and out
 * at different rates and a progress counter that increments from 1% to 100%.
 * Automatically navigates to the quote screen when loading completes.
 *
 * Features:
 * - Three animated circles with different sizes, colors, and animation timings
 * - Progress counter that updates every 50ms
 * - Green color scheme matching app theme
 * - Automatic navigation after completion
 */
export default function LoadingScreen() {
  // Progress state: starts at 1%, increments to 100%
  const [progress, setProgress] = useState(1);

  // Animated values for each circle's scale transformation
  // Each circle will scale from 1.0 to a different maximum scale
  const circle1Anim = new Animated.Value(1); // Scales to 1.2x
  const circle2Anim = new Animated.Value(1); // Scales to 1.3x
  const circle3Anim = new Animated.Value(1); // Scales to 1.1x

  useEffect(() => {
    /**
     * Starts looping scale animations for all three circles
     * Each circle has different timing and scale values for visual variety
     */
    const animateCircles = () => {
      // CIRCLE 1 ANIMATION
      // Fastest animation (2 seconds total) with moderate scale (1.2x)
      Animated.loop(
        Animated.sequence([
          // Scale up to 1.2x over 1 second
          Animated.timing(circle1Anim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true, // Better performance for transform animations
          }),
          // Scale back down to 1.0x over 1 second
          Animated.timing(circle1Anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // CIRCLE 2 ANIMATION
      // Medium speed (2.4 seconds total) with largest scale (1.3x)
      Animated.loop(
        Animated.sequence([
          // Scale up to 1.3x over 1.2 seconds
          Animated.timing(circle2Anim, {
            toValue: 1.3,
            duration: 1200,
            useNativeDriver: true,
          }),
          // Scale back down to 1.0x over 1.2 seconds
          Animated.timing(circle2Anim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // CIRCLE 3 ANIMATION
      // Slowest animation (3 seconds total) with smallest scale (1.1x)
      Animated.loop(
        Animated.sequence([
          // Scale up to 1.1x over 1.5 seconds
          Animated.timing(circle3Anim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          // Scale back down to 1.0x over 1.5 seconds
          Animated.timing(circle3Anim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    // Start all circle animations
    animateCircles();

    // PROGRESS COUNTER
    // Updates every 50ms, incrementing by 2% each time
    // Total loading time: ~2.5 seconds (50 updates × 50ms)
    const interval = setInterval(() => {
      setProgress((prev) => {
        // Check if loading is complete
        if (prev >= 100) {
          clearInterval(interval); // Stop the progress updates
          // Navigate to quote screen after short delay for UX
          setTimeout(() => router.replace("/quote"), 500);
          return 100; // Keep at 100%
        }
        // Increment progress by 2%
        return prev + 2;
      });
    }, 50); // Update every 50 milliseconds

    // Cleanup function: clear interval when component unmounts
    return () => clearInterval(interval);
  }, []); // Empty dependency array - run once on mount

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 
          ANIMATED CIRCLE 1
          Largest circle, positioned top-right
          Fastest animation with moderate scale
        */}
        <Animated.View
          style={[
            styles.circle1,
            {
              transform: [{ scale: circle1Anim }], // Apply scale animation
            },
          ]}
        />

        {/* 
          ANIMATED CIRCLE 2  
          Medium circle, positioned bottom-left
          Medium speed animation with largest scale
        */}
        <Animated.View
          style={[
            styles.circle2,
            {
              transform: [{ scale: circle2Anim }], // Apply scale animation
            },
          ]}
        />

        {/* 
          ANIMATED CIRCLE 3
          Smallest circle, positioned bottom-right
          Slowest animation with smallest scale
        */}
        <Animated.View
          style={[
            styles.circle3,
            {
              transform: [{ scale: circle3Anim }], // Apply scale animation
            },
          ]}
        />

        {/* 
          PROGRESS TEXT
          Large white text showing current progress percentage
          Centered in the middle of the screen
        */}
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // MAIN CONTAINER
  // Light green background matching app theme
  container: {
    flex: 1,
    backgroundColor: "#a7f3d0", // Light green background
  },

  // CONTENT WRAPPER
  // Centers all content and provides relative positioning context
  content: {
    flex: 1,
    justifyContent: "center", // Center vertically
    alignItems: "center", // Center horizontally
    position: "relative", // Allow absolute positioning of circles
  },

  // ANIMATED CIRCLES
  // Each circle has different size, position, color, and opacity

  // Circle 1: Large circle, top-right position
  circle1: {
    position: "absolute",
    top: 80, // Distance from top
    right: 40, // Distance from right edge
    width: 128,
    height: 128,
    backgroundColor: "#34d399", // Medium green
    borderRadius: 64, // Half of width/height for perfect circle
    opacity: 0.3, // Semi-transparent for layering effect
  },

  // Circle 2: Medium circle, bottom-left position
  circle2: {
    position: "absolute",
    bottom: 160, // Distance from bottom
    left: 32, // Distance from left edge
    width: 96,
    height: 96,
    backgroundColor: "#10b981", // Darker green
    borderRadius: 48, // Half of width/height for perfect circle
    opacity: 0.4, // Slightly more opaque than circle1
  },

  // Circle 3: Small circle, bottom-right position
  circle3: {
    position: "absolute",
    bottom: 200, // Distance from bottom (higher than circle2)
    right: 64, // Distance from right edge
    width: 80,
    height: 80,
    backgroundColor: "#14b8a6", // Teal green (darkest)
    borderRadius: 40, // Half of width/height for perfect circle
    opacity: 0.2, // Most transparent for subtle background effect
  },

  // PROGRESS TEXT
  // Large, bold white text displaying the loading percentage
  progressText: {
    fontSize: 48, // Large text for visibility
    fontWeight: "bold",
    color: "#ffffff", // White text for contrast against green background
    // Positioned in center due to parent's centering styles
  },
});
