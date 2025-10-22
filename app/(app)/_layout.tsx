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

  // Global heartbeat to keep user online while app is active
  useEffect(() => {
    if (!isSignedIn || !userId) return;

    const sendHeartbeat = async () => {
      try {
        await activityApi.heartbeat(userId);
        console.log('💓 Heartbeat sent for user:', userId);
      } catch (error) {
        console.error('❌ Heartbeat failed:', error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 15 seconds to keep user online
    const heartbeatInterval = setInterval(sendHeartbeat, 15000);

    // Handle app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground - send immediate heartbeat
        console.log('📱 App came to foreground - sending heartbeat');
        sendHeartbeat();
      }
      appState.current = nextAppState;
    });

    return () => {
      clearInterval(heartbeatInterval);
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