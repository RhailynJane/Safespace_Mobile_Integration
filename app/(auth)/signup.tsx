import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import SafeSpaceLogo from "../../components/SafeSpaceLogo";
import TherapyTypeCard from "../../components/TherapyTypeCard";
import PersonalInfoStep from "../../components/PersonalInfoStep";
import PasswordStep from "../../components/PasswordStep";
import EmailVerificationStep from "../../components/EmailVerificationStep";
import SuccessStep from "../../components/SuccessStep";
import { useAuth } from "../../context/AuthContext";

// TYPE DEFINITIONS
// Define the possible steps in the signup flow
export type SignupStep =
  | "therapyType" // Initial therapy type selection
  | "personal" // Personal information collection
  | "password" // Password creation
  | "verification" // Email verification
  | "success"; // Completion confirmation

// Define the available therapy types for user selection
export type TherapyType = "adult" | "minor" | "guardian";

// Interface defining the complete signup data structure
export interface SignupData {
  firstName: string; // User's first name
  lastName: string; // User's last name
  email: string; // Email address for account
  age: string; // User's age (stored as string for form handling)
  phoneNumber: string; // Contact phone number
  password: string; // Account password
  verificationCode: string; // Email verification code
  therapyType: TherapyType | null; // Selected therapy type
}

/**
 * SignupScreen Component
 *
 * A comprehensive multi-step registration flow that guides users through
 * account creation with therapy type selection, personal information collection,
 * password creation, email verification, and success confirmation.
 *
 * Features:
 * - Multi-step wizard interface with 5 distinct steps
 * - Therapy type selection (Adult, Minor, Guardian)
 * - Form validation and error handling
 * - Loading states during account creation
 * - Email verification process
 * - Success confirmation with navigation
 * - Keyboard-aware interface
 * - Consistent branding and navigation
 */
