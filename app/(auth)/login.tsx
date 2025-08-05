"use client";

import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SafeSpaceLogo from "../../components/SafeSpaceLogo";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const { signIn } = useAuth();

  const handleSignIn = async () => {
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    // Check for missing fields
    if (!email.trim()) {
      setEmailError("Email is missing, please input to login");
      return;
    }
    if (!password.trim()) {
      setPasswordError("Password is missing, please input to login");
      return;
    }

    setLoading(true);
    const result = await signIn(email.trim(), password);

    setLoading(false);

    if (result.error) {
      if (result.error === "Invalid email address.") {
        setEmailError(result.error);
      } else if (result.error === "Email or password is incorrect.") {
        // Show as general error since Firebase doesn't distinguish for security
        setGeneralError(result.error);
      } else {
        setGeneralError(result.error);
      }
      return; // stop here, no navigation
    }

    // Navigate only on successful login
    router.replace("/(app)/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <SafeSpaceLogo size={80} />
          </View>

          <Text style={styles.title}>Sign In To SafeSpace</Text>

          <View style={styles.toggleContainer}>
            <View style={[styles.toggleButton, styles.activeToggle]}>
              <Text style={styles.activeToggleText}>Sign In</Text>
            </View>
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => router.push("/(auth)/signup")}
            >
              <Text style={styles.inactiveToggleText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
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
                placeholder="Enter your email address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

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
                placeholder="Enter your password..."
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError("");
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
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
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            {generalError ? (
              <Text style={styles.errorText}>{generalError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.signInButton, loading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.signInButtonText}>
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            {/* Social Login */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-instagram" size={24} color="#E4405F" />
              </TouchableOpacity>
            </View>

            {/* Footer Links */}
            <View style={styles.footerContainer}>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup")}
                disabled={loading}
              >
                <Text style={styles.footerText}>
                  Don't have an account?{" "}
                  <Text style={styles.linkText}>Sign Up</Text>
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.linkText}>Forgot Password</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
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
    marginBottom: 30,
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
  formContainer: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
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
    marginBottom: 8,
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
  signInButton: {
    backgroundColor: "#7FDBDA",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 30,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  footerContainer: {
    alignItems: "center",
    gap: 10,
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
  forgotPassword: {
    marginTop: 5,
  },
  errorText: {
    color: "#FF6B6B",
    marginTop: 4,
    marginLeft: 8,
    fontSize: 13,
  },
});
