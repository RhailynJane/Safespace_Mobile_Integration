import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import StatusModal from "./StatusModal";

// Local interface for signup data
interface SignupData {
  password: string;
  confirmPassword: string;
}

// Props interface for the PasswordStep component
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
  const { theme } = useTheme();
  // State to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'error' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  // Validates password against all security requirements
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

  // Show modal helper
  const showErrorModal = (title: string, message: string) => {
    setModalConfig({ type: 'error', title, message });
    setShowModal(true);
  };

  // Handles form submission
  const handleSubmit = () => {
    if (!validatePassword()) {
      showErrorModal(
        "Password Requirements",
        "Please ensure your password meets all requirements"
      );
      return;
    }

    if (!data.confirmPassword) {
      showErrorModal(
        "Confirm Password",
        "Please confirm your password"
      );
      return;
    }

    if (data.password !== data.confirmPassword) {
      showErrorModal(
        "Passwords Don't Match",
        "Please make sure both passwords are identical"
      );
      return;
    }

    onNext();
  };

  // Returns password requirements with their current validation status
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

  // Check if passwords match (only show when both fields have values)
  const passwordsMatch = data.password && data.confirmPassword && data.password === data.confirmPassword;
  const passwordsDontMatch = data.password && data.confirmPassword && data.password !== data.confirmPassword;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Account Setup</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Step {stepNumber} of 3</Text>

      <View style={styles.formContainer}>
        {/* Password Input Field */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Password</Text>
          <View style={[styles.inputWrapper, { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderLight
          }]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.colors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Enter password"
              placeholderTextColor={theme.colors.textSecondary}
              value={data.password}
              onChangeText={(text) => onUpdate({ password: text })}
              secureTextEntry={!showPassword}
              testID="input-password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              testID="toggle-password-visibility"
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.colors.icon}
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
                  { backgroundColor: requirement.test ? theme.colors.primary : (theme.isDark ? '#666666' : '#CCCCCC') },
                ]}
              />
              <Text
                style={[
                  styles.requirementText,
                  { color: requirement.test ? theme.colors.primary : theme.colors.textSecondary },
                ]}
              >
                {requirement.message}
              </Text>
            </View>
          ))}
        </View>

        {/* Confirm Password Input Field */}
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Confirm Password</Text>
          <View style={[
            styles.inputWrapper,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderLight },
            passwordsDontMatch && { borderColor: theme.colors.error },
            passwordsMatch && { borderColor: theme.colors.primary }
          ]}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={theme.colors.icon}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder="Re-enter password"
              placeholderTextColor={theme.colors.textSecondary}
              value={data.confirmPassword}
              onChangeText={(text) => onUpdate({ confirmPassword: text })}
              secureTextEntry={!showConfirmPassword}
              testID="input-confirm-password"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={theme.colors.icon}
              />
            </TouchableOpacity>
          </View>
          
          {/* Password Match Indicator */}
          {passwordsMatch && (
            <View style={styles.matchIndicator}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
              <Text style={[styles.matchText, { color: theme.colors.primary }]}>Passwords match</Text>
            </View>
          )}
          {passwordsDontMatch && (
            <View style={styles.matchIndicator}>
              <Ionicons name="close-circle" size={16} color={theme.colors.error} />
              <Text style={[styles.errorMatchText, { color: theme.colors.error }]}>Passwords don&apos;t match</Text>
            </View>
          )}
        </View>

        {/* Create Account Button */}
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: theme.colors.primary }, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? "Creating Account..." : "Create an Account"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Modal */}
      <StatusModal
        visible={showModal}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setShowModal(false)}
      />
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
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputWrapperError: {
    borderColor: "#E43232",
  },
  inputWrapperSuccess: {
    borderColor: "#4CAF50",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: "#757575",
  },
  eyeIcon: {
    padding: 4,
  },
  continueButton: {
    backgroundColor: "#7BB8A8",
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
    marginTop: 0,
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
  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  matchText: {
    fontSize: 12,
    color: "#4CAF50",
    marginLeft: 4,
    fontWeight: "500",
  },
  errorMatchText: {
    fontSize: 12,
    color: "#E43232",
    marginLeft: 4,
    fontWeight: "500",
  },
});