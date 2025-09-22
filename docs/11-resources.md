/**
* LLM Prompt: Create comprehensive React Native component documentation covering frontend implementation details and backend integration specs including PostgreSQL schema design and REST API endpoints. 
* Reference: chat.deepseek.com
*/

# Resources Module Frontend Documentation

## Overview

The Resources module provides a comprehensive library of mental health resources including articles, exercises, guides, and tools. It features intelligent categorization, search functionality, and personalized recommendations to help users find relevant mental health support materials.

## Component Architecture

### File Structure
```
resources/
├── index.tsx                 # Main resources library screen
└── understanding-anxiety.tsx # Individual resource detail screen
```

## Core Component

### ResourcesScreen (`index.tsx`)
**Purpose**: Main resources library with search, categorization, and resource browsing.

**Key Features**:
- Search functionality with real-time filtering
- Category-based resource organization
- Visual resource cards with metadata
- Horizontal category scrolling
- Responsive grid layout

**State Management**:
```typescript
const [sideMenuVisible, setSideMenuVisible] = useState(false);
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState("resources");
const [searchQuery, setSearchQuery] = useState("");
const [selectedCategory, setSelectedCategory] = useState("");
```

## Database Integration Guide

### PostgreSQL Schema Recommendations

#### Resources Table
```sql
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content TEXT, -- Full content for articles/guides
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN (
        'article', 'exercise', 'guide', 'video', 'audio', 'tool', 'worksheet'
    )),
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'stress', 'anxiety', 'depression', 'sleep', 'mindfulness', 
        'relationships', 'work', 'trauma', 'addiction', 'general'
    )),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN (
        'beginner', 'intermediate', 'advanced'
    )),
    duration_minutes INTEGER, -- Estimated time to complete
    content_url TEXT, -- External content link if applicable
    thumbnail_url TEXT, -- Image/thumbnail URL
    emoji_icon VARCHAR(10), -- Emoji representation
    color_hex VARCHAR(7), -- Brand color for the resource
    author VARCHAR(100),
    publisher VARCHAR(100),
    publication_date DATE,
    language VARCHAR(10) DEFAULT 'en',
    is_interactive BOOLEAN DEFAULT FALSE,
    requires_authentication BOOLEAN DEFAULT FALSE,
    accessibility_features VARCHAR(100)[], -- Array of features
    content_warnings VARCHAR(100)[], -- Array of warnings
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resources_difficulty ON resources(difficulty_level);
CREATE INDEX idx_resources_featured ON resources(is_featured) WHERE is_featured = true;
CREATE INDEX idx_resources_approved ON resources(is_approved) WHERE is_approved = true;
CREATE INDEX idx_resources_search ON resources USING gin(
    to_tsvector('english', title || ' ' || description)
);
```

#### Resource Categories Table
```sql
CREATE TABLE resource_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    emoji_icon VARCHAR(10),
    color_hex VARCHAR(7) DEFAULT '#666666',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    parent_category_id INTEGER REFERENCES resource_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate with common categories
INSERT INTO resource_categories (name, display_name, emoji_icon, color_hex, sort_order) VALUES
('stress', 'Stress Management', '💧', '#FF8A65', 1),
('anxiety', 'Anxiety', '🧠', '#81C784', 2),
('depression', 'Depression', '👥', '#64B5F6', 3),
('sleep', 'Sleep', '🛏️', '#4DD0E1', 4),
('mindfulness', 'Mindfulness', '🌿', '#AED581', 5),
('relationships', 'Relationships', '💑', '#F48FB1', 6);
```

#### User Resource Interactions Table
```sql
CREATE TABLE user_resource_interactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN (
        'view', 'bookmark', 'complete', 'share', 'rate', 'review'
    )),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    duration_seconds INTEGER, -- Time spent on resource
    completion_percentage DECIMAL(5,2) CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    device_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, resource_id, interaction_type) -- Prevent duplicate interactions
);

-- Indexes for analytics and recommendations
CREATE INDEX idx_user_interactions_user ON user_resource_interactions(user_id, created_at DESC);
CREATE INDEX idx_user_interactions_resource ON user_resource_interactions(resource_id);
CREATE INDEX idx_user_interactions_type ON user_resource_interactions(interaction_type);
```

#### Resource Tags Table (for advanced filtering)
```sql
CREATE TABLE resource_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE resource_tag_associations (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES resource_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(resource_id, tag_id)
);

CREATE INDEX idx_resource_tags_associations ON resource_tag_associations(resource_id, tag_id);
```

