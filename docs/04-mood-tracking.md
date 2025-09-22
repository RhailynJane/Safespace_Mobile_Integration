/**
* LLM Prompt: Create comprehensive React Native component documentation covering frontend implementation details and backend integration specs including PostgreSQL schema design and REST API endpoints. 
* Reference: chat.deepseek.com
*/

# SafeSpace Mood Tracking System - Combined Documentation

## 📱 Frontend Mood Tracking Components

### Component Architecture Overview

The mood tracking system consists of three main screens that work together:

1. **MoodTrackingScreen** (`/mood-tracking`) - Main mood selection interface
2. **MoodLoggingScreen** (`/mood-tracking/mood-logging`) - Detailed mood entry with factors and notes
3. **MoodHistoryScreen** (`/mood-tracking/mood-history`) - Historical mood entries review

---

### 1. MoodTrackingScreen Component
**File**: `app/(app)/mood-tracking/index.tsx`

**Purpose**: Primary interface for mood selection with animated emojis

#### Key Features:
- **Animated Mood Emojis**: 5 mood types with scale and opacity animations
- **Visual Feedback**: Press animations with haptic-like visual responses
- **Recent Mood Display**: Shows last 3 mood entries
- **Navigation Flow**: Seamless transition to logging and history screens

#### Mood Types Configuration:
```typescript
type MoodType = "very-happy" | "happy" | "neutral" | "sad" | "very-sad";

const moodOptions = [
  { id: "very-happy", emoji: "😄", label: "Very Happy", color: "#4CAF50" },
  { id: "happy", emoji: "🙂", label: "Happy", color: "#8BC34A" },
  { id: "neutral", emoji: "😐", label: "Neutral", color: "#FFC107" },
  { id: "sad", emoji: "🙁", label: "Sad", color: "#FF9800" },
  { id: "very-sad", emoji: "😢", label: "Very Sad", color: "#F44336" }
];
```

#### Animation System:
```typescript
// Scale animation on press
Animated.spring(emoji.scale, {
  toValue: 1.2,  // 20% larger
  useNativeDriver: true,
  friction: 3,
}).start();

// Dim other emojis when one is selected
Animated.spring(emoji.opacity, {
  toValue: 0.3,  // 70% transparent
  useNativeDriver: true,
  friction: 3,
}).start();
```

---

### 2. MoodLoggingScreen Component
**File**: `app/(app)/mood-tracking/mood-logging.tsx`

**Purpose**: Detailed mood entry with intensity, factors, and notes

#### Key Features:
- **Intensity Slider**: 1-5 scale for mood strength
- **Factor Selection**: 8 predefined mood influencers
- **Notes Field**: Optional detailed description
- **Form Validation**: Ensures complete mood data capture

#### Mood Factors:
```typescript
const moodFactors = [
  "Family", "Health Concerns", "Sleep Quality", "Social Interaction",
  "Financial Stress", "Physical Activity", "Work/School Stress", "Weather"
];
```

#### Form Data Structure:
```typescript
const [moodData, setMoodData] = useState({
  type: selectedMood as MoodType,  // From navigation params
  intensity: 3,                    // Default medium intensity
  factors: [] as string[],         // Selected factors array
  notes: "",                       // User notes
});
```

---

### 3. MoodHistoryScreen Component
**File**: `app/(app)/mood-tracking/mood-history.tsx`

**Purpose**: Review and analyze historical mood entries

#### Key Features:
- **Chronological Display**: Mood entries sorted by date
- **Factor Tags**: Visual indicators of mood influencers
- **Intensity Ratings**: 1-5 scale display
- **Empty State**: Encouragement for first-time users

#### Mood Entry Display:
- **Emoji + Label**: Visual mood representation
- **Date/Time**: When the mood was recorded
- **Intensity**: Strength indicator (1-5)
- **Factors**: Tag-based influencer display
- **Notes**: Optional user comments

---

## 🗄️ Backend Database Schema

### Core Mood Tracking Tables

