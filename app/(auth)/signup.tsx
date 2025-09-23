// app/(auth)/signup.tsx
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
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import SafeSpaceLogo from "../../components/SafeSpaceLogo";
import PersonalInfoStep from "../../components/PersonalInfoStep";
import PasswordStep from "../../components/PasswordStep";
import EmailVerificationStep from "../../components/EmailVerificationStep";
import SuccessStep from "../../components/SuccessStep";

// Define the steps and data structure for the signup process
export type SignupStep = "personal" | "password" | "verification" | "success";

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  phoneNumber: string;
  password: string;
  verificationCode: string;
}

export default function SignupScreen() {
  // Clerk signup hook
  const { isLoaded, signUp, setActive } = useSignUp();
  
  // State management for signup process
  const [currentStep, setCurrentStep] = useState<SignupStep>("personal");
  const [loading, setLoading] = useState(false);
  const [signupData, setSignupData] = useState<SignupData>({
    firstName: "",
    lastName: "",
    email: "",
    age: "",
    phoneNumber: "",
    password: "",
    verificationCode: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Update signup data with partial updates
  const updateSignupData = (data: Partial<SignupData>) => {
    setSignupData((prev) => ({ ...prev, ...data }));
  };

  // Handle personal info step
  const handlePersonalInfoNext = () => {
    setErrorMessage(null);
    
    // Validate personal info
    if (!signupData.firstName || !signupData.lastName) {
      setErrorMessage("Please provide your full name");
      return;
    }
    if (!signupData.email) {
      setErrorMessage("Email is required");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setCurrentStep("password");
  };

  // Handle password step with Clerk signup
  const handlePasswordNext = async () => {
    if (!isLoaded) {
      setErrorMessage("Authentication service not ready");
      return;
    }

    setErrorMessage(null);

    // Validate password
    if (!signupData.password) {
      setErrorMessage("Password is required");
      return;
    }
    if (signupData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      // Start sign-up process using Clerk
      await signUp.create({
        emailAddress: signupData.email,
        password: signupData.password,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Move to verification step
      setCurrentStep("verification");
    } catch (err: any) {
      console.error("Sign up error:", err);
      
      if (err.errors) {
        const clerkError = err.errors[0];
        if (clerkError.code === 'form_password_pwned') {
          setErrorMessage("This password has been compromised. Please choose a different one.");
        } else if (clerkError.code === 'form_identifier_exists') {
          setErrorMessage("An account with this email already exists.");
        } else {
          setErrorMessage(clerkError.message || "Failed to create account");
        }
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle email verification
  const handleVerification = async () => {
    if (!isLoaded) {
      setErrorMessage("Authentication service not ready");
      return;
    }

    setErrorMessage(null);

    if (!signupData.verificationCode) {
      setErrorMessage("Verification code is required");
      return;
    }

    setLoading(true);

    try {
      // Attempt email verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: signupData.verificationCode,
      });

      if (signUpAttempt.status === 'complete') {
        // Set the session as active and redirect
        await setActive({ session: signUpAttempt.createdSessionId });
        setCurrentStep("success");
      } else {
        setErrorMessage("Verification failed. Please try again.");
        console.log(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      
      if (err.errors) {
        const clerkError = err.errors[0];
        setErrorMessage(clerkError.message || "Verification failed");
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Progress to the next step
  const nextStep = async () => {
    switch (currentStep) {
      case "personal":
        handlePersonalInfoNext();
        break;
      case "password":
        await handlePasswordNext();
        break;
      case "verification":
        await handleVerification();
        break;
      default:
        const steps: SignupStep[] = ["personal", "password", "verification", "success"];
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
          setCurrentStep(steps[currentIndex + 1]!);
        }
        break;
    }
  };

  // Return to the previous step
  const prevStep = () => {
    const steps: SignupStep[] = ["personal", "password", "verification", "success"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]!);
    }
  };

  // Get the current step number for display purposes
  const getStepNumber = (): number => {
    return ["personal", "password", "verification", "success"].indexOf(currentStep) + 1;
  };

  // Render the appropriate step component based on current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "personal":
        return (
          <View>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Sign Up To SafeSpace</Text>
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => router.push("/(auth)/login")}
                >
                  <Text style={styles.inactiveToggleText}>Sign In</Text>
                </TouchableOpacity>
                <View style={[styles.toggleButton, styles.activeToggle]}>
                  <Text style={styles.activeToggleText}>Sign Up</Text>
                </View>
              </View>
            </View>
            <PersonalInfoStep
              data={signupData}
              onUpdate={updateSignupData}
              onNext={nextStep}
              stepNumber={getStepNumber()}
            />
            <TouchableOpacity 
              style={styles.footerContainer}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.footerText}>
                Already signed up? <Text style={styles.linkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        );

      case "password":
        return (
          <View>
            <PasswordStep
              data={signupData}
              onUpdate={updateSignupData}
              onNext={nextStep}
              onBack={prevStep}
              stepNumber={getStepNumber()}
              loading={loading}
            />
            {errorMessage && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}
          </View>
        );

      case "verification":
        return (
          <EmailVerificationStep
            email={signupData.email}
            verificationCode={signupData.verificationCode}
            onUpdate={updateSignupData}
            onNext={nextStep}
            onBack={prevStep}
            stepNumber={getStepNumber()}
            loading={loading}
          />
        );

      case "success":
        return (
          <SuccessStep 
            onContinue={() => router.replace("/(app)/(tabs)/home")}
            onSignIn={() => router.replace("/(auth)/login")}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Decorative ellipse at the top */}
          <View style={styles.topEllipse}></View> 

          {/* Logo display (hidden on success screen) */}
          {currentStep !== "success" && (
            <View style={styles.logoContainer}>
              <SafeSpaceLogo size={218} />
            </View>
          )}
          
          {/* Render the current step component */}
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 2,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 2,
  },
  headerContainer: {
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 25,
    padding: 4,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 20,
  },
  topEllipse: {
    position: 'absolute',
    top: 0,
    left: -50,
    right: -50,
    height: 200,
    backgroundColor: '#B87B7B',
    opacity: 0.10,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    zIndex: -1,
  },
  activeToggle: {
    backgroundColor: "#7BB8A8",
  },
  activeToggleText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  inactiveToggleText: {
    color: "#666",
    fontWeight: "500",
    fontSize: 16,
  },
  footerContainer: {
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  linkText: {
    fontWeight: "400",
    color: "#E43232",
    textDecorationLine: 'underline',
  },
  errorText: {
    color: "#E43232",
    fontWeight: "400",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
});