#### User Preferences for Recommendations
```sql
CREATE TABLE user_resource_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferred_categories VARCHAR(50)[],
    preferred_formats VARCHAR(50)[], -- article, video, audio, etc.
    preferred_difficulty VARCHAR(20),
    max_duration_minutes INTEGER,
    excluded_topics VARCHAR(100)[], -- Topics to avoid
    content_warnings VARCHAR(100)[], -- Warnings to respect
    learning_style VARCHAR(50), -- visual, auditory, kinesthetic
    last_recommendation_update TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
```

### API Endpoints Specification

#### Resources Endpoints
```typescript
// GET /api/resources - Get resources with filtering and pagination
interface GetResourcesParams {
  category?: string;
  search?: string;
  type?: string;
  difficulty?: string;
  durationMax?: number;
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'popularity' | 'recent' | 'rating';
}

// GET /api/resources/:id - Get specific resource details
interface ResourceDetailResponse {
  resource: Resource;
  userInteraction?: UserInteraction;
  relatedResources: Resource[];
}

// POST /api/resources/:id/interactions - Log user interaction
interface LogInteractionRequest {
  interactionType: 'view' | 'bookmark' | 'complete' | 'rate';
  rating?: number;
  reviewText?: string;
  durationSeconds?: number;
  completionPercentage?: number;
}

// GET /api/resources/categories - Get all categories
interface CategoriesResponse {
  categories: ResourceCategory[];
}
```

#### Recommendations Endpoints
```typescript
// GET /api/users/me/recommendations - Get personalized recommendations
interface GetRecommendationsParams {
  limit?: number;
  basedOn?: 'preferences' | 'history' | 'similar_users';
}

// POST /api/users/me/preferences - Update resource preferences
interface UpdatePreferencesRequest {
  preferredCategories?: string[];
  preferredFormats?: string[];
  preferredDifficulty?: string;
  maxDurationMinutes?: number;
  excludedTopics?: string[];
}
```

#### Analytics Endpoints
```typescript
// GET /api/resources/analytics/popular - Get popular resources
interface PopularResourcesParams {
  timeframe?: 'day' | 'week' | 'month' | 'all';
  limit?: number;
}

// GET /api/resources/analytics/engagement - Get engagement metrics
interface EngagementMetricsResponse {
  totalViews: number;
  averageCompletionRate: number;
  popularCategories: string[];
  peakUsageTimes: string[];
}
```

### Real-time Features Implementation

#### Resource Availability WebSocket
```typescript
// WebSocket events for real-time resource updates
interface ResourceWebSocketEvents {
  'resource:new': {
    resource: Resource;
    categories: string[];
  };
  
  'resource:updated': {
    resourceId: number;
    updates: Partial<Resource>;
  };
  
  'resource:trending': {
    resourceId: number;
    trend: 'up' | 'down';
    reason: string;
  };
  
  'recommendation:refresh': {
    userId: string;
    newRecommendations: Resource[];
  };
}
```

#### Real-time Search Implementation
```typescript
// Search service with debouncing and suggestions
class ResourceSearchService {
  private searchTimeout: NodeJS.Timeout | null = null;
  
  async searchResources(query: string, filters: SearchFilters): Promise<Resource[]> {
    // Cancel previous search if new one comes in
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    return new Promise((resolve) => {
      this.searchTimeout = setTimeout(async () => {
        try {
          const response = await api.get('/api/resources', {
            params: { search: query, ...filters }
          });
          resolve(response.data.resources);
        } catch (error) {
          console.error('Search failed:', error);
          resolve([]);
        }
      }, 300); // 300ms debounce
    });
  }
  
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    if (query.length < 2) return [];
    
    const response = await api.get('/api/resources/suggestions', {
      params: { q: query }
    });
    return response.data.suggestions;
  }
}
```

### Data Flow Integration

#### 1. Resource Service Layer
```typescript
// services/resourceService.ts
export const resourceService = {
  getResources: async (params: GetResourcesParams): Promise<Resource[]> => {
    const response = await api.get('/api/resources', { params });
    return response.data.resources;
  },
  
  getResource: async (resourceId: number): Promise<Resource> => {
    const response = await api.get(`/api/resources/${resourceId}`);
    return response.data.resource;
  },
  
  logInteraction: async (resourceId: number, interaction: LogInteractionRequest): Promise<void> => {
    await api.post(`/api/resources/${resourceId}/interactions`, interaction);
  },
  
  getCategories: async (): Promise<ResourceCategory[]> => {
    const response = await api.get('/api/resources/categories');
    return response.data.categories;
  },
  
  getRecommendations: async (params?: GetRecommendationsParams): Promise<Resource[]> => {
    const response = await api.get('/api/users/me/recommendations', { params });
    return response.data.recommendations;
  }
};
```

