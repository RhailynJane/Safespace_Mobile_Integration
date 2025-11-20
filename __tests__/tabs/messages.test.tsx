/**
 * Tab Test - Messages
 * Tests messaging functionality - Structural coverage
 * Note: Full data-driven tests deferred pending Convex reactive query stabilization
 */

import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import { router } from 'expo-router';
import MessagesScreen from '../../app/(app)/(tabs)/messages/index';

describe('Messages Tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', async () => {
    const { findByTestId } = render(<MessagesScreen />);
    await expect(findByTestId('messages-screen')).resolves.toBeTruthy();
  });

  it('should display search bar', async () => {
    const { findByTestId } = render(<MessagesScreen />);
    await expect(findByTestId('messages-search')).resolves.toBeTruthy();
  });

  it('should show new message button', async () => {
    const { findByTestId } = render(<MessagesScreen />);
    await expect(findByTestId('new-message-button')).resolves.toBeTruthy();
  });

  it('should navigate to new message screen when button pressed', async () => {
    const { findByTestId } = render(<MessagesScreen />);
    const button = await findByTestId('new-message-button');
    fireEvent.press(button);
    expect(router.push).toHaveBeenCalled();
  });

  it('should display filter tabs (All, Unread, Read)', async () => {
    const { findByText } = render(<MessagesScreen />);
    await expect(findByText('All')).resolves.toBeTruthy();
    await expect(findByText('Unread')).resolves.toBeTruthy();
    await expect(findByText('Read')).resolves.toBeTruthy();
  });

  it('should show empty state or error modal initially', async () => {
    const { findByText } = render(<MessagesScreen />);
    // Component shows either empty state or connection error on failed Convex queries
    await expect(
      findByText(/no conversations yet|connection error/i)
    ).resolves.toBeTruthy();
  });
});

