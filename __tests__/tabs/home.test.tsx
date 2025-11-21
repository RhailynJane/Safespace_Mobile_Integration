/**
 * Tab Test - Home
 * Tests the home/dashboard screen functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import { router } from 'expo-router';
import HomeScreen from '../../app/(app)/(tabs)/home';

describe('Home Tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });
  });

  it('should render without crashing', async () => {
    const { getByTestId } = render(<HomeScreen />);
    // Wait for initial async effects to complete
    await waitFor(() => expect(getByTestId('home-screen')).toBeTruthy());
  });

  it('should display welcome message', async () => {
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => expect(getByText(/how are you feeling today/i)).toBeTruthy());
  });

  it('should show user greeting with name', async () => {
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText(/good (morning|afternoon|evening)/i)).toBeTruthy();
    });
  });

  it('should display quick access cards', async () => {
    const { getByTestId } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByTestId('quick-access-mood')).toBeTruthy();
      expect(getByTestId('quick-access-journal')).toBeTruthy();
      expect(getByTestId('quick-access-resources')).toBeTruthy();
    });
  });

  it('should navigate to mood tracking when card pressed', async () => {
    const { getByTestId } = render(<HomeScreen />);
    fireEvent.press(getByTestId('quick-access-mood'));
    expect(router.push).toHaveBeenCalledWith('/mood-tracking');
  });

  // The current Home screen doesn't render a dedicated daily quote widget; quick actions cover content
  it('should render the Quick Actions section title', async () => {
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => expect(getByText(/quick actions/i)).toBeTruthy());
  });

  it('should render scroll view', async () => {
    const { getByTestId } = render(<HomeScreen />);
    await waitFor(() => expect(getByTestId('home-scroll-view')).toBeTruthy());
  });

  it('should show Recommended For You section', async () => {
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText(/Recommended For You/i)).toBeTruthy();
    });
  });

  it('should show crisis support button prominently', async () => {
    const { getByTestId } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByTestId('crisis-support-button')).toBeTruthy();
    });
  });

  it('should navigate to crisis support immediately when pressed', async () => {
    const { getByTestId } = render(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByTestId('crisis-support-button')).toBeTruthy();
    });
    
    fireEvent.press(getByTestId('crisis-support-button'));
    expect(router.push).toHaveBeenCalledWith('/crisis-support');
  });

  it('should show empty state when no resources available', async () => {
    const { getByText } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByText(/no resources available/i)).toBeTruthy();
    });
  });
});
