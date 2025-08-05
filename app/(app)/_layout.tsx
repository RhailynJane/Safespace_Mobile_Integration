"use client";

import { Stack } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { Redirect } from "expo-router";

export default function AppLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
