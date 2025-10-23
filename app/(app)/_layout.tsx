// app/(app)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View, AppState } from "react-native";
import { useEffect, useRef } from "react";
import activityApi from "../../utils/activityApi";

export default function AppLayout() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const appState = useRef(AppState.currentState);

  console.log('📱 AppLayout - Auth State:', { isLoaded, isSignedIn });

  // On sign-in or app foreground, record login once (no heartbeat/polling)
  useEffect(() => {
    if (!isSignedIn || !userId) return;

    const record = async () => {
      try {
        await activityApi.recordLogin(userId);
        console.log('✅ Presence: recorded login for user:', userId);
      } catch (error) {
        console.error('❌ recordLogin failed:', error);
      }
    };

    // Initial record when layout mounts for a signed-in user
    record();

    // Record again when app returns to foreground (no interval)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App foregrounded - refreshing presence');
        record();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isSignedIn, userId]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7BB8A8" />
      </View>
    );
  }

  if (!isSignedIn) {
    console.log('🚨 AppLayout redirecting to login - user not signed in');
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="crisis-support" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="mood-tracking" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="resources" />
      <Stack.Screen name="self-assessment" />
      <Stack.Screen name="video-consultations" />
    </Stack>
  );
}