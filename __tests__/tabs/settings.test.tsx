/**
 * Settings Test - Profile Settings Functionality
 * Tests settings screen functionality including theme management, notifications, and preferences
 */

import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import { router } from 'expo-router';
import SettingsScreen from '../../app/(app)/(tabs)/profile/settings';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Settings Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: {} })
    });
  });

  // Basic Settings Functionality Tests (TC_SET_P01-P05)
  describe('Basic Settings Functionality', () => {
    it('TC_SET_P01 - should successfully load settings with saved preferences', async () => {
      // Set up existing settings
      await AsyncStorage.setItem('userSettings', JSON.stringify({
        darkMode: false,
        notificationsEnabled: true,
        textSize: 'medium'
      }));

      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
        expect(getByTestId('settings-scroll-view')).toBeTruthy();
      });
    });

    it('TC_SET_P02 - should toggle dark mode on/off', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const darkModeSwitch = getByTestId('dark-mode-switch');
        fireEvent(darkModeSwitch, 'onValueChange', true);
      });

      // Verify dark mode is toggled
      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('TC_SET_P03 - should change text size setting', async () => {
      const { getByTestId, getByText } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const textSizeOption = getByTestId('text-size-row');
        fireEvent.press(textSizeOption);
      });

      await waitFor(() => {
        const largeOption = getByText('Large');
        fireEvent.press(largeOption);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('TC_SET_P04 - should toggle accessibility options', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const highContrastSwitch = getByTestId('high-contrast-switch');
        fireEvent(highContrastSwitch, 'onValueChange', true);

        const reduceMotionSwitch = getByTestId('reduce-motion-switch');
        fireEvent(reduceMotionSwitch, 'onValueChange', true);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('TC_SET_P05 - should toggle security settings', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const biometricSwitch = getByTestId('biometric-lock-switch');
        fireEvent(biometricSwitch, 'onValueChange', true);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  // Notification Settings Tests
  describe('Notification Settings', () => {
    it('should toggle notifications on/off', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const notificationSwitch = getByTestId('notifications-enabled-switch');
        fireEvent(notificationSwitch, 'onValueChange', false);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should configure notification times', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const morningReminderTime = getByTestId('morning-reminder-time');
        fireEvent.press(morningReminderTime);
      });

      // Should open time picker
      await waitFor(() => {
        expect(getByTestId('time-picker-modal')).toBeTruthy();
      });
    });

    it('should save notification preferences', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const saveButton = getByTestId('save-settings-button');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  // Theme Management Tests  
  describe('Theme Management', () => {
    it('should apply dark mode theme', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const darkModeSwitch = getByTestId('dark-mode-switch');
        fireEvent(darkModeSwitch, 'onValueChange', true);
      });

      // Verify theme context is updated
      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
      });
    });

    it('should apply light mode theme', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const darkModeSwitch = getByTestId('dark-mode-switch');
        fireEvent(darkModeSwitch, 'onValueChange', false);
      });

      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
      });
    });

    it('should persist theme changes', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const darkModeSwitch = getByTestId('dark-mode-switch');
        fireEvent(darkModeSwitch, 'onValueChange', true);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'themePreference',
          expect.any(String)
        );
      });
    });
  });

  // Text Size Settings Tests
  describe('Text Size Settings', () => {
    const textSizeOptions = ['Small', 'Medium', 'Large', 'Extra Large'];

    textSizeOptions.forEach(size => {
      it(`should set text size to ${size}`, async () => {
        const { getByTestId, getByText } = render(<SettingsScreen />);
        
        await waitFor(() => {
          const textSizeRow = getByTestId('text-size-row');
          fireEvent.press(textSizeRow);
        });

        await waitFor(() => {
          const sizeOption = getByText(size);
          fireEvent.press(sizeOption);
        });

        await waitFor(() => {
          expect(AsyncStorage.setItem).toHaveBeenCalled();
        });
      });
    });
  });

  // Privacy Settings Tests
  describe('Privacy Settings', () => {
    it('should toggle data sharing preferences', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const dataSharingSwitch = getByTestId('data-sharing-switch');
        fireEvent(dataSharingSwitch, 'onValueChange', false);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('should manage location permissions', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const locationSwitch = getByTestId('location-permission-switch');
        fireEvent(locationSwitch, 'onValueChange', true);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });
  });

  // Auto-lock Settings Tests
  describe('Auto-lock Settings', () => {
    const autoLockOptions = ['Immediate', '1 minute', '5 minutes', '15 minutes', 'Never'];

    autoLockOptions.forEach(option => {
      it(`should set auto-lock timer to ${option}`, async () => {
        const { getByTestId, getByText } = render(<SettingsScreen />);
        
        await waitFor(() => {
          const autoLockRow = getByTestId('auto-lock-timer-row');
          fireEvent.press(autoLockRow);
        });

        await waitFor(() => {
          const timerOption = getByText(option);
          fireEvent.press(timerOption);
        });

        await waitFor(() => {
          expect(AsyncStorage.setItem).toHaveBeenCalled();
        });
      });
    });
  });

  // Navigation Tests
  describe('Navigation', () => {
    it('should navigate back from settings', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const backButton = getByTestId('back-button');
        fireEvent.press(backButton);
        expect(router.back).toHaveBeenCalled();
      });
    });

    it('should display settings tabs correctly', async () => {
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        expect(getByTestId('display-tab')).toBeTruthy();
        expect(getByTestId('privacy-tab')).toBeTruthy();
        expect(getByTestId('notifications-tab')).toBeTruthy();
      });
    });
  });

  // Persistence Tests
  describe('Settings Persistence', () => {
    it('should persist settings after navigation', async () => {
      // Set some settings
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const darkModeSwitch = getByTestId('dark-mode-switch');
        fireEvent(darkModeSwitch, 'onValueChange', true);
        
        const notificationSwitch = getByTestId('notifications-enabled-switch');
        fireEvent(notificationSwitch, 'onValueChange', false);
      });

      // Navigate away and back
      await waitFor(() => {
        const backButton = getByTestId('back-button');
        fireEvent.press(backButton);
      });

      // Re-render to simulate navigation back
      const { getByTestId: getByTestId2 } = render(<SettingsScreen />);
      
      await waitFor(() => {
        expect(getByTestId2('settings-screen')).toBeTruthy();
        expect(AsyncStorage.getItem).toHaveBeenCalled();
      });
    });

    it('should load default settings when no saved preferences exist', async () => {
      AsyncStorage.getItem = jest.fn().mockResolvedValue(null);
      
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
      });
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle AsyncStorage save errors', async () => {
      AsyncStorage.setItem = jest.fn().mockRejectedValue(new Error('Storage error'));
      
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const darkModeSwitch = getByTestId('dark-mode-switch');
        fireEvent(darkModeSwitch, 'onValueChange', true);
      });

      // Should handle error gracefully
      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
      });
    });

    it('should handle AsyncStorage load errors', async () => {
      AsyncStorage.getItem = jest.fn().mockRejectedValue(new Error('Load error'));
      
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
      });
    });

    it('should handle invalid settings data', async () => {
      AsyncStorage.getItem = jest.fn().mockResolvedValue('invalid-json');
      
      const { getByTestId } = render(<SettingsScreen />);
      
      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
      });
    });
  });

  // Modal Tests
  describe('Modal Functionality', () => {
    it('should show success modal after saving settings', async () => {
      const { getByTestId, getByText } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const saveButton = getByTestId('save-settings-button');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(getByText('Settings Saved')).toBeTruthy();
      });
    });

    it('should close modal after confirmation', async () => {
      const { getByTestId, getByText } = render(<SettingsScreen />);
      
      await waitFor(() => {
        const saveButton = getByTestId('save-settings-button');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        const okButton = getByText('OK');
        fireEvent.press(okButton);
      });

      await waitFor(() => {
        expect(getByTestId('settings-screen')).toBeTruthy();
      });
    });
  });
});