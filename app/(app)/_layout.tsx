// app/(app)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  console.log('📱 AppLayout - Auth State:', { isLoaded, isSignedIn });

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