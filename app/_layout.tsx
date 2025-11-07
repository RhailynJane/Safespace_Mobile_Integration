import { Stack, useRouter, useSegments, Redirect } from "expo-router";
// Polyfills required for some browser APIs in React Native
import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import { tokenCache } from "../utils/cache";
import { ConvexProvider, ConvexReactClient, useConvex } from "convex/react";
import { useEffect, useState, useRef } from "react";
import { syncUserWithDatabase } from "../utils/userSync";
import { ActivityIndicator, View, LogBox } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider } from "../contexts/ThemeContext";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

// Global flags to prevent duplicate operations across remounts
let convexUserSyncCompleted = false;
let convexHeartbeatStarted = false;
let onboardingStatusCached: boolean | null = null;

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
  const [hasPerformedSync, setHasPerformedSync] = useState(false);

  useEffect(() => {
    // Only sync once per session
    if (!isLoaded || !isSignedIn || !user || hasPerformedSync) return;

    async function handleUserSync() {
      try {
        const token = await getToken();
        if (token && user) {
          console.log('🔄 Starting user sync...');
          // Sync with Postgres/Prisma in background - don't block UI
          syncUserWithDatabase(user, token).then(() => {
            console.log("✅ User synced successfully");
          }).catch((error) => {
            console.error("❌ Failed to sync user (non-blocking):", error);
          });
        } else {
          console.warn("⚠️ Token is null, skipping user sync.");
        }
        setHasPerformedSync(true);
      } catch (error) {
        console.error("❌ Failed to handle user sync:", error);
        setHasPerformedSync(true);
      }
    }

    handleUserSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user?.id, hasPerformedSync]);

  return null;
}

