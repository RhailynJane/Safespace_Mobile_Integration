# Profile & Home Module Frontend Documentation

## Overview

The Profile and Home modules provide comprehensive user management, personalization, and dashboard functionality. These modules feature user profile management, settings customization, help/support systems, and a personalized home dashboard with quick access to key features.

## Component Architecture

### File Structure
```
profile/
├── index.tsx                 # Main profile screen
├── edit.tsx                 # Profile editing screen
├── settings.tsx             # App settings screen
└── help-support.tsx         # Help and support screen
```

## Core Components

### 1. ProfileScreen (`profile/index.tsx`)
**Purpose**: Main user profile interface displaying personal information and account options.

**Key Features**:
- User profile display with avatar/initials
- Menu navigation to edit profile, settings, help
- Sign out functionality
- Local storage integration for profile data

**State Management**:
```typescript
const [activeTab, setActiveTab] = useState("profile");
const [profileImage, setProfileImage] = useState<string | null>(null);
const [profileData, setProfileData] = useState({...});
```

### 2. EditProfileScreen (`profile/edit.tsx`)
**Purpose**: Comprehensive profile editing interface with image upload and location autocomplete.

**Key Features**:
- Profile photo upload (camera/gallery)
- Form validation and local storage
- Location autocomplete with suggestions
- Notification preferences

### 3. SettingsScreen (`profile/settings.tsx`)
**Purpose**: Extensive app customization and configuration interface.

**Key Features**:
- Dark/light mode toggle
- Accessibility settings (text size, contrast, motion)
- Privacy and security controls
- Notification management
- Wellbeing features configuration

### 4. HelpSupportScreen (`profile/help-support.tsx`)
**Purpose**: Comprehensive help system with crisis support and FAQs.

**Key Features**:
- Crisis support hotlines with direct calling
- Expandable help sections
- FAQ and troubleshooting guides
- Contact support options

## Database Integration Guide

### PostgreSQL Schema Recommendations

#### Users Table (Extended)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    display_name VARCHAR(100),
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    location JSONB, -- {city: string, state: string, country: string, timezone: string}
    avatar_url TEXT,
    bio TEXT,
    preferred_language VARCHAR(10) DEFAULT 'en',
    theme_preference VARCHAR(20) DEFAULT 'light', -- light/dark/system
    text_size VARCHAR(20) DEFAULT 'medium', -- small/medium/large/x-large
    high_contrast BOOLEAN DEFAULT FALSE,
    reduce_motion BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for user lookup and performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_online ON users(is_online, last_seen_at);
CREATE INDEX idx_users_created ON users(created_at);
```

#### User Settings Table
```sql
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'privacy', 'notifications', 'accessibility', 'wellbeing'
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category, setting_key)
);

-- Index for efficient settings retrieval
CREATE INDEX idx_user_settings_user ON user_settings(user_id, category);
```

#### Emergency Contacts Table
```sql
CREATE TABLE emergency_contacts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50), -- family, friend, therapist, doctor
    phone_number VARCHAR(20),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    can_receive_alerts BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emergency_contacts_user ON emergency_contacts(user_id);
```

#### Mood Tracking Table
```sql
CREATE TABLE mood_entries (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood_type VARCHAR(20) NOT NULL CHECK (mood_type IN (
        'very-happy', 'happy', 'neutral', 'sad', 'very-sad', 'anxious', 
        'stressed', 'angry', 'tired', 'energetic'
    )),
    intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
    notes TEXT,
    tags TEXT[], -- Array of tags like ['work', 'family', 'health']
    location JSONB,
    weather JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for mood analytics
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, created_at DESC);
CREATE INDEX idx_mood_entries_type ON mood_entries(mood_type);
CREATE INDEX idx_mood_entries_public ON mood_entries(is_public, created_at DESC);
```

#### User Resources Table (For Recommendations)
```sql
CREATE TABLE user_resources (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES resources(id), -- If you have a resources table
    resource_type VARCHAR(50) NOT NULL, -- article, video, exercise, tool
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_url TEXT,
    duration_minutes INTEGER,
    category VARCHAR(50), -- mindfulness, coping, education, crisis
    difficulty_level VARCHAR(20), -- beginner, intermediate, advanced
    viewed_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    recommended_based_on JSONB, -- Algorithm data for why this was recommended
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_resources_user ON user_resources(user_id, created_at DESC);
CREATE INDEX idx_user_resources_category ON user_resources(category);
CREATE INDEX idx_user_resources_bookmarked ON user_resources(user_id, is_bookmarked);
```

### API Endpoints Specification

#### User Profile Endpoints
```typescript
// GET /api/users/me - Get current user profile
interface UserProfileResponse {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  location: LocationData;
  settings: UserSettings;
  emergencyContacts: EmergencyContact[];
}

// PUT /api/users/me - Update user profile
interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  location?: LocationData;
  bio?: string;
}

