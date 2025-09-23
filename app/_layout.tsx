// app/_layout.tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "../utils/cache";
import { useEffect } from "react";
import { syncUserWithDatabase } from "../utils/userSync";
import { ActivityIndicator, View } from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file"
  );
}

// Component to handle user synchronization with PostgreSQL
function UserSyncHandler() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Use the full user object from useUser hook
      syncUserWithDatabase(user);
    }
  }, [isLoaded, isSignedIn, user]); // Depend on user object instead of userId

  return null;
}

// Loading component for authentication states
function AuthLoading() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7BB8A8" />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  return (
    <ClerkProvider 
      publishableKey={publishableKey} 
      tokenCache={tokenCache}
      afterSignInUrl="/(app)/(tabs)/home"
      afterSignUpUrl="/(app)/(tabs)/home"
    >
      <SafeAreaProvider>
        <AuthLoading />
        <UserSyncHandler />
        <MainStack />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}

// Separate stack component to use hooks
function MainStack() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7BB8A8" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isSignedIn ? (
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="loading" />
          <Stack.Screen name="quote" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
        </>
      ) : (
        <Stack.Screen name="(app)" />
      )}
    </Stack>
  );
}