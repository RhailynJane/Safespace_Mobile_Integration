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
import { supabase } from "../../lib/supabase";
import { getAuth } from "firebase/auth";

export type SignupStep =
  | "therapyType"
  | "personal"
  | "password"
  | "verification"
  | "success";

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  phoneNumber: string;
  password: string;
  verificationCode: string;
  therapyType: "adult" | "minor" | "guardian" | null;
}

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState<SignupStep>("therapyType");
  const [loading, setLoading] = useState(false);
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateSignupData = (data: Partial<SignupData>) => {
    setSignupData((prev) => ({ ...prev, ...data }));
  };

  const handleTherapyTypeSelection = (type: "adult" | "minor" | "guardian") => {
    updateSignupData({ therapyType: type });
    setCurrentStep("personal");
  };

  const nextStep = async () => {
    const steps: SignupStep[] = [
      "therapyType",
      "personal",
      "password",
      "verification",
      "success",
    ];
    const currentIndex = steps.indexOf(currentStep);

    setErrorMessage(null);

    if (currentStep === "password") {
      // Validate required fields
      if (!signupData.therapyType) {
        setErrorMessage("Please select a therapy type");
        return;
      }
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
          signupData.phoneNumber,
          signupData.age
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
    const steps: SignupStep[] = [
      "therapyType",
      "personal",
      "password",
      "verification",
      "success",
    ];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0 && steps[currentIndex - 1]) {
      setCurrentStep(steps[currentIndex - 1]!);
    }
  };

  const getStepNumber = (): number => {
    return [
      "therapyType",
      "personal",
      "password",
      "verification",
      "success",
    ].indexOf(currentStep);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "therapyType":
        return (
          <View style={styles.therapyTypeContainer}>
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
            <Text style={styles.question}>
              What type of therapy are you looking for?
            </Text>
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
            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
              <Text style={styles.footerText}>
                Already signed up? <Text style={styles.linkText}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        );

      case "personal":
        return (
          <PersonalInfoStep
            data={signupData}
            onUpdate={updateSignupData}
            onNext={nextStep}
            stepNumber={getStepNumber()}
          />
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
            data={signupData}
            onUpdate={updateSignupData}
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
          {currentStep !== "success" && (
            <View style={styles.logoContainer}>
              <SafeSpaceLogo size={currentStep === "therapyType" ? 80 : 60} />
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
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  therapyTypeContainer: {
    flex: 1,
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
    marginBottom: 40,
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
  activeToggle: {
    backgroundColor: "#7FDBDA",
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
  question: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 30,
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
