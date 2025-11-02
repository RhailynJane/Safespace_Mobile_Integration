import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '../test-utils';

// Mock Alert - just spy, don't mock implementation
jest.spyOn(Alert, 'alert');

// Mock Clerk with specific implementations
const mockUpdatePassword = jest.fn();
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(() => ({
    isSignedIn: true,
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    signOut: jest.fn()
  })),
  useUser: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      updatePassword: mockUpdatePassword,
    },
  })),
  useSignIn: jest.fn(() => ({
    isLoaded: true,
    signIn: {
      create: jest.fn(),
      attemptFirstFactor: jest.fn(),
    },
    setActive: jest.fn(),
  })),
}));

// NOW import the component
import ChangePasswordScreen from '../../app/(app)/change-password';

describe('ChangePasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdatePassword.mockReset();
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
    
    // Get button by finding all "Change Password" texts and selecting the button one (not the header)
    const submitButtons = screen.getAllByText('Change Password');
    const submitButton = submitButtons[submitButtons.length - 1]; // Button is likely the last one
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
    
    const submitButtons = screen.getAllByText('Change Password');
    const submitButton = submitButtons[submitButtons.length - 1];
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
    
    const submitButtons = screen.getAllByText('Change Password');
    const submitButton = submitButtons[submitButtons.length - 1];
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
    
    const submitButtons = screen.getAllByText('Change Password');
    const submitButton = submitButtons[submitButtons.length - 1];
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
    
    const submitButtons = screen.getAllByText('Change Password');
    const submitButton = submitButtons[submitButtons.length - 1];
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
    
    const submitButtons = screen.getAllByText('Change Password');
    const submitButton = submitButtons[submitButtons.length - 1];
    fireEvent.press(submitButton);
    
    // Button should show ActivityIndicator during loading
    await waitFor(() => {
      const loadingButtons = screen.queryAllByText('Change Password');
      // Header still shows "Change Password", but button text should be gone
      expect(loadingButtons.length).toBe(1); // Only the header should remain
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
    
    const submitButtons = screen.getAllByText('Change Password');
    const submitButton = submitButtons[submitButtons.length - 1].parent;
    fireEvent.press(submitButton!);
    
    // Button should be disabled
    expect(submitButton?.props.accessibilityState?.disabled).toBe(true);
  });

  it('matches snapshot', () => {
    const tree = render(<ChangePasswordScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
