import { router } from "expo-router";
import { useEffect } from "react";
import { Animated, StyleSheet, Text, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * QuoteScreen - Splash screen displaying an inspirational quote
 * Shows the SafeSpace logo with animation and an inspiring mental health quote
 * Automatically transitions to onboarding after 4 seconds
 */
export default function QuoteScreen() {
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(20);
  const logoScaleAnim = new Animated.Value(0.8); // Added scale animation for logo

  useEffect(() => {
    // Start parallel animations
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
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate after 4 seconds
    const timer = setTimeout(() => {
      router.replace("/onboarding");
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* SafeSpace Logo with animations */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          <Image
            source={require("../assets/images/safespace-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Quote container with animations */}
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
    backgroundColor: "#fed7aa", // Warm peach background
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 32,
    width: 150, // Container size for logo
    height: 150,
  },
  logo: {
    width: "100%",
    height: "100%",
    // Optional shadow if needed
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
