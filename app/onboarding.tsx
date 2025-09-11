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

// Configuration array containing all onboarding steps data
const onboardingSteps = [
  {
    title: "Welcome to SafeSpace!",
    subtitle: "Your mental health companion.",
    description:
      "Connect with support workers, track your wellness, and access support resources.",
    image: require("../assets/images/onboarding-welcome.png"), // Welcome illustration
    bgColor: "#f9fafb", // Light gray for welcome screen
    // Note: No stepLabel for welcome screen - indicator won't show
  },
  {
    title: "Personalize Your Mental Health State",
    subtitle: "With AI",
    description:
      "Our AI helps you understand and track your mental health journey.",
    image: require("../assets/images/onboarding-step1.png"), // Meditation illustration
    bgColor: "#b9e0d1",
    stepLabel: "Step One", // Shows step indicator at top
    subtitleColor: "#0d9488", // Darker teal for subtitle
  },
  {
    title: "Intelligent",
    subtitle: "Mood Tracking",
    description:
      "Track your emotions and moods with smart insights and patterns.",
    image: require("../assets/images/onboarding-step2.png"), // Mood tracking illustration
    bgColor: "#f7c193",
    stepLabel: "Step Two",
    subtitleColor: "#db9558ff", 

  },
  {
    title: "AI Mental",
    subtitle: "Journaling",
    description: "Express your thoughts with AI-powered journaling assistance.",
    image: require("../assets/images/onboarding-step3.png"), // Journaling illustration
    bgColor: "#e0e7ff", // Light purple background
    stepLabel: "Step Three",
    subtitleColor: "#9aa5ccff",
  },
  {
    title: "Mindful Resources That",
    subtitle: "Makes You Happy",
    description: "Access curated resources designed to improve your wellbeing.",
    image: require("../assets/images/onboarding-step4.png"), // Resources illustration
    bgColor: "#1f655a", // Dark green background
    stepLabel: "Step Four",
    subtitleColor: "#1f655a",

  },
  {
    title: "Loving & Supportive",
    subtitle: "Community",
    description: "Connect with others who understand your journey.",
    image: require("../assets/images/onboarding-step5.png"), // Community illustration
    bgColor: "#ffffff", // Light background
    stepLabel: "Step Five",
    subtitleColor: "#A44121",

  },
];

