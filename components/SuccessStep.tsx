// components/SuccessStep.tsx
import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";

interface SuccessStepProps {
  onContinue: () => void;
  onSignIn: () => void;
}

export default function SuccessStep({ onContinue, onSignIn }: SuccessStepProps) {
  const [syncing, setSyncing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync user with your database
  const syncUserWithDatabase = async () => {
    try {
      // You'll need to get the current user's info
      // This is a simplified example - you'll need to adapt it
      const response = await fetch('YOUR_BACKEND_URL/api/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // You'll need to pass user data here
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync user');
      }

      setSyncing(false);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError('Failed to sync user data');
      setSyncing(false);
    }
  };

  // Call sync when component mounts
  useEffect(() => {
    syncUserWithDatabase();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Created Successfully! 🎉</Text>
      
      {syncing ? (
        <View style={styles.syncContainer}>
          <ActivityIndicator size="large" color="#7BB8A8" />
          <Text style={styles.syncText}>Setting up your account...</Text>
        </View>
      ) : syncError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{syncError}</Text>
          <Text style={styles.errorHelp}>
            Your account was created, but there was an issue syncing data.
            You can continue to the app.
          </Text>
        </View>
      ) : (
        <Text style={styles.successText}>
          Your account has been set up successfully! You can now access all features of SafeSpace.
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, syncing && styles.disabledButton]}
        onPress={onContinue}
        disabled={syncing}
      >
        <Text style={styles.buttonText}>
          {syncing ? 'Setting Up...' : 'Continue to App'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signInButton} onPress={onSignIn}>
        <Text style={styles.signInButtonText}>Sign In to Another Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  syncContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  syncText: {
    marginTop: 10,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#FFE6E6",
    padding: 16,
    borderRadius: 8,
    marginVertical: 20,
  },
  errorText: {
    color: "#D00",
    fontWeight: "600",
  },
  errorHelp: {
    color: "#666",
    marginTop: 8,
    fontSize: 12,
  },
  successText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#7BB8A8",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  signInButton: {
    padding: 16,
    alignItems: "center",
    width: "100%",
  },
  signInButtonText: {
    color: "#7BB8A8",
    fontWeight: "600",
    fontSize: 16,
  },
});