/**
 * Tab Test - Profile
 * Tests user profile functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import { router } from 'expo-router';
import ProfileScreen from '../../app/(app)/(tabs)/profile/index';

describe('Profile Tab', () => {
  const mockUserData = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    avatar: 'https://example.com/avatar.jpg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockUserData })
    });
  });

  it('should render without crashing', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('profile-screen')).toBeTruthy();
  });

  it('should display user information', async () => {
    const { getByText } = render(<ProfileScreen />);
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('john.doe@example.com')).toBeTruthy();
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
    const { getByText } = render(<ProfileScreen />);
    expect(getByText(/help.*support/i)).toBeTruthy();
  });

  it('should navigate to help & support', () => {
    const { getByTestId } = render(<ProfileScreen />);
    fireEvent.press(getByTestId('help-support-option'));
    expect(router.push).toHaveBeenCalledWith('/profile/help-support');
  });

  it('should show account statistics', async () => {
    const { getByText } = render(<ProfileScreen />);
    
    await waitFor(() => {
      expect(getByText(/mood entries/i)).toBeTruthy();
      expect(getByText(/journal entries/i)).toBeTruthy();
      expect(getByText(/appointments/i)).toBeTruthy();
    });
  });

  it('should display logout button', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('logout-button')).toBeTruthy();
  });

  it('should show confirmation dialog on logout', () => {
    const { getByTestId, getByText } = render(<ProfileScreen />);
    
    fireEvent.press(getByTestId('logout-button'));
    expect(getByText(/are you sure/i)).toBeTruthy();
  });

  it('should logout user when confirmed', async () => {
    const mockSignOut = jest.fn();
    const { getByTestId, getByText } = render(<ProfileScreen />);
    
    fireEvent.press(getByTestId('logout-button'));
    fireEvent.press(getByText('Confirm'));
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('should show privacy policy link', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText(/privacy policy/i)).toBeTruthy();
  });

  it('should show terms of service link', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText(/terms of service/i)).toBeTruthy();
  });

  it('should display app version', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText(/version/i)).toBeTruthy();
  });

  it('should allow avatar change', () => {
    const { getByTestId } = render(<ProfileScreen />);
    
    const avatarButton = getByTestId('change-avatar-button');
    fireEvent.press(avatarButton);
    
    expect(getByTestId('avatar-picker-modal')).toBeTruthy();
  });

  it('should handle profile load error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    const { getByText } = render(<ProfileScreen />);
    
    await waitFor(() => {
      expect(getByText(/error loading profile/i)).toBeTruthy();
    });
  });

  it('should refresh profile on pull to refresh', async () => {
    const { getByTestId } = render(<ProfileScreen />);
    
    const scrollView = getByTestId('profile-scroll-view');
    fireEvent(scrollView, 'refresh');
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should show preferences section', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText(/preferences/i)).toBeTruthy();
  });

  it('should display notification settings toggle', () => {
    const { getByTestId } = render(<ProfileScreen />);
    expect(getByTestId('notification-toggle')).toBeTruthy();
  });

  it('should match snapshot', () => {
    const tree = render(<ProfileScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
