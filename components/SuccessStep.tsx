// components/SuccessStep.tsx
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { syncUserToDatabase } from "../lib/api";

interface SuccessStepProps {
  onContinue: () => void;
  onSignIn: () => void;
}

export default function SuccessStep({ onContinue, onSignIn }: SuccessStepProps) {
  const { user } = useUser();
  const [syncing, setSyncing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncUserWithDatabase = async () => {
    if (!user) {
      setSyncError("User information not available");
      setSyncing(false);
      return;
    }

    try {
      await syncUserToDatabase({
        clerkUserId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.primaryPhoneNumber?.phoneNumber,
      });

      console.log('User synced successfully to PostgreSQL');
      setSyncing(false);
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error instanceof Error ? error.message : 'Failed to sync user data');
      setSyncing(false);
    }
  };

  useEffect(() => {
    syncUserWithDatabase();
  }, [user]);

  const handleContinue = () => {
    if (syncError) {
      Alert.alert(
        "Sync Warning",
        "Your account was created, but there was an issue syncing with the database. You can continue anyway.",
        [{ text: "Continue", onPress: onContinue }]
      );
    } else {
      onContinue();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={styles.title}>Account Created Successfully! 🎉</Text>
      
      {syncing ? (
        <View style={styles.syncContainer}>
          <ActivityIndicator size="large" color="#7BB8A8" />
          <Text style={styles.syncText}>Syncing with database...</Text>
        </View>
      ) : syncError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Database Sync Issue</Text>
          <Text style={styles.errorHelp}>{syncError}</Text>
        </View>
      ) : (
        <Text style={styles.successText}>
          Your account has been synced with the database successfully!
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, syncing && styles.disabledButton]}
        onPress={handleContinue}
        disabled={syncing}
      >
        <Text style={styles.buttonText}>
          {syncing ? 'Syncing...' : 'Continue to App'}
        </Text>
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
    alignItems: "center",
  },
  errorText: {
    color: "#D00",
    fontWeight: "600",
    marginBottom: 8,
  },
  errorHelp: {
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  noteText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
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