// POST /api/users/me/avatar - Upload profile avatar
interface UploadAvatarResponse {
  avatarUrl: string;
}

// DELETE /api/users/me - Delete user account (soft delete)
```

#### Settings Endpoints
```typescript
// GET /api/users/me/settings - Get all user settings
interface UserSettingsResponse {
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
  wellbeing: WellbeingSettings;
}

// PUT /api/users/me/settings - Update user settings
interface UpdateSettingsRequest {
  category: 'privacy' | 'notifications' | 'accessibility' | 'wellbeing';
  settings: Record<string, any>;
}

// GET /api/users/me/settings/categories/:category - Get specific category settings
```

#### Emergency Contacts Endpoints
```typescript
// GET /api/users/me/emergency-contacts - Get emergency contacts
interface EmergencyContactsResponse {
  contacts: EmergencyContact[];
}

// POST /api/users/me/emergency-contacts - Add emergency contact
interface AddEmergencyContactRequest {
  name: string;
  relationship: string;
  phoneNumber: string;
  email?: string;
  isPrimary?: boolean;
  canReceiveAlerts?: boolean;
}

// PUT /api/users/me/emergency-contacts/:id - Update emergency contact
// DELETE /api/users/me/emergency-contacts/:id - Remove emergency contact
```

#### Mood Tracking Endpoints
```typescript
// GET /api/users/me/mood-entries - Get mood history with pagination
interface GetMoodEntriesParams {
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// POST /api/users/me/mood-entries - Create new mood entry
interface CreateMoodEntryRequest {
  moodType: string;
  intensity?: number;
  notes?: string;
  tags?: string[];
  isPublic?: boolean;
}

// GET /api/users/me/mood-analytics - Get mood insights and analytics
interface MoodAnalyticsResponse {
  weeklyAverage: number;
  monthlyTrend: MoodTrend[];
  commonTriggers: string[];
  moodPatterns: MoodPattern[];
}
```

### Real-time Features Implementation

#### WebSocket Events for Home Dashboard
```typescript
// WebSocket event types for real-time updates
interface HomeWebSocketEvents {
  'mood:new': {
    userId: string;
    moodEntry: MoodEntry;
  };
  'resource:recommended': {
    userId: string;
    resource: Resource;
    reason: string;
  };
  'reminder:triggered': {
    userId: string;
    reminderType: string;
    message: string;
  };
  'emergency:alert': {
    userId: string;
    contactId: string;
    alertType: string;
  };
}
```

#### Push Notifications Service
```typescript
// Notification service for wellbeing reminders
class NotificationService {
  async scheduleWellbeingReminders(userId: string, preferences: NotificationPreferences) {
    // Schedule based on user preferences
    if (preferences.dailyCheckin) {
      await this.scheduleDailyCheckin(userId);
    }
    
    if (preferences.breakReminders) {
      await this.scheduleBreakReminders(userId);
    }
    
    if (preferences.moodReminders) {
      await this.scheduleMoodReminders(userId);
    }
  }
  
  async sendCrisisSupportNotification(userId: string, resources: CrisisResource[]) {
    // Send immediate crisis support resources
  }
}
```

### Data Flow Integration

#### 1. Authentication Context Integration
Replace mock user data with actual authentication:
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const { user, profile, loading } = useContext(AuthContext);
  return { user, profile, loading };
};

// In components, replace mock data:
const { user, profile, loading } = useAuth();
```

#### 2. API Service Layer
Create comprehensive service functions:
```typescript
// services/userService.ts
export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  updateProfile: async (updates: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.put('/users/me', updates);
    return response.data;
  },
  
  uploadAvatar: async (imageUri: string): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    });
    
    const response = await api.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  getSettings: async (): Promise<UserSettings> => {
    const response = await api.get('/users/me/settings');
    return response.data;
  },
  
  updateSettings: async (category: string, settings: any): Promise<UserSettings> => {
    const response = await api.put('/users/me/settings', { category, settings });
    return response.data;
  }
};
```

#### 3. Home Dashboard Data Integration
```typescript
// In HomeScreen component
const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadDashboardData();
}, []);

const loadDashboardData = async () => {
  try {
    const [moodData, resourcesData, appointmentsData] = await Promise.all([
      moodService.getRecentMoods({ limit: 3 }),
      resourceService.getRecommendedResources(),
      appointmentService.getUpcomingAppointments()
    ]);
    
    setDashboardData({
      recentMoods: moodData.entries,
      recommendedResources: resourcesData.resources,
      upcomingAppointments: appointmentsData.appointments,
      wellbeingScore: moodData.wellbeingScore
    });
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 4. Settings Synchronization
```typescript
// hooks/useSettings.ts
export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  
  const updateSetting = async (category: string, key: string, value: any) => {
    try {
      // Optimistic update
      setSettings(prev => ({
        ...prev!,
        [category]: { ...prev![category], [key]: value }
      }));
      
      // Sync with backend
      await userService.updateSettings(category, { [key]: value });
    } catch (error) {
      // Revert on error
      console.error('Failed to update setting:', error);
    }
  };
  
