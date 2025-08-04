// File: app/(auth)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

// This is the navigator for the authentication screens
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
