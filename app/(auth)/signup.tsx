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
import PersonalInfoStep from "../../components/PersonalInfoStep";
import PasswordStep from "../../components/PasswordStep";
import EmailVerificationStep from "../../components/EmailVerificationStep";
import SuccessStep from "../../components/SuccessStep";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { getAuth } from "firebase/auth";

export type SignupStep = "personal" | "password" | "verification" | "success";

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  phoneNumber: string;
  password: string;
  verificationCode: string;
  therapyType: "adult" | "minor" | "guardian";
}

export default function SignupScreen() {
  const { signUp } = useAuth();
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
    therapyType: "adult", // Default to adult therapy type
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateSignupData = (data: Partial<SignupData>) => {
    setSignupData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = async () => {
    const steps: SignupStep[] = ["personal", "password", "verification", "success"];
    const currentIndex = steps.indexOf(currentStep);

    setErrorMessage(null);

    if (currentStep === "password") {
      // Validate required fields
      if (!signupData.firstName || !signupData.lastName) {
        setErrorMessage("Please provide your full name");
        return;
      }
      if (!signupData.email || !signupData.password) {
        setErrorMessage("Email and password are required");
        return;
      }

      setLoading(true);

      try {
        const firebaseResult = await signUp(
          signupData.email,
          signupData.password,
          signupData.firstName,
          signupData.lastName,
          signupData.therapyType,
          signupData.phoneNumber
        );

        if (firebaseResult?.error) {
          setErrorMessage(firebaseResult.error);
          setLoading(false);
          return;
        }

        setCurrentStep("verification");
      } catch (error) {
        setErrorMessage(
          typeof error === "string"
            ? error
            : "Failed to complete registration. Please try again."
        );
        console.error("Signup error:", error);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  };

  const prevStep = () => {
    const steps: SignupStep[] = ["personal", "password", "verification", "success"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0 && steps[currentIndex - 1]) {
      setCurrentStep(steps[currentIndex - 1]!);
    }
  };

  const getStepNumber = (): number => {
    return ["personal", "password", "verification", "success"].indexOf(currentStep) + 1;
  };

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
            onNext={nextStep}
            onBack={prevStep}
            stepNumber={getStepNumber()}
          />
        );

      case "success":
        return <SuccessStep onSignIn={() => router.push("/(auth)/login")} />;

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

                <View style={styles.topEllipse}></View> 


          {currentStep !== "success" && (
            <View style={styles.logoContainer}>
              <SafeSpaceLogo size={218} />
            </View>
          )}
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
    paddingVertical: 15,
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
    fontWeight: "600",
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
  opacity: 0.10, // 50% opacity
  borderBottomLeftRadius: 200,
  borderBottomRightRadius: 200,
  zIndex: -1, // Place behind other content
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
    fontWeight: "600",
    color: "#FF6B6B",
  },
  errorText: {
    color: "#FF4C4C",
    fontWeight: "600",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
});