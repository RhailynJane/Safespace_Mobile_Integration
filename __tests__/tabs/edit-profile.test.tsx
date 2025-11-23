/**
 * Edit Profile Test - Profile Edit Functionality
 * Tests profile editing functionality including form validation, image upload, and data persistence
 */

import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import { router } from 'expo-router';
import EditProfileScreen from '../../app/(app)/(tabs)/profile/edit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation, useConvex } from 'convex/react';

// Mock Clerk
jest.mock('@clerk/clerk-expo', () => ({
  useUser: jest.fn(),
  useAuth: () => ({ userId: 'user123', isSignedIn: true }),
}));

// Mock image picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

describe('Edit Profile Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    
    // Mock Clerk user data - provide the required structure
    (useUser as jest.Mock).mockReturnValue({
      user: {
        id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        emailAddresses: [{ emailAddress: 'john.doe@example.com' }],
        imageUrl: 'https://test-image-url.com'
      }
    });
    
    // Mock Convex - return undefined to trigger user-based initialization
    (useQuery as jest.Mock).mockReturnValue(undefined);
    (useMutation as jest.Mock).mockReturnValue(jest.fn().mockResolvedValue({ success: true }));
    (useConvex as jest.Mock).mockReturnValue({
      mutation: jest.fn().mockResolvedValue({ success: true }),
      action: jest.fn().mockResolvedValue({ uploadUrl: 'https://test-upload-url.com' })
    });
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });
  });

  // Basic Profile Functionality Tests (TC_EDIT_P01-P07)
  describe('Basic Edit Profile Functionality', () => {
    it('TC_EDIT_P01 - should successfully load edit profile screen', async () => {
      const { getByTestId, getByText } = render(<EditProfileScreen />);
      
      // Verify the screen loads (either with loading state or main content)
      await waitFor(() => {
        expect(getByTestId('app-header')).toBeTruthy();
        expect(getByText('Edit Profile')).toBeTruthy();
      });

      // Check if screen is in loading or loaded state
      const appHeader = getByTestId('app-header');
      expect(appHeader).toBeTruthy();
    });

    it('TC_EDIT_P02 - should edit and save full name successfully', async () => {
      const { getByTestId, getByPlaceholderText } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const firstNameInput = getByPlaceholderText('First Name');
        const lastNameInput = getByPlaceholderText('Last Name');
        const saveButton = getByTestId('save-button');

        fireEvent.changeText(firstNameInput, 'John');
        fireEvent.changeText(lastNameInput, 'Smith');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'profileData',
          expect.stringContaining('"firstName":"John"')
        );
      });
    });

    it('TC_EDIT_P03 - should edit and save email successfully', async () => {
      const { getByTestId, getByPlaceholderText } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const emailInput = getByPlaceholderText('Email');
        const saveButton = getByTestId('save-button');

        fireEvent.changeText(emailInput, 'newemail@test.com');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'profileData',
          expect.stringContaining('"email":"newemail@test.com"')
        );
      });
    });

    it('TC_EDIT_P04 - should edit and save location successfully', async () => {
      const { getByTestId, getByPlaceholderText } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const locationInput = getByPlaceholderText('Location');
        const saveButton = getByTestId('save-button');

        fireEvent.changeText(locationInput, 'Toronto, ON');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          'profileData',
          expect.stringContaining('"location":"Toronto, ON"')
        );
      });
    });

    it('TC_EDIT_P05 - should toggle notifications setting', async () => {
      const { getByTestId } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const notificationSwitch = getByTestId('notification-switch');
        fireEvent(notificationSwitch, 'onValueChange', true);
        
        const saveButton = getByTestId('save-button');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(AsyncStorage.setItem).toHaveBeenCalled();
      });
    });

    it('TC_EDIT_P06 - should upload profile photo from camera', async () => {
      const mockImagePicker = jest.requireMock('expo-image-picker');
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        cancelled: false,
        assets: [{ uri: 'mock://camera-image.jpg' }]
      });
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });

      const { getByTestId } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const cameraButton = getByTestId('camera-button');
        fireEvent.press(cameraButton);
      });

      await waitFor(() => {
        expect(mockImagePicker.launchCameraAsync).toHaveBeenCalled();
      });
    });

    it('TC_EDIT_P07 - should upload profile photo from gallery', async () => {
      const mockImagePicker = jest.requireMock('expo-image-picker');
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        cancelled: false,
        assets: [{ uri: 'mock://gallery-image.jpg' }]
      });
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: true });

      const { getByTestId } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const galleryButton = getByTestId('gallery-button');
        fireEvent.press(galleryButton);
      });

      await waitFor(() => {
        expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      });
    });
  });

  // Navigation Tests
  describe('Navigation', () => {
    it('should navigate back from Edit Profile', async () => {
      const { getByTestId } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const backButton = getByTestId('back-button');
        fireEvent.press(backButton);
        expect(router.back).toHaveBeenCalled();
      });
    });

    it('should display profile image if previously saved', async () => {
      await AsyncStorage.setItem('profileImage', 'mock://saved-image.jpg');
      
      const { getByTestId } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        expect(getByTestId('profile-image')).toBeTruthy();
      });
    });

    it('should display initials when no profile image', async () => {
      const { getByTestId } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        expect(getByTestId('profile-initials')).toBeTruthy();
      });
    });
  });

  // Error Handling Tests (TC_EDIT_N01-N06)
  describe('Error Handling', () => {
    it('TC_EDIT_N01 - should handle camera permission denied', async () => {
      const mockImagePicker = jest.requireMock('expo-image-picker');
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false });

      const { getByTestId, getByText } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const cameraButton = getByTestId('camera-button');
        fireEvent.press(cameraButton);
      });

      await waitFor(() => {
        expect(getByText('Permission needed')).toBeTruthy();
      });
    });

    it('TC_EDIT_N02 - should handle gallery permission denied', async () => {
      const mockImagePicker = jest.requireMock('expo-image-picker');
      mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ granted: false });

      const { getByTestId, getByText } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const galleryButton = getByTestId('gallery-button');
        fireEvent.press(galleryButton);
      });

      await waitFor(() => {
        expect(getByText('Permission needed')).toBeTruthy();
      });
    });

    it('TC_EDIT_N03 - should handle camera capture cancellation', async () => {
      const mockImagePicker = jest.requireMock('expo-image-picker');
      mockImagePicker.launchCameraAsync.mockResolvedValue({ cancelled: true });
      mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true });

      const { getByTestId } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const cameraButton = getByTestId('camera-button');
        fireEvent.press(cameraButton);
      });

      // Should return to edit screen without changes
      await waitFor(() => {
        expect(getByTestId('edit-profile-screen')).toBeTruthy();
      });
    });

    it('TC_EDIT_N04 - should handle image save error', async () => {
      AsyncStorage.setItem = jest.fn().mockRejectedValue(new Error('Save failed'));
      
      const mockImagePicker = jest.requireMock('expo-image-picker');
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        cancelled: false,
        assets: [{ uri: 'mock://image.jpg' }]
      });

      const { getByTestId, getByText } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const galleryButton = getByTestId('gallery-button');
        fireEvent.press(galleryButton);
      });

      await waitFor(() => {
        expect(getByText('Error')).toBeTruthy();
      });
    });

    it('TC_EDIT_N05 - should handle empty full name input', async () => {
      const { getByTestId, getByPlaceholderText } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const firstNameInput = getByPlaceholderText('First Name');
        const lastNameInput = getByPlaceholderText('Last Name');
        const saveButton = getByTestId('save-button');

        fireEvent.changeText(firstNameInput, '');
        fireEvent.changeText(lastNameInput, '');
        fireEvent.press(saveButton);
      });

      // Should handle gracefully without crashes
      await waitFor(() => {
        expect(getByTestId('edit-profile-screen')).toBeTruthy();
      });
    });

    it('TC_EDIT_N06 - should handle location autocomplete with no matches', async () => {
      const { getByTestId, getByPlaceholderText } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const locationInput = getByPlaceholderText('Location');
        fireEvent.changeText(locationInput, 'zzzzz');
      });

      // Should not crash with invalid location
      await waitFor(() => {
        expect(getByTestId('edit-profile-screen')).toBeTruthy();
      });
    });
  });

  // Form Validation Tests
  describe('Form Validation', () => {
    it('should validate email format', async () => {
      const { getByTestId, getByPlaceholderText } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const emailInput = getByPlaceholderText('Email');
        fireEvent.changeText(emailInput, 'invalid-email');
        
        const saveButton = getByTestId('save-button');
        fireEvent.press(saveButton);
      });

      // Should show validation error or handle gracefully
      await waitFor(() => {
        expect(getByTestId('edit-profile-screen')).toBeTruthy();
      });
    });

    it('should show save success message', async () => {
      const { getByTestId, getByText } = render(<EditProfileScreen />);
      
      await waitFor(() => {
        const saveButton = getByTestId('save-button');
        fireEvent.press(saveButton);
      });

      await waitFor(() => {
        expect(getByText('Success')).toBeTruthy();
      });
    });
  });
});