export default function SignupScreen() {
  // AUTH CONTEXT
  // Access the signUp function from authentication context
  const { signUp } = useAuth();

  // STEP MANAGEMENT STATE
  const [currentStep, setCurrentStep] = useState<SignupStep>("therapyType"); // Current step in the signup flow
  const [loading, setLoading] = useState(false); // Loading state during API calls

  // FORM DATA STATE
  // Complete signup data object with default empty values
  const [signupData, setSignupData] = useState<SignupData>({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    phoneNumber: "",
    password: "",
    verificationCode: "",
    therapyType: null,
  });

  // ERROR HANDLING STATE
  // Store error messages to display in the UI instead of alerts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Updates the signup data object with partial data
   * Uses spread operator to merge new data with existing state
   * @param data - Partial signup data to update
   */
  const updateSignupData = (data: Partial<SignupData>) => {
    setSignupData((prev) => ({ ...prev, ...data }));
  };

  /**
   * Handles therapy type selection and automatic progression
   * Updates the signup data and immediately moves to personal info step
   * @param type - Selected therapy type (adult, minor, or guardian)
   */
  const handleTherapyTypeSelection = (type: TherapyType) => {
    updateSignupData({ therapyType: type });
    setCurrentStep("personal"); // Automatically advance to next step
  };

  /**
   * Advances to the next step in the signup flow
   * Handles special logic for the password step where account creation occurs
   * For other steps, simply progresses to the next step in sequence
   */
  const nextStep = async () => {
    // Define the complete step sequence
    const steps: SignupStep[] = [
      "therapyType",
      "personal",
      "password",
      "verification",
      "success",
    ];
    const currentIndex = steps.indexOf(currentStep);

    // Clear any previous error messages when moving forward
    setErrorMessage(null);

    // SPECIAL HANDLING FOR PASSWORD STEP
    // This is where the actual account creation API call happens
    if (currentStep === "password") {
      setLoading(true); // Show loading state

      try {
        // Call the authentication service to create the account
        const result = await signUp(
          signupData.email,
          signupData.password,
          signupData.firstName,
          signupData.lastName
        );

        // Handle API response errors
        if (result?.error) {
          // Show error message in UI instead of native alert for better UX
          setErrorMessage(result.error);
          setLoading(false);
          return; // Stop progression on error
        }

        // Account created successfully, move to verification step
        setCurrentStep("verification");
      } catch (error) {
        // Handle unexpected errors during account creation
        setErrorMessage("Failed to create account. Please try again.");
        console.error("Signup error:", error);
      }

      setLoading(false); // Hide loading state
      return;
    }

    // STANDARD STEP PROGRESSION
    // For all other steps, simply move to the next step in sequence
    if (
      currentIndex < steps.length - 1 &&
      steps[currentIndex + 1] !== undefined
    ) {
      setCurrentStep(steps[currentIndex + 1] as SignupStep);
    }
  };

  /**
   * Goes back to the previous step in the signup flow
   * Allows users to correct information or change selections
   */
  const prevStep = () => {
    const steps: SignupStep[] = [
      "therapyType",
      "personal",
      "password",
      "verification",
      "success",
    ];
    const currentIndex = steps.indexOf(currentStep);

    // Only go back if not at the first step
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1] as SignupStep);
    }
  };

  /**
   * Gets the numeric step number for display purposes
   * Used by step components to show progress indicators
   * @returns Numeric step number (0-based index)
   */
  const getStepNumber = (): number => {
    switch (currentStep) {
      case "therapyType":
        return 0;
      case "personal":
        return 1;
      case "password":
        return 2;
      case "verification":
        return 3;
      case "success":
        return 4;
      default:
        return 1;
    }
  };

  /**
   * Renders the appropriate component for the current step
   * Each step has its own component with specific props and functionality
   * @returns JSX element for the current step
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      // STEP 1: THERAPY TYPE SELECTION
      // Initial step where users choose their therapy type
      case "therapyType":
        return (
          <View style={styles.therapyTypeContainer}>
            {/* Screen Title */}
            <Text style={styles.title}>Sign Up To SafeSpace</Text>

            {/* 
              SIGN IN/SIGN UP TOGGLE
              Visual toggle showing current screen (Sign Up active)
              Allows navigation back to login screen
            */}
            <View style={styles.toggleContainer}>
              {/* Inactive Sign In button - navigates to login */}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.inactiveToggleText}>Sign In</Text>
              </TouchableOpacity>
              {/* Active Sign Up button - highlighted */}
              <View style={[styles.toggleButton, styles.activeToggle]}>
                <Text style={styles.activeToggleText}>Sign Up</Text>
              </View>
            </View>

            {/* Question prompt for therapy type selection */}
            <Text style={styles.question}>
              What type of therapy are you looking for?
            </Text>

            {/* 
              THERAPY TYPE CARDS
              Three selectable cards for different user types
              Each card shows selection state and handles tap events
            */}
            <View style={styles.cardsContainer}>
              <TherapyTypeCard
                type="adult"
                title="For Adult"
                subtitle="18 years or older"
                emoji="👨‍💼"
                isSelected={signupData.therapyType === "adult"}
                onPress={() => handleTherapyTypeSelection("adult")}
              />

              <TherapyTypeCard
                type="minor"
                title="For Minor"
                subtitle="Under 18 years old"
                emoji="👶"
                isSelected={signupData.therapyType === "minor"}
                onPress={() => handleTherapyTypeSelection("minor")}
              />

              <TherapyTypeCard
                type="guardian"
                title="For Guardian"
                subtitle="Managing minor account"
                emoji="👩‍👧‍👦"
                isSelected={signupData.therapyType === "guardian"}
                onPress={() => handleTherapyTypeSelection("guardian")}
              />
            </View>

            {/* Footer link back to login for existing users */}
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.footerText}>
                Already signed up? <Text style={styles.linkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        );

      // STEP 2: PERSONAL INFORMATION
      // Collects user's personal details (name, email, age, phone)
      case "personal":
        return (
          <PersonalInfoStep
            data={signupData} // Current signup data
            onUpdate={updateSignupData} // Function to update data
            onNext={nextStep} // Function to proceed
            stepNumber={getStepNumber()} // Current step number for progress
          />
        );

      // STEP 3: PASSWORD CREATION
      // Password input with confirmation and account creation
      case "password":
        return (
          <View>
            <PasswordStep
              data={signupData}
              onUpdate={updateSignupData}
              onNext={nextStep}
              onBack={prevStep} // Allow going back to personal info
              stepNumber={getStepNumber()}
              loading={loading} // Show loading state during account creation
            />

            {/* 
              ERROR MESSAGE DISPLAY
              Shows account creation errors below the password step
              Provides user feedback without blocking the interface
            */}
            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}
          </View>
        );

      // STEP 4: EMAIL VERIFICATION
      // Code input for email verification
      case "verification":
        return (
          <EmailVerificationStep
            data={signupData}
            onUpdate={updateSignupData}
            onNext={nextStep}
            onBack={prevStep} // Allow going back to password step
            stepNumber={getStepNumber()}
          />
        );

      // STEP 5: SUCCESS CONFIRMATION
      // Final step showing successful account creation
      case "success":
        return (
          <SuccessStep
            onSignIn={() => router.push("/(auth)/login")} // Navigate to login
          />
        );

      // Fallback for invalid step
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status bar configuration for consistent appearance */}
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      {/* 
        KEYBOARD AVOIDING VIEW
        Ensures form inputs remain visible when keyboard is open
        Different behavior for iOS (padding) vs Android (height)
      */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* 
          SCROLLABLE CONTAINER
          Allows scrolling when content exceeds screen height
          Flexible growth to accommodate different step content
        */}
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* 
            LOGO SECTION
            Shows SafeSpace branding for all steps except success
            Logo size varies by step (larger for therapy type selection)
          */}
          {currentStep !== "success" && (
            <View style={styles.logoContainer}>
              <SafeSpaceLogo size={currentStep === "therapyType" ? 80 : 60} />
            </View>
          )}

          {/* 
            STEP CONTENT
            Renders the appropriate component for the current step
            Content changes based on currentStep state
          */}
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // MAIN CONTAINER
  // Light gray background consistent with app theme
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5", // Light gray background
  },

  // KEYBOARD AVOIDING CONTAINER
  // Full height container for keyboard avoidance behavior
  keyboardContainer: {
    flex: 1,
  },

  // SCROLLABLE CONTENT CONTAINER
  // Flexible container that grows with content
  scrollContainer: {
    flexGrow: 1, // Allow growth beyond screen height
    paddingHorizontal: 24, // Side padding for content
    paddingVertical: 20, // Top/bottom padding
  },

  // BRANDING SECTION
  // Logo container with appropriate spacing
  logoContainer: {
    alignItems: "center", // Center logo horizontally
    marginBottom: 30, // Space below logo
    marginTop: 20, // Space above logo
  },

  // THERAPY TYPE STEP CONTAINER
  // Container for the initial step content
  therapyTypeContainer: {
    flex: 1, // Take remaining space
  },

  // TEXT STYLES
  // Main screen title
  title: {
    fontSize: 20,
    fontWeight: "600", // Semi-bold weight
    color: "#333", // Dark gray for good contrast
    textAlign: "center",
    marginBottom: 30, // Space before toggle
  },

  // SIGN IN/SIGN UP TOGGLE
  // Container for the toggle switch between login and signup
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF", // White background
    borderRadius: 25, // Fully rounded corners
    padding: 4, // Internal padding around buttons
    marginBottom: 40, // Large space below toggle
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },

  // Individual toggle button styling
  toggleButton: {
    flex: 1, // Equal width for both buttons
    paddingVertical: 12, // Vertical padding
    alignItems: "center", // Center text horizontally
    borderRadius: 20, // Rounded corners for active state
  },

  // Active toggle button (Sign Up)
  activeToggle: {
    backgroundColor: "#7FDBDA", // Teal background for active state
  },

  // Active toggle text styling
  activeToggleText: {
    color: "#FFF", // White text on teal background
    fontWeight: "600", // Semi-bold
    fontSize: 16,
  },

  // Inactive toggle text styling
  inactiveToggleText: {
    color: "#666", // Gray text for inactive state
    fontWeight: "500", // Medium weight
    fontSize: 16,
  },

  // THERAPY TYPE SELECTION
  // Question prompt styling
  question: {
    fontSize: 18,
    fontWeight: "600", // Semi-bold for emphasis
    color: "#333", // Dark gray
    textAlign: "center",
    marginBottom: 30, // Space before cards
    lineHeight: 24, // Better text spacing
  },

  // Container for therapy type cards
  cardsContainer: {
    gap: 16, // Space between cards
    marginBottom: 30, // Space below cards
  },

  // FOOTER SECTION
  // Footer text styling
  footerText: {
    fontSize: 14,
    color: "#666", // Medium gray for secondary text
    textAlign: "center",
  },

  // Highlighted link text within footer
  linkText: {
    fontWeight: "600",
    color: "#FF6B6B", // Red accent color for links
  },

  // ERROR MESSAGE STYLING
  // Error text for account creation failures
  errorText: {
    color: "#FF4C4C", // Bright red for errors
    fontWeight: "600", // Bold for emphasis
    fontSize: 14,
    marginTop: 10, // Space above error message
    textAlign: "center", // Center error text
  },
});
