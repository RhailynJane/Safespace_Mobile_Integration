/* eslint-disable no-undef */
// Jest setup file for SafeSpace testing
/* eslint-env jest, node */

require('@testing-library/react-native');

// Ensure Convex URL exists for any code paths that instantiate Convex clients
process.env.EXPO_PUBLIC_CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || 'http://localhost:1';

// Mock ConvexHttpClient to avoid initialization errors in tests
jest.mock('convex/browser', () => ({
  ConvexHttpClient: jest.fn().mockImplementation(() => ({
    query: jest.fn().mockResolvedValue(null),
    mutation: jest.fn().mockResolvedValue(null),
    action: jest.fn().mockResolvedValue(null),
  })),
}));

// Mock convex/react to prevent import errors
jest.mock('convex/react', () => ({
  ConvexProvider: ({ children }) => children,
  ConvexReactClient: jest.fn().mockImplementation(() => ({
    query: jest.fn().mockResolvedValue(null),
    mutation: jest.fn().mockResolvedValue(null),
    action: jest.fn().mockResolvedValue(null),
  })),
  useQuery: jest.fn(() => null),
  useMutation: jest.fn(() => jest.fn()),
  useAction: jest.fn(() => jest.fn()),
  useConvex: jest.fn(() => ({
    query: jest.fn().mockResolvedValue(null),
    mutation: jest.fn().mockResolvedValue({ success: true }),
    action: jest.fn().mockResolvedValue({ uploadUrl: 'mock://upload-url' }),
  })),
}));

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
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({}),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/test',
  useSegments: () => ['test'],
  Link: ({ children, ...props }) => {
    const React = require('react');
    const { TouchableOpacity } = require('react-native');
    return React.createElement(TouchableOpacity, props, children);
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

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  const MockSvg = ({ children, ...props }) => React.createElement(View, { testID: 'mock-svg', ...props }, children);
  const MockPath = (props) => React.createElement(View, { testID: 'mock-path', ...props });
  const MockDefs = ({ children }) => React.createElement(View, { testID: 'mock-defs' }, children);
  const MockLinearGradient = ({ children }) => React.createElement(View, { testID: 'mock-linear-gradient' }, children);
  const MockStop = (props) => React.createElement(View, { testID: 'mock-stop', ...props });
  
  return {
    __esModule: true,
    default: MockSvg,
    Svg: MockSvg,
    Path: MockPath,
    Defs: MockDefs,
    LinearGradient: MockLinearGradient,
    Stop: MockStop,
    Circle: (props) => React.createElement(View, { testID: 'mock-circle', ...props }),
    Rect: (props) => React.createElement(View, { testID: 'mock-rect', ...props }),
    G: ({ children }) => React.createElement(View, { testID: 'mock-g' }, children),
    Text: ({ children, ...props }) => React.createElement(Text, { testID: 'mock-svg-text', ...props }, children),
  };
});

// Mock avatarEvents utility
jest.mock('./utils/avatarEvents', () => {
  const mockSubscribe = jest.fn(() => jest.fn()); // returns unsubscribe function
  const mockEmit = jest.fn();
  
  const mockAvatarEvents = {
    subscribe: mockSubscribe,
    emit: mockEmit,
  };
  
  return {
    __esModule: true,
    avatarEvents: mockAvatarEvents,
    default: mockAvatarEvents,
  };
});

// Additional mock for default import pattern
jest.mock('./utils/avatarEvents', () => {
  const mockSubscribe = jest.fn(() => jest.fn());
  const mockEmit = jest.fn();
  
  const mockAvatarEvents = {
    subscribe: mockSubscribe,
    emit: mockEmit,
  };
  
  return {
    __esModule: true,
    avatarEvents: mockAvatarEvents,
    default: mockAvatarEvents,
  };
});

// Mock useConvexMoods hook to prevent dynamic import errors
jest.mock('./utils/hooks/useConvexMoods', () => ({
  useConvexMoods: () => ({
    moods: [],
    stats: null,
    loading: false,
    error: null,
    loadRecentMoods: jest.fn().mockResolvedValue([]),
    loadMoodStats: jest.fn().mockResolvedValue(null),
    recordMood: jest.fn().mockResolvedValue({ success: true }),
    isUsingConvex: false,
  }),
}));

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

  // Stable user object across renders to avoid effect loops
  const mockUserObj = {
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    lastName: 'User'
  };

  const module = {
    useAuth: () => ({
      isSignedIn: true,
      userId: 'test-user-id',
      sessionId: 'test-session-id',
      signOut: jest.fn()
    }),
    useUser: () => ({
      user: mockUserObj,
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

// Provide a default mock for Convex useQuery across tests to avoid undefined data issues
try {
  const ConvexReact = require('convex/react');
  if (ConvexReact && typeof ConvexReact.useQuery === 'function') {
    jest.spyOn(ConvexReact, 'useQuery').mockImplementation((queryFn, args) => {
      // Return null for fullProfile to prevent infinite re-renders in edit screen
      if (queryFn && typeof queryFn === 'object' && queryFn._query === 'profiles:getFullProfile') {
        return null;
      }
      
      // Return sensible defaults based on argument shape used in app screens
      if (!args) return undefined;
      if (args && typeof args === 'object') {
        if ('clerkId' in args) {
          return {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phoneNumber: '',
            location: '',
            profileImageUrl: '',
          };
        }
        if ('startDate' in args && 'endDate' in args) {
          return { entries: [] };
        }
        if ('userId' in args && 'limit' in args) {
          return [];
        }
        if ('includeDrafts' in args) {
          return [];
        }
        if ('days' in args) {
          return {
            currentStreak: 0,
            longestStreak: 0,
            chartData: [],
          };
        }
      }
      return undefined;
    });
  }
} catch {
  // If convex/react isn't available in a specific environment, ignore
}
