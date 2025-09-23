// app/(auth)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  // Show loading indicator while checking auth state
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7BB8A8" />
      </View>
    );
  }

  // Redirect to app if already signed in
  if (isSignedIn) {
    return <Redirect href="/(app)/(tabs)/home" />;
  }

  // Render auth routes including success screen
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="success" />
    </Stack>
  );
}