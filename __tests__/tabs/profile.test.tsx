/**
 * Tab Test - Profile
 * Tests user profile functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import { router } from 'expo-router';
import ProfileScreen from '../../app/(app)/(tabs)/profile/index';

describe('Profile Tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });
  });

  it('should render without crashing', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('profile-screen')).toBeTruthy();
  });

  it('should display user information', async () => {
    const { getByText } = render(<ProfileScreen />);
    await waitFor(() => {
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
    });
  });

  it('should display user avatar', async () => {
    const { getByTestId } = render(<ProfileScreen />);
    
    await waitFor(() => {
      expect(getByTestId('user-avatar')).toBeTruthy();
    });
  });

  it('should show edit profile button', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('edit-profile-button')).toBeTruthy();
  });

  it('should navigate to edit profile screen', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('edit-profile-button'));
    expect(router.push).toHaveBeenCalledWith('/profile/edit');
  });

  it('should display settings option', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('settings-option')).toBeTruthy();
  });

  it('should navigate to settings screen', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('settings-option'));
    expect(router.push).toHaveBeenCalledWith('/profile/settings');
  });

  it('should display help & support option', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('help-support-option')).toBeTruthy();
  });

  it('should navigate to help & support', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('help-support-option'));
    expect(router.push).toHaveBeenCalledWith('/profile/help-support');
  });

  it('should show activity summary KPIs', async () => {
    const { getByText } = render(<ProfileScreen />);
    await waitFor(() => {
      expect(getByText('Journals this week')).toBeTruthy();
      expect(getByText('Upcoming appointments')).toBeTruthy();
      expect(getByText('My posts')).toBeTruthy();
      expect(getByText('Mood check-ins')).toBeTruthy();
    });
  });

  it('should display logout button', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('logout-button')).toBeTruthy();
  });

  it('should show success modal on logout', async () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('logout-button'));
    await waitFor(() => {
      expect(getByText('Signed Out')).toBeTruthy();
    });
  });

  // Removed legacy assertions not present in the current Profile UI
});
