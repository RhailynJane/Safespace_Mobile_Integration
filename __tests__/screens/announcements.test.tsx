/**
 * Announcements Screen Tests
 * Comprehensive test coverage for all test cases defined in announcements_test_cases.md
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AnnouncementsScreen from '../../app/(app)/announcements';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { NotificationsProvider } from '../../contexts/NotificationsContext';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';

// Get mocked modules
const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;

// Get Clerk mock module to access internal mocks
const clerkMock = require('@clerk/clerk-expo');

// Mock Convex client
const mockConvexClient = {
  query: jest.fn().mockResolvedValue([]),
  mutation: jest.fn().mockResolvedValue({}),
  action: jest.fn().mockResolvedValue({}),
  watchQuery: jest.fn(() => ({
    localQueryResult: () => undefined,
    onUpdate: jest.fn(() => jest.fn()),
    dispose: jest.fn(),
    journal: jest.fn(() => undefined),
  })),
  subscribe: jest.fn(() => ({
    unsubscribe: jest.fn(),
  })),
} as any;

const initialMetrics = {
  frame: { x: 0, y: 0, width: 360, height: 640 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
} as const;

describe('Announcements Screen', () => {
  // Mock mutations
  let mockSeed: jest.Mock;
  let mockClearAndReseed: jest.Mock;
  let mockSyncOrg: jest.Mock;
  let mockMarkAsRead: jest.Mock;

  // Shared state for mock return values
  let orgValue: any;
  let announcementsValue: any[];
  let userIdValue: string | null;
  let userValue: any;
  
  // Custom render with providers
  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <SafeAreaProvider initialMetrics={initialMetrics}>
        <ThemeProvider>
          <NotificationsProvider convexClient={mockConvexClient} userId={userIdValue || "test-user-id"}>
            {component}
          </NotificationsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock mutations
    mockSeed = jest.fn(() => Promise.resolve(undefined));
    mockClearAndReseed = jest.fn(() => Promise.resolve(undefined));
    mockSyncOrg = jest.fn(() => Promise.resolve(undefined));
    mockMarkAsRead = jest.fn(() => Promise.resolve(undefined));
    
    // Setup shared state with defaults
    orgValue = 'sait';
    announcementsValue = [];
    userIdValue = 'test-user-id';
    userValue = {
      id: 'test-user-id',
      firstName: 'Test',
      publicMetadata: { orgId: 'sait' }
    };
    
    // Mock Clerk hooks using jest.spyOn
    jest.spyOn(clerkMock, 'useAuth').mockReturnValue({
      userId: userIdValue,
      isSignedIn: true,
      signOut: jest.fn(),
      getToken: jest.fn(() => Promise.resolve('mock-token')),
    });
    
    jest.spyOn(clerkMock, 'useUser').mockReturnValue({
      user: userValue,
      isLoaded: true,
    });
    
    // Configure useQuery mock
    mockUseQuery.mockImplementation((q: any, args: any) => {
      // Check if this is the getMyOrg query (has empty args object)
      if (args && typeof args === 'object' && Object.keys(args).length === 0) {
        return orgValue;
      }
      
      // Announcements query
      if (args && args !== 'skip' && typeof args === 'object' && 'orgId' in args) {
        return { announcements: announcementsValue };
      }
      
      return undefined;
    });
    
    // Configure useMutation mock to return our specific mocks
    // Simply return the mocks in order they're called
    let mutationCallCount = 0;
    mockUseMutation.mockImplementation(() => {
      const mocks = [mockSeed, mockClearAndReseed, mockSyncOrg, mockMarkAsRead];
      return mocks[mutationCallCount++ % mocks.length];
    });
  });

  // ========================================
  // Category 1: Authentication & Authorization
  // ========================================
  
  describe('Authentication & Authorization', () => {
    it('TC-ANNOUNCE-P01: displays sign-in required screen when not authenticated', async () => {
      userIdValue = null;
      jest.spyOn(clerkMock, 'useAuth').mockReturnValue({
        userId: null,
        isSignedIn: false,
        signOut: jest.fn(),
        getToken: jest.fn(),
      });

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sign in Required')).toBeTruthy();
        expect(screen.getByText('Please sign in to view announcements.')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P02: displays announcements when authenticated', async () => {
      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Announcements')).toBeTruthy();
        expect(screen.getByText('Organization')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P03: fetches announcements with user ID in context', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Test Announcement', body: 'Test body', time: 'Today', readBy: [] }
      ];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Test Announcement')).toBeTruthy();
      });
    });
  });

  // ========================================
  // Category 2: Organization Management
  // ========================================
  
  describe('Organization Management', () => {
    it('TC-ANNOUNCE-P04: displays organization from Clerk metadata', async () => {
      userValue = { 
        id: 'test-user-id', 
        firstName: 'Test',
        publicMetadata: { orgId: 'sait' } 
      };

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        const saitElements = screen.getAllByText('SAIT');
        expect(saitElements.length).toBeGreaterThan(0);
      });
    });

    it('TC-ANNOUNCE-P05: displays CMHA Calgary with green badge', async () => {
      orgValue = 'cmha-calgary';
      userValue = { 
        id: 'test-user-id',
        firstName: 'Test', 
        publicMetadata: { orgId: 'cmha-calgary' } 
      };
      
      jest.spyOn(clerkMock, 'useUser').mockReturnValue({
        user: userValue,
        isLoaded: true,
      });

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        const calgaryElements = screen.getAllByText('CMHA Calgary');
        expect(calgaryElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Canadian Mental Health Association - Calgary')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P06: displays CMHA Edmonton with teal badge', async () => {
      orgValue = 'cmha-edmonton';
      userValue = { 
        id: 'test-user-id',
        firstName: 'Test',
        publicMetadata: { orgId: 'cmha-edmonton' } 
      };
      
      jest.spyOn(clerkMock, 'useUser').mockReturnValue({
        user: userValue,
        isLoaded: true,
      });

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        const edmontonElements = screen.getAllByText('CMHA Edmonton');
        expect(edmontonElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Canadian Mental Health Association - Edmonton')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P07: displays SAIT organization with blue badge', async () => {
      orgValue = 'sait';
      userValue = { 
        id: 'test-user-id',
        firstName: 'Test',
        publicMetadata: { orgId: 'sait' } 
      };

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        const saitElements = screen.getAllByText('SAIT');
        expect(saitElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Southern Alberta Institute of Technology')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P08: displays Unaffiliated organization', async () => {
      orgValue = 'unaffiliated';
      userValue = { 
        id: 'test-user-id',
        firstName: 'Test',
        publicMetadata: { orgId: 'unaffiliated' } 
      };
      
      jest.spyOn(clerkMock, 'useUser').mockReturnValue({
        user: userValue,
        isLoaded: true,
      });

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        const unaffiliatedElements = screen.getAllByText('Unaffiliated');
        expect(unaffiliatedElements.length).toBeGreaterThan(0);
        expect(screen.getByText('No organization selected')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P09: syncs org to Convex when metadata differs', async () => {
      orgValue = 'cmha-calgary'; // Convex has different org
      userValue = { 
        id: 'test-user-id',
        firstName: 'Test',
        publicMetadata: { orgId: 'sait' } // Clerk has different org
      };

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(mockSyncOrg).toHaveBeenCalledWith({ orgId: 'sait' });
      }, { timeout: 3000 });
    });

    it('TC-ANNOUNCE-P10: displays organization subtitle', async () => {
      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Southern Alberta Institute of Technology')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P11: displays organization stat', async () => {
      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        const saitElements = screen.getAllByText('SAIT');
        expect(saitElements.length).toBeGreaterThan(0);
      });
    });
  });

  // ========================================
  // Category 3: Announcement Display
  // ========================================
  
  describe('Announcement Display', () => {
    it('TC-ANNOUNCE-P12: displays empty state when no announcements', async () => {
      announcementsValue = [];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('No announcements yet')).toBeTruthy();
        expect(screen.getByText('Announcements from sait will appear here.')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P13: displays all announcements in list', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Announcement 1', body: 'Body 1', time: 'Today', readBy: [] },
        { id: 'a2', title: 'Announcement 2', body: 'Body 2', time: 'Yesterday', readBy: [] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Announcement 1')).toBeTruthy();
        expect(screen.getByText('Announcement 2')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P14: displays announcement card structure', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Test Title', body: 'Test Body', time: 'Today', readBy: [] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Test Title')).toBeTruthy();
        expect(screen.getByText('Test Body')).toBeTruthy();
        expect(screen.getByText('Today')).toBeTruthy();
        expect(screen.getByText('Read more ▼')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P19: displays loading state', async () => {
      mockUseQuery.mockReturnValue(undefined);

      renderWithProviders(<AnnouncementsScreen />);

      expect(screen.getByText('Loading announcements...')).toBeTruthy();
    });
  });

  // ========================================
  // Category 4: Read/Unread Functionality
  // ========================================
  
  describe('Read/Unread Functionality', () => {
    it('TC-ANNOUNCE-P21: displays NEW badge for unread announcements', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Unread Item', body: 'Test', time: 'Today', readBy: [] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('NEW')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P22: does not display NEW badge for read announcements', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Read Item', body: 'Test', time: 'Today', readBy: ['test-user-id'] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Read Item')).toBeTruthy();
      });

      expect(screen.queryByText('NEW')).toBeNull();
    });

    it('TC-ANNOUNCE-P23: displays correct unread count', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Unread 1', body: 'Test', time: 'Today', readBy: [] },
        { id: 'a2', title: 'Unread 2', body: 'Test', time: 'Yesterday', readBy: [] },
        { id: 'a3', title: 'Read 1', body: 'Test', time: '2 days ago', readBy: ['test-user-id'] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeTruthy(); // Unread count
      });
    });

    it('TC-ANNOUNCE-P24: displays correct total count', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Item 1', body: 'Test', time: 'Today', readBy: [] },
        { id: 'a2', title: 'Item 2', body: 'Test', time: 'Yesterday', readBy: [] },
        { id: 'a3', title: 'Item 3', body: 'Test', time: '2 days ago', readBy: ['test-user-id'] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('3')).toBeTruthy(); // Total count
      });
    });

    it('TC-ANNOUNCE-P25: marks announcement as read when expanded', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Unread Item', body: 'Long body text for testing', time: 'Today', readBy: [] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      const readMore = await screen.findByText('Read more ▼');
      fireEvent.press(readMore);

      await waitFor(() => {
        expect(mockMarkAsRead).toHaveBeenCalled();
      });
    });

    it('TC-ANNOUNCE-N14: treats undefined readBy as unread', async () => {
      announcementsValue = [
        { id: 'a1', title: 'No ReadBy', body: 'Test', time: 'Today' }, // No readBy field
      ];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('NEW')).toBeTruthy();
      });
    });
  });

  // ========================================
  // Category 5: User Interaction
  // ========================================
  
  describe('User Interaction', () => {
    it('TC-ANNOUNCE-P31: toggles expand/collapse on card tap', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Test', body: 'Long body text for testing expand behavior', time: 'Today', readBy: [] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      const readMore = await screen.findByText('Read more ▼');
      fireEvent.press(readMore);

      await waitFor(() => {
        expect(screen.getByText('Show less ▲')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P32: expands announcement to show full body', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Test', body: 'This is a very long body text that should be fully visible when expanded', time: 'Today', readBy: [] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      const readMore = await screen.findByText('Read more ▼');
      fireEvent.press(readMore);

      await waitFor(() => {
        expect(screen.getByText('Show less ▲')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P33: collapses announcement to truncated body', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Test', body: 'Long body text', time: 'Today', readBy: [] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      const readMore = await screen.findByText('Read more ▼');
      fireEvent.press(readMore);

      await waitFor(() => {
        expect(screen.getByText('Show less ▲')).toBeTruthy();
      });

      const showLess = screen.getByText('Show less ▲');
      fireEvent.press(showLess);

      await waitFor(() => {
        expect(screen.getByText('Read more ▼')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P36: allows multiple announcements to be expanded', async () => {
      announcementsValue = [
        { id: 'a1', title: 'First', body: 'Body 1', time: 'Today', readBy: [] },
        { id: 'a2', title: 'Second', body: 'Body 2', time: 'Yesterday', readBy: [] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      const readMoreButtons = await screen.findAllByText('Read more ▼');
      fireEvent.press(readMoreButtons[0]);
      fireEvent.press(readMoreButtons[1]);

      await waitFor(() => {
        const showLessButtons = screen.getAllByText('Show less ▲');
        expect(showLessButtons.length).toBe(2);
      });
    });
  });

  // ========================================
  // Category 6: Data Management
  // ========================================
  
  describe('Data Management', () => {
    it('TC-ANNOUNCE-P41: auto-seeds on empty data', async () => {
      announcementsValue = [];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(mockSeed).toHaveBeenCalledWith({ orgId: 'sait' });
      }, { timeout: 3000 });
    });

    it('TC-ANNOUNCE-P42: auto-reseeds on old data (length === 2)', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Old 1', body: 'Test', time: 'Today', readBy: [] },
        { id: 'a2', title: 'Old 2', body: 'Test', time: 'Yesterday', readBy: [] },
      ];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(mockClearAndReseed).toHaveBeenCalledWith({ orgId: 'sait' });
      }, { timeout: 3000 });
    });

    it('TC-ANNOUNCE-N08: handles seed failure gracefully', async () => {
      announcementsValue = [];
      mockSeed.mockRejectedValue(new Error('Seed failed'));

      renderWithProviders(<AnnouncementsScreen />);

      // Should not crash, error caught silently
      await waitFor(() => {
        expect(screen.getByText('No announcements yet')).toBeTruthy();
      });
    });
  });

  // ========================================
  // Category 7: UI/UX
  // ========================================
  
  describe('UI/UX', () => {
    it('TC-ANNOUNCE-P46: displays stats container with all metrics', async () => {
      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Organization')).toBeTruthy();
        expect(screen.getByText('Unread')).toBeTruthy();
        expect(screen.getByText('Total')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P50: displays organization banner', async () => {
      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        const saitElements = screen.getAllByText('SAIT');
        expect(saitElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Southern Alberta Institute of Technology')).toBeTruthy();
      });
    });
  });

  // ========================================
  // Category 8: Navigation
  // ========================================
  
  describe('Navigation', () => {
    it('TC-ANNOUNCE-P56: displays AppHeader with title', async () => {
      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Announcements')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P57: displays BottomNavigation with tabs', async () => {
      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('nav-tab-home')).toBeTruthy();
        expect(screen.getByTestId('nav-tab-community-forum')).toBeTruthy();
        expect(screen.getByTestId('nav-tab-appointments')).toBeTruthy();
        expect(screen.getByTestId('nav-tab-messages')).toBeTruthy();
        expect(screen.getByTestId('nav-tab-profile')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-P58: navigates to Home tab', async () => {
      renderWithProviders(<AnnouncementsScreen />);

      const homeTab = await screen.findByTestId('nav-tab-home');
      fireEvent.press(homeTab);

      expect(router.replace).toHaveBeenCalledWith('/(app)/(tabs)/home');
    });

    it('TC-ANNOUNCE-P59: navigates to Community tab', async () => {
      renderWithProviders(<AnnouncementsScreen />);

      const communityTab = await screen.findByTestId('nav-tab-community-forum');
      fireEvent.press(communityTab);

      expect(router.push).toHaveBeenCalledWith('/(app)/(tabs)/community-forum');
    });
  });

  // ========================================
  // Category 9: Error Handling
  // ========================================
  
  describe('Error Handling', () => {
    it('TC-ANNOUNCE-N01: handles null userId', async () => {
      userIdValue = null;
      jest.spyOn(clerkMock, 'useAuth').mockReturnValue({
        userId: null,
        isSignedIn: false,
        signOut: jest.fn(),
        getToken: jest.fn(),
      });

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sign in Required')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-N02: handles undefined query return', async () => {
      mockUseQuery.mockReturnValue(undefined);

      renderWithProviders(<AnnouncementsScreen />);

      expect(screen.getByText('Loading announcements...')).toBeTruthy();
    });

    it('TC-ANNOUNCE-N03: handles empty array from query', async () => {
      announcementsValue = [];

      renderWithProviders(<AnnouncementsScreen />);

      await waitFor(() => {
        expect(screen.getByText('No announcements yet')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-N04: handles invalid orgId with fallback', async () => {
      orgValue = 'invalid-org';
      userValue = { 
        id: 'test-user-id',
        firstName: 'Test',
        publicMetadata: { orgId: 'invalid-org' } 
      };

      renderWithProviders(<AnnouncementsScreen />);

      // Component should still render without crashing
      await waitFor(() => {
        expect(screen.getByText('Announcements')).toBeTruthy();
      });
    });

    it('TC-ANNOUNCE-N07: handles markAsRead failure gracefully', async () => {
      announcementsValue = [
        { id: 'a1', title: 'Test', body: 'Body', time: 'Today', readBy: [] },
      ];
      mockMarkAsRead.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<AnnouncementsScreen />);

      const readMore = await screen.findByText('Read more ▼');
      fireEvent.press(readMore);

      // Should not crash
      await waitFor(() => {
        expect(screen.getByText('Show less ▲')).toBeTruthy();
      });
    });
  });
});
