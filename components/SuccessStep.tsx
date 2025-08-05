import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SafeSpaceLogo from "./SafeSpaceLogo";

interface SuccessStepProps {
  onSignIn: () => void;
}

export default function SuccessStep({ onSignIn }: SuccessStepProps) {
  return (
    <View style={styles.container}>
      <SafeSpaceLogo size={80} />

      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
      </View>

      <Text style={styles.title}>Your email was successfully verified!</Text>
      <Text style={styles.subtitle}>Only one click to explore SafeSpace</Text>

      <TouchableOpacity style={styles.signInButton} onPress={onSignIn}>
        <Text style={styles.signInButtonText}>Sign in</Text>
      </TouchableOpacity>

      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By using this platform, you agree to the{" "}
          <Text style={styles.termsLink}>Terms</Text> and{" "}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginTop: 32,
    marginBottom: 24,
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
    marginBottom: 40,
  },
  signInButton: {
    width: "100%",
    backgroundColor: "#7FDBDA",
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 32,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  termsContainer: {
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  termsLink: {
    color: "#333",
    fontWeight: "600",
  },
});
