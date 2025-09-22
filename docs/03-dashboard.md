/**
* LLM Prompt: Create comprehensive React Native component documentation covering frontend implementation details and backend integration specs including PostgreSQL schema design and REST API endpoints. 
* Reference: chat.deepseek.com
*/

# SafeSpace Home Dashboard - Dashboard Documentation

## 📱 Frontend HomeScreen Component

### Component Overview
**File**: `app/(app)/(tabs)/home.tsx`

**Purpose**: Main dashboard screen featuring user greeting, quick actions, mood tracking, and resource recommendations

**Key Features**:
- Personalized user greeting with time-based messages
- Emergency help button for crisis support
- Quick action grid for main app features
- Recent mood tracking history
- Recommended resources section
- Bottom navigation with active state
- Side navigation menu with smooth animations

---

### State Management & Data Types

#### Data Structures
```typescript
type MoodEntry = {
  id: string;
  mood_type: string;  // "very-happy", "happy", "neutral", "sad", "very-sad"
  created_at: string;
  mood_emoji?: string;
  mood_label?: string;
};

type Resource = {
  id: string;
  title: string;
  duration: string;
  onPress?: () => void;
};
```

#### State Variables
```typescript
const [loading, setLoading] = useState(true);                    // Loading state
const [recentMoods, setRecentMoods] = useState<MoodEntry[]>([]); // Mood history
const [resources, setResources] = useState<Resource[]>([]);      // Resource recommendations
const [activeTab, setActiveTab] = useState("home");              // Bottom nav state
const [sideMenuVisible, setSideMenuVisible] = useState(false);   // Side menu visibility
const [profileImage, setProfileImage] = useState<string | null>(null); // User avatar
```

---

### Key Functional Components

#### 1. Quick Actions Grid
Four main action buttons with images and navigation:

| Action | Purpose | Navigation | Image Reference |
|--------|---------|------------|-----------------|
| Track Mood | Mood tracking | `/mood-tracking` | Google Share image |
| Journal | Journaling | `/journal` | LovePik notebook vector |
| Resources | Resource library | `/resources` | PNGTree books image |
| Crisis Support | Emergency help | `/crisis-support` | Google Share support image |

#### 2. Mood Tracking System
- **Mood Types**: Very Happy 😄, Happy 🙂, Neutral 😐, Sad 🙁, Very Sad 😢
- **Storage**: Uses AsyncStorage for local mood history
- **Display**: Shows last 3 mood entries with dates and emojis

#### 3. Side Navigation Menu
12 navigation items including:
- Dashboard, Profile, Self-Assessment
- Mood Tracking, Journaling, Resources
- Crisis Support, Messages, Appointments
- Community Forum, Video Consultations, Sign Out

---

### Animation & UI Effects

#### Side Menu Animation
```typescript
const fadeAnim = useRef(new Animated.Value(0)).current;

const showSideMenu = () => {
  setSideMenuVisible(true);
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 300,  // 300ms fade-in
    useNativeDriver: true,
  }).start();
};
```

#### Curved Background
Uses `CurvedBackground` component with SVG gradients for visual appeal.

---

### Utility Functions

#### Time-based Greeting
```typescript
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};
```

#### Mood Mapping
```typescript
const getEmojiForMood = (moodType: string) => {
  switch (moodType) {
    case "very-happy": return "😄";
    case "happy": return "🙂";
    case "neutral": return "😐";
    case "sad": return "🙁";
    case "very-sad": return "😢";
    default: return "😐";
  }
};
```

#### Date Formatting
```typescript
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  
  if (date.toDateString() === today.toDateString()) return "Today";
  // ... handles "Yesterday" and other dates
};
```

---

## 🗄️ Backend Database Schema

### Core Tables for Home Dashboard

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    phone_number VARCHAR(20),
    profile_image_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Mood Entries Table