function RootLayoutNav() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const segments = useSegments();
  const router = useRouter();
  
  // Use cached value to prevent state flipping
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(onboardingStatusCached);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(onboardingStatusCached === null);
  
  console.log("🔐 RootLayoutNav - Auth State:", { 
    isLoaded, 
    isSignedIn,
    segments,
    hasCompletedOnboarding
  });

  // Send heartbeat every 5 minutes to keep status updated (handled by Convex)
  // The ConvexHeartbeat component below handles presence tracking via Convex
  // No REST API heartbeat needed

  // Check onboarding status ONLY if not already cached
  useEffect(() => {
    // If already cached, don't recheck
    if (onboardingStatusCached !== null) {
      setHasCompletedOnboarding(onboardingStatusCached);
      setIsCheckingOnboarding(false);
      return;
    }
    
    let isMounted = true;
    
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem("hasCompletedOnboarding");
        const completedBool = completed === "true";
        
        // Cache the value globally to prevent future reads
        onboardingStatusCached = completedBool;
        
        if (isMounted) {
          setHasCompletedOnboarding(completedBool);
          setIsCheckingOnboarding(false);
        }
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        
        // Cache false as default
        onboardingStatusCached = false;
        
        if (isMounted) {
          setHasCompletedOnboarding(false);
          setIsCheckingOnboarding(false);
        }
      }
    };
    
    checkOnboarding();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

  // Prefer declarative redirects over imperative router.replace to avoid remount loops
  const inAuthGroup = segments[0] === "(auth)";
  const inAppGroup = segments[0] === "(app)";

  if (!isLoaded || isCheckingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7BB8A8" />
      </View>
    );
  }

  // Guarded redirects
  if (isLoaded && hasCompletedOnboarding !== null) {
    if (isSignedIn && !inAppGroup) {
      return <Redirect href="/(app)/(tabs)/home" />;
    }
    if (!isSignedIn && !inAuthGroup && hasCompletedOnboarding) {
      return <Redirect href="/(auth)/login" />;
    }
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
      // Use global flag to prevent multiple heartbeat intervals
      if (!isLoaded || !isSignedIn || !user?.id || convexHeartbeatStarted) return;

      const send = async () => {
        try {
          // @ts-ignore generated at runtime by `npx convex dev`
          const { api } = await import("../convex/_generated/api");
          // Pre-flight whoami to avoid unauthenticated heartbeat spam
          try {
            const who = await convex.query(api.auth.whoami, {} as any);
            if (!who) {
              console.log("⏸️ Skipping heartbeat — no Convex identity yet (awaiting Clerk JWT template).");
              return;
            }
          } catch (err:any) {
            console.log("⏸️ Skipping heartbeat — whoami failed:", err?.message);
            return;
          }
          await convex.mutation(api.presence.heartbeat, { status: "online" });
          console.log("💓 Heartbeat sent");
        } catch (e: any) {
          // Convex not initialized yet or generated files missing — skip silently
          console.log("Convex heartbeat skipped:", e?.message ?? e);
        }
      };

      // Mark heartbeat as started globally
      convexHeartbeatStarted = true;
      
      // initial heartbeat
      send();
      // every 5 minutes
      const id = setInterval(send, 5 * 60 * 1000);
      return () => clearInterval(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn, user?.id]);

    return null;
  }

  function ConvexUserSync() {
    const convex = useConvex();
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    useEffect(() => {
      // Use global flag to prevent duplicate sync across all remounts
      if (!isLoaded || !isSignedIn || !user?.id || convexUserSyncCompleted) return;

      const run = async () => {
        try {
          // @ts-ignore generated at runtime by `npx convex dev`
          const { api } = await import("../convex/_generated/api");
          
          // Pre-flight whoami check to ensure we have authentication
          let who;
          try {
            who = await convex.query(api.auth.whoami, {} as any);
            if (!who) {
              console.warn("🔎 Convex whoami returned null — skipping syncUser until token is available.");
              return;
            }
          } catch (e:any) {
            console.warn("🔎 whoami query failed:", e?.message);
            return;
          }
          
          // Perform the sync with retry logic
          const userData = {
            email: user.primaryEmailAddress?.emailAddress ?? undefined,
            firstName: user.firstName ?? undefined,
            lastName: user.lastName ?? undefined,
            imageUrl: user.imageUrl ?? undefined,
          };
          
          console.log("✅ User sync handled by Convex (ConvexUserSync in _layout.tsx):", {
            clerkId: user.id,
            email: userData.email,
            name: `${userData.firstName} ${userData.lastName}`.trim()
          });
          
          // Retry up to 3 times with exponential backoff if authentication fails
          let retries = 0;
          const maxRetries = 3;
          
          while (retries <= maxRetries) {
            try {
              await convex.mutation(api.auth.syncUser, userData);
              // Mark as completed globally to prevent duplicate syncs
              convexUserSyncCompleted = true;
              console.log("✅ Convex user sync successful");
              break;
            } catch (syncError: any) {
              if (syncError?.message?.includes("Unauthenticated") && retries < maxRetries) {
                retries++;
                const delay = Math.pow(2, retries) * 200; // 400ms, 800ms, 1600ms
                console.log(`⏳ Auth not ready, retrying syncUser in ${delay}ms (attempt ${retries}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              } else {
                throw syncError; // Re-throw if not auth error or max retries reached
              }
            }
          }
        } catch (e: any) {
          console.log("Convex user sync skipped:", e?.message ?? e);
        }
      };
      
      // Debounce to prevent race conditions
      const timer = setTimeout(run, 500);
      return () => clearTimeout(timer);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded, isSignedIn, user?.id]);

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

  // Wrapper to use Clerk's useAuth inside ClerkProvider and explicitly provide a token fetcher
  function ConvexClerkWrapper({ children }: { children: React.ReactNode }) {
    // Fallback to original helper since ConvexProvider does not accept "auth" prop directly in this version.
    // Use ConvexProviderWithClerk for automatic token wiring, but add pre-flight token diagnostic.
    const { getToken, isSignedIn } = useAuth();
    useEffect(() => {
      const check = async () => {
        if (!isSignedIn) return;
        try {
          const t = await getToken({ template: "convex" });
          if (t) {
            console.log("🔑 Clerk convex template token present (first 30 chars):", t.substring(0,30) + "...");
          } else {
            console.warn("🔑 No token from getToken({template:'convex'}) - ensure JWT template 'convex' exists and is enabled for this instance.");
          }
        } catch (e:any) {
          console.warn("🔑 Token fetch error:", e?.message);
        }
      };
      check();
    }, [getToken, isSignedIn]);

    // Dynamically require ConvexProviderWithClerk to avoid earlier import swap issues.
    const { ConvexProviderWithClerk } = require("convex/react-clerk");
    return (
      <ConvexProviderWithClerk client={convexClient!} useAuth={useAuth}>
        <ConvexUserSync />
        <ConvexHeartbeat />
        {children}
      </ConvexProviderWithClerk>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={publishableKey} 
      tokenCache={tokenCache}
    >
      {convexClient ? (
        <ConvexClerkWrapper>
          {AppTree}
        </ConvexClerkWrapper>
      ) : (
        AppTree
      )}
    </ClerkProvider>
  );
}