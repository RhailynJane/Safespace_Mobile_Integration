/**
 * Announcements Screen Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import AnnouncementsScreen from '../../app/(app)/announcements';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { api } from '../../convex/_generated/api';

// Mock Convex
const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn(() => jest.fn(() => Promise.resolve(undefined)));
jest.mock('convex/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: (...args: any[]) => mockUseMutation(...args),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  ConvexReactClient: jest.fn(),
}));

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
}));

// Mock expo-router router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  },
}));

describe('Announcements Screen', () => {
  // Default mock state driven by query key, not call order
  let orgValue: any;
  let announcementsValue: any[];

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ userId: 'test-user-id' });
    (useUser as jest.Mock).mockReturnValue({
      user: {
        id: 'test-user-id',
        publicMetadata: { orgId: 'sait' },
      },
    });
    // Stable implementation by query key
    orgValue = 'sait';
    announcementsValue = [];
    mockUseQuery.mockImplementation((q: any, args: any) => {
      if (q === api.users.getMyOrg) return orgValue;
      // Match announcements query by args shape to avoid call-order issues
      if (args && typeof args === 'object' && 'orgId' in args && 'activeOnly' in args && 'limit' in args) {
        return { announcements: announcementsValue };
      }
      // Other queries used by providers/components can return undefined
      return undefined;
    });
  });

  it('renders title and stats with default empty state', async () => {
    render(<AnnouncementsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Announcements')).toBeTruthy();
    });

    // Stats header labels
    expect(screen.getByText('Organization')).toBeTruthy();
    expect(screen.getByText('Unread')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();

    // Empty state texts
    await waitFor(() => {
      expect(screen.getByText('No announcements yet')).toBeTruthy();
      expect(screen.getByText('Announcements from sait will appear here.')).toBeTruthy();
    });
  });

  it('renders list items and shows unread count', async () => {
    // Provide list data: one unread, one read
    announcementsValue = [
      { id: 'a1', title: 'Welcome to SAIT', body: 'Orientation details...', time: 'Today', readBy: [] },
      { id: 'a2', title: 'Campus Update', body: 'Library hours extended.', time: 'Yesterday', readBy: ['test-user-id'] },
    ];

    render(<AnnouncementsScreen />);

    // Titles should appear
    await waitFor(() => {
      expect(screen.getByText('Welcome to SAIT')).toBeTruthy();
      expect(screen.getByText('Campus Update')).toBeTruthy();
    });

    // Unread badge should be present for the first item
    expect(screen.getByText('NEW')).toBeTruthy();
  });

  it('toggles expand/collapse for an announcement body', async () => {
    announcementsValue = [
      { id: 'a1', title: 'Read Policy', body: 'This is a longer announcement body used for testing expand behavior.', time: 'Today', readBy: [] },
    ];

    render(<AnnouncementsScreen />);

    // Read more control should be visible
    const readMore = await screen.findByText('Read more ▼');
    fireEvent.press(readMore);

    // After expand, Show less should appear
    await waitFor(() => {
      expect(screen.getByText('Show less ▲')).toBeTruthy();
    });
  });
});
