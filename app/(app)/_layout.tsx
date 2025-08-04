// File: app/(app)/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';

// This is the navigator for the main app screens
export default function AppLayout() {
  const { session } = useAuth();

  // If the user is not signed in, redirect them to the login screen.
  // This is a crucial security measure.
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // Use Stack instead of Tabs to remove the built-in tab navigation
  // We're using our custom BottomNavigation component instead
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="mood" />
      <Stack.Screen name="mood-logging" />
      <Stack.Screen name="mood-history" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="journal-create" />
      <Stack.Screen name="journal-history" />
      {/* Add any future app screens here */}
    </Stack>
  );
}