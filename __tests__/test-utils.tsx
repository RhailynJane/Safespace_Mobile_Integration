import React, { PropsWithChildren } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

// Memoize initialMetrics outside the provider to avoid re-creating the object each render
const initialMetrics = {
  frame: { x: 0, y: 0, width: 360, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
} as const;

// Global providers wrapper for tests
// Create a mock Convex client instance for all tests.
const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || 'http://localhost:1';

// Mock ConvexReactClient - create a simple object that satisfies the ConvexProvider
const mockConvexClient = {
  query: jest.fn(),
  mutation: jest.fn(),
  action: jest.fn(),
} as any;

function AllProviders({ children }: PropsWithChildren<{}>) {
  return (
    <ConvexProvider client={mockConvexClient}>
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ThemeProvider>
          <NotificationsProvider convexClient={mockConvexClient} userId="test-user-id">
            {children}
          </NotificationsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ConvexProvider>
  );
}

export function render(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything else from RTL
export * from '@testing-library/react-native';
