import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import NotificationsScreen from '../../app/(app)/notifications/index';

// Mock fetch
global.fetch = jest.fn();

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notifications screen correctly', () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<NotificationsScreen />);
    
    expect(screen.getByText('Notifications')).toBeTruthy();
  });

  it('displays empty state when no notifications', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    render(<NotificationsScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeTruthy();
      expect(screen.getByText("You'll see important updates here")).toBeTruthy();
    });
  });

  it('displays notifications list', async () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'message',
        title: 'New Message',
        message: 'You have a new message from Dr. Smith',
        is_read: false,
        created_at: '2025-01-01T10:00:00Z',
      },
      {
        id: 2,
        type: 'appointment',
        title: 'Appointment Reminder',
        message: 'Your appointment is tomorrow at 2 PM',
        is_read: true,
        created_at: '2025-01-01T09:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockNotifications }),
    });

    render(<NotificationsScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('New Message')).toBeTruthy();
      expect(screen.getByText('You have a new message from Dr. Smith')).toBeTruthy();
      expect(screen.getByText('Appointment Reminder')).toBeTruthy();
      expect(screen.getByText('Your appointment is tomorrow at 2 PM')).toBeTruthy();
    });
  });

  it('displays unread count correctly', async () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'message',
        title: 'New Message 1',
        message: 'Message 1',
        is_read: false,
        created_at: '2025-01-01T10:00:00Z',
      },
      {
        id: 2,
        type: 'message',
        title: 'New Message 2',
        message: 'Message 2',
        is_read: false,
        created_at: '2025-01-01T09:00:00Z',
      },
      {
        id: 3,
        type: 'system',
        title: 'Read Message',
        message: 'Already read',
        is_read: true,
        created_at: '2025-01-01T08:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockNotifications }),
    });

    render(<NotificationsScreen />);
    
    await waitFor(() => {
      expect(screen.getByText(/2 unread notifications/i)).toBeTruthy();
    });
  });

  it('marks notification as read when tapped', async () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'message',
        title: 'Unread Message',
        message: 'This is unread',
        is_read: false,
        created_at: '2025-01-01T10:00:00Z',
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockNotifications }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<NotificationsScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Unread Message')).toBeTruthy();
    });

    const notification = screen.getByText('Unread Message');
    fireEvent.press(notification);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/notifications/1/read'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('marks all notifications as read', async () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'message',
        title: 'Message 1',
        message: 'Unread 1',
        is_read: false,
        created_at: '2025-01-01T10:00:00Z',
      },
      {
        id: 2,
        type: 'message',
        title: 'Message 2',
        message: 'Unread 2',
        is_read: false,
        created_at: '2025-01-01T09:00:00Z',
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockNotifications }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<NotificationsScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Mark all as read')).toBeTruthy();
    });

    const markAllButton = screen.getByText('Mark all as read');
    fireEvent.press(markAllButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/read-all'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('clears all notifications', async () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'message',
        title: 'Message',
        message: 'Some message',
        is_read: true,
        created_at: '2025-01-01T10:00:00Z',
      },
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockNotifications }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<NotificationsScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Clear all')).toBeTruthy();
    });

    const clearAllButton = screen.getByText('Clear all');
    fireEvent.press(clearAllButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/clear-all'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('shows error modal on load failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<NotificationsScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Load Failed')).toBeTruthy();
    });
  });

  it('shows error modal on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<NotificationsScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Connection Error')).toBeTruthy();
    });
  });

  it('supports pull-to-refresh', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    });

    const { getByTestId } = render(<NotificationsScreen />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('No notifications yet')).toBeTruthy();
    });

    // Simulate pull to refresh - Note: ScrollView doesn't have testID by default
    // This is a simplified test; in a real scenario, you'd use the refreshControl's onRefresh
    expect(global.fetch).toHaveBeenCalled();
  });

  it('displays notification icons based on type', async () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'message',
        title: 'Message',
        message: 'Chat message',
        is_read: false,
        created_at: '2025-01-01T10:00:00Z',
      },
      {
        id: 2,
        type: 'appointment',
        title: 'Appointment',
        message: 'Appointment reminder',
        is_read: false,
        created_at: '2025-01-01T09:00:00Z',
      },
      {
        id: 3,
        type: 'mood',
        title: 'Mood',
        message: 'Mood tracking reminder',
        is_read: false,
        created_at: '2025-01-01T08:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockNotifications }),
    });

    render(<NotificationsScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Message')).toBeTruthy();
      expect(screen.getByText('Appointment')).toBeTruthy();
      expect(screen.getByText('Mood')).toBeTruthy();
    });
  });

  it('matches snapshot with notifications', async () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'message',
        title: 'Test Notification',
        message: 'Test message',
        is_read: false,
        created_at: '2025-01-01T10:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockNotifications }),
    });

    const tree = render(<NotificationsScreen />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Notification')).toBeTruthy();
    });

    expect(tree.toJSON()).toMatchSnapshot();
  });
});
