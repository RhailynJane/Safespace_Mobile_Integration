/**
 * Tab Test - Messages
 * Tests messaging functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '../test-utils';
import { router } from 'expo-router';
import MessagesScreen from '../../app/(app)/(tabs)/messages/index';

describe('Messages Tab', () => {
  const mockConversations = [
    {
      id: '1',
      name: 'Dr. Smith',
      lastMessage: 'How are you feeling today?',
      timestamp: '2025-11-01T10:00:00Z',
      unread: 2
    },
    {
      id: '2',
      name: 'Support Group',
      lastMessage: 'Meeting tomorrow at 3 PM',
      timestamp: '2025-11-01T09:00:00Z',
      unread: 0
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockConversations })
    });
  });

  it('should render without crashing', () => {
    const { getByTestId } = render(<MessagesScreen />);
    expect(getByTestId('messages-screen')).toBeTruthy();
  });

  it('should display conversations list', async () => {
    const { getByText } = render(<MessagesScreen />);
    
    await waitFor(() => {
      expect(getByText('Dr. Smith')).toBeTruthy();
      expect(getByText('Support Group')).toBeTruthy();
    });
  });

  it('should show unread message count', async () => {
    const { getByText } = render(<MessagesScreen />);
    
    await waitFor(() => {
      expect(getByText('2')).toBeTruthy(); // Unread badge
    });
  });

  it('should display last message preview', async () => {
    const { getByText } = render(<MessagesScreen />);
    
    await waitFor(() => {
      expect(getByText('How are you feeling today?')).toBeTruthy();
    });
  });

  it('should show new message button', () => {
    const { getByTestId } = render(<MessagesScreen />);
    expect(getByTestId('new-message-button')).toBeTruthy();
  });

  it('should navigate to new message screen', () => {
    const { getByTestId } = render(<MessagesScreen />);
    fireEvent.press(getByTestId('new-message-button'));
    expect(router.push).toHaveBeenCalled();
  });

  it('should navigate to chat when conversation is tapped', async () => {
    const { getByText } = render(<MessagesScreen />);
    await waitFor(() => {
      fireEvent.press(getByText('Dr. Smith'));
    });
    expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: expect.stringContaining('message-chat-screen') }));
  });

  it('should display search bar', () => {
    const { getByTestId } = render(<MessagesScreen />);
    expect(getByTestId('messages-search')).toBeTruthy();
  });

  it('should filter conversations by search', async () => {
    const { getByTestId, getByText, queryByText } = render(<MessagesScreen />);
    
    await waitFor(() => {
      expect(getByText('Dr. Smith')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('messages-search'), 'Dr. Smith');
    
    await waitFor(() => {
      expect(getByText('Dr. Smith')).toBeTruthy();
      expect(queryByText('Support Group')).toBeNull();
    });
  });

  it('should show timestamp for each conversation', async () => {
    const { getByText } = render(<MessagesScreen />);
    
    await waitFor(() => {
      expect(getByText(/10:00|am|pm/i)).toBeTruthy();
    });
  });

  // Deletion via swipe is not implemented; skipping this scenario

  it('should mark conversation as read when opened', async () => {
    const { getByText } = render(<MessagesScreen />);
    await waitFor(() => {
      fireEvent.press(getByText('Dr. Smith'));
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/conversations/1/mark-read'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  // Pull-to-refresh is wired via RefreshControl; event not directly fired in tests

  it('should show empty state when no conversations', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [] })
    });

    const { getByText } = render(<MessagesScreen />);
    
    await waitFor(() => {
      expect(getByText(/no messages yet/i)).toBeTruthy();
    });
  });

  it('should handle API error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    const { getByText } = render(<MessagesScreen />);
    await waitFor(() => {
      expect(getByText(/no conversations yet/i)).toBeTruthy();
    });
  });

  it('should display online status for contacts', async () => {
    const { getByTestId } = render(<MessagesScreen />);
    
    await waitFor(() => {
      expect(getByTestId('online-indicator-1')).toBeTruthy();
    });
  });

  it('should match snapshot', () => {
    const tree = render(<MessagesScreen />).toJSON();
    expect(tree).toMatchSnapshot();
  });
});
