import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "../utils/cache";
import { useEffect, useState } from "react";
import { syncUserWithDatabase } from "../utils/userSync";
import { ActivityIndicator, View, LogBox } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file"
  );
}

// Component to handle user synchronization with PostgreSQL
function UserSyncHandler() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    async function handleUserSync() {
      if (isLoaded && isSignedIn && user) {
        try {
          const token = await getToken();
          if (token) {
            await syncUserWithDatabase(user, token);
          } else {
            console.warn("⚠️ Token is null, skipping user sync.");
          }
          // Mark onboarding as completed when user is created
          await AsyncStorage.setItem("hasCompletedOnboarding", "true");
          console.log("✅ User synced successfully");
        } catch (error) {
          console.error("❌ Failed to sync user:", error);
          // Don't block the app if sync fails - user might already exist
          await AsyncStorage.setItem("hasCompletedOnboarding", "true");
        }
      }
    }

    handleUserSync();
  }, [isLoaded, isSignedIn, user, getToken]);

  return null;
}

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  
  console.log("🔐 RootLayoutNav - Auth State:", { 
    isLoaded, 
    isSignedIn,
    segments,
    hasCompletedOnboarding
  });

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = await AsyncStorage.getItem("hasCompletedOnboarding");
      setHasCompletedOnboarding(completed === "true");
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (!isLoaded || hasCompletedOnboarding === null) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";

    if (isSignedIn && !inAppGroup) {
      // User is signed in but not in the app group, redirect to home
      router.replace("/(app)/home");
    } else if (!isSignedIn && !inAuthGroup) {
      // User is signed out but not in auth group
      if (hasCompletedOnboarding) {
        // User has an account, go to sign-in
        router.replace("/(auth)/sign-in");
      }
    }
  }, [isLoaded, isSignedIn, segments, hasCompletedOnboarding, router]);

  if (!isLoaded || hasCompletedOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7BB8A8" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="loading" />
      <Stack.Screen name="quote" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Suppress warnings
    LogBox.ignoreLogs([
      'useInsertionEffect must not schedule updates',
      'Non-serializable values were found in the navigation state',
      '[clerk/telemetry]',
    ]);
  }, []);

  return (
    <ClerkProvider 
      publishableKey={publishableKey} 
      tokenCache={tokenCache}
    >
      <SafeAreaProvider>
        <UserSyncHandler />
        <RootLayoutNav />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}