#### 1. Mood Entries Table
```sql
CREATE TABLE mood_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood_type VARCHAR(20) NOT NULL CHECK (mood_type IN (
        'very-happy', 'happy', 'neutral', 'sad', 'very-sad'
    )),
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at DESC);
CREATE INDEX idx_mood_entries_type ON mood_entries(mood_type);
```

#### 2. Mood Factors Junction Table
```sql
CREATE TABLE mood_entry_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mood_entry_id UUID REFERENCES mood_entries(id) ON DELETE CASCADE,
    factor VARCHAR(50) NOT NULL CHECK (factor IN (
        'Family', 'Health Concerns', 'Sleep Quality', 'Social Interaction',
        'Financial Stress', 'Physical Activity', 'Work/School Stress', 'Weather'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Composite index for efficient factor queries
CREATE INDEX idx_mood_factors_entry ON mood_entry_factors(mood_entry_id);
CREATE INDEX idx_mood_factors_type ON mood_entry_factors(factor);
```

#### 3. Mood Statistics Table (Optional - for analytics)
```sql
CREATE TABLE mood_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    average_mood DECIMAL(3,2) CHECK (average_mood >= 1 AND average_mood <= 5),
    mood_count INTEGER DEFAULT 0,
    predominant_mood VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint for daily user statistics
CREATE UNIQUE INDEX idx_mood_stats_user_date ON mood_statistics(user_id, date);
```

---

## 🔌 API Endpoints Specification

### Mood Tracking Endpoints

#### 1. Create Mood Entry
```http
POST /api/mood/entries
Authorization: Bearer <token>
Content-Type: application/json

{
  "mood_type": "happy",
  "intensity": 4,
  "factors": ["Social Interaction", "Physical Activity"],
  "notes": "Had a great workout with friends"
}

Response (201):
{
  "id": "uuid",
  "mood_type": "happy",
  "intensity": 4,
  "factors": ["Social Interaction", "Physical Activity"],
  "notes": "Had a great workout with friends",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### 2. Get Recent Mood Entries
```http
GET /api/mood/entries/recent?limit=10
Authorization: Bearer <token>

