import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import ChangePasswordScreen from '../../app/(app)/change-password';
import { Alert } from 'react-native';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ChangePasswordScreen', () => {
  const mockUpdatePassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock user with updatePassword method
    const mockUser = {
      id: 'user_123',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      imageUrl: 'https://example.com/avatar.jpg',
      updatePassword: mockUpdatePassword,
    };
    
    require('@clerk/clerk-expo').useUser.mockReturnValue({ user: mockUser });
  });

  it('renders change password screen correctly', () => {
    render(<ChangePasswordScreen />);
    
    expect(screen.getByText('Change Password')).toBeTruthy();
    expect(screen.getByText('Enter your current password and choose a new one')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter current password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Enter new password')).toBeTruthy();
    expect(screen.getByPlaceholderText('Confirm new password')).toBeTruthy();
  });

  it('displays password requirements', () => {
    render(<ChangePasswordScreen />);
    
    expect(screen.getByText('Password must have:')).toBeTruthy();
    expect(screen.getByText('• At least 8 characters')).toBeTruthy();
    expect(screen.getByText('• One uppercase letter')).toBeTruthy();
    expect(screen.getByText('• One number')).toBeTruthy();
  });

  it('toggles current password visibility', () => {
    render(<ChangePasswordScreen />);
    
    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const toggleButtons = screen.getAllByRole('button');
    
    // Initial state: password should be hidden (secureTextEntry = true)
    expect(currentPasswordInput.props.secureTextEntry).toBe(true);
    
    // Find and press the first eye icon (current password toggle)
    const eyeButton = toggleButtons.find(btn => 
      btn.props.accessibilityRole === 'button' && 
      btn.props.children?.props?.name?.includes('eye')
    );
    
    if (eyeButton) {
      fireEvent.press(eyeButton);
      // After toggle, password should be visible
      expect(currentPasswordInput.props.secureTextEntry).toBe(false);
    }
  });

  it('shows error when fields are empty', async () => {
    render(<ChangePasswordScreen />);
    
    const submitButton = screen.getByText('Change Password');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<ChangePasswordScreen />);
    
    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    
    fireEvent.changeText(currentPasswordInput, 'OldPassword123');
    fireEvent.changeText(newPasswordInput, 'NewPassword123');
    fireEvent.changeText(confirmPasswordInput, 'DifferentPassword123');
    
    const submitButton = screen.getByText('Change Password');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', "New passwords don't match");
    });
  });

  it('shows error when new password is too short', async () => {
    render(<ChangePasswordScreen />);
    
    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    
    fireEvent.changeText(currentPasswordInput, 'OldPassword123');
    fireEvent.changeText(newPasswordInput, 'Short1');
    fireEvent.changeText(confirmPasswordInput, 'Short1');
    
    const submitButton = screen.getByText('Change Password');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Password must be at least 8 characters');
    });
  });

  it('successfully changes password with valid inputs', async () => {
    mockUpdatePassword.mockResolvedValue({});
    
    render(<ChangePasswordScreen />);
    
    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    
    fireEvent.changeText(currentPasswordInput, 'OldPassword123');
    fireEvent.changeText(newPasswordInput, 'NewPassword123');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123');
    
    const submitButton = screen.getByText('Change Password');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(mockUpdatePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
      });
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Your password has been changed successfully',
        expect.any(Array)
      );
    });
  });

  it('shows error message when password update fails', async () => {
    const errorMessage = 'Current password is incorrect';
    mockUpdatePassword.mockRejectedValue({
      errors: [{ message: errorMessage }],
    });
    
    render(<ChangePasswordScreen />);
    
    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    
    fireEvent.changeText(currentPasswordInput, 'WrongPassword');
    fireEvent.changeText(newPasswordInput, 'NewPassword123');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123');
    
    const submitButton = screen.getByText('Change Password');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', errorMessage);
    });
  });

  it('shows loading state during password change', async () => {
    mockUpdatePassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    
    render(<ChangePasswordScreen />);
    
    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    
    fireEvent.changeText(currentPasswordInput, 'OldPassword123');
    fireEvent.changeText(newPasswordInput, 'NewPassword123');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123');
    
    const submitButton = screen.getByText('Change Password');
    fireEvent.press(submitButton);
    
    // Button should show ActivityIndicator during loading
    await waitFor(() => {
      const loadingButton = screen.queryByText('Change Password');
      expect(loadingButton).toBeFalsy(); // Text should be replaced by ActivityIndicator
    });
  });

  it('disables button while loading', async () => {
    mockUpdatePassword.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    
    render(<ChangePasswordScreen />);
    
    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
    
    fireEvent.changeText(currentPasswordInput, 'OldPassword123');
    fireEvent.changeText(newPasswordInput, 'NewPassword123');
    fireEvent.changeText(confirmPasswordInput, 'NewPassword123');
    
    const submitButton = screen.getByText('Change Password').parent;
    fireEvent.press(submitButton!);
    
    // Button should be disabled
    expect(submitButton?.props.disabled).toBe(true);
  });

  it('matches snapshot', () => {
    const tree = render(<ChangePasswordScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