#### 2. Frontend Data Management
```typescript
// In ResourcesScreen component
const [resources, setResources] = useState<Resource[]>([]);
const [categories, setCategories] = useState<ResourceCategory[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadInitialData();
}, []);

// Load categories and initial resources
const loadInitialData = async () => {
  try {
    const [categoriesData, resourcesData] = await Promise.all([
      resourceService.getCategories(),
      resourceService.getResources({ limit: 20, sortBy: 'popularity' })
    ]);
    
    setCategories(categoriesData);
    setResources(resourcesData);
  } catch (error) {
    console.error('Failed to load initial data:', error);
  } finally {
    setLoading(false);
  }
};

// Handle search with debouncing
const handleSearch = useCallback(
  debounce(async (query: string) => {
    if (query.trim() === '') {
      await loadInitialData();
      return;
    }
    
    try {
      const results = await resourceService.getResources({
        search: query,
        category: selectedCategory || undefined
      });
      setResources(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, 500),
  [selectedCategory]
);
```

#### 3. User Interaction Tracking
```typescript
// Hook for tracking resource interactions
const useResourceTracking = () => {
  const trackView = async (resourceId: number) => {
    try {
      await resourceService.logInteraction(resourceId, {
        interactionType: 'view',
        deviceInfo: getDeviceInfo()
      });
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };
  
  const trackCompletion = async (resourceId: number, durationSeconds: number) => {
    try {
      await resourceService.logInteraction(resourceId, {
        interactionType: 'complete',
        durationSeconds,
        completionPercentage: 100
      });
    } catch (error) {
      console.error('Failed to track completion:', error);
    }
  };
  
  return { trackView, trackCompletion };
};

// Usage in component
const ResourceCard = ({ resource }) => {
  const { trackView } = useResourceTracking();
  
  const handlePress = () => {
    // Track the view before navigation
    trackView(resource.id);
    router.push(`/resources/${resource.id}`);
  };
  
  return (
    <TouchableOpacity onPress={handlePress}>
      {/* Resource card content */}
    </TouchableOpacity>
  );
};
```

### Advanced Features Implementation

#### 1. Personalized Recommendation Engine
```sql
-- Materialized view for recommendation calculations
CREATE MATERIALIZED VIEW resource_recommendations AS
SELECT 
    ur.user_id,
    r.id as resource_id,
    r.title,
    r.category,
    -- Calculate recommendation score based on multiple factors
    (
        -- Category preference weight (40%)
        (CASE WHEN up.preferred_categories IS NULL OR r.category = ANY(up.preferred_categories) 
              THEN 0.4 ELSE 0.1 END) +
        -- Difficulty match weight (20%)
        (CASE WHEN up.preferred_difficulty IS NULL OR r.difficulty_level = up.preferred_difficulty 
              THEN 0.2 ELSE 0.05 END) +
        -- Duration preference weight (15%)
        (CASE WHEN up.max_duration_minutes IS NULL OR r.duration_minutes <= up.max_duration_minutes 
              THEN 0.15 ELSE 0.02 END) +
        -- Popularity weight (15%)
        (r.average_rating * 0.15) +
        -- Recency weight (10%)
        (CASE WHEN r.created_at > CURRENT_DATE - INTERVAL '30 days' THEN 0.1 ELSE 0.02 END)
    ) as recommendation_score,
    r.created_at
FROM users u
CROSS JOIN resources r
LEFT JOIN user_resource_preferences up ON u.id = up.user_id
WHERE r.is_approved = true
AND NOT EXISTS (
    SELECT 1 FROM user_resource_interactions uri 
    WHERE uri.user_id = u.id AND uri.resource_id = r.id
)
ORDER BY recommendation_score DESC;

CREATE UNIQUE INDEX idx_recommendations_user_resource ON resource_recommendations(user_id, resource_id);
CREATE INDEX idx_recommendations_score ON resource_recommendations(user_id, recommendation_score DESC);

-- Refresh recommendations periodically
CREATE OR REPLACE FUNCTION refresh_recommendations()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY resource_recommendations;
END;
$$ LANGUAGE plpgsql;
```

