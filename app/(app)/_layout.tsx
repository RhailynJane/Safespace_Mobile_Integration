import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Onboarding Flow - Available to all users */}
      <Stack.Screen name="splash" />
      <Stack.Screen name="loading" />
      <Stack.Screen name="quote" />
      <Stack.Screen name="onboarding" />

      {/* Main App with Tabs */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
