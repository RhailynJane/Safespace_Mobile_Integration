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
      title: 'Dr. Smith',
      conversation_type: 'direct',
      updated_at: '2025-11-01T10:00:00Z',
      last_message: 'How are you feeling today?',
      last_message_time: '2025-11-01T10:00:00Z',
      unread_count: 2,
      participants: [
        {
          id: '1',
          clerk_user_id: 'test-user-id',
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          online: true,
          presence: 'online',
          last_active_at: '2025-11-01T10:00:00Z'
        },
        {
          id: '2',
          clerk_user_id: 'dr-smith-id',
          first_name: 'Dr.',
          last_name: 'Smith',
          email: 'drsmith@example.com',
          online: true,
          presence: 'online',
          last_active_at: '2025-11-01T10:00:00Z'
        }
      ]
    },
    {
      id: '2',
      title: 'Support Group',
      conversation_type: 'group',
      updated_at: '2025-11-01T09:00:00Z',
      last_message: 'Meeting tomorrow at 3 PM',
      last_message_time: '2025-11-01T09:00:00Z',
      unread_count: 0,
      participants: [
        {
          id: '1',
          clerk_user_id: 'test-user-id',
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          online: true,
          presence: 'online',
          last_active_at: '2025-11-01T09:00:00Z'
        }
      ]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock conversations API
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/conversations')) {
        if (url.includes('/mark-read')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true })
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: mockConversations })
        });
      }
      // Mock activity API status batch
      if (url.includes('/activity/status/batch')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              'dr-smith-id': {
                online: true,
                presence: 'online',
                last_active_at: '2025-11-01T10:00:00Z'
              }
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: [] })
      });
    });
  });

  it('should render without crashing', async () => {
    const { findByTestId } = render(<MessagesScreen />);
    await expect(findByTestId('messages-screen')).resolves.toBeTruthy();
  });

  it('should display conversations list', async () => {
    const { getByText } = render(<MessagesScreen />);
    
    await waitFor(() => {
      expect(getByText('Dr. Smith')).toBeTruthy();
      expect(getByText('Support Group')).toBeTruthy();
    });
  });

  it('should show unread message count', async () => {
    const { findByText } = render(<MessagesScreen />);
    
    await expect(findByText('2')).resolves.toBeTruthy(); // Unread badge
  });

  it('should display last message preview', async () => {
    const { findByText } = render(<MessagesScreen />);
    
    await expect(findByText('How are you feeling today?')).resolves.toBeTruthy();
  });

  it('should show new message button', async () => {
    const { findByTestId } = render(<MessagesScreen />);
    await expect(findByTestId('new-message-button')).resolves.toBeTruthy();
  });

  it('should navigate to new message screen', async () => {
    const { findByTestId } = render(<MessagesScreen />);
    const button = await findByTestId('new-message-button');
    fireEvent.press(button);
    expect(router.push).toHaveBeenCalled();
  });

  it('should navigate to chat when conversation is tapped', async () => {
    const { findByText } = render(<MessagesScreen />);
    const conversation = await findByText('Dr. Smith');
    fireEvent.press(conversation);
    expect(router.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: expect.stringContaining('message-chat-screen') }));
  });

  it('should display search bar', async () => {
    const { findByTestId } = render(<MessagesScreen />);
    await expect(findByTestId('messages-search')).resolves.toBeTruthy();
  });

  it('should filter conversations by search', async () => {
    const { findByTestId, findByText, queryByText } = render(<MessagesScreen />);
    
    await findByText('Dr. Smith');

    const searchInput = await findByTestId('messages-search');
    fireEvent.changeText(searchInput, 'Dr. Smith');
    
    await waitFor(() => {
      expect(queryByText('Dr. Smith')).toBeTruthy();
      expect(queryByText('Support Group')).toBeNull();
    });
  });

  it('should show timestamp for each conversation', async () => {
    const { findByText, getAllByText } = render(<MessagesScreen />);
    
    // Wait for conversations to load first
    await findByText('Dr. Smith');
    
    // Look for timestamp - there will be multiple "Nov 1" timestamps
    const timestamps = getAllByText(/Nov 1/i);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  // Deletion via swipe is not implemented; skipping this scenario

  it('should mark conversation as read when opened', async () => {
    const { findByText } = render(<MessagesScreen />);
    const conversation = await findByText('Dr. Smith');
    fireEvent.press(conversation);
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/conversations/1/mark-read'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  // Pull-to-refresh is wired via RefreshControl; event not directly fired in tests

  it('should show empty state when no conversations', async () => {
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/conversations')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: [] })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });
    });

    const { findByText } = render(<MessagesScreen />);
    
    await expect(findByText(/no conversations yet/i)).resolves.toBeTruthy();
  });

  it('should handle API error gracefully', async () => {
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    const { findByText } = render(<MessagesScreen />);
    await expect(findByText(/no conversations yet/i)).resolves.toBeTruthy();
  });

  it('should display online status for contacts', async () => {
    const { findByTestId } = render(<MessagesScreen />);
    
    await expect(findByTestId('online-indicator-1')).resolves.toBeTruthy();
  });
});