#### 2. Advanced Search with Full-Text Search
```sql
-- Enhanced search functionality
CREATE OR REPLACE FUNCTION search_resources(
    search_query TEXT,
    category_filter VARCHAR[] DEFAULT NULL,
    type_filter VARCHAR[] DEFAULT NULL,
    difficulty_filter VARCHAR[] DEFAULT NULL,
    max_duration INTEGER DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
) RETURNS TABLE(
    resource_id INTEGER,
    title VARCHAR,
    description TEXT,
    resource_type VARCHAR,
    category VARCHAR,
    difficulty_level VARCHAR,
    duration_minutes INTEGER,
    search_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.title,
        r.description,
        r.resource_type,
        r.category,
        r.difficulty_level,
        r.duration_minutes,
        ts_rank(
            to_tsvector('english', coalesce(r.title, '') || ' ' || coalesce(r.description, '')),
            plainto_tsquery('english', search_query)
        ) as search_rank
    FROM resources r
    WHERE (
        search_query IS NULL OR 
        to_tsvector('english', coalesce(r.title, '') || ' ' || coalesce(r.description, '')) 
        @@ plainto_tsquery('english', search_query)
    )
    AND (category_filter IS NULL OR r.category = ANY(category_filter))
    AND (type_filter IS NULL OR r.resource_type = ANY(type_filter))
    AND (difficulty_filter IS NULL OR r.difficulty_level = ANY(difficulty_filter))
    AND (max_duration IS NULL OR r.duration_minutes <= max_duration)
    AND r.is_approved = true
    ORDER BY search_rank DESC, r.view_count DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Content Engagement Analytics
```sql
-- Comprehensive engagement analytics
CREATE MATERIALIZED VIEW resource_engagement_metrics AS
SELECT 
    r.id as resource_id,
    r.title,
    r.category,
    r.resource_type,
    COUNT(uri.id) as total_interactions,
    COUNT(uri.id) FILTER (WHERE uri.interaction_type = 'view') as view_count,
    COUNT(uri.id) FILTER (WHERE uri.interaction_type = 'complete') as completion_count,
    COUNT(uri.id) FILTER (WHERE uri.interaction_type = 'bookmark') as bookmark_count,
    AVG(uri.rating) FILTER (WHERE uri.rating IS NOT NULL) as average_rating,
    COUNT(uri.rating) as rating_count,
    AVG(uri.duration_seconds) as average_duration_seconds,
    AVG(uri.completion_percentage) as average_completion_rate,
    COUNT(DISTINCT uri.user_id) as unique_users
FROM resources r
LEFT JOIN user_resource_interactions uri ON r.id = uri.resource_id
WHERE r.is_approved = true
GROUP BY r.id, r.title, r.category, r.resource_type;

CREATE UNIQUE INDEX idx_engagement_metrics_resource ON resource_engagement_metrics(resource_id);
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Partitioning for large interaction tables
CREATE TABLE user_resource_interactions_2024 
PARTITION OF user_resource_interactions 
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Connection pooling configuration
-- Consider using PgBouncer for connection pooling

-- Query performance monitoring
CREATE INDEX CONCURRENTLY idx_resources_created_approved 
ON resources(created_at DESC) 
WHERE is_approved = true;

CREATE INDEX CONCURRENTLY idx_interactions_user_date 
ON user_resource_interactions(user_id, created_at DESC);
```

#### 2. Frontend Performance
```typescript
// Virtual scrolling for large resource lists
import { FlashList } from '@shopify/flash-list';

const ResourceList = ({ resources }) => (
  <FlashList
    data={resources}
    renderItem={({ item }) => <ResourceCard resource={item} />}
    estimatedItemSize={120}
    keyExtractor={(item) => item.id.toString()}
  />
);

// Image caching and lazy loading
import { CachedImage } from '@georstat/react-native-image-cache';

const ResourceImage = ({ imageUrl, emojiIcon }) => (
  <View style={styles.imageContainer}>
    {imageUrl ? (
      <CachedImage
        source={imageUrl}
        style={styles.image}
        resizeMode="cover"
        loadingImageComponent={<ActivityIndicator />}
      />
    ) : (
      <Text style={styles.emoji}>{emojiIcon}</Text>
    )}
  </View>
);
```