  return { settings, updateSetting };
};
```

### Advanced Features Implementation

#### 1. Location-Based Services
```sql
-- Extended location services
CREATE TABLE user_locations (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address JSONB,
    type VARCHAR(20) CHECK (type IN ('home', 'work', 'favorite', 'crisis_center')),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_locations_user ON user_locations(user_id);
CREATE INDEX idx_user_locations_type ON user_locations(type);
```

#### 2. Mood Analytics and Insights
```sql
-- Materialized view for mood analytics
CREATE MATERIALIZED VIEW mood_analytics AS
SELECT 
    user_id,
    DATE(created_at) as date,
    COUNT(*) as entry_count,
    AVG(CASE 
        WHEN mood_type = 'very-happy' THEN 5
        WHEN mood_type = 'happy' THEN 4
        WHEN mood_type = 'neutral' THEN 3
        WHEN mood_type = 'sad' THEN 2
        WHEN mood_type = 'very-sad' THEN 1
        ELSE 3 
    END) as average_score,
    MODE() WITHIN GROUP (ORDER BY mood_type) as most_common_mood
FROM mood_entries 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, DATE(created_at);

CREATE UNIQUE INDEX idx_mood_analytics_user_date ON mood_analytics(user_id, date);
```

#### 3. Personalized Resource Recommendations
```sql
-- Recommendation engine data
CREATE TABLE user_behavior (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'view', 'complete', 'bookmark', 'share'
    resource_type VARCHAR(50),
    resource_id INTEGER,
    duration_seconds INTEGER,
    completion_rate DECIMAL(5,2),
    interest_score INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_behavior_user ON user_behavior(user_id, created_at DESC);
CREATE INDEX idx_user_behavior_interest ON user_behavior(user_id, interest_score DESC);
```

### Security and Privacy Implementation

#### 1. Data Encryption
```sql
-- Encrypted sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE user_private_data (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ssn_encrypted BYTEA, -- Encrypted social security number
    insurance_data_encrypted BYTEA,
    medical_history_encrypted BYTEA,
    encryption_key_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Privacy Controls
```sql
-- Granular privacy settings
CREATE TYPE privacy_level AS ENUM ('private', 'friends', 'therapists', 'public');

CREATE TABLE user_privacy_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL, -- 'mood_visibility', 'profile_visibility', etc.
    privacy_level privacy_level NOT NULL DEFAULT 'private',
    custom_allowed_users UUID[], -- Specific users who can access
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);
```

#### 3. Audit Logging
```sql
-- Comprehensive audit trail
CREATE TABLE user_audit_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_audit_log_user ON user_audit_log(user_id, created_at DESC);
CREATE INDEX idx_user_audit_log_action ON user_audit_log(action, created_at);
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Partitioning for large tables
CREATE TABLE mood_entries_2024 PARTITION OF mood_entries 
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Query optimization indexes
CREATE INDEX CONCURRENTLY idx_mood_entries_user_created 
ON mood_entries(user_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Full-text search for resources
CREATE INDEX idx_resources_search ON resources 
USING gin(to_tsvector('english', title || ' ' || description));
```

#### 2. Caching Strategy
```typescript
// React Query for data caching
const { data: dashboardData } = useQuery({
  queryKey: ['dashboard', userId],
  queryFn: () => dashboardService.getDashboardData(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});

// Settings cache with optimistic updates
const queryClient = useQueryClient();

const updateSettings = useMutation({
  mutationFn: (newSettings: Partial<UserSettings>) => 
    userService.updateSettings(newSettings),
  onMutate: async (newSettings) => {
    await queryClient.cancelQueries({ queryKey: ['settings'] });
    
    const previousSettings = queryClient.getQueryData(['settings']);
    queryClient.setQueryData(['settings'], (old: UserSettings) => ({
      ...old,
      ...newSettings
    }));
    
    return { previousSettings };
  },
  onError: (err, newSettings, context) => {
    queryClient.setQueryData(['settings'], context?.previousSettings);
  }
});
```

