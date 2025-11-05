import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '../test-utils';
import LoginScreen from '../../app/(auth)/login';
import activityApi from '../../utils/activityApi';

const clerkModule = require('@clerk/clerk-expo');
const routerModule = require('expo-router');

jest.spyOn(activityApi, 'recordLogin').mockResolvedValue({ success: true, data: {} } as any);

describe('LoginScreen', () => {
  beforeEach(() => {
    clerkModule.__signInMock.create.mockReset().mockResolvedValue({ status: 'complete', createdSessionId: 'sess_mock', createdUserId: 'user_mock' });
    clerkModule.__setActiveMock.mockReset().mockResolvedValue(undefined);
    routerModule.router.replace.mockReset();
  });

  it('signs in successfully and navigates to home, recording login', async () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter your email address'), 'john.doe@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password...'), 'Passw0rd!');

    // Choose the last 'Sign In' text which corresponds to the submit button
    const signIns = screen.getAllByText('Sign In');
    fireEvent.press(signIns[signIns.length - 1]);

    await waitFor(() => expect(clerkModule.__signInMock.create).toHaveBeenCalledWith({ identifier: 'john.doe@example.com', password: 'Passw0rd!' }));
    await waitFor(() => expect(clerkModule.__setActiveMock).toHaveBeenCalled());
    await waitFor(() => expect(activityApi.recordLogin).toHaveBeenCalled());
    expect(routerModule.router.replace).toHaveBeenCalledWith('/(app)/(tabs)/home');
  });

  it('shows invalid email or password error for Clerk invalid credentials', async () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter your email address'), 'nope@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password...'), 'wrong');

    clerkModule.__signInMock.create.mockRejectedValueOnce({ errors: [{ code: 'form_identifier_not_found' }] });

    const signIns = screen.getAllByText('Sign In');
    fireEvent.press(signIns[signIns.length - 1]);

    await screen.findByText('Invalid email or password');
  });

  it('shows Clerk error message if provided for other failures', async () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter your email address'), 'user@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password...'), 'pass');

    clerkModule.__signInMock.create.mockRejectedValueOnce({ errors: [{ message: 'Too many attempts, please try later' }] });

    const signIns = screen.getAllByText('Sign In');
    fireEvent.press(signIns[signIns.length - 1]);

    await screen.findByText('Too many attempts, please try later');
  });
});
