/* eslint-disable no-undef */
// Jest setup file for SafeSpace testing
/* eslint-env jest, node */

require('@testing-library/react-native');

// Mock Expo winter runtime (Expo 54+)
global.__ExpoImportMetaRegistry = new Map();
global.structuredClone = global.structuredClone || ((val) => JSON.parse(JSON.stringify(val)));

// Add Alert to global for testing
global.Alert = {
  alert: jest.fn(),
};

// NOTE: MSW (Mock Service Worker) is available but commented out due to compatibility issues
// To use MSW, uncomment the lines below and ensure msw is configured properly
// const { server } = require('./testing/mocks/server');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-font', () => ({}));
jest.mock('expo-asset', () => ({}));
jest.mock('expo-secure-store', () => ({}));
jest.mock('expo-notifications', () => ({}));
jest.mock('expo-location', () => ({}));
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const MockIcon = ({ name = 'icon', ...props }) => React.createElement(View, props, React.createElement(Text, null, name));
  return {
    Ionicons: MockIcon,
    MaterialIcons: MockIcon,
    MaterialCommunityIcons: MockIcon,
    Feather: MockIcon,
    Entypo: MockIcon,
    FontAwesome: MockIcon,
    FontAwesome5: MockIcon,
    AntDesign: MockIcon,
    SimpleLineIcons: MockIcon,
    EvilIcons: MockIcon,
    Octicons: MockIcon,
    Zocial: MockIcon,
  };
});

// Mock expo-router router to avoid navigation side-effects in tests
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
    back: jest.fn(),
  },
}));

// Mock react-navigation focus hooks used by some screens
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const React = require('react');
  return {
    ...actual,
    useIsFocused: () => true,
    // Run focus effect like a useEffect so setState happens after render, avoiding infinite re-renders
    useFocusEffect: (cb) => {
      React.useEffect(() => {
        if (typeof cb === 'function') {
          const cleanup = cb();
          return typeof cleanup === 'function' ? cleanup : undefined;
        }
      }, []);
    },
    NavigationContainer: ({ children }) => children,
  };
});

// Mock LinearGradient to a simple passthrough view
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  const LinearGradient = ({ children, ...props }) => React.createElement(View, props, children);
  return { LinearGradient };
});

// Mock Clerk authentication
jest.mock('@clerk/clerk-expo', () => {
  // Create shared mock fns so tests can inspect/override behavior
  const signUpMock = {
    create: jest.fn(async () => ({ id: 'signup_mock_id' })),
    prepareEmailAddressVerification: jest.fn(async () => ({ status: 'needs_verification' })),
    attemptEmailAddressVerification: jest.fn(async () => ({ status: 'complete', createdSessionId: 'sess_mock', createdUserId: 'user_mock' })),
  };
  const setActiveMock = jest.fn(async () => undefined);
  const signInMock = {
    create: jest.fn(async () => ({ status: 'complete', createdSessionId: 'sess_mock', createdUserId: 'user_mock' })),
    attemptFirstFactor: jest.fn(async () => ({ status: 'complete', createdSessionId: 'sess_mock', createdUserId: 'user_mock' })),
  };

  const module = {
    useAuth: () => ({
      isSignedIn: true,
      userId: 'test-user-id',
      sessionId: 'test-session-id',
      signOut: jest.fn()
    }),
    useUser: () => ({
      user: {
        id: 'test-user-id',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'Test',
        lastName: 'User'
      }
    }),
    useSignIn: () => ({
      isLoaded: true,
      signIn: signInMock,
      setActive: setActiveMock,
    }),
    useSignUp: () => ({
      isLoaded: true,
      signUp: signUpMock,
      setActive: setActiveMock,
    }),
    ClerkProvider: ({ children }) => children,
    // Expose helpers for tests to tweak behavior
    __signUpMock: signUpMock,
    __signInMock: signInMock,
    __setActiveMock: setActiveMock,
  };

  return module;
});

// Mock fetch for API calls (alternative to MSW)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data: [] }),
  })
);

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000);