```sql
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood_type VARCHAR(20) NOT NULL CHECK (mood_type IN (
        'very-happy', 'happy', 'neutral', 'sad', 'very-sad'
    )),
    mood_intensity INTEGER CHECK (mood_intensity >= 1 AND mood_intensity <= 10),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient mood history queries
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, created_at DESC);
CREATE INDEX idx_mood_entries_date ON mood_entries(created_at DESC);
```

#### Resources Table
```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN (
        'article', 'video', 'audio', 'exercise', 'tool'
    )),
    duration_minutes INTEGER,
    category VARCHAR(100) NOT NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN (
        'beginner', 'intermediate', 'advanced'
    )),
    thumbnail_url VARCHAR(500),
    content_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories: anxiety, depression, stress, mindfulness, relationships, etc.
CREATE INDEX idx_resources_category_active ON resources(category, is_active);
CREATE INDEX idx_resources_content_type ON resources(content_type);
```

#### User Resources Interaction Table
```sql
CREATE TABLE user_resource_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN (
        'viewed', 'completed', 'saved', 'shared'
    )),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track user engagement with resources
CREATE INDEX idx_user_resources_user ON user_resource_interactions(user_id);
CREATE INDEX idx_user_resources_type ON user_resource_interactions(interaction_type);
```

---

## 🔌 API Endpoints Specification

### Dashboard Data Endpoints

#### 1. Get Dashboard Summary
```http
GET /api/dashboard/summary
Authorization: Bearer <token>

Response (200):
{
  "user": {
    "firstName": "John",
    "lastName": "Doe",
    "profileImage": "https://example.com/image.jpg",
    "streakDays": 7
  },
  "recentMoods": [
    {
      "id": "uuid",
      "mood_type": "happy",
      "mood_emoji": "🙂",
      "mood_label": "Happy",
      "created_at": "2024-01-15T10:30:00Z",
      "formatted_date": "Today"
    }
  ],
  "recommendedResources": [
    {
      "id": "uuid",
      "title": "Understanding Anxiety",
      "duration": "10 min",
      "category": "anxiety",
      "thumbnail_url": "https://example.com/thumb.jpg"
    }
  ],
  "quickStats": {
    "moodEntriesThisWeek": 5,
    "journalEntriesThisMonth": 12,
    "resourcesCompleted": 3
  }
}
```

#### 2. Get Recent Mood History
```http
GET /api/moods/recent?limit=5
Authorization: Bearer <token>

Response (200):
{
  "moods": [
    {
      "id": "uuid",
      "mood_type": "happy",
      "mood_intensity": 8,
      "notes": "Had a great day with friends",
      "created_at": "2024-01-15T10:30:00Z",
      "formatted_date": "Today"
    }
  ],
  "moodSummary": {
    "averageMoodThisWeek": 7.2,
    "moodTrend": "improving" // improving, declining, stable
  }
}
```

#### 3. Get Recommended Resources
```http
GET /api/resources/recommended
Authorization: Bearer <token>

Response (200):
{
  "resources": [
    {
      "id": "uuid",
      "title": "Mindfulness Meditation",
      "description": "10-minute guided meditation for stress relief",
      "content_type": "audio",
      "duration_minutes": 10,
      "category": "mindfulness",
      "difficulty_level": "beginner",
      "thumbnail_url": "https://example.com/meditation.jpg"
    }
  ],
  "basedOn": "recent_activity" // recent_activity, mood_pattern, user_preferences
}
```

#### 4. Create Mood Entry
```http
POST /api/moods
Authorization: Bearer <token>
Content-Type: application/json

{
  "mood_type": "happy",
  "mood_intensity": 8,
  "notes": "Feeling great after exercise"
}

Response (201):
{
  "id": "uuid",
  "message": "Mood entry saved successfully"
}
```

---

## 🔐 Database Service Functions

