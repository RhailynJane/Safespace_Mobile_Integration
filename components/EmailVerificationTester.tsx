/**
 * Email Verification Test Component
 * 
 * TEMPORARY DEBUGGING COMPONENT
 * Add this to your signup screen to test email sending independently
 * Remove after fixing the issue
 * 
 * Usage in signup.tsx:
 * import { EmailVerificationTester } from "../../components/EmailVerificationTester";
 * 
 * Then add in your render:
 * {__DEV__ && <EmailVerificationTester signUp={signUp} email={signupData.email} />}
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { clerkDiagnostics } from "../utils/clerkDiagnostics";

interface EmailVerificationTesterProps {
  signUp: any;
  email: string;
}

export function EmailVerificationTester({ signUp, email }: EmailVerificationTesterProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>("");

  const runTest = async () => {
    if (!signUp || !email) {
      setResult("❌ SignUp not ready or email missing");
      return;
    }

    setTesting(true);
    setResult("");

    console.log("\n" + "=".repeat(50));
    console.log("🧪 EMAIL VERIFICATION TEST");
    console.log("=".repeat(50));

    // Step 1: Check config
    console.log("\n📋 Step 1: Checking Clerk Configuration...");
    const configOk = clerkDiagnostics.checkClerkConfig();
    if (!configOk) {
      setResult("❌ Clerk config issue - check console");
      setTesting(false);
      return;
    }

    // Step 2: Create signup (if not already created)
    console.log("\n📋 Step 2: Creating signup...");
    try {
      if (!signUp.createdUserId) {
        await signUp.create({
          emailAddress: email,
          password: "TestPassword123!", // Temporary test password
        });
        console.log("✅ Test signup created");
      } else {
        console.log("✅ Using existing signup");
      }
    } catch (err: any) {
      console.error("❌ Failed to create signup:", err);
      setResult(`❌ Signup creation failed: ${err?.errors?.[0]?.message || err.message}`);
      setTesting(false);
      return;
    }

    // Step 3: Test email verification
    console.log("\n📋 Step 3: Testing email verification...");
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      console.log("✅ Email verification request successful!");
      console.log("📧 Check your email:", email);
      console.log("📬 Check spam/junk folder too!");
      
      clerkDiagnostics.logEmailVerification(email, true);
      setResult(`✅ SUCCESS! Check ${email} (and spam folder)`);
    } catch (err: any) {
      console.error("❌ Email verification request failed:", err);
      clerkDiagnostics.logEmailVerification(email, false, err);
      clerkDiagnostics.displayTroubleshooting(err);
      
      setResult(`❌ FAILED: ${err?.errors?.[0]?.message || err.message}`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🧪 TEST COMPLETE");
    console.log("=".repeat(50) + "\n");

    setTesting(false);
  };

  // Only show in development mode
  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>🧪 Email Verification Test</Text>
        <Text style={styles.subText}>Development Only</Text>
      </View>

      <Text style={styles.infoText}>Email: {email || "Not set"}</Text>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={runTest}
        disabled={testing || !email}
      >
        {testing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Test Email Sending</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}

      <Text style={styles.instructionText}>
        This will test if Clerk can send verification emails.{"\n"}
        Check the console for detailed diagnostics.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF3CD",
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: "#FFC107",
  },
  header: {
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
  },
  subText: {
    fontSize: 12,
    color: "#856404",
    fontStyle: "italic",
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#FFC107",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#856404",
    fontWeight: "bold",
    fontSize: 14,
  },
  resultContainer: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 13,
    color: "#333",
  },
  instructionText: {
    fontSize: 12,
    color: "#856404",
    fontStyle: "italic",
    lineHeight: 18,
  },
});
