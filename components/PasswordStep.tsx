"use client";

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

interface PasswordStepProps {
  data: SignupData;
  onUpdate: (data: Partial<SignupData>) => void;
  onNext: () => void;
  onBack: () => void;
  stepNumber: number;
  loading?: boolean;
}

export default function PasswordStep({
  data,
  onUpdate,
  onNext,
  onBack,
  stepNumber,
  loading = false,
}: PasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false);

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
    if (validatePassword()) {
      onNext();
    } else {
      Alert.alert(
        "Password Requirements",
        "Please ensure your password meets all requirements"
      );
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

        <TouchableOpacity
          style={[styles.continueButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? "Creating Account..." : "Create an Account"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
  disabledButton: {
    opacity: 0.6,
  },
});
