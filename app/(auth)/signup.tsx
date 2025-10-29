// app/(auth)/signup.tsx
import { useEffect, useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import SafeSpaceLogo from "../../components/SafeSpaceLogo";
import PersonalInfoStep from "../../components/PersonalInfoStep";
import PasswordStep from "../../components/PasswordStep";
import EmailVerificationStep from "../../components/EmailVerificationStep";
import SuccessStep from "../../components/SuccessStep";
import StatusModal from "../../components/StatusModal";
import { CaptchaHandler } from "../../utils/captcha-handler";
import { apiService } from "../../utils/api";
import { useTheme } from "../../contexts/ThemeContext";

// Define the steps and data structure for the signup process
export type SignupStep = "personal" | "password" | "verification" | "success";

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
}

export default function SignupScreen() {
  const { theme } = useTheme();
  // Clerk signup hook
  const { isLoaded, signUp, setActive } = useSignUp();
  const [captchaReady, setCaptchaReady] = useState(false);

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
    confirmPassword: "",
    verificationCode: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'error' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  // Show modal helper
  const showErrorModal = (title: string, message: string) => {
    setModalConfig({ type: 'error', title, message });
    setShowModal(true);
  };

  // Wait for CAPTCHA to be ready (shorter timeout for mobile)
  useEffect(() => {
    const timer = setTimeout(
      () => {
        setCaptchaReady(true);
      },
      Platform.OS === "web" ? 1000 : 500
    );

    return () => clearTimeout(timer);
  }, []);

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

    // Validate age
    if (!signupData.age) {
      setErrorMessage("Age is required");
      return;
    }

    const age = parseInt(signupData.age);
    if (isNaN(age) || age < 1 || age > 120) {
      setErrorMessage("Please enter a valid age");
      return;
    }

    // Check if user is 18 or older
    if (age < 18) {
      showErrorModal(
        "Age Requirement",
        "You must be 18 years or older to use SafeSpace. If you're under 18 and need support, please reach out to a trusted adult, school counselor, or contact Kids Help Phone at 1-800-668-6868 (available 24/7) or text CONNECT to 686868."
      );
      // Reset age field
      updateSignupData({ age: "" });
      return;
    }

    setCurrentStep("password");
  };

  // Handle password step with improved CAPTCHA handling
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

    // Validate confirm password
    if (!signupData.confirmPassword) {
      setErrorMessage("Please confirm your password");
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Prepare signup data with CAPTCHA considerations
      const signupPayload: any = {
        emailAddress: signupData.email,
        password: signupData.password,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
      };

      // Add CAPTCHA configuration for web environment
      if (Platform.OS === "web" && !__DEV__) {
        signupPayload.captcha = {
          invisible: true,
        };
      }

      // Start sign-up process
      await signUp.create(signupPayload);

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Move to verification step
      setCurrentStep("verification");
    } catch (err: any) {
      console.error("Sign up error:", err);

      // Check for specific Clerk errors
      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0];
        console.error("Clerk error details:", err.errors);
        
        // Handle password pwned error
        if (clerkError.code === "form_password_pwned") {
          showErrorModal(
            "Weak Password",
            "This password has been found in an online data breach. For your account safety, please use a different, more secure password."
          );
          return;
        }
        
        // Handle other Clerk errors
        if (clerkError.message) {
          setErrorMessage(clerkError.message);
          showErrorModal("Error", clerkError.message);
          return;
        }
      }

      // Use the improved CAPTCHA error handler
      const errorMessage = CaptchaHandler.handleCaptchaError(err);
      setErrorMessage(errorMessage);
      showErrorModal("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Improved retry mechanism
  const retrySignup = async () => {
    setErrorMessage(null);
    setCaptchaReady(false);

    // Longer delay for retry to ensure clean state
    setTimeout(() => {
      setCaptchaReady(true);
      handlePasswordNext();
    }, 3000);
  };

  // Handle email verification
  const handleVerification = async () => {
    if (!isLoaded || !signUp) {
      setErrorMessage("Authentication service not ready");
      return;
    }

    setErrorMessage(null);

    if (
      !signupData.verificationCode ||
      signupData.verificationCode.length !== 6
    ) {
      setErrorMessage("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);

    try {
      // Attempt email verification with Clerk
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: signupData.verificationCode,
      });

      if (signUpAttempt.status === "complete") {
        // User successfully verified - set active session
        await setActive({ session: signUpAttempt.createdSessionId });

        // Sync user data with your database
        try {
          console.log("Syncing user with database...");
          const syncResult = await apiService.syncUser({
            clerkUserId: signUpAttempt.createdUserId!,
            email: signupData.email,
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            phoneNumber: signupData.phoneNumber,
          });

          // Create client record
          if (syncResult.user?.id) {
            try {
              await apiService.createClient({
                userId: syncResult.user.id,
              });
              console.log("Client record created successfully");
            } catch (clientError) {
              console.error("Failed to create client record:", clientError);
            }
          }

          setCurrentStep("success");
        } catch (syncError) {
          console.error("Failed to sync user with database:", syncError);
          setCurrentStep("success");
        }
      } else {
        setErrorMessage("Verification incomplete. Please try again.");
        console.log("Verification status:", signUpAttempt.status);
      }
    } catch (err: any) {
      console.error("Verification error:", err);

      if (err.errors) {
        const clerkError = err.errors[0];
        setErrorMessage(
          clerkError?.message || "Invalid verification code. Please try again."
        );
      } else {
        setErrorMessage("Invalid verification code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Add a resend function
  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      showErrorModal(
        "Code Sent",
        "A new verification code has been sent to your email."
      );
    } catch (err: any) {
      setErrorMessage("Failed to resend code. Please try again.");
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
        {
          const steps: SignupStep[] = [
            "personal",
            "password",
            "verification",
            "success",
          ];
          const currentIndex = steps.indexOf(currentStep);
          if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1]!);
          }
        }
        break;
    }
  };

  // Return to the previous step
  const prevStep = () => {
    const steps: SignupStep[] = [
      "personal",
      "password",
      "verification",
      "success",
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]!);
    }
  };

  // Get the current step number for display purposes
  const getStepNumber = (): number => {
    return (
      ["personal", "password", "verification", "success"].indexOf(currentStep) +
      1
    );
  };

  // Render the appropriate step component based on current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case "personal":
        return (
          <View>
            <View style={styles.headerContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Sign Up To SafeSpace</Text>
              <View style={[styles.toggleContainer, { backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => router.push("/(auth)/login")}
                >
                  <Text style={[styles.inactiveToggleText, { color: theme.colors.textSecondary }]}>Sign In</Text>
                </TouchableOpacity>
                <View style={[styles.toggleButton, styles.activeToggle, { backgroundColor: theme.colors.primary }]}>
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
            {errorMessage && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{errorMessage}</Text>
            )}
            <TouchableOpacity
              style={styles.footerContainer}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                Already signed up? <Text style={[styles.linkText, { color: theme.colors.error }]}>Sign In</Text>
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
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                {(errorMessage.includes("CAPTCHA") ||
                  errorMessage.includes("Security verification") ||
                  errorMessage.includes("verification")) && (
                  <TouchableOpacity
                    onPress={retrySignup}
                    style={styles.retryButton}
                  >
                    <Text style={styles.retryText}>Retry Security Check</Text>
                  </TouchableOpacity>
                )}
              </View>
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
            onResendCode={handleResendCode}
          />
        );

      case "success":
        return (
          <SuccessStep
            onContinue={() => router.replace("/(app)/home")}
            onSignIn={() => router.replace("/(auth)/login")}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.topEllipse}></View>

          {currentStep !== "success" && (
            <View style={styles.logoContainer}>
              <SafeSpaceLogo size={218} />
            </View>
          )}

          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Status Modal */}
      <StatusModal
        visible={showModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setShowModal(false)}
      />
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
    position: "absolute",
    top: 0,
    left: -50,
    right: -50,
    height: 200,
    backgroundColor: "#B87B7B",
    opacity: 0.1,
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
    textDecorationLine: "underline",
  },
  errorText: {
    color: "#E43232",
    fontWeight: "400",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
  errorContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#7BB8A8",
    borderRadius: 5,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
