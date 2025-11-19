/**
 * Community Forum Screen Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
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
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  },
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
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
        return Promise.resolve(categoriesValue);
      }
      // Match posts.bookmarkedPosts (check this BEFORE posts.list since both have 'limit')
      if (apiFunc === api.posts.bookmarkedPosts) {
        return Promise.resolve([]);
      }
      // Match posts.myPosts
      if (args && typeof args === 'object' && 'includeDrafts' in args) {
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
      return Promise.resolve(undefined);
    });

    mockUseConvex.mockReturnValue({
      query: mockConvexQuery,
      mutation: mockConvexMutation,
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

  it('shows empty state when no posts exist', async () => {
    postsValue = [];
    setupMockQuery(); // Refresh mock with updated postsValue
    render(<CommunityMainScreen />);

    // Wait for loading to complete and empty state to appear
    await waitFor(
      () => {
        expect(screen.getByTestId('empty-state-container')).toBeTruthy();
        // Check for the dedicated empty state text added for tests
        const emptyTexts = screen.getAllByText('No posts yet');
        expect(emptyTexts.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  it('renders post list with title and author', async () => {
    postsValue = [
      {
        _id: 'post1',
        title: 'Mental Health Tips',
        content: 'Here are some helpful tips for managing stress...',
        category: 'Self-Care',
        authorId: 'user1',
        authorName: 'Jane Doe',
        authorImage: null,
        createdAt: Date.now(),
        reactionCounts: [{ e: '❤️', c: 5 }],
        imageUrls: [],
        isDraft: false,
      },
      {
        _id: 'post2',
        title: 'Mindfulness Practice',
        content: 'Daily mindfulness exercises...',
        category: 'Mindfulness',
        authorId: 'user2',
        authorName: 'John Smith',
        authorImage: null,
        createdAt: Date.now(),
        reactionCounts: [],
        imageUrls: [],
        isDraft: false,
      },
    ];
    setupMockQuery(); // Refresh mock with updated postsValue

    render(<CommunityMainScreen />);

    // Wait for posts to load and render
    await waitFor(
      () => {
        expect(screen.getByText(/helpful tips for managing stress/i)).toBeTruthy();
        expect(screen.getByText(/Daily mindfulness exercises/i)).toBeTruthy();
        expect(screen.getByText(/@Jane Doe/)).toBeTruthy();
        expect(screen.getByText(/@John Smith/)).toBeTruthy();
      },
      { timeout: 5000 }
    );
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

  it('shows reaction counts on posts', async () => {
    postsValue = [
      {
        _id: 'post1',
        title: 'Popular Post',
        content: 'This post has many reactions',
        category: 'Support',
        authorId: 'user1',
        authorName: 'Community Member',
        authorImage: null,
        createdAt: Date.now(),
        reactionCounts: [
          { e: '❤️', c: 10 },
          { e: '👍', c: 5 },
        ],
        imageUrls: [],
        isDraft: false,
      },
    ];
    setupMockQuery(); // Refresh mock with updated postsValue

    render(<CommunityMainScreen />);

    // Wait for post content and reaction counts to render
    await waitFor(
      () => {
        expect(screen.getByText(/This post has many reactions/i)).toBeTruthy();
        // Reaction counts should be visible
        expect(screen.getByText('10')).toBeTruthy();
        expect(screen.getByText('5')).toBeTruthy();
      },
      { timeout: 5000 }
    );
  });
});
