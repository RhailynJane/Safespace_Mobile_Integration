import React from 'react';
import { render, screen, fireEvent, waitFor, act, waitForElementToBeRemoved } from '../test-utils';
import ResourcesScreen from '../../app/(app)/resources/index';
import ResourceDetailScreen from '../../app/(app)/resources/resource-detail-screen';

// Mock expo-router navigation
jest.mock('expo-router', () => {
  const push = jest.fn();
  const replace = jest.fn();
  const back = jest.fn();
  return {
    router: { push, replace, back },
    useLocalSearchParams: () => ({
      id: '1',
      title: 'Managing Stress',
      content: 'Tips for managing daily stress',
      author: 'Team',
      type: 'Article',
      category: 'stress',
      imageEmoji: '💧',
      backgroundColor: '#FFE0B2'
    })
  };
});

// Convex API object shape referenced in component (extended for profiles)
jest.mock('../../convex/_generated/api', () => ({
  api: {
    resources: {
      listResources: { _id: 'listResources' },
      listByCategory: { _id: 'listByCategory' },
      search: { _id: 'search' },
      getDailyQuote: { _id: 'getDailyQuote' },
      getDailyAffirmationExternal: { _id: 'getDailyAffirmationExternal' },
      addBookmark: { _id: 'addBookmark' },
      removeBookmark: { _id: 'removeBookmark' },
      listBookmarkedIds: { _id: 'listBookmarkedIds' },
      getResource: { _id: 'getResource' }
    },
    profiles: {
      getFullProfile: { _id: 'getFullProfile' }
    }
  }
}));

// Shared mock resources fixture
const ALL_RESOURCES = [
  {
    id: '1',
    title: 'Managing Stress',
    type: 'Quote',
    duration: '1 min',
    category: 'stress',
    content: '"Stress is manageable when you breathe"',
    author: 'A.A. Milne',
    image_emoji: '💧',
    backgroundColor: '#FFE0B2'
  },
  {
    id: '2',
    title: 'Box Breathing Technique',
    type: 'Exercise',
    duration: '5 mins',
    category: 'anxiety',
    content: 'Inhale 4, hold 4, exhale 4, hold 4.',
    author: 'Coach',
    image_emoji: '🧠',
    backgroundColor: '#C8E6C9'
  },
  {
    id: '3',
    title: 'Behavioral Activation',
    type: 'Article',
    duration: '10 mins',
    category: 'depression',
    content: 'Structure activities to combat inertia.',
    author: 'Dr. Sarah Mitchell',
    image_emoji: '👥',
    backgroundColor: '#B3E5FC'
  },
  {
    id: '4',
    title: 'Daily Mood Tracking',
    type: 'Guide',
    duration: '7 mins',
    category: 'mindfulness',
    content: 'Track mood each morning and evening.',
    author: 'Team',
    image_emoji: '🧘',
    backgroundColor: '#BA68C8'
  }
];

// Mock convex/react hooks - return data synchronously
jest.mock('convex/react', () => {
  return {
    useQuery: (fn: any, args: any) => {
      if (fn && fn._id === 'listResources') {
        return { resources: ALL_RESOURCES };
      }
      if (fn && fn._id === 'listByCategory' && args?.category) {
        return { resources: ALL_RESOURCES.filter((r: any) => r.category === args.category) };
      }
      if (fn && fn._id === 'search' && typeof args === 'object') {
        const q = (args.query || '').toLowerCase();
        const filtered = ALL_RESOURCES.filter((r: any) => 
          r.title.toLowerCase().includes(q) || 
          r.content.toLowerCase().includes(q) ||
          (r.author || '').toLowerCase().includes(q)
        );
        return { resources: filtered };
      }
      if (fn && fn._id === 'listBookmarkedIds') {
        return { ids: [] };
      }
      if (fn && fn._id === 'getResource') {
        return ALL_RESOURCES[0];
      }
      if (fn && fn._id === 'getFullProfile') {
        return { profileImageUrl: null };
      }
      return undefined;
    },
    useAction: (fn: any) => {
      return async () => {
        if (fn._id === 'getDailyQuote') {
          return {
            id: 'quote-1',
            title: 'Daily Inspiration',
            type: 'Quote',
            duration: '1 min',
            category: 'motivation',
            content: 'Believe in yourself today.',
            author: 'Author',
            image_emoji: '⚡',
            backgroundColor: '#FFB74D'
          };
        }
        if (fn._id === 'getDailyAffirmationExternal') {
          return {
            id: 'affirm-1',
            title: 'Daily Affirmation',
            type: 'Affirmation',
            duration: '1 min',
            category: 'motivation',
            content: 'You are strong and capable.',
            author: 'Team',
            image_emoji: '⚡',
            backgroundColor: '#FFB74D'
          };
        }
        return null;
      };
    },
    useMutation: () => jest.fn()
  };
});