### Mood Service
```javascript
class MoodService {
  async getRecentMoods(userId, limit = 5) {
    const query = `
      SELECT 
        id,
        mood_type,
        mood_intensity,
        notes,
        created_at,
        EXTRACT(EPOCH FROM created_at) as timestamp
      FROM mood_entries 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  async createMoodEntry(userId, moodData) {
    const query = `
      INSERT INTO mood_entries (user_id, mood_type, mood_intensity, notes)
      VALUES ($1, $2, $3, $4)
      RETURNING id, mood_type, created_at
    `;
    
    const values = [
      userId, 
      moodData.mood_type, 
      moodData.mood_intensity, 
      moodData.notes
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getMoodSummary(userId, days = 7) {
    const query = `
      SELECT 
        mood_type,
        COUNT(*) as count,
        AVG(mood_intensity) as average_intensity
      FROM mood_entries 
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY mood_type
      ORDER BY count DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}
```

### Resource Service
```javascript
class ResourceService {
  async getRecommendedResources(userId, limit = 5) {
    // Get resources based on user's recent mood patterns and preferences
    const query = `
      SELECT 
        r.id,
        r.title,
        r.description,
        r.content_type,
        r.duration_minutes,
        r.category,
        r.thumbnail_url,
        COALESCE(uri.progress_percentage, 0) as user_progress
      FROM resources r
      LEFT JOIN user_resource_interactions uri ON r.id = uri.resource_id AND uri.user_id = $1
      WHERE r.is_active = TRUE
      AND r.category IN (
        SELECT DISTINCT category 
        FROM resources 
        WHERE id IN (
          SELECT resource_id 
          FROM user_resource_interactions 
          WHERE user_id = $1 AND interaction_type = 'completed'
        )
        UNION
        SELECT 'mindfulness' -- Default category
      )
      ORDER BY 
        CASE WHEN uri.interaction_type IS NULL THEN 0 ELSE 1 END, -- Prioritize new resources
        r.created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  }

  async trackResourceInteraction(userId, resourceId, interactionType) {
    const query = `
      INSERT INTO user_resource_interactions (user_id, resource_id, interaction_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, resource_id) 
      DO UPDATE SET 
        interaction_type = EXCLUDED.interaction_type,
        last_accessed_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    
    const result = await pool.query(query, [userId, resourceId, interactionType]);
    return result.rows[0];
  }
}
```

### Dashboard Service
```javascript
class DashboardService {
  async getDashboardData(userId) {
    const [
      userResult,
      moodsResult,
      resourcesResult,
      statsResult
    ] = await Promise.all([
      pool.query('SELECT first_name, last_name, profile_image_url FROM users WHERE id = $1', [userId]),
      pool.query(`
        SELECT mood_type, created_at 
        FROM mood_entries 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 3
      `, [userId]),
      pool.query(`
        SELECT r.id, r.title, r.duration_minutes
        FROM resources r
        LEFT JOIN user_resource_interactions uri ON r.id = uri.resource_id AND uri.user_id = $1
        WHERE r.is_active = TRUE AND uri.id IS NULL
        ORDER BY r.created_at DESC
        LIMIT 3
      `, [userId]),
      pool.query(`
        SELECT 
          COUNT(*) as mood_entries_this_week,
          (SELECT COUNT(*) FROM journal_entries WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days') as journal_entries_this_month,
          (SELECT COUNT(*) FROM user_resource_interactions WHERE user_id = $1 AND interaction_type = 'completed') as resources_completed
        FROM mood_entries 
        WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
      `, [userId])
    ]);

    return {
      user: userResult.rows[0],
      recentMoods: moodsResult.rows,
      recommendedResources: resourcesResult.rows,
      quickStats: statsResult.rows[0]
    };
  }
}
```

---

## 🌐 Environment Configuration

### Required Environment Variables
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/safespace_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=safespace_db
DB_USER=safespace_user
DB_PASSWORD=secure_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# File Storage (for profile images)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=safespace-app

# Application URLs
APP_URL=https://safespace-app.com
API_URL=https://api.safespace-app.com
```
