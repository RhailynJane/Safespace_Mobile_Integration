/**
* LLM Prompt: Create comprehensive React Native component documentation covering frontend implementation details and backend integration specs including PostgreSQL schema design and REST API endpoints. 
* Reference: chat.deepseek.com
*/

# Community Forum Frontend Documentation

## Overview

The Community Forum is a React Native application that provides users with a platform to share mental health experiences, connect with others, and participate in discussions. The application features a clean, intuitive interface with curved backgrounds and smooth navigation.

## Component Architecture

### File Structure
```
community-forum/
├── index.tsx                 # Main community entry screen
├── main.tsx                 # Community forum main screen
├── comments.tsx             # Post comments screen
└── create/
    ├── index.tsx           # Category selection screen
    ├── content.tsx         # Post creation screen
    └── success.tsx         # Post success confirmation screen
```

## Core Components

### 1. CommunityScreen (`index.tsx`)
**Purpose**: Welcome screen and entry point to the community features.

**Key Features**:
- Welcoming interface with community illustration
- Side menu navigation with animated transitions
- User profile display with initials
- Bottom navigation integration

**State Management**:
```typescript
const [sideMenuVisible, setSideMenuVisible] = useState(false);
const [activeTab, setActiveTab] = useState("community");
const fadeAnim = useRef(new Animated.Value(0)).current;
```

### 2. CommunityMainScreen (`main.tsx`)
**Purpose**: Main forum interface displaying posts and categories.

**Key Features**:
- Category-based post filtering
- Post interactions (like, comment, bookmark)
- Add post functionality
- Side menu navigation

**State Management**:
```typescript
const [selectedCategory, setSelectedCategory] = useState("Trending");
const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<number>>(new Set());
```

### 3. CommentsScreen (`comments.tsx`)
**Purpose**: Display and manage post comments.

**Key Features**:
- Threaded comment display
- Real-time comment addition
- User avatars and timestamps
- Keyboard-avoiding view for iOS/Android

**Data Structure**:
```typescript
interface CommentType {
  id: number;
  user: { name: string; avatar: string };
  content: string;
  timestamp: string;
  likes: number;
}
```

### 4. Create Post Flow

#### SelectCategoryScreen (`create/index.tsx`)
**Purpose**: Category selection for new posts.

**Available Categories**:
- Self Care, Mindfulness, Stories, Support, Creative
- Therapy, Stress, Affirmation, Awareness

#### CreatePostScreen (`create/content.tsx`)
**Purpose**: Post content creation with privacy settings.

**Features**:
- Rich text input with character counting
- Privacy toggle (public/private)
- Draft saving capability
- Media attachment options

#### PostSuccessScreen (`create/success.tsx`)
**Purpose**: Success confirmation after post creation.

## Database Integration Guide

### PostgreSQL Schema Recommendations

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Posts Table
```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT FALSE,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for better performance
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

#### Comments Table
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id INTEGER REFERENCES comments(id), -- For nested comments
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
```

#### User Interactions Table
```sql
CREATE TABLE user_interactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) CHECK (interaction_type IN ('like', 'bookmark')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id, interaction_type) -- Prevent duplicate interactions
);
```

### API Endpoints Specification

#### Posts Endpoints
```typescript
// GET /api/posts - Get posts with pagination and filtering
interface GetPostsParams {
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'popular';
}

// POST /api/posts - Create new post
interface CreatePostRequest {
  title: string;
  content: string;
  category: string;
  isPrivate: boolean;
}

// GET /api/posts/:id/comments - Get post comments
```

#### Comments Endpoints
```typescript
// POST /api/comments - Add comment to post
interface CreateCommentRequest {
  postId: number;
  content: string;
  parentCommentId?: number; // For nested comments
}

// PUT /api/comments/:id/like - Like/unlike comment
```

#### User Interactions Endpoints
```typescript
// POST /api/interactions/like - Like/unlike post
interface LikeRequest {
  postId: number;
  action: 'like' | 'unlike';
}

// POST /api/interactions/bookmark - Bookmark post
interface BookmarkRequest {
  postId: number;
  action: 'bookmark' | 'unbookmark';
}
```

### Data Flow Integration

#### 1. Authentication Context
Replace mock user data with actual authentication:
```typescript
// Replace mock data with actual user context
const { user, profile } = useAuth(); // Your auth context
```

#### 2. API Service Layer
Create service functions for backend communication:
```typescript
// api/posts.ts
export const postService = {
  getPosts: async (params: GetPostsParams) => {
    const response = await api.get('/posts', { params });
    return response.data;
  },
  
  createPost: async (postData: CreatePostRequest) => {
    const response = await api.post('/posts', postData);
    return response.data;
  },
  
  likePost: async (postId: number) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  }
};
```

#### 3. State Management Integration
Update component states to use real data:
```typescript
// In CommunityMainScreen
const [posts, setPosts] = useState<Post[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadPosts();
}, [selectedCategory]);

const loadPosts = async () => {
  try {
    const postsData = await postService.getPosts({
      category: selectedCategory === 'Trending' ? undefined : selectedCategory
    });
    setPosts(postsData);
  } catch (error) {
    console.error('Failed to load posts:', error);
  } finally {
    setLoading(false);
  }
};
```

### Real-time Features Implementation

#### WebSocket Integration for Live Updates
```typescript
// websocket.service.ts
class WebSocketService {
  connect() {
    // Implement WebSocket connection for real-time updates
    // Notify on new posts, comments, and likes
  }
  
  subscribeToPostUpdates(postId: number) {
    // Subscribe to real-time updates for specific post
  }
}
```

### Error Handling and Validation

#### Frontend Validation
```typescript
// validation/post.ts
export const validatePost = (post: CreatePostRequest) => {
  const errors: string[] = [];
  
  if (!post.title.trim()) errors.push('Title is required');
  if (!post.content.trim()) errors.push('Content is required');
  if (post.content.length > 300) errors.push('Content too long');
  if (!post.category) errors.push('Category is required');
  
  return errors;
};
```

#### API Error Handling
```typescript
// error-handler.ts
export const handleApiError = (error: any) => {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        router.push('/login');
        break;
      case 403:
        Alert.alert('Error', 'You do not have permission for this action');
        break;
      default:
        Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  }
};
```

### Performance Optimization

#### Database Optimization
- Implement pagination for posts and comments
- Use database indexes strategically
- Cache frequently accessed data
- Implement connection pooling

#### Frontend Optimization
- Implement virtual scrolling for long post lists
- Use React.memo for expensive components
- Implement image lazy loading
- Optimize bundle size with code splitting

## Key Integration Points

### 1. User Authentication
- Replace mock user data with actual authentication context
- Implement secure token management
- Add role-based permissions if needed

### 2. File Upload
- Implement image/video upload for posts
- Add file type validation
- Implement progress indicators

### 3. Notifications
- Implement push notifications for new comments/likes
- Add in-app notification system
- Implement email notifications for important updates

### 4. Search and Filtering
- Implement full-text search for posts
- Add advanced filtering options
- Implement search result highlighting

## Security Considerations

### 1. Input Validation
- Sanitize user-generated content
- Implement rate limiting for API calls
- Validate file uploads

### 2. Data Protection
- Implement proper authentication middleware
- Use HTTPS for all API calls
- Sanitize database queries to prevent SQL injection

### 3. Privacy Controls
- Respect post privacy settings
- Implement proper access controls
- Add data anonymization options

This documentation provides a comprehensive guide for frontend development and backend integration. The component structure is modular and ready for real data integration with PostgreSQL backend.