/**
* LLM Prompt: Create comprehensive React Native component documentation covering frontend implementation details and backend integration specs including PostgreSQL schema design and REST API endpoints. 
* Reference: chat.deepseek.com
*/

# NotificationsScreen Documentation

## Overview
The `NotificationsScreen` is a React Native component that displays a list of user notifications with various types including messages, appointment reminders, system updates, and journal/mood reminders. The screen supports pull-to-refresh functionality and allows users to mark notifications as read.

## Component Structure

### Type Definition
```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: "message" | "appointment" | "system" | "reminder";
}
```

### Key Features
- **Pull-to-refresh** functionality for updating notifications
- **Unread notification indicators** with green dots
- **Mark all as read** capability
- **Categorized notifications** with type-specific icons and colors
- **Empty state** handling when no notifications are available

## Frontend Implementation Details

### State Management
```typescript
const [notifications, setNotifications] = useState<Notification[]>([]);
const [refreshing, setRefreshing] = useState(false);
```

### Core Functions
- `loadNotifications()`: Loads mock notification data (replace with API call)
- `onRefresh()`: Handles pull-to-refresh with 1-second timeout
- `markAsRead(id)`: Marks individual notification as read
- `markAllAsRead()`: Marks all notifications as read
- `getNotificationIcon(type)`: Returns appropriate icon per notification type
- `getNotificationColor(type)`: Returns color code per notification type

### Visual Elements
- **Icons**: Using Ionicons with type-specific mappings
- **Colors**: Different colors for each notification type
- **Unread Indicator**: Green dot for unread notifications
- **Empty State**: "No notifications yet" with appropriate icon

## Backend Integration (PostgreSQL)

### Database Schema Recommendations

```sql
-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('message', 'appointment', 'system', 'reminder')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    related_entity_id UUID, -- Optional: reference to related entity (appointment, message, etc.)
    metadata JSONB -- Optional: additional data specific to notification type
);

-- Indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
```

### API Endpoints Required

```typescript
// 1. Get user notifications
GET /api/notifications
Query Parameters:
  - limit: number (default: 50)
  - offset: number (default: 0)
  - unread_only: boolean (default: false)

Response:
{
  "notifications": Notification[],
  "totalCount": number,
  "unreadCount": number
}

// 2. Mark notification as read
PATCH /api/notifications/:id/read
Response: { "success": true }

// 3. Mark all notifications as read
PATCH /api/notifications/read-all
Response: { "success": true, "markedCount": number }

// 4. Real-time notifications (WebSocket)
// Consider implementing WebSocket for real-time notification delivery
```

### Backend Integration Implementation

Replace the mock data with actual API calls:

```typescript
// API service functions
const NotificationAPI = {
  async getNotifications(): Promise<Notification[]> {
    const response = await fetch('/api/notifications');
    const data = await response.json();
    return data.notifications;
  },
  
  async markAsRead(id: string): Promise<void> {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },
  
  async markAllAsRead(): Promise<void> {
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
  }
};

// Updated component functions
const loadNotifications = async () => {
  try {
    const data = await NotificationAPI.getNotifications();
    setNotifications(data);
  } catch (error) {
    console.error('Failed to load notifications:', error);
  }
};

const markAsRead = async (id: string) => {
  try {
    await NotificationAPI.markAsRead(id);
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  } catch (error) {
    console.error('Failed to mark as read:', error);
  }
};
```

### Time Formatting
The current implementation uses relative time strings ("10 minutes ago"). For backend integration, consider:

```typescript
// Utility function to format time
const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
  return `${Math.floor(diffInMinutes / 1440)} days ago`;
};
```

## Error Handling

Add error boundaries and loading states:

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// In loadNotifications
try {
  setLoading(true);
  const data = await NotificationAPI.getNotifications();
  setNotifications(data);
  setError(null);
} catch (err) {
  setError('Failed to load notifications');
} finally {
  setLoading(false);
}
```