export default function OnboardingFlow() {
  // Track current step index (0-based)
  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Handles navigation to next step or auth screen
   * Increments step counter or navigates to login when reaching the end
   */
  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      // Move to next step if not at the end
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to login screen after completing all steps
      router.replace("../(auth)/login");
    }
  };

  // Get data for currently active step
  const currentStepData = onboardingSteps[currentStep];

  return (
    <View style={styles.container}>
      {/* 
        TOP SECTION (75% of screen)
        Full-screen colored background with centered image and optional step indicator
      */}
      <View
        style={[
          styles.imageSection,
          { backgroundColor: currentStepData?.bgColor ?? "#fff" }, // Dynamic background color
        ]}
      >
        <SafeAreaView style={styles.imageSafeArea}>
          {/* 
            STEP INDICATOR
            Only shown for steps that have a stepLabel (excludes welcome screen)
            Centered at top with semi-transparent white background
          */}
          {currentStepData?.stepLabel && (
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>{currentStepData.stepLabel}</Text>
            </View>
          )}

          {/* 
            MAIN ILLUSTRATION
            Large image that blends seamlessly with the background color
            Centered in remaining space after step indicator
          */}
          <View style={styles.illustrationContainer}>
            {currentStepData?.image && (
              <Image
                source={currentStepData.image}
                style={styles.illustrationImage}
                resizeMode="contain" // Maintains aspect ratio
              />
            )}
          </View>
        </SafeAreaView>
      </View>

      {/* 
        BOTTOM SECTION (25% of screen)
        Off-white background containing text content, button, and progress indicators
      */}
      <View style={styles.textSection}>
        <SafeAreaView style={styles.textSafeArea}>
          {/*
            PROGRESS LINE
            Single line showing completion progress with brown colors
          */}
          <View style={styles.progressLineContainer}>
            <View style={styles.progressLineBackground} />
            <View 
              style={[
                styles.progressLineFill,
                { 
                  width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` 
                }
              ]} 
            />
          </View>

          {/* 
            TEXT CONTENT
            Title, subtitle (colored), and description text
            Centered and takes up most of the text section
          */}
          <View style={styles.textContainer}>
            {currentStepData && (
              <>
                {/* Main title in dark color */}
                <Text style={styles.title}>{currentStepData.title}</Text>

            {/* Subtitle in accent color (teal) - optional */}
            {currentStepData.subtitle && (
              <Text style={[styles.subtitle, { color: currentStepData.subtitleColor || "#14b8a6" }]}>
                {currentStepData.subtitle}
              </Text>
            )}

                {/* Description text in gray */}
                <Text style={styles.description}>
                  {currentStepData.description}
                </Text>
              </>
            )}
          </View>

          {/* 
            CONTINUE BUTTON
            Circular button with arrow - advances to next step or login
            Positioned above progress dots
          */}
          <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
            <Text style={styles.continueButtonText}>→</Text>
          </TouchableOpacity>


        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // MAIN CONTAINER
  // No SafeAreaView wrapper to allow full-screen background colors
  container: {
    flex: 1,
  },

  // TOP SECTION STYLES (Image/Illustration Area)
  // Takes 75% of screen height (flex: 3 out of total 5)
  imageSection: {
    flex: 3, // 3/5 = 60% base + extends to ~75% with flex behavior
  },

  // SafeAreaView within image section to respect device safe areas
  imageSafeArea: {
    flex: 1,
    paddingHorizontal: 20, // Side padding for content
  },

  // Step indicator pill at top of image section
  stepIndicator: {
    alignSelf: "center", // Center horizontally
    backgroundColor: "rgba(255, 255, 255, 0.9)", // Semi-transparent white
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20, // Pill shape
    marginTop: 10,
    marginBottom: 20,
  },

  // Text inside step indicator
  stepText: {
    fontSize: 14,
    color: "#6b7280", // Gray text
    fontWeight: "500",
  },

  // Container for main illustration - fills remaining space after step indicator
  illustrationContainer: {
    flex: 1,
    justifyContent: "center", // Center vertically
    alignItems: "center", // Center horizontally
  },

  // Main illustration image styling
  illustrationImage: {
    width: "100%",
    height: "100%",
    maxWidth: 320, // Constrain maximum size
    maxHeight: 300,
  },

  // BOTTOM SECTION STYLES (Text Content Area)
  // Takes 25% of screen height (flex: 2 out of total 5)
  textSection: {
    flex: 2, // 2/5 = 40% base + flex behavior makes it ~25%
    backgroundColor: "#f8fafc", // Off-white background
  },

  // SafeAreaView within text section
  textSafeArea: {
    flex: 1,
    paddingHorizontal: 24, // Side padding for text content
    justifyContent: "space-between", // Distribute children evenly
  },

  // Container for title, subtitle, and description
  textContainer: {
    alignItems: "center", // Center text horizontally
    flex: 1, // Take up most of the text section
    justifyContent: "center", // Center content vertically
    paddingVertical: 20,
    marginBottom: 35, // Space above button
  },

  // Main title styling
  title: {
    paddingTop: 30,
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    color: "#4F3422", // Brownish dark color
    marginBottom: 4,
    lineHeight: 22, 
    flexWrap: 'wrap', // Enables wrapping

  },

  // Subtitle with accent color
  subtitle: {
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    color: "#14b8a6", // Teal accent color
    marginBottom: 12,
    lineHeight: 30,
  },

  // Description text styling
  description: {
    fontSize: 16,
    textAlign: "center",
    color: "#6b7280", // Medium gray
    lineHeight: 22,
    paddingHorizontal: 10, // Extra side padding for description
    marginBottom: 12,

  },

  // INTERACTIVE ELEMENTS
  // Circular continue button with shadow
  continueButton: {
    width: 56,
    height: 56,
    borderRadius: 28, // Makes it perfectly circular
    backgroundColor: "#B2BE9C", // Teal background
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center", // Center horizontally
    marginBottom: 16,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 3,
  },

  // Arrow text inside continue button
  continueButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
  },

  // Progress line container
  progressLineContainer: {
    height: 4,
    width: '60%',
    alignSelf: 'center',
    position: 'relative',
    marginTop: 12,
    marginBottom: 20,
  },

  // Background line (incomplete progress)
  progressLineBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(139, 69, 19, 0.2)', // Medium brown 20% opacity
    borderRadius: 2,
  },

  // Fill line (completed progress)
  progressLineFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(139, 69, 19, 0.6)', // Medium brown 60% opacity
    borderRadius: 2,
  },
});