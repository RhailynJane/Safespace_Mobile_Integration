# SafeSpace Journaling System - JOurnaling Documentation

## 📱 Frontend Journaling Components

### Component Architecture Overview

The journaling system consists of five main screens that provide a complete journaling experience:

1. **JournalScreen** (`/index`) - Main journal dashboard with recent entries
2. **JournalCreateScreen** (`/journal/journal-create`) - Create new journal entries
3. **JournalHistoryScreen** (`/journal/journal-history`) - Browse all journal entries
4. **JournalEditScreen** (`/journal/journal-edit/[id]`) - Edit existing entries
5. **JournalEntryScreen** (`/journal/journal-entry/[id]`) - View individual entries

---

### 1. JournalScreen Component
**File**: `app/(app)/journal/index.tsx`

**Purpose**: Main journal dashboard showing recent entries and quick actions

#### Key Features:
- **Create Journal Card**: Primary call-to-action for new entries
- **Recent Entries**: Displays last 2 journal entries with preview
- **Quick Navigation**: Links to create new entries and view full history
- **Empty State**: Encourages first-time journaling

#### UI Components:
- **Create Card**: Large button with icon, title, and subtitle
- **Entry Cards**: Preview cards showing title, date, and content snippet
- **View All Button**: Navigation to full history screen

#### Navigation Flow:
```typescript
const handleCreateJournal = () => router.push("/(app)/journal/journal-create");
const handleViewAllEntries = () => router.push("/(app)/journal/journal-history");
const handleEntryPress = (entryId: string) => router.push(`/(app)/journal/journal-entry/${entryId}`);
```

---

### 2. JournalCreateScreen Component
**File**: `app/(app)/journal/journal-create.tsx`

**Purpose**: Create new journal entries with emotion selection

#### Key Features:
- **Two-Step Process**: Creation → Success confirmation
- **Emotion Selection**: 5 emotional states with emojis
- **Form Validation**: Ensures title, content, and emotion are provided
- **Success Screen**: Confirmation with entry preview

#### Emotion Types:
```typescript
type EmotionType = "very-sad" | "sad" | "neutral" | "happy" | "very-happy";

const emotionOptions = [
  { id: "very-sad", emoji: "😢", label: "Very Sad" },
  { id: "sad", emoji: "🙁", label: "Sad" },
  { id: "neutral", emoji: "😐", label: "Neutral" },
  { id: "happy", emoji: "🙂", label: "Happy" },
  { id: "very-happy", emoji: "😄", label: "Very Happy" }
];
```

#### Form Data Structure:
```typescript
interface JournalData {
  title: string;
  content: string;
  emotion: EmotionType | null;
  emoji: string;
}
```

---

### 3. JournalHistoryScreen Component
**File**: `app/(app)/journal/journal-history.tsx`

**Purpose**: Browse and manage all journal entries

#### Key Features:
- **Filter System**: View entries by time period (All, Week, Month)
- **Expandable Cards**: Tap to read full content with tags
- **Floating Action Button**: Quick access to create new entries
- **Empty State**: Encourages journaling with call-to-action

#### Filter Types:
```typescript
type FilterType = "all" | "week" | "month";
```

#### Entry Display:
- **Title & Date**: Clear identification of each entry
- **Content Preview**: First few lines with "Read more" expansion
- **Tags**: Visual indicators of entry themes
- **Emoji**: Emotional state indicator

---

### 4. JournalEditScreen Component
**File**: `app/(app)/journal/journal-edit/[id].tsx`

**Purpose**: Edit existing journal entries

#### Key Features:
- **Pre-filled Form**: Loads existing entry data for editing
- **Same UI as Create**: Consistent experience with creation flow
- **Cancel Confirmation**: Prevents accidental data loss
- **Save Changes**: Updates entry with validation

#### Edit Flow:
1. Load existing entry data by ID
2. Pre-fill title, content, and emotion fields
3. Allow modifications with same validation as creation
4. Save changes or cancel with confirmation

---

### 5. JournalEntryScreen Component
**File**: `app/(app)/journal/journal-entry/[id].tsx`

**Purpose**: View individual journal entries in detail

