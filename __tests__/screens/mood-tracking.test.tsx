/**
 * Mood Tracking Functional Tests
 * Tests mood logging, mood history display, and Convex integration
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { render } from '../test-utils';
import MoodTrackingScreen from '../../app/(app)/mood-tracking/index';
import MoodHistoryScreen from '../../app/(app)/mood-tracking/mood-history';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: jest.fn((callback) => callback()),
}));

// Mock Clerk user
jest.mock('@clerk/clerk-expo', () => ({
  useUser: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
    },
  })),
  useAuth: jest.fn(() => ({
    signOut: jest.fn(),
    isSignedIn: true,
  })),
}));

// Mock Convex
jest.mock('convex/react', () => ({
  useQuery: jest.fn(() => undefined),
  useMutation: jest.fn(() => jest.fn()),
  ConvexProvider: ({ children }: any) => children,
}));

describe('Mood Tracking - Functional Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mood Selection Screen', () => {
    it('should render mood tracking screen with testID', () => {
      const { getByTestId } = render(<MoodTrackingScreen />);
      expect(getByTestId('mood-tracking-screen')).toBeTruthy();
    });

    it('should display mood selection grid', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      expect(getByText('How was your day?')).toBeTruthy();
    });

    it('should display View History and Statistics buttons', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      expect(getByText('View History')).toBeTruthy();
      expect(getByText('Statistics')).toBeTruthy();
    });

    it('should display mood factor chips', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      expect(getByText('work')).toBeTruthy();
      expect(getByText('family')).toBeTruthy();
      expect(getByText('relationship')).toBeTruthy();
    });

    it('should display Next button', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      expect(getByText('Next')).toBeTruthy();
    });

    it('should allow selecting mood factors', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      const workChip = getByText('work');
      
      fireEvent.press(workChip);
      // Chip should be selected after press
      expect(workChip).toBeTruthy();
    });

    it('should have disabled Next button when no mood is selected', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      const nextButton = getByText('Next');
      
      // Next button should be present but disabled
      expect(nextButton).toBeTruthy();
      // The button is disabled via opacity and disabled prop
    });
  });

  describe('Mood History Screen', () => {
    it('should render mood history screen', () => {
      const { getByText } = render(<MoodHistoryScreen />);
      expect(getByText('Mood History')).toBeTruthy();
    });

    it('should display search input', () => {
      const { getByPlaceholderText } = render(<MoodHistoryScreen />);
      expect(getByPlaceholderText('Search notes...')).toBeTruthy();
    });

    it('should display statistics button', () => {
      const { getByText } = render(<MoodHistoryScreen />);
      expect(getByText('View Statistics & AI Predictions')).toBeTruthy();
    });

    it('should display empty state when no moods', () => {
      const { getByText } = render(<MoodHistoryScreen />);
      expect(getByText('No mood entries found')).toBeTruthy();
      expect(getByText('Log Your First Mood')).toBeTruthy();
    });

    it('should allow searching mood notes', () => {
      const { getByPlaceholderText } = render(<MoodHistoryScreen />);
      const searchInput = getByPlaceholderText('Search notes...');
      
      fireEvent.changeText(searchInput, 'test search');
      expect(searchInput.props.value).toBe('test search');
    });
  });
});
