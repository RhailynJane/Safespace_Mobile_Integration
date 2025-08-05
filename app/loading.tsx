"use client";

import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(1);
  const circle1Anim = new Animated.Value(1);
  const circle2Anim = new Animated.Value(1);
  const circle3Anim = new Animated.Value(1);

  useEffect(() => {
    const animateCircles = () => {
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
    };

    animateCircles();

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
        <Animated.View
          style={[
            styles.circle1,
            {
              transform: [{ scale: circle1Anim }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.circle2,
            {
              transform: [{ scale: circle2Anim }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.circle3,
            {
              transform: [{ scale: circle3Anim }],
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
  progressText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
  },
});
