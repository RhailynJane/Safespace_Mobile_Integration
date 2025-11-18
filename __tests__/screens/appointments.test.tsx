/**
 * Appointments Feature Functional Tests
 * Tests appointment booking, viewing, and management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import AppointmentsScreen from '../../app/(app)/(tabs)/appointments/index';
import { useAuth, useUser } from '@clerk/clerk-expo';

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(() => []),
  useMutation: jest.fn(() => jest.fn()),
  useConvex: jest.fn(() => ({
    query: jest.fn(() => Promise.resolve([])),
  })),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  ConvexReactClient: jest.fn(),
}));

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
}));

// Mock router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

describe('Appointments Screen - Main View', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      userId: 'test-user-id',
      isSignedIn: true,
      signOut: jest.fn(),
    });
    (useUser as jest.Mock).mockReturnValue({
      user: {
        id: 'test-user-id',
        firstName: 'John',
        fullName: 'John Doe',
        primaryEmailAddress: { emailAddress: 'john@example.com' },
      },
    });
  });

  it('should render the appointments screen with testID', async () => {
    render(<AppointmentsScreen />);
    await waitFor(() => {
      expect(screen.getByTestId('appointments-screen')).toBeTruthy();
    });
  });

  it('should display the page title "My Appointments"', async () => {
    render(<AppointmentsScreen />);
    await waitFor(() => {
      expect(screen.getByText('My Appointments')).toBeTruthy();
    });
  });

  it('should display upcoming and completed stats cards', async () => {
    render(<AppointmentsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Upcoming')).toBeTruthy();
      expect(screen.getByText('Completed')).toBeTruthy();
    });
  });

  it('should display the "Book New Session" button', async () => {
    render(<AppointmentsScreen />);
    await waitFor(() => {
      expect(screen.getByText('Book New Session')).toBeTruthy();
    });
  });

  it('should display "View All Appointments" button', async () => {
    render(<AppointmentsScreen />);
    await waitFor(() => {
      expect(screen.getByText('View All Appointments')).toBeTruthy();
    });
  });
});
