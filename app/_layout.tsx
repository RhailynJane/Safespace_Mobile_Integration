// File: app/_layout.tsx

import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

const InitialLayout = () => {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until the auth state is loaded before navigating.
    if (loading) {
      return;
    }

    const inAppGroup = segments[0] === '(app)';

    if (session && !inAppGroup) {
      // User is signed in but not in the (app) group, so redirect to the main app.
      router.replace('/(app)');
    } else if (!session && inAppGroup) {
      // User is not signed in but is in the (app) group, so redirect to login.
      router.replace('/(auth)/login');
    }
  }, [session, loading, segments]);

  // Show a loading spinner while the auth state is being determined.
  // This prevents any other screen from rendering prematurely.
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Once loaded, Slot renders the correct route.
  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
