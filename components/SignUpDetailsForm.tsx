"use client";

import type React from "react";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { SignupData } from "../app/(auth)/signup";

interface SignUpDetailsFormProps {
  step: "personal" | "password";
  data: SignupData;
  onUpdate: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onBack?: () => void;
  stepNumber: number;
}

const SignUpDetailsForm: React.FC<SignUpDetailsFormProps> = ({
  step,
  data,
  onUpdate,
  onNext,
  onBack,
  stepNumber,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePersonalInfo = () => {
    const newErrors: Record<string, string> = {};

    if (!data.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!data.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!data.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!data.age.trim()) {
      newErrors.age = "Age is required";
    }
    if (!data.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const requirements = [
      { test: data.password.length >= 8, message: "8 characters minimum" },
      { test: /\d/.test(data.password), message: "a number" },
      {
        test: /[!@#$%^&*(),.?":{}|<>]/.test(data.password),
        message: "a symbol",
      },
    ];

    const failedRequirements = requirements.filter((req) => !req.test);
    return failedRequirements.length === 0;
  };

  const handleSubmit = () => {
    if (step === "personal") {
      if (validatePersonalInfo()) {
        onNext();
      }
    } else if (step === "password") {
      if (validatePassword()) {
        onNext();
      } else {
        Alert.alert(
          "Password Requirements",
          "Please ensure your password meets all requirements"
        );
      }
    }
  };

  const getPasswordRequirements = () => {
    return [
      { test: data.password.length >= 8, message: "8 characters minimum" },
      { test: /\d/.test(data.password), message: "a number" },
      {
        test: /[!@#$%^&*(),.?":{}|<>]/.test(data.password),
        message: "a symbol",
      },
    ];
  };

  if (step === "personal") {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>Step {stepNumber} of 3</Text>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>First Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your First Name"
                value={data.firstName}
                onChangeText={(text) => onUpdate({ firstName: text })}
                autoCapitalize="words"
              />
            </View>
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your Last Name"
                value={data.lastName}
                onChangeText={(text) => onUpdate({ lastName: text })}
                autoCapitalize="words"
              />
            </View>
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your Email Address"
                value={data.email}
                onChangeText={(text) => onUpdate({ email: text })}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Age</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your Age"
                value={data.age}
                onChangeText={(text) => onUpdate({ age: text })}
                keyboardType="numeric"
              />
            </View>
            {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="call-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your Phone Number"
                value={data.phoneNumber}
                onChangeText={(text) => onUpdate({ phoneNumber: text })}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleSubmit}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Password step
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Setup</Text>
      <Text style={styles.subtitle}>Step {stepNumber} of 3</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={data.password}
              onChangeText={(text) => onUpdate({ password: text })}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Requirements */}
        <View style={styles.requirementsContainer}>
          {getPasswordRequirements().map((requirement, index) => (
            <View key={index} style={styles.requirementRow}>
              <View
                style={[
                  styles.requirementDot,
                  { backgroundColor: requirement.test ? "#4CAF50" : "#E0E0E0" },
                ]}
              />
              <Text
                style={[
                  styles.requirementText,
                  { color: requirement.test ? "#4CAF50" : "#666" },
                ]}
              >
                {requirement.message}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleSubmit}>
          <Text style={styles.continueButtonText}>Create an Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 4,
  },
  continueButton: {
    backgroundColor: "#7FDBDA",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  requirementsContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  requirementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  requirementText: {
    fontSize: 14,
  },
});

export default SignUpDetailsForm;