#### Key Features:
- **Full Content Display**: Complete journal entry with formatting
- **Edit/Delete Actions**: Quick access to modify or remove entries
- **Tag Display**: Shows all associated tags
- **Mood Indicator**: Emotional state with emoji

#### Action Buttons:
- **Edit**: Navigates to edit screen
- **Delete**: Confirmation dialog before removal

---

## 🗄️ Backend Database Schema

### Core Journaling Tables

#### 1. Journal Entries Table
```sql
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    emotion_type VARCHAR(20) CHECK (emotion_type IN (
        'very-sad', 'sad', 'neutral', 'happy', 'very-happy'
    )),
    emotion_emoji VARCHAR(10),
    word_count INTEGER DEFAULT 0,
    reading_time_minutes INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_entries_emotion ON journal_entries(emotion_type);
```

#### 2. Journal Tags Table
```sql
CREATE TABLE journal_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Composite index for efficient tag queries
CREATE INDEX idx_journal_tags_entry ON journal_tags(journal_entry_id);
CREATE INDEX idx_journal_tags_tag ON journal_tags(tag);
```

#### 3. Journal Statistics Table (Optional - for analytics)
```sql
CREATE TABLE journal_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    entries_count INTEGER DEFAULT 0,
    total_words INTEGER DEFAULT 0,
    average_mood DECIMAL(3,2),
    most_used_tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint for daily user statistics
CREATE UNIQUE INDEX idx_journal_stats_user_date ON journal_statistics(user_id, date);
```

---

## 🔌 API Endpoints Specification

### Journal Management Endpoints

#### 1. Create Journal Entry
```http
POST /api/journal/entries
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "A Productive Day",
  "content": "Today I accomplished all my goals...",
  "emotion_type": "happy",
  "tags": ["productivity", "gratitude"]
}

Response (201):
{
  "id": "uuid",
  "title": "A Productive Day",
  "content": "Today I accomplished all my goals...",
  "emotion_type": "happy",
  "emotion_emoji": "🙂",
  "tags": ["productivity", "gratitude"],
  "word_count": 45,
  "reading_time_minutes": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### 2. Get Journal Entries (Paginated)
```http
GET /api/journal/entries?page=1&limit=10&filter=month
Authorization: Bearer <token>

