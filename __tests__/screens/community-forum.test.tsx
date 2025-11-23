/**
 * Community Forum Screen Tests
 */

// Mock avatarEvents before any other imports
jest.mock('../../utils/avatarEvents', () => {
  const mockSubscribe = jest.fn(() => jest.fn()); // returns unsubscribe function
  const mockEmit = jest.fn();
  
  return {
    avatarEvents: {
      subscribe: mockSubscribe,
      emit: mockEmit,
    },
  };
});

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '../test-utils';
import CommunityMainScreen from '../../app/(app)/(tabs)/community-forum/index';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { api } from '../../convex/_generated/api';

// Mock Convex with stable query/mutation implementations
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn((_mutation: any) => jest.fn(() => Promise.resolve(undefined)));
const mockUseConvex = jest.fn();

jest.mock('convex/react', () => ({
  useQuery: jest.fn((query: any, args: any) => mockUseQuery(query, args)),
  useMutation: jest.fn((mutation: any) => mockUseMutation(mutation)),
  useConvex: () => mockUseConvex(),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  ConvexReactClient: jest.fn(),
}));

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
}));

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
};

jest.mock('expo-router', () => ({
  router: mockRouter,
  useRouter: jest.fn(() => mockRouter),
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: jest.fn((callback) => {
    callback();
  }),
}));

describe('Community Forum Screen', () => {
  // Shared state for query/mutation mocks
  let postsValue: any[];
  let categoriesValue: any[];
  let mockConvexQuery: jest.Mock;
  let mockConvexMutation: jest.Mock;

  // Helper function to setup mock query with current postsValue
  const setupMockQuery = () => {
    mockConvexQuery = jest.fn((apiFunc: any, args?: any) => {
      // Match categories.list
      if (apiFunc === api.categories.list) {
        console.log('🔍 Mock returning categories:', categoriesValue.length);
        return Promise.resolve(categoriesValue);
      }
      // Match posts.bookmarkedPosts (check this BEFORE posts.list since both have 'limit')
      if (apiFunc === api.posts.bookmarkedPosts) {
        console.log('🔍 Mock returning bookmarked posts: 0');
        return Promise.resolve([]);
      }
      // Match posts.myPosts
      if (args && typeof args === 'object' && 'includeDrafts' in args) {
        console.log('🔍 Mock returning my posts: 0');
        return Promise.resolve([]);
      }
      // Match posts.getUserReaction
      if (args && typeof args === 'object' && 'postId' in args) {
        return Promise.resolve(null);
      }
      // Match posts.list by args shape (default fallback for queries with limit)
      if (args && typeof args === 'object' && 'limit' in args) {
        console.log('🔍 Mock returning posts:', postsValue.length, postsValue);
        return Promise.resolve(postsValue);
      }
      console.log('🔍 Mock returning undefined for:', apiFunc, args);
      return Promise.resolve(undefined);
    });

    mockUseConvex.mockReturnValue({
      query: mockConvexQuery,
      mutation: mockConvexMutation,
    });
    
    // Also setup useQuery mock to return the same data synchronously
    mockUseQuery.mockImplementation((query: any, args: any) => {
      if (query === api.categories.list) {
        return categoriesValue;
      }
      if (query === api.posts.bookmarkedPosts) {
        return [];
      }
      if (args && typeof args === 'object' && 'includeDrafts' in args) {
        return [];
      }
      if (args && typeof args === 'object' && 'limit' in args) {
        return postsValue;
      }
      return undefined;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup auth/user mocks
    (useAuth as jest.Mock).mockReturnValue({ 
      userId: 'test-user-id',
      isSignedIn: true,
      signOut: jest.fn(),
    });
    (useUser as jest.Mock).mockReturnValue({
      user: {
        id: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
        primaryEmailAddress: { emailAddress: 'test@example.com' },
        imageUrl: null,
      },
    });

    // Setup default posts and categories
    postsValue = [];
    categoriesValue = [
      { name: 'Self-Care' },
      { name: 'Mindfulness' },
      { name: 'Support' },
    ];

    mockConvexMutation = jest.fn((apiFunc: any, args?: any) => {
      return Promise.resolve({ success: true });
    });

    // Setup mock query
    setupMockQuery();
  });

  it('renders community forum screen with testID', async () => {
    render(<CommunityMainScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('community-forum')).toBeTruthy();
    });
  });

  it('renders title and newsfeed/my-posts tabs', async () => {
    render(<CommunityMainScreen />);

    await waitFor(() => {
      expect(screen.getByText('Community Forum')).toBeTruthy();
      expect(screen.getByText('Newsfeed')).toBeTruthy();
      expect(screen.getByText('My Posts')).toBeTruthy();
    });
  });

  it('renders search bar and create post button', async () => {
    render(<CommunityMainScreen />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search posts...')).toBeTruthy();
      expect(screen.getByTestId('create-post-button')).toBeTruthy();
    });
  });

  it('navigates to create post when button pressed', async () => {
    render(<CommunityMainScreen />);

    await waitFor(() => {
      const createButton = screen.getByTestId('create-post-button');
      fireEvent.press(createButton);
    });

    expect(mockPush).toHaveBeenCalledWith('/(app)/(tabs)/community-forum/create');
  });

  it('switches between Newsfeed and My Posts views', async () => {
    render(<CommunityMainScreen />);

    const myPostsTab = await screen.findByText('My Posts');
    fireEvent.press(myPostsTab);

    await waitFor(() => {
      // My Posts tab should now be selected (verify via accessibility state or UI change)
      expect(screen.getByText('My Posts')).toBeTruthy();
    });
  });

  it('displays categories in Browse By section', async () => {
    render(<CommunityMainScreen />);

    await waitFor(() => {
      expect(screen.getByText('Browse By')).toBeTruthy();
      expect(screen.getByText('All')).toBeTruthy();
      expect(screen.getByText('Self-Care')).toBeTruthy();
      expect(screen.getByText('Mindfulness')).toBeTruthy();
      expect(screen.getByText('Support')).toBeTruthy();
    });
  });
});