Response (200):
{
  "entries": [
    {
      "id": "uuid",
      "mood_type": "happy",
      "intensity": 4,
      "factors": ["Social Interaction"],
      "notes": "Good day at work",
      "created_at": "2024-01-15T10:30:00Z",
      "mood_emoji": "🙂",
      "mood_label": "Happy"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

#### 3. Get Mood History with Filters
```http
GET /api/mood/entries/history?start_date=2024-01-01&end_date=2024-01-15&mood_type=happy
Authorization: Bearer <token>

Response (200):
{
  "entries": [...],
  "summary": {
    "total_entries": 15,
    "average_intensity": 3.8,
    "mood_distribution": {
      "very-happy": 3,
      "happy": 7,
      "neutral": 3,
      "sad": 2,
      "very-sad": 0
    }
  }
}
```

#### 4. Get Mood Statistics
```http
GET /api/mood/statistics?period=7d  // 7d, 30d, 90d, 1y
Authorization: Bearer <token>

Response (200):
{
  "period": "7d",
  "average_mood": 3.8,
  "mood_trend": "improving",  // improving, declining, stable
  "most_common_factors": ["Social Interaction", "Physical Activity"],
  "entries_per_day": 2.1
}
```

---

## 🔐 Database Service Functions

### Mood Service
```javascript
class MoodService {
  async createMoodEntry(userId, moodData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert main mood entry
      const moodEntryQuery = `
        INSERT INTO mood_entries (user_id, mood_type, intensity, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING id, mood_type, intensity, notes, created_at
      `;
      
      const moodEntryResult = await client.query(moodEntryQuery, [
        userId, moodData.mood_type, moodData.intensity, moodData.notes
      ]);
      
      const moodEntry = moodEntryResult.rows[0];
      
      // Insert factors if provided
      if (moodData.factors && moodData.factors.length > 0) {
        const factorValues = moodData.factors.map(factor => 
          `('${moodEntry.id}', '${factor}')`
        ).join(',');
        
        const factorsQuery = `
          INSERT INTO mood_entry_factors (mood_entry_id, factor)
          VALUES ${factorValues}
        `;
        
        await client.query(factorsQuery);
      }
      
      await client.query('COMMIT');
      
      return {
        ...moodEntry,
        factors: moodData.factors || []
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getRecentMoodEntries(userId, limit = 10) {
    const query = `
      SELECT 
        me.id,
        me.mood_type,
        me.intensity,
        me.notes,
        me.created_at,
        ARRAY_AGG(mef.factor) FILTER (WHERE mef.factor IS NOT NULL) as factors
      FROM mood_entries me
      LEFT JOIN mood_entry_factors mef ON me.id = mef.mood_entry_id
      WHERE me.user_id = $1
      GROUP BY me.id
      ORDER BY me.created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, limit]);
    return result.rows.map(row => ({
      ...row,
      mood_emoji: this.getMoodEmoji(row.mood_type),
      mood_label: this.getMoodLabel(row.mood_type)
    }));
  }

  async getMoodStatistics(userId, period = '7d') {
    const dateFilter = this.getDateFilter(period);
    
    const query = `
      SELECT 
        COUNT(*) as total_entries,
        AVG(intensity) as average_intensity,
        mood_type,
        COUNT(*) as count
      FROM mood_entries 
      WHERE user_id = $1 AND created_at >= $2
      GROUP BY mood_type
      ORDER BY count DESC
    `;
    
    const result = await pool.query(query, [userId, dateFilter]);
    
    return {
      period,
      total_entries: parseInt(result.rows.reduce((sum, row) => sum + parseInt(row.count), 0)),
      average_intensity: parseFloat(result.rows[0]?.average_intensity || 0),
      mood_distribution: result.rows.reduce((acc, row) => {
        acc[row.mood_type] = parseInt(row.count);
        return acc;
      }, {})
    };
  }

  // Helper methods
  getMoodEmoji(moodType) {
    const emojiMap = {
      'very-happy': '😄',
      'happy': '🙂',
      'neutral': '😐',
      'sad': '🙁',
      'very-sad': '😢'
    };
    return emojiMap[moodType] || '😐';
  }

  getMoodLabel(moodType) {
    const labelMap = {
      'very-happy': 'Very Happy',
      'happy': 'Happy',
      'neutral': 'Neutral',
      'sad': 'Sad',
      'very-sad': 'Very Sad'
    };
    return labelMap[moodType] || 'Unknown';
  }

  getDateFilter(period) {
    const now = new Date();
    switch (period) {
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return new Date(now.setDate(now.getDate() - 7));
    }
  }
}
```

### Factor Analysis Service
```javascript
class FactorAnalysisService {
  async getFactorCorrelations(userId, period = '30d') {
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(period));
    
    const query = `
      SELECT 
        mef.factor,
        AVG(me.intensity) as avg_intensity,
        COUNT(*) as occurrence_count,
        mood_type,
        COUNT(*) as mood_count
      FROM mood_entry_factors mef
      JOIN mood_entries me ON mef.mood_entry_id = me.id
      WHERE me.user_id = $1 AND me.created_at >= $2
      GROUP BY mef.factor, me.mood_type
      ORDER BY occurrence_count DESC
    `;
    
    const result = await pool.query(query, [userId, dateFilter]);
    
    return result.rows.reduce((acc, row) => {
      if (!acc[row.factor]) {
        acc[row.factor] = {
          factor: row.factor,
          avg_intensity: parseFloat(row.avg_intensity),
          occurrence_count: parseInt(row.occurrence_count),
          mood_breakdown: {}
        };
      }
      acc[row.factor].mood_breakdown[row.mood_type] = parseInt(row.mood_count);
      return acc;
    }, {});
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

# Application Configuration
MOOD_ENTRY_LIMIT_DAILY=5
MOOD_HISTORY_RETENTION_DAYS=365
DEFAULT_MOOD_INTENSITY=3

# Analytics Configuration
MOOD_TREND_ANALYSIS_ENABLED=true
FACTOR_CORRELATION_ANALYSIS_ENABLED=true
```

### Database Connection Pool Configuration
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Error handling
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
```

