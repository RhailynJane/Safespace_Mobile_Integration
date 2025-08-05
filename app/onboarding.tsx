"use client";

import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * OnboardingFlow Component
 *
 * Multi-step onboarding experience with full-screen colored backgrounds and seamless image integration.
 * Features centered step indicators, large illustrations that blend with backgrounds,
 * and off-white text sections at the bottom of each screen.
 */

const onboardingSteps = [
  {
    title: "Welcome to SafeSpace!",
    subtitle: "Your mental health companion.",
    description:
      "Connect with support workers, track your wellness, and access support resources.",
    image: require("../assets/images/onboarding-welcome.png"), // Welcome illustration
    bgColor: "#f9fafb", // Light gray for welcome screen
  },
  {
    title: "Personalize Your Mental Health State",
    subtitle: "With AI",
    description:
      "Our AI helps you understand and track your mental health journey.",
    image: require("../assets/images/onboarding-step1.png"), // Meditation illustration
    bgColor: "#dcfce7", // Light green background
    stepLabel: "Step One",
  },
  {
    title: "Intelligent",
    subtitle: "Mood Tracking",
    description:
      "Track your emotions and moods with smart insights and patterns.",
    image: require("../assets/images/onboarding-step2.png"), // Mood tracking illustration
    bgColor: "#fed7aa", // Light orange background
    stepLabel: "Step Two",
  },
  {
    title: "AI Mental",
    subtitle: "Journaling",
    description: "Express your thoughts with AI-powered journaling assistance.",
    image: require("../assets/images/onboarding-step3.png"), // Journaling illustration
    bgColor: "#e0e7ff", // Light purple background
    stepLabel: "Step Three",
  },
  {
    title: "Mindful Resources That",
    subtitle: "Makes You Happy",
    description: "Access curated resources designed to improve your wellbeing.",
    image: require("../assets/images/onboarding-step4.png"), // Resources illustration
    bgColor: "#065f46", // Dark green background
    stepLabel: "Step Four",
  },
  {
    title: "Loving & Supportive",
    subtitle: "Community",
    description: "Connect with others who understand your journey.",
    image: require("../assets/images/onboarding-step5.png"), // Community illustration
    bgColor: "#f9fafb", // Light background
    stepLabel: "Step Five",
  },
];

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Handles navigation to next step or auth screen
   */
  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace("/(auth)/login");
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <View style={styles.container}>
      {/* Top section with colored background and image - takes 75% of screen */}
      <View
        style={[
          styles.imageSection,
          { backgroundColor: currentStepData?.bgColor ?? "#fff" },
        ]}
      >
        <SafeAreaView style={styles.imageSafeArea}>
          {/* Centered step indicator - only show for steps 1-5 */}
          {currentStepData?.stepLabel && (
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>{currentStepData.stepLabel}</Text>
            </View>
          )}

          {/* Main illustration container - image blends with background */}
          <View style={styles.illustrationContainer}>
            {currentStepData?.image && (
              <Image
                source={currentStepData.image}
                style={styles.illustrationImage}
                resizeMode="contain"
              />
            )}
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom section with off-white background and text - takes 25% of screen */}
      <View style={styles.textSection}>
        <SafeAreaView style={styles.textSafeArea}>
          {/* Progress indicator line */}
          <View style={styles.progressLine} />

          {/* Text content */}
          <View style={styles.textContainer}>
            {currentStepData && (
              <>
                <Text style={styles.title}>{currentStepData.title}</Text>
                {currentStepData.subtitle && (
                  <Text style={styles.subtitle}>
                    {currentStepData.subtitle}
                  </Text>
                )}
                <Text style={styles.description}>
                  {currentStepData.description}
                </Text>
              </>
            )}
          </View>

          {/* Continue button */}
          <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
            <Text style={styles.continueButtonText}>→</Text>
          </TouchableOpacity>

          {/* Progress dots */}
          <View style={styles.progressIndicator}>
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor:
                      index === currentStep ? "#14b8a6" : "#d1d5db",
                  },
                ]}
              />
            ))}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container without SafeAreaView to allow full-screen colors
  container: {
    flex: 1,
  },
  // Top section with colored background - 75% of screen
  imageSection: {
    flex: 3, // 75% of screen (3/4)
  },
  // SafeAreaView for the image section
  imageSafeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  // Centered step indicator at top
  stepIndicator: {
    alignSelf: "center", // Center horizontally
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  // Step indicator text
  stepText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  // Container for main illustration - fills remaining space
  illustrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Main illustration image - blends seamlessly with background
  illustrationImage: {
    width: "100%",
    height: "100%",
    maxWidth: 320,
    maxHeight: 300,
  },
  // Bottom section with off-white background - 25% of screen
  textSection: {
    flex: 2,
    backgroundColor: "#f8fafc", // Off-white background
  },
  // SafeAreaView for the text section
  textSafeArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  // Progress line at top of text section
  progressLine: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  // Text content container
  textContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  // Main title text
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#111827",
    marginBottom: 4,
    lineHeight: 30,
  },
  // Subtitle text with accent color
  subtitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#14b8a6",
    marginBottom: 12,
    lineHeight: 30,
  },
  // Description text
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#6b7280",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  // Circular continue button
  continueButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#14b8a6",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Continue button arrow text
  continueButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },
  // Progress indicator container
  progressIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: 10,
  },
  // Individual progress dot
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
