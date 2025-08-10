import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(1);

  // Animation values for all circles
  const circle1Anim = new Animated.Value(1);
  const circle2Anim = new Animated.Value(1);
  const circle3Anim = new Animated.Value(1);
  const circle4Anim = new Animated.Value(1);
  const circle5Anim = new Animated.Value(1);
  const circle6Anim = new Animated.Value(1);
  const circle6Movement = new Animated.Value(0);

  useEffect(() => {
    const animateCircles = () => {
      // Original circle animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle1Anim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(circle1Anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(circle2Anim, {
            toValue: 1.3,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(circle2Anim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(circle3Anim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(circle3Anim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // New circle animations
      // Large background circle (slow pulse)
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle4Anim, {
            toValue: 1.4,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(circle4Anim, {
            toValue: 0.9,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Tiny circle (fast flicker)
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle5Anim, {
            toValue: 1.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(circle5Anim, {
            toValue: 0.7,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Medium circle (scale + vertical movement)
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(circle6Anim, {
              toValue: 1.2,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(circle6Movement, {
              toValue: -30,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(circle6Anim, {
              toValue: 0.8,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(circle6Movement, {
              toValue: 0,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    animateCircles();

    // Progress counter
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => router.replace("/quote"), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Original circles */}
        <Animated.View
          style={[styles.circle1, { transform: [{ scale: circle1Anim }] }]}
        />
        <Animated.View
          style={[styles.circle2, { transform: [{ scale: circle2Anim }] }]}
        />
        <Animated.View
          style={[styles.circle3, { transform: [{ scale: circle3Anim }] }]}
        />

        {/* New circles */}
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
                { scale: circle6Anim },
                { translateY: circle6Movement },
              ],
            },
          ]}
        />

        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#a7f3d0",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  circle1: {
    position: "absolute",
    top: 80,
    right: 40,
    width: 128,
    height: 128,
    backgroundColor: "#34d399",
    borderRadius: 64,
    opacity: 0.3,
  },
  circle2: {
    position: "absolute",
    bottom: 160,
    left: 32,
    width: 96,
    height: 96,
    backgroundColor: "#10b981",
    borderRadius: 48,
    opacity: 0.4,
  },
  circle3: {
    position: "absolute",
    bottom: 200,
    right: 64,
    width: 80,
    height: 80,
    backgroundColor: "#14b8a6",
    borderRadius: 40,
    opacity: 0.2,
  },
  circle4: {
    position: "absolute",
    top: "20%",
    left: "15%",
    width: 200,
    height: 200,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    borderRadius: 100,
  },
  circle5: {
    position: "absolute",
    top: "70%",
    right: "20%",
    width: 40,
    height: 40,
    backgroundColor: "rgba(20, 184, 166, 0.6)",
    borderRadius: 20,
  },
  circle6: {
    position: "absolute",
    top: "30%",
    left: "60%",
    width: 70,
    height: 70,
    backgroundColor: "rgba(16, 185, 129, 0.35)",
    borderRadius: 35,
  },
  progressText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
  },
});
