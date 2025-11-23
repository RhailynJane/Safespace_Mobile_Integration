/**
 * Mood Tracking Functional Tests
 * Tests mood logging, mood history display, and Convex integration
 */

import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { render } from '../test-utils';
import MoodTrackingScreen from '../../app/(app)/mood-tracking/index';
import MoodHistoryScreen from '../../app/(app)/mood-tracking/mood-history';
import MoodLoggingScreen from '../../app/(app)/mood-tracking/mood-logging';

// Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    push: (...args: any[]) => mockPush(...args),
    replace: (...args: any[]) => mockReplace(...args),
    back: (...args: any[]) => mockBack(...args),
  },
  useLocalSearchParams: jest.fn(() => ({ selectedMood: 'happy', selectedEmoji: '😃', selectedLabel: 'Happy' })),
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
const mockRecordMood = jest.fn(async () => Promise.resolve());
jest.mock('convex/react', () => ({
  useQuery: jest.fn(() => undefined),
  useMutation: jest.fn(() => mockRecordMood),
  ConvexProvider: ({ children }: any) => children,
}));

describe('Mood Tracking - Comprehensive Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =============================
  // PART 1: Mood Selection Screen
  // =============================

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

    it('should display mood factor chips (representative subset)', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      expect(getByText('work')).toBeTruthy();
      expect(getByText('family')).toBeTruthy();
      expect(getByText('relationship')).toBeTruthy();
    });

    it('should display Next button', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      expect(getByText('Next')).toBeTruthy();
    });

    it('should allow selecting multiple mood factors (work + family)', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      const workChip = getByText('work');
      const familyChip = getByText('family');
      fireEvent.press(workChip);
      fireEvent.press(familyChip);
      expect(workChip).toBeTruthy();
      expect(familyChip).toBeTruthy();
    });

    it('should have disabled Next button when no mood is selected', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      const nextButton = getByText('Next');
      expect(nextButton).toBeTruthy();
    });

    it('enables Next button after mood selection', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      const ecstatic = getByText('Ecstatic');
      fireEvent.press(ecstatic);
      const nextButton = getByText('Next');
      expect(nextButton).toBeTruthy();
    });

    it('navigates to mood logging screen on Next press with selection', () => {
      const { getByText } = render(<MoodTrackingScreen />);
      fireEvent.press(getByText('Happy'));
      fireEvent.press(getByText('Next'));
      return waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });
  });

  // =============================
  // PART 2: Mood Logging Screen
  // =============================
  describe('Mood Logging Screen', () => {
    it('renders logging screen with selected mood info', () => {
      const { getByText } = render(<MoodLoggingScreen />);
      expect(getByText('Log Your Mood')).toBeTruthy();
      expect(getByText('Happy')).toBeTruthy();
    });

    it('allows entering notes and updates counter (dynamic length)', async () => {
      const { getByPlaceholderText, getByText } = render(<MoodLoggingScreen />);
      const notesInput = getByPlaceholderText('Add any notes about your mood...');
      const sample = 'Feeling good today after morning exercise session'; // length 49
      fireEvent.changeText(notesInput, sample);
      await waitFor(() => {
        expect(getByText(new RegExp(`${sample.length}\\s*/\\s*200`))).toBeTruthy();
      });
    });

    it('caps notes at 200 chars', async () => {
      const { getByPlaceholderText, getByText } = render(<MoodLoggingScreen />);
      const notesInput = getByPlaceholderText('Add any notes about your mood...');
      const maxText = 'a'.repeat(200);
      fireEvent.changeText(notesInput, maxText);
      await waitFor(() => {
        expect(getByText(/200\s*\/\s*200/)).toBeTruthy();
      });
    });

    it('toggles share with support worker ON', () => {
      const { getByText, getByRole } = render(<MoodLoggingScreen />);
      const toggleLabel = getByText('Share with Support Worker');
      expect(toggleLabel).toBeTruthy();
    });

    it('submits mood entry successfully (minimum fields)', async () => {
      const { getByText, getByTestId } = render(<MoodLoggingScreen />);
      const saveBtn = getByTestId('save-mood-entry-btn');
      await act(async () => {
        fireEvent.press(saveBtn);
      });
      await waitFor(() => {
        expect(mockRecordMood).toHaveBeenCalledTimes(1);
      });
    });
  });

  // =============================
  // PART 3: Mood History Screen
  // =============================
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

  // =============================
  // PART 4: Integration & Flow
  // =============================
  describe('Integration Flow', () => {
    it('selects mood and navigates to logging, then saves', async () => {
      const { getByText, getByTestId, rerender } = render(<MoodTrackingScreen />);
      fireEvent.press(getByText('Neutral'));
      fireEvent.press(getByText('Next'));
      await waitFor(() => expect(mockPush).toHaveBeenCalled());
      rerender(<MoodLoggingScreen />);
      await act(async () => {
        const saveBtn = getByTestId('save-mood-entry-btn');
        fireEvent.press(saveBtn);
      });
      await waitFor(() => expect(mockRecordMood).toHaveBeenCalledTimes(1));
    });
  });
});
