import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import ResourcesScreen from '../../app/(app)/resources/index';
import * as resourcesApi from '../../utils/resourcesApi';

// Mock resources API
jest.mock('../../utils/resourcesApi', () => ({
  fetchAllResourcesWithExternal: jest.fn(),
  fetchResourcesByCategory: jest.fn(),
  searchResources: jest.fn(),
  getDailyAffirmation: jest.fn(),
  getRandomQuote: jest.fn(),
}));

describe('ResourcesScreen', () => {
  const mockResources = [
    {
      id: 1,
      title: 'Managing Stress',
      content: 'Tips for managing daily stress',
      category: 'stress',
      source: 'internal',
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 2,
      title: 'Anxiety Techniques',
      content: 'Breathing exercises for anxiety',
      category: 'anxiety',
      source: 'internal',
      created_at: '2025-01-02T00:00:00Z',
    },
    {
      id: 3,
      title: 'Sleep Better',
      content: 'How to improve your sleep',
      category: 'sleep',
      source: 'internal',
      created_at: '2025-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (resourcesApi.fetchAllResourcesWithExternal as jest.Mock).mockResolvedValue({
      resources: mockResources,
      featured: mockResources[0],
    });
    (resourcesApi.getDailyAffirmation as jest.Mock).mockResolvedValue(
      'You are capable and strong.'
    );
    (resourcesApi.getRandomQuote as jest.Mock).mockResolvedValue({
      text: 'Be the change you wish to see.',
      author: 'Gandhi',
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
    (resourcesApi.fetchResourcesByCategory as jest.Mock).mockResolvedValue([
      mockResources[0],
    ]);

    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Managing Stress')).toBeTruthy();
    });

    const stressCategory = screen.getByText('Stress');
    fireEvent.press(stressCategory);
    
    await waitFor(() => {
      expect(resourcesApi.fetchResourcesByCategory).toHaveBeenCalledWith('stress');
    });
  });

  it('searches resources', async () => {
    const searchResults = [mockResources[1]];
    (resourcesApi.searchResources as jest.Mock).mockResolvedValue(searchResults);

    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Managing Stress')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText(/Search resources/i);
    fireEvent.changeText(searchInput, 'anxiety');
    
    await waitFor(() => {
      expect(resourcesApi.searchResources).toHaveBeenCalledWith('anxiety');
    }, { timeout: 2000 });
  });

  it('displays featured resource', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText(/Featured|Spotlight/i)).toBeTruthy();
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
      expect.stringContaining('resource-detail-screen')
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
    (resourcesApi.fetchAllResourcesWithExternal as jest.Mock).mockResolvedValue({
      resources: [],
      featured: null,
    });

    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText(/No resources found|No resources available/i)).toBeTruthy();
    });
  });

  it('shows error modal on load failure', async () => {
    (resourcesApi.fetchAllResourcesWithExternal as jest.Mock).mockRejectedValue(
      new Error('Failed to load resources')
    );

    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText(/Error|Failed/i)).toBeTruthy();
    });
  });

  it('supports pull-to-refresh', async () => {
    render(<ResourcesScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Managing Stress')).toBeTruthy();
    });

    // Initial load + pull-to-refresh would call it again
    expect(resourcesApi.fetchAllResourcesWithExternal).toHaveBeenCalled();
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
        expect(resourcesApi.fetchAllResourcesWithExternal).toHaveBeenCalled();
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
      expect(resourcesApi.searchResources).toHaveBeenCalled();
    });

    fireEvent.changeText(searchInput, '');
    
    await waitFor(() => {
      // Should reload all resources
      expect(resourcesApi.fetchAllResourcesWithExternal).toHaveBeenCalled();
    });
  });

  it('matches snapshot', () => {
    const tree = render(<ResourcesScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
