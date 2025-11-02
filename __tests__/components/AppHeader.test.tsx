/**
 * Component Test - AppHeader
 * Tests the main application header component
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';

// Mock ThemeProvider to bypass async loading
jest.mock('../../contexts/ThemeContext', () => {
  const React = require('react');
  
  const lightTheme = {
    background: "#E8E8E8",
    surface: "#FFFFFF",
    text: "#1A1A1A",
    textSecondary: "#555",
    textDisabled: "#999",
    border: "#D0D0D0",
    borderLight: "#E5E5E5",
    icon: "#555",
    iconDisabled: "#999",
    primary: "#4CAF50",
    accent: "#7FDBDA",
    error: "#FF6B6B",
  };
  
  const mockThemeContext = {
    theme: { colors: lightTheme, isDark: false },
    isDarkMode: false,
    toggleDarkMode: jest.fn(),
    setDarkMode: jest.fn(),
    textSize: 'Medium',
    setTextSize: jest.fn(),
    fontScale: 1.0,
    scaledFontSize: (baseSize: number) => baseSize,
  };
  
  return {
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    useTheme: () => mockThemeContext,
  };
});

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ signOut: jest.fn(), isSignedIn: true }),
  useUser: () => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      imageUrl: 'https://example.com/avatar.png',
      primaryEmailAddress: { emailAddress: 'test@example.com' },
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  let asyncStorageData: Record<string, string> = {
    appDarkMode: JSON.stringify(false),
    appTextSize: 'Medium',
  };
  return {
    getItem: jest.fn((key) => asyncStorageData[key] ?? null),
    setItem: jest.fn((key, value) => { asyncStorageData[key] = value; }),
    removeItem: jest.fn((key) => { delete asyncStorageData[key]; }),
    clear: jest.fn(() => { asyncStorageData = {
      appDarkMode: JSON.stringify(false),
      appTextSize: 'Medium',
    }; }),
  };
});

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('../../utils/avatarEvents', () => ({
  subscribe: jest.fn(() => () => {}),
}));

jest.mock('../../utils/notificationEvents', () => ({
  subscribe: jest.fn(() => () => {}),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => {
    // Immediately invoke the callback to simulate component focus
    callback();
  }),
}));

jest.mock('../../utils/assessmentTracker', () => ({
  assessmentTracker: {
    isAssessmentDue: jest.fn(() => Promise.resolve(false)),
  },
}));

jest.mock('../../utils/activityApi', () => ({
  default: {
    recordLogout: jest.fn(() => Promise.resolve()),
  },
}));

// Mock fetch for unread notifications count
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [] }),
  })
) as jest.Mock;

// Import ThemeProvider after mocking
import { ThemeProvider } from '../../contexts/ThemeContext';

describe('AppHeader Component', () => {
  it('should render without crashing', async () => {
    const { getByTestId, debug } = render(
      <SafeAreaProvider>
        <ThemeProvider>
          <AppHeader title="Test Title" />
        </ThemeProvider>
      </SafeAreaProvider>
    );
    debug(); // Output the component tree
    await waitFor(() => expect(getByTestId('app-header')).toBeTruthy());
  });

  it('should display the correct title', async () => {
    const { getByText } = render(
      <SafeAreaProvider>
        <ThemeProvider>
          <AppHeader title="Dashboard" />
        </ThemeProvider>
      </SafeAreaProvider>
    );
    await waitFor(() => expect(getByText('Dashboard')).toBeTruthy());
  });

  it('should render back button when showBack is true', async () => {
    const { getByTestId } = render(
      <SafeAreaProvider>
        <ThemeProvider>
          <AppHeader title="Details" showBack />
        </ThemeProvider>
      </SafeAreaProvider>
    );
    await waitFor(() => expect(getByTestId('back-button')).toBeTruthy());
  });

  it('should not render back button when onBackPress is not provided', () => {
    const { queryByTestId } = render(
      <SafeAreaProvider>
        <ThemeProvider>
          <AppHeader title="Home" />
        </ThemeProvider>
      </SafeAreaProvider>
    );
    expect(queryByTestId('back-button')).toBeNull();
  });

  it('should render custom rightActions when provided', async () => {
    const action = <></>;
    const { getByText } = render(
      <SafeAreaProvider>
        <ThemeProvider>
          <AppHeader 
            title="Settings" 
            rightActions={<></>}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    );
    await waitFor(() => expect(getByText('Settings')).toBeTruthy());
  });

  it('should match snapshot', () => {
    const tree = render(
      <SafeAreaProvider>
        <ThemeProvider>
          <AppHeader title="Test" />
        </ThemeProvider>
      </SafeAreaProvider>
    ).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
