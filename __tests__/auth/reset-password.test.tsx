import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import ResetPasswordScreen from '../../app/(auth)/reset-password';

const clerkModule = require('@clerk/clerk-expo');
const routerModule = require('expo-router');

// Mock useLocalSearchParams to provide email
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useLocalSearchParams: () => ({ email: 'user@example.com' }),
}));

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    clerkModule.__signInMock.create.mockReset().mockResolvedValue({ status: 'needs_first_factor' });
    clerkModule.__signInMock.attemptFirstFactor.mockReset().mockResolvedValue({ status: 'complete', createdSessionId: 'sess_mock' });
    clerkModule.__setActiveMock.mockReset().mockResolvedValue(undefined);
    if (routerModule.router.replace.mockReset) {
      routerModule.router.replace.mockReset();
    }
  });

  it('resets password and shows success modal', async () => {
    render(<ResetPasswordScreen />);

    clerkModule.__signInMock.attemptFirstFactor.mockResolvedValueOnce({
      status: 'complete',
      createdSessionId: 'test-session-id',
    });

    fireEvent.changeText(screen.getByPlaceholderText('Enter 6-digit code'), '123456');
    fireEvent.changeText(screen.getByPlaceholderText('Enter new password'), 'NewPass123!');
    fireEvent.changeText(screen.getByPlaceholderText('Confirm new password'), 'NewPass123!');

    fireEvent.press(screen.getByText('Reset Password'));

    // Wait for success modal
    await screen.findByText('Password Reset Successful');
    
    expect(clerkModule.__signInMock.attemptFirstFactor).toHaveBeenCalledWith({
      strategy: 'reset_password_email_code',
      code: '123456',
      password: 'NewPass123!',
    });
    expect(clerkModule.__setActiveMock).toHaveBeenCalledWith({ session: 'test-session-id' });
  });

  it('shows validation error when code is missing', async () => {
    render(<ResetPasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter new password'), 'NewPass123!');
    fireEvent.changeText(screen.getByPlaceholderText('Confirm new password'), 'NewPass123!');

    fireEvent.press(screen.getByText('Reset Password'));

    await screen.findByText('Verification code is required');
  });

  it('shows validation error when password is too short', async () => {
    render(<ResetPasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter 6-digit code'), '123456');
    fireEvent.changeText(screen.getByPlaceholderText('Enter new password'), 'short');
    fireEvent.changeText(screen.getByPlaceholderText('Confirm new password'), 'short');

    fireEvent.press(screen.getByText('Reset Password'));

    await screen.findByText('Password must be at least 8 characters long');
  });

  it('shows validation error when passwords do not match', async () => {
    render(<ResetPasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter 6-digit code'), '123456');
    fireEvent.changeText(screen.getByPlaceholderText('Enter new password'), 'NewPass123!');
    fireEvent.changeText(screen.getByPlaceholderText('Confirm new password'), 'Different123!');

    fireEvent.press(screen.getByText('Reset Password'));

    await screen.findByText('Passwords do not match');
  });

  it('shows inline error when Clerk returns invalid code', async () => {
    render(<ResetPasswordScreen />);

    clerkModule.__signInMock.attemptFirstFactor.mockRejectedValueOnce({
      errors: [{ code: 'form_code_incorrect', message: 'Invalid verification code' }],
    });

    fireEvent.changeText(screen.getByPlaceholderText('Enter 6-digit code'), 'wrong');
    fireEvent.changeText(screen.getByPlaceholderText('Enter new password'), 'NewPass123!');
    fireEvent.changeText(screen.getByPlaceholderText('Confirm new password'), 'NewPass123!');

    fireEvent.press(screen.getByText('Reset Password'));

    // Should show inline error, not a modal
    await screen.findByText('Invalid verification code');
  });
});
