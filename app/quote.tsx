"use client";

import { router } from "expo-router";
import { useEffect } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuoteScreen() {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(20);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace("/onboarding");
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
          <View style={styles.logo}>
            <View style={styles.logoInner}>
              <View style={styles.logoCenter} />
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.quoteContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.quote}>
            "Healing takes time, and asking for help is a courageous step."
          </Text>
          <Text style={styles.author}>— Mariska Hargitay</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fed7aa",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 64,
    height: 64,
    backgroundColor: "#ffffff",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  logoInner: {
    width: 40,
    height: 40,
    backgroundColor: "#14b8a6",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logoCenter: {
    width: 24,
    height: 24,
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  quoteContainer: {
    alignItems: "center",
  },
  quote: {
    fontSize: 20,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
    lineHeight: 28,
    marginBottom: 24,
  },
  author: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
});
