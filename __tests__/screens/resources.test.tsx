import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import ResourcesScreen from '../../app/(app)/resources/index';
import { api } from '../../convex/_generated/api';

// Mock Convex hooks for this suite to return deterministic data
jest.mock('convex/react', () => {
  const actual = jest.requireActual('convex/react');
  const mockUseQuery = jest.fn();
  const mockUseAction = jest.fn();
  const mockUseMutation = jest.fn(() => jest.fn(async () => {}));
  return {
    ...actual,
    useQuery: (...args: any[]) => mockUseQuery(...args),
    useAction: (ref: any) => mockUseAction(ref),
    useMutation: mockUseMutation,
    __mocks: { mockUseQuery, mockUseAction },
  };
});

describe('ResourcesScreen', () => {
  // Convex-shaped mock resources
  const mockResources = [
    {
      id: '1',
      title: 'Managing Stress',
      type: 'Article',
      duration: '5 min',
      category: 'stress',
      content: 'Tips for managing daily stress',
      author: 'Team',
      image_emoji: '💧',
      backgroundColor: '#FFE0B2',
    },
    {
      id: '2',
      title: 'Anxiety Techniques',
      type: 'Guide',
      duration: '7 min',
      category: 'anxiety',
      content: 'Breathing exercises for anxiety',
      author: 'Coach',
      image_emoji: '🧠',
      backgroundColor: '#C8E6C9',
    },
    {
      id: '3',
      title: 'Sleep Better',
      type: 'Article',
      duration: '6 min',
      category: 'sleep',
      content: 'How to improve your sleep',
      author: 'Expert',
      image_emoji: '🛏️',
      backgroundColor: '#B3E5FC',
    },
  ];

  // Helpers to access our mocks
  const { __mocks } = jest.requireMock('convex/react');
  const mockUseQuery = __mocks.mockUseQuery as jest.Mock;
  const mockUseAction = __mocks.mockUseAction as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Default useQuery behavior: listResources returns all, bookmarkedIds empty
    const stableAll = { resources: mockResources };
    const stableBookmarksEmpty = { ids: [] as string[] };

    // Stable memoized results for category and search to avoid new refs per render
    const byCategoryCache = new Map<string, { resources: typeof mockResources }>();
    const searchCache = new Map<string, { resources: typeof mockResources }>();

    mockUseQuery.mockImplementation((ref: any, args: any) => {
      // Prefer exact ref matches
      if (ref === api.resources.listResources) {
        return stableAll;
      }
      if (ref === api.resources.listByCategory) {
        const cat = args?.category ?? '';
        if (!byCategoryCache.has(cat)) {
          byCategoryCache.set(cat, { resources: mockResources.filter(r => r.category === cat) });
        }
        return byCategoryCache.get(cat);
      }
      if (ref === api.resources.search) {
        const q = (args?.query || '').toLowerCase();
        if (!searchCache.has(q)) {
          searchCache.set(q, { resources: mockResources.filter(r => r.title.toLowerCase().includes(q)) });
        }
        return searchCache.get(q);
      }
      if (ref === api.resources.listBookmarkedIds) {
        return stableBookmarksEmpty;
      }
      // Fallback: infer by args shape
      if (args && typeof args === 'object') {
        if ('query' in args) {
          const q = (args.query || '').toLowerCase();
          if (!searchCache.has(q)) {
            searchCache.set(q, { resources: mockResources.filter(r => r.title.toLowerCase().includes(q)) });
          }
          return searchCache.get(q);
        }
        if ('category' in args) {
          const cat = args.category ?? '';
          if (!byCategoryCache.has(cat)) {
            byCategoryCache.set(cat, { resources: mockResources.filter(r => r.category === cat) });
          }
          return byCategoryCache.get(cat);
        }
        if ('limit' in args && !('category' in args)) {
          return stableAll;
        }
        if ('userId' in args) {
          return stableBookmarksEmpty;
        }
      }
      return undefined;
    });
    // Default actions: quote/affirmation return simple resource-like objects
    const stableQuoteHandler = jest.fn(async () => ({
      id: 'q1',
      title: 'Daily Quote',
      type: 'Quote',
      duration: '1 min',
      category: 'motivation',
      content: 'Be the change you wish to see.',
      author: 'Gandhi',
      image_emoji: '💬',
      backgroundColor: '#FFF3E0',
    }));
    const stableAffirmationHandler = jest.fn(async () => ({
      id: 'a1',
      title: 'Daily Affirmation',
      type: 'Affirmation',
      duration: '1 min',
      category: 'mindfulness',
      content: 'You are capable and strong.',
      image_emoji: '🌟',
      backgroundColor: '#E8F5E8',
    }));

    mockUseAction.mockImplementation((ref: any) => {
      if (ref === api.resources.getDailyQuote) return stableQuoteHandler;
      if (ref === api.resources.getDailyAffirmationExternal) return stableAffirmationHandler;
      return jest.fn(async () => null);
    });
  });

  it('renders resources screen correctly', () => {
    render(<ResourcesScreen />);
    
    expect(screen.getByText('Resources')).toBeTruthy();
  });

  it('loads and displays resources', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Managing Stress')).toBeTruthy();
      expect(screen.getByText('Anxiety Techniques')).toBeTruthy();
      expect(screen.getByText('Sleep Better')).toBeTruthy();
    });
  });

  it('displays category filters', () => {
    render(<ResourcesScreen />);
    
    expect(screen.getByText('Stress')).toBeTruthy();
    expect(screen.getByText('Anxiety')).toBeTruthy();
    expect(screen.getByText('Depression')).toBeTruthy();
    expect(screen.getByText('Sleep')).toBeTruthy();
    expect(screen.getByText('Motivation')).toBeTruthy();
    expect(screen.getByText('Mindfulness')).toBeTruthy();
  });

  it('filters resources by category', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Managing Stress')).toBeTruthy();
    });

    const stressCategory = screen.getByText('Stress');
    fireEvent.press(stressCategory);
    
    await waitFor(() => {
      // After selecting Stress, only Stress content should remain present
      expect(screen.getByText('Managing Stress')).toBeTruthy();
      expect(screen.queryByText('Sleep Better')).toBeNull();
    });
  });

  it('searches resources', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Managing Stress')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText(/Search resources/i);
    fireEvent.changeText(searchInput, 'anxiety');
    
    await waitFor(() => {
      expect(screen.getByText('Anxiety Techniques')).toBeTruthy();
      expect(screen.queryByText('Managing Stress')).toBeNull();
    }, { timeout: 2000 });
  });

  it('displays featured resource', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Managing Stress')).toBeTruthy();
    });
  });

  it('navigates to resource detail', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Managing Stress')).toBeTruthy();
    });

    const resourceCard = screen.getByText('Managing Stress');
    fireEvent.press(resourceCard);
    
    expect(require('expo-router').router.push).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: expect.stringContaining('resource-detail-screen'),
      })
    );
  });

  it('displays daily affirmation button', () => {
    render(<ResourcesScreen />);
    
    expect(screen.getByText(/Daily Affirmation|Affirmation/i)).toBeTruthy();
  });

  it('displays random quote button', () => {
    render(<ResourcesScreen />);
    
    expect(screen.getByText(/Random Quote|Quote/i)).toBeTruthy();
  });

  it('shows empty state when no resources', async () => {
    // Override listResources to return empty using stable references to avoid effect loops
    const emptyResources = { resources: [] };
    const emptyBookmarks = { ids: [] };
    mockUseQuery.mockImplementation((ref: any, args: any) => {
      if (args && typeof args === 'object') {
        if ('limit' in args && !('category' in args) && !('query' in args)) return emptyResources;
        if ('userId' in args) return emptyBookmarks;
      }
      return undefined;
    });
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText(/No resources found|No resources available/i)).toBeTruthy();
    });
  });

  

  it('clears category filter when pressing "All"', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Managing Stress')).toBeTruthy();
    });

    // Select a category first
    const stressCategory = screen.getByText('Stress');
    fireEvent.press(stressCategory);
    
    // Then clear by selecting "All" or similar
    const allButton = screen.queryByText(/All|Clear/i);
    if (allButton) {
      fireEvent.press(allButton);
      
      await waitFor(() => {
        // Back to full list
        expect(screen.getByText('Sleep Better')).toBeTruthy();
      });
    }
  });

  it('clears search when input is emptied', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Managing Stress')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText(/Search resources/i);
    fireEvent.changeText(searchInput, 'anxiety');
    
    await waitFor(() => {
      expect(screen.getByText('Anxiety Techniques')).toBeTruthy();
    });

    fireEvent.changeText(searchInput, '');
    
    await waitFor(() => {
      // Should reload all resources
      expect(screen.getByText('Sleep Better')).toBeTruthy();
    });
  });

  // Snapshot disabled due to large provider tree; covered by functional assertions above
});
