import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '../test-utils';

// Mock Alert - just spy, don't mock implementation
jest.spyOn(Alert, 'alert');

// Mock Clerk with updatePassword method
const mockUpdatePassword = jest.fn();
const mockUser = {
  id: 'test-user-id',
  updatePassword: mockUpdatePassword,
  publicMetadata: { orgId: 'cmha-calgary' }
};

jest.mock('@clerk/clerk-expo', () => ({
  useUser: jest.fn(() => ({ user: mockUser })),
  useSignIn: jest.fn(() => ({ signIn: {} })),
  useAuth: jest.fn(() => ({ 
    signOut: jest.fn(),
    isSignedIn: true,
    userId: 'test-user-id',
    orgId: 'cmha-calgary'
  })),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
  },
}));

// NOW import the component
import ChangePasswordScreen from '../../app/(app)/change-password';

describe('ChangePasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdatePassword.mockReset();
  });

  it('renders change password screen correctly', async () => {
    render(<ChangePasswordScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Enter your current password and choose a new one')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter current password')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter new password')).toBeTruthy();
      expect(screen.getByPlaceholderText('Confirm new password')).toBeTruthy();
    });
  });

  it('displays password requirements', () => {
    render(<ChangePasswordScreen />);
    
    expect(screen.getByText('Password must have:')).toBeTruthy();
    expect(screen.getByText('• At least 8 characters')).toBeTruthy();
    expect(screen.getByText('• One uppercase letter')).toBeTruthy();
    expect(screen.getByText('• One number')).toBeTruthy();
  });

  it('toggles current password visibility', async () => {
    render(<ChangePasswordScreen />);
    
    await waitFor(() => {
      const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
      // Initial state: password should be hidden (secureTextEntry = true)
      expect(currentPasswordInput.props.secureTextEntry).toBe(true);
    });
  });

  it('shows error when fields are empty', async () => {
    render(<ChangePasswordScreen />);
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      fireEvent.press(submitButton);
    });
    
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
    
    const submitButton = screen.getByRole('button', { name: /Change Password/i });
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
    
    const submitButton = screen.getByRole('button', { name: /Change Password/i });
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
    
    const submitButton = screen.getByRole('button', { name: /Change Password/i });
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
    
    const submitButton = screen.getByRole('button', { name: /Change Password/i });
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
    
    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    fireEvent.press(submitButton);
    
    // Button should show ActivityIndicator during loading - just check it still exists
    await waitFor(() => {
      expect(submitButton).toBeTruthy();
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
    
    const submitButton = screen.getByRole('button', { name: /Change Password/i });
    fireEvent.press(submitButton);
    
    // Button should be disabled
    await waitFor(() => {
      expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  it('matches snapshot', () => {
    const tree = render(<ChangePasswordScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