Response (200):
{
  "entries": [
    {
      "id": "uuid",
      "title": "A Productive Day",
      "content_preview": "Today I accomplished all my goals...",
      "emotion_type": "happy",
      "emotion_emoji": "🙂",
      "tags": ["productivity", "gratitude"],
      "created_at": "2024-01-15T10:30:00Z",
      "word_count": 45
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_entries": 42,
    "has_next": true,
    "has_prev": false
  }
}
```

#### 3. Get Single Journal Entry
```http
GET /api/journal/entries/{entry_id}
Authorization: Bearer <token>

Response (200):
{
  "id": "uuid",
  "title": "A Productive Day",
  "content": "Full journal entry content...",
  "emotion_type": "happy",
  "emotion_emoji": "🙂",
  "tags": ["productivity", "gratitude"],
  "word_count": 45,
  "reading_time_minutes": 1,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### 4. Update Journal Entry
```http
PUT /api/journal/entries/{entry_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "emotion_type": "very-happy",
  "tags": ["updated", "tags"]
}

Response (200):
{
  "id": "uuid",
  "title": "Updated Title",
  "content": "Updated content...",
  "emotion_type": "very-happy",
  "emotion_emoji": "😄",
  "tags": ["updated", "tags"],
  "updated_at": "2024-01-15T11:30:00Z"
}
```

#### 5. Delete Journal Entry
```http
DELETE /api/journal/entries/{entry_id}
Authorization: Bearer <token>

Response (200):
{
  "message": "Journal entry deleted successfully"
}
```

#### 6. Get Journal Statistics
```http
GET /api/journal/statistics?period=30d
Authorization: Bearer <token>

Response (200):
{
  "period": "30d",
  "total_entries": 15,
  "total_words": 2450,
  "average_entries_per_week": 3.5,
  "emotion_distribution": {
    "very-happy": 3,
    "happy": 7,
    "neutral": 3,
    "sad": 2,
    "very-sad": 0
  },
  "most_used_tags": ["gratitude", "productivity", "family"]
}
```

---

## 🔐 Database Service Functions

### Journal Service
```javascript
class JournalService {
  async createJournalEntry(userId, entryData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Calculate word count and reading time
      const wordCount = entryData.content.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200); // 200 wpm reading speed
      
      // Insert main journal entry
      const entryQuery = `
        INSERT INTO journal_entries (
          user_id, title, content, emotion_type, emotion_emoji, 
          word_count, reading_time_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, title, content, emotion_type, emotion_emoji, 
                 word_count, reading_time_minutes, created_at
      `;
      
      const entryResult = await client.query(entryQuery, [
        userId,
        entryData.title,
        entryData.content,
        entryData.emotion_type,
        this.getEmojiForEmotion(entryData.emotion_type),
        wordCount,
        readingTime
      ]);
      
      const journalEntry = entryResult.rows[0];
      
      // Insert tags if provided
      if (entryData.tags && entryData.tags.length > 0) {
        const tagValues = entryData.tags.map(tag => 
          `('${journalEntry.id}', '${tag}')`
        ).join(',');
        
        const tagsQuery = `
          INSERT INTO journal_tags (journal_entry_id, tag)
          VALUES ${tagValues}
        `;
        
        await client.query(tagsQuery);
      }
      
      await client.query('COMMIT');
      
      return {
        ...journalEntry,
        tags: entryData.tags || []
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getJournalEntries(userId, page = 1, limit = 10, filter = 'all') {
    const offset = (page - 1) * limit;
    const dateFilter = this.getDateFilter(filter);
    
    const query = `
      SELECT 
        je.id,
        je.title,
        SUBSTRING(je.content FROM 1 FOR 150) as content_preview,
        je.emotion_type,
        je.emotion_emoji,
        je.word_count,
        je.created_at,
        ARRAY_AGG(jt.tag) FILTER (WHERE jt.tag IS NOT NULL) as tags
      FROM journal_entries je
      LEFT JOIN journal_tags jt ON je.id = jt.journal_entry_id
      WHERE je.user_id = $1 AND je.created_at >= $2
      GROUP BY je.id
      ORDER BY je.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM journal_entries 
      WHERE user_id = $1 AND created_at >= $2
    `;
    
    const [entriesResult, countResult] = await Promise.all([
      pool.query(query, [userId, dateFilter, limit, offset]),
      pool.query(countQuery, [userId, dateFilter])
    ]);
    
    const totalEntries = parseInt(countResult.rows[0].total_count);
    const totalPages = Math.ceil(totalEntries / limit);
    
    return {
      entries: entriesResult.rows,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_entries: totalEntries,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };
  }

  async getJournalEntry(userId, entryId) {
    const query = `
      SELECT 
        je.*,
        ARRAY_AGG(jt.tag) FILTER (WHERE jt.tag IS NOT NULL) as tags
      FROM journal_entries je
      LEFT JOIN journal_tags jt ON je.id = jt.journal_entry_id
      WHERE je.id = $1 AND je.user_id = $2
      GROUP BY je.id
    `;
    
    const result = await pool.query(query, [entryId, userId]);
    return result.rows[0];
  }

  async updateJournalEntry(userId, entryId, updateData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Recalculate word count and reading time if content changed
      const wordCount = updateData.content ? 
        updateData.content.split(/\s+/).length : null;
      const readingTime = wordCount ? Math.ceil(wordCount / 200) : null;
      
      // Build dynamic update query
      const updateFields = [];
      const values = [entryId, userId];
      let paramCount = 2;
      
      if (updateData.title) {
        paramCount++;
        updateFields.push(`title = $${paramCount}`);
        values.push(updateData.title);
      }
      
      if (updateData.content) {
        paramCount++;
        updateFields.push(`content = $${paramCount}`);
        values.push(updateData.content);
        
        paramCount++;
        updateFields.push(`word_count = $${paramCount}`);
        values.push(wordCount);
        
        paramCount++;
        updateFields.push(`reading_time_minutes = $${paramCount}`);
        values.push(readingTime);
      }
      
      if (updateData.emotion_type) {
        paramCount++;
        updateFields.push(`emotion_type = $${paramCount}`);
        values.push(updateData.emotion_type);
        
        paramCount++;
        updateFields.push(`emotion_emoji = $${paramCount}`);
        values.push(this.getEmojiForEmotion(updateData.emotion_type));
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      const updateQuery = `
        UPDATE journal_entries 
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, values);
      
      // Update tags if provided
      if (updateData.tags) {
        // Delete existing tags
        await client.query(
          'DELETE FROM journal_tags WHERE journal_entry_id = $1',
          [entryId]
        );
        
        // Insert new tags
        if (updateData.tags.length > 0) {
          const tagValues = updateData.tags.map(tag => 
            `('${entryId}', '${tag}')`
          ).join(',');
          
          const tagsQuery = `
            INSERT INTO journal_tags (journal_entry_id, tag)
            VALUES ${tagValues}
          `;
          
          await client.query(tagsQuery);
        }
      }
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteJournalEntry(userId, entryId) {
    const query = 'DELETE FROM journal_entries WHERE id = $1 AND user_id = $2';
    const result = await pool.query(query, [entryId, userId]);
    return result.rowCount > 0;
  }

  // Helper methods
  getEmojiForEmotion(emotionType) {
    const emojiMap = {
      'very-sad': '😢',
      'sad': '🙁',
      'neutral': '😐',
      'happy': '🙂',
      'very-happy': '😄'
    };
    return emojiMap[emotionType] || '😐';
  }

  getDateFilter(filter) {
    const now = new Date();
    switch (filter) {
      case 'week': return new Date(now.setDate(now.getDate() - 7));
      case 'month': return new Date(now.setDate(now.getDate() - 30));
      case 'all': return new Date(0); // Beginning of time
      default: return new Date(now.setDate(now.getDate() - 30)); // Default to month
    }
  }
}
```

### Journal Statistics Service
```javascript
class JournalStatisticsService {
  async getUserJournalStats(userId, period = '30d') {
    const dateFilter = this.getDateFilter(period);
    
    const query = `
      SELECT 
        COUNT(*) as total_entries,
        SUM(word_count) as total_words,
        emotion_type,
        COUNT(*) as emotion_count
      FROM journal_entries 
      WHERE user_id = $1 AND created_at >= $2
      GROUP BY emotion_type
      ORDER BY emotion_count DESC
    `;
    
    const tagsQuery = `
      SELECT 
        jt.tag,
        COUNT(*) as tag_count
      FROM journal_tags jt
      JOIN journal_entries je ON jt.journal_entry_id = je.id
      WHERE je.user_id = $1 AND je.created_at >= $2
      GROUP BY jt.tag
      ORDER BY tag_count DESC
      LIMIT 10
    `;
    
    const [emotionResult, tagsResult] = await Promise.all([
      pool.query(query, [userId, dateFilter]),
      pool.query(tagsQuery, [userId, dateFilter])
    ]);
    
    const totalEntries = emotionResult.rows.reduce((sum, row) => 
      sum + parseInt(row.emotion_count), 0
    );
    
    const totalWords = emotionResult.rows.reduce((sum, row) => 
      sum + parseInt(row.total_words || 0), 0
    );
    
    const emotionDistribution = emotionResult.rows.reduce((acc, row) => {
      acc[row.emotion_type] = parseInt(row.emotion_count);
      return acc;
    }, {});
    
    const mostUsedTags = tagsResult.rows.map(row => row.tag);
    
    return {
      period,
      total_entries: totalEntries,
      total_words: totalWords,
      average_entries_per_week: Math.round((totalEntries / 4.2857) * 10) / 10, // 30 days ≈ 4.2857 weeks
      emotion_distribution: emotionDistribution,
      most_used_tags: mostUsedTags
    };
  }

  getDateFilter(period) {
    const now = new Date();
    switch (period) {
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
      default: return new Date(now.setDate(now.getDate() - 30));
    }
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

# Journal Configuration
JOURNAL_ENTRIES_PER_PAGE=10
JOURNAL_MAX_CONTENT_LENGTH=10000
JOURNAL_READING_SPEED_WPM=200

# Application URLs
APP_URL=https://safespace-app.com
API_URL=https://api.safespace-app.com
```