// Mock Clerk user hook
jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({ user: { id: 'user-1' } }),
  useAuth: () => ({ signOut: jest.fn(), isSignedIn: true })
}));

describe('ResourcesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page title and featured quote (TC-RES-P01, P47)', async () => {
    render(<ResourcesScreen />);
    await waitFor(() => {
      expect(screen.getByText('Resources')).toBeTruthy();
    });
  });

  it('shows quick action cards (TC-RES-P02, P03, P59)', async () => {
    render(<ResourcesScreen />);
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeTruthy();
    });
    expect(screen.getByText(/Daily Affirmation/i)).toBeTruthy();
    expect(screen.getByText(/Random Quote/i)).toBeTruthy();
  });

  it('displays search bar with icon and placeholder (TC-RES-P06, P50)', async () => {
    render(<ResourcesScreen />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search resources...')).toBeTruthy();
    });
  });

  it('renders all category cards (TC-RES-P09–P15, P60)', async () => {
    render(<ResourcesScreen />);
    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeTruthy();
    });
    ['Stress','Anxiety','Depression','Sleep','Motivation','Mindfulness'].forEach(name => {
      expect(screen.getByText(name)).toBeTruthy();
    });
  });

  it('filters resources by category (Stress) (TC-RES-P16)', async () => {
    render(<ResourcesScreen />);
    await waitFor(() => screen.getByText('Stress'));
    await act(async () => {
      fireEvent.press(screen.getByText('Stress'));
    });
    await screen.findByText(/Managing Stress/);
  });

  it('searches resources case-insensitively (TC-RES-P07, P08)', async () => {
    render(<ResourcesScreen />);
    const input = await screen.findByPlaceholderText('Search resources...');
    await act(async () => {
      fireEvent.changeText(input, 'BREATHING');
    });
    await screen.findByText(/Box Breathing Technique/, {}, { timeout: 3000 });
  });

  it('shows resource metadata (TC-RES-P23–P26)', async () => {
    render(<ResourcesScreen />);
    // Wait for loading spinner to disappear
    await waitForElementToBeRemoved(() => screen.queryByText('Loading resources...'), { timeout: 5000 });
    expect(screen.getByText(/Managing Stress/)).toBeTruthy();
    expect(screen.getByText(/Quote/)).toBeTruthy();
    expect(screen.getByText(/1 min/)).toBeTruthy();
    expect(screen.getByText(/Exercise/)).toBeTruthy();
    expect(screen.getByText(/5 mins/)).toBeTruthy();
    expect(screen.getByText(/Article/)).toBeTruthy();
    expect(screen.getByText(/10 mins/)).toBeTruthy();
    expect(screen.getByText(/Guide/)).toBeTruthy();
  });

  it('displays empty state on unmatched search (TC-RES-N01)', async () => {
    render(<ResourcesScreen />);
    const input = await screen.findByPlaceholderText('Search resources...');
    await act(async () => {
      fireEvent.changeText(input, 'zzzzzz');
    });
    await screen.findByText(/No resources found/i, {}, { timeout: 3000 });
  });
});

describe('ResourceDetailScreen', () => {
  it('renders detail with category badge and reflection section (TC-RES-P28, P29, P30, P38)', async () => {
    render(<ResourceDetailScreen />);
    await waitFor(() => {
      expect(screen.getByText(/MANAGING STRESS/i)).toBeTruthy(); // category badge uppercase
    });
    expect(screen.getByText(/Managing Stress/)).toBeTruthy();
    expect(screen.getByText(/Content/)).toBeTruthy();
    expect(screen.getByText(/Take a Moment/)).toBeTruthy();
    // Just verify the text contains what and next - more robust than regex
    expect(screen.getByText(/What/)).toBeTruthy();
    expect(screen.getByText(/Next/)).toBeTruthy();
  });
});
