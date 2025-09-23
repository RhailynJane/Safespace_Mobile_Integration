// app/(app)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading indicator while checking auth state
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7BB8A8" />
      </View>
    );
  }

  // Redirect to auth if not signed in
  if (!isSignedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  // Render the protected app routes
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      {/* Add other app screens here if needed */}
    </Stack>
  );
}