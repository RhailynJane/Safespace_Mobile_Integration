// app/(auth)/login.tsx
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
import { useSignIn } from "@clerk/clerk-expo";
import SafeSpaceLogo from "../../components/SafeSpaceLogo";
import { useTheme } from "../../contexts/ThemeContext";

export default function LoginScreen() {
  const { theme } = useTheme();
  const { signIn, setActive, isLoaded } = useSignIn();

  // Form state management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

  // Function to update login timestamp
  const updateLoginTimestamp = async (clerkUserId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/users/${clerkUserId}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Login timestamp updated successfully');
    } catch (error) {
      console.error('Failed to update login timestamp:', error);
      // Don't throw error - continue with login even if timestamp update fails
    }
  };

  const handleSignIn = async () => {
    if (!isLoaded) {
      setError("Authentication service not ready");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        
        // Update login timestamp after successful login
        const clerkUserId = signInAttempt.createdSessionId;
        if (clerkUserId) {
          await updateLoginTimestamp(clerkUserId);
        }
        
        router.replace("/(app)/(tabs)/home");
      } else {
        setError("Sign in process incomplete. Please try again.");
        console.log(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      console.error("Sign in error:", err);

      if (err.errors) {
        const clerkError = err.errors[0];
        if (
          clerkError.code === "form_identifier_not_found" ||
          clerkError.code === "form_password_incorrect"
        ) {
          setError("Invalid email or password");
        } else {
          setError(clerkError.message || "Sign in failed");
        }
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
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

          <View style={styles.logoContainer}>
            <SafeSpaceLogo size={218} />
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
                  setError("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

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
                  setError("");
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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.signInButton, loading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={loading || !isLoaded}
            >
              <Text style={styles.signInButtonText}>
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/signup")}
                disabled={loading}
              >
                <Text style={styles.footerText}>
                  Dont have an account?{" "}
                  <Text style={styles.linkText}>Sign Up</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push("/(auth)/forgot-password")}
              >
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
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  keyboardContainer: { flex: 1 },
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
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 2 },
  logoContainer: { alignItems: "center" },
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
  activeToggle: { backgroundColor: "#7BB8A8" },
  activeToggleText: { color: "#FFF", fontWeight: "600", fontSize: 16 },
  inactiveToggleText: { color: "#666", fontWeight: "500", fontSize: 16 },
  formContainer: { width: "100%" },
  inputLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: "#333",
    marginBottom: 20,
    marginTop: 2,
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
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 12, color: "#333" },
  eyeIcon: { padding: 4 },
  signInButton: {
    backgroundColor: "#7BB8A8",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 30,
  },
  disabledButton: { opacity: 0.6 },
  signInButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  footerContainer: { alignItems: "center", gap: 10 },
  footerText: { fontSize: 14, color: "#666", textAlign: "center" },
  linkText: {
    fontWeight: "400",
    color: "#E43232",
    textDecorationLine: "underline",
  },
  forgotPassword: { marginTop: 5 },
  errorText: { color: "#E43232", marginTop: 4, marginLeft: 8, fontSize: 13 },
});
