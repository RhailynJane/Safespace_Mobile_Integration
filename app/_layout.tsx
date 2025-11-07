import { Stack, useRouter, useSegments } from "expo-router";
// Polyfills required for some browser APIs in React Native
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "../utils/cache";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient, useConvex } from "convex/react";
import { useEffect, useState } from "react";
import { syncUserWithDatabase } from "../utils/userSync";
import { ActivityIndicator, View, LogBox } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider } from "../contexts/ThemeContext";
import activityApi from "../utils/activityApi";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

function isAbsoluteHttpUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file"
  );
}

// Component to handle user synchronization with PostgreSQL
function UserSyncHandler() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  // Note: Don't call useConvex here unless Convex provider is definitely present.

  useEffect(() => {
    async function handleUserSync() {
      if (isLoaded && isSignedIn && user) {
        try {
          const token = await getToken();
          if (token) {
            console.log('🔄 Starting user sync...');
            // Sync with Postgres/Prisma in background - don't block UI
            syncUserWithDatabase(user, token).then(() => {
              console.log("✅ User synced successfully");
            }).catch((error) => {
              console.error("❌ Failed to sync user (non-blocking):", error);
            });

            // Also sync to Convex (if configured & generated code exists)
            try {
              const convexEnabled = !!process.env.EXPO_PUBLIC_CONVEX_URL;
              if (convexEnabled) {
                // Dynamic import avoids compile-time issues before `convex dev`
                const { api } = await import("../convex/_generated/api");
                // We can't access useConvex() here safely, so schedule a custom event for ConvexHeartbeat to consume if needed.
                // Instead, trigger a one-off sync using a lightweight fetch to Convex action once added.
                // For now, we do nothing here; ConvexUserSync below will handle syncing reliably.
              }
            } catch (e) {
              // Silently ignore if Convex not initialized
            }
          } else {
            console.warn("⚠️ Token is null, skipping user sync.");
          }
          // Mark onboarding as completed
          await AsyncStorage.setItem("hasCompletedOnboarding", "true");
        } catch (error) {
          console.error("❌ Failed to handle user sync:", error);
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
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  
  console.log("🔐 RootLayoutNav - Auth State:", { 
    isLoaded, 
    isSignedIn,
    segments,
    hasCompletedOnboarding
  });

  // Send heartbeat every 5 minutes to keep status updated
  useEffect(() => {
    if (!isSignedIn || !user?.id) return;

    // Send initial heartbeat
    activityApi.heartbeat(user.id).catch(err => 
      console.log('Heartbeat failed:', err)
    );

    // Send heartbeat every 5 minutes (300000ms)
    const heartbeatInterval = setInterval(() => {
      activityApi.heartbeat(user.id).catch(err => 
        console.log('Heartbeat failed:', err)
      );
    }, 5 * 60 * 1000);

    return () => clearInterval(heartbeatInterval);
  }, [isSignedIn, user?.id]);

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
        // User has an account, go to login
        router.replace("/(auth)/login");
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
      'Due to changes in Androids permission requirements',
      'Expo Go can no longer provide full access to the media library',
    ]);
  }, []);

  // Lazily create Convex client only when URL is a valid absolute http(s) URL
  let convexClient: ConvexReactClient | null = null;
  if (isAbsoluteHttpUrl(convexUrl)) {
    try {
      convexClient = new ConvexReactClient(convexUrl as string);
    } catch (e) {
      console.warn('Convex client not initialized. Invalid EXPO_PUBLIC_CONVEX_URL:', convexUrl, e);
      convexClient = null;
    }
  } else if (convexUrl) {
    console.warn('EXPO_PUBLIC_CONVEX_URL must be an absolute http(s) URL. Got:', convexUrl);
  }

  function ConvexHeartbeat() {
    const convex = useConvex();
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    useEffect(() => {
      if (!isLoaded || !isSignedIn || !user?.id) return;

      const send = async () => {
        try {
          // @ts-ignore generated at runtime by `npx convex dev`
          const { api } = await import("../convex/_generated/api");
          await convex.mutation(api.presence.heartbeat, { status: "online" });
        } catch (e: any) {
          // Convex not initialized yet or generated files missing — skip silently
          console.log("Convex heartbeat skipped:", e?.message ?? e);
        }
      };

      // initial
      send();
      // every 5 minutes
      const id = setInterval(send, 5 * 60 * 1000);
      return () => clearInterval(id);
    }, [
      isLoaded,
      isSignedIn,
      user?.id,
      convex,
    ]);

    return null;
  }

  function ConvexUserSync() {
    const convex = useConvex();
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    useEffect(() => {
      if (!isLoaded || !isSignedIn || !user?.id) return;

      const run = async () => {
        try {
          // @ts-ignore generated at runtime by `npx convex dev`
          const { api } = await import("../convex/_generated/api");
          await convex.mutation(api.auth.syncUser, {
            email: user.primaryEmailAddress?.emailAddress ?? undefined,
            firstName: user.firstName ?? undefined,
            lastName: user.lastName ?? undefined,
            imageUrl: user.imageUrl ?? undefined,
          });
        } catch (e: any) {
          console.log("Convex user sync skipped:", e?.message ?? e);
        }
      };
      run();
    }, [
      isLoaded,
      isSignedIn,
      user?.id,
      user?.firstName,
      user?.lastName,
      user?.imageUrl,
      user?.primaryEmailAddress?.emailAddress,
      convex,
    ]);

    return null;
  }

  const AppTree = (
    <SafeAreaProvider>
      <ThemeProvider>
        <UserSyncHandler />
        <RootLayoutNav />
      </ThemeProvider>
    </SafeAreaProvider>
  );

  return (
    <ClerkProvider 
      publishableKey={publishableKey} 
      tokenCache={tokenCache}
    >
      {convexClient ? (
        <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
          <ConvexUserSync />
          <ConvexHeartbeat />
          {AppTree}
        </ConvexProviderWithClerk>
      ) : (
        AppTree
      )}
    </ClerkProvider>
  );
}