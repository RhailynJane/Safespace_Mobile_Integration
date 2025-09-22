/**
* LLM Prompt: Create comprehensive React Native component documentation covering frontend implementation details and backend integration specs including PostgreSQL schema design and REST API endpoints. 
* Reference: chat.deepseek.com
*/

# Crisis Support Module Frontend Documentation

## Overview

The Crisis Support module provides immediate emergency assistance resources for users in mental health crises. It features urgent contact options, immediate coping strategies, and grounding techniques designed for high-stress situations. The interface prioritizes clarity, accessibility, and rapid access to life-saving resources.

## Component Architecture

### File Structure
```
crisis-support/
└── index.tsx                 # Main crisis support screen
```

## Core Component

### CrisisScreen (`index.tsx`)
**Purpose**: Emergency support interface for immediate crisis intervention.

**Key Features**:
- High-visibility emergency contact buttons (911, crisis hotlines)
- Immediate coping strategies checklist
- 5-4-3-2-1 grounding technique guide
- Clear, urgent interface design with red accent colors
- One-tap emergency calling functionality

**State Management**:
```typescript
const [sideMenuVisible, setSideMenuVisible] = useState(false);
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState("crisis");
```

## Database Integration Guide

### PostgreSQL Schema Recommendations

#### Crisis Resources Table
```sql
CREATE TABLE crisis_resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g., "National Suicide Prevention Lifeline"
    phone_number VARCHAR(20) NOT NULL, -- e.g., "988"
    website_url VARCHAR(255),
    description TEXT,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN (
        'emergency', 'hotline', 'text', 'online_chat', 'local', 'international'
    )),
    languages_available VARCHAR(100)[] DEFAULT '{English}',
    operating_hours JSONB, -- {timezone: string, hours: json}
    specialization VARCHAR(100)[], -- Array of specialties
    is_24_7 BOOLEAN DEFAULT FALSE,
    geographic_coverage VARCHAR(100), -- "National", "Regional", "Local"
    verification_status VARCHAR(20) DEFAULT 'pending', -- verified/pending/rejected
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient crisis resource lookup
CREATE INDEX idx_crisis_resources_type ON crisis_resources(service_type);
CREATE INDEX idx_crisis_resources_24_7 ON crisis_resources(is_24_7) WHERE is_24_7 = true;
CREATE INDEX idx_crisis_resources_verified ON crisis_resources(verification_status) WHERE verification_status = 'verified';
```

#### User Crisis Contacts Table
```sql
CREATE TABLE user_crisis_contacts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50), -- family, friend, therapist, etc.
    phone_number VARCHAR(20),
    email VARCHAR(255),
    is_emergency_contact BOOLEAN DEFAULT TRUE,
    can_receive_alerts BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{"sms": true, "call": true, "email": false}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, phone_number)
);

CREATE INDEX idx_user_crisis_contacts_user ON user_crisis_contacts(user_id);
```

#### Crisis Intervention Sessions Table
```sql
CREATE TABLE crisis_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN (
        'hotline_call', 'text_chat', 'grounding_exercise', 'safety_plan'
    )),
    resource_id INTEGER REFERENCES crisis_resources(id),
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    crisis_level INTEGER CHECK (crisis_level >= 1 AND crisis_level <= 10),
    primary_concern VARCHAR(100),
    coping_strategies_used TEXT[],
    outcome VARCHAR(20) CHECK (outcome IN ('resolved', 'escalated', 'referred', 'ongoing')),
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_scheduled TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for crisis analytics and reporting
CREATE INDEX idx_crisis_sessions_user_date ON crisis_sessions(user_id, start_time DESC);
CREATE INDEX idx_crisis_sessions_type ON crisis_sessions(session_type);
CREATE INDEX idx_crisis_sessions_outcome ON crisis_sessions(outcome);
```

#### Safety Plans Table
```sql
CREATE TABLE safety_plans (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    warning_signs TEXT[], -- Array of personal warning signs
    coping_strategies TEXT[], -- Array of coping strategies
    social_contacts JSONB, -- {name: string, phone: string, relationship: string}[]
    professional_contacts JSONB, -- {service: string, contact: string, hours: string}[]
    emergency_services JSONB, -- Local emergency services information
    safe_environments TEXT[], -- Places to go when feeling unsafe
    reasons_to_live TEXT[], -- Personal reasons to stay safe
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_safety_plans_user ON safety_plans(user_id, is_active);
```

#### Grounding Exercises Table
```sql
CREATE TABLE grounding_exercises (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- e.g., "5-4-3-2-1 Technique"
    description TEXT NOT NULL,
    steps JSONB NOT NULL, -- Array of step instructions
    category VARCHAR(50) CHECK (category IN ('sensory', 'cognitive', 'physical', 'mindfulness')),
    duration_minutes INTEGER,
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
    effectiveness_rating DECIMAL(3,2), -- Average user rating
    tags VARCHAR(100)[],
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_grounding_exercises_category ON grounding_exercises(category);
CREATE INDEX idx_grounding_exercises_difficulty ON grounding_exercises(difficulty_level);
```

### API Endpoints Specification

#### Crisis Resources Endpoints
```typescript
// GET /api/crisis/resources - Get crisis resources with filtering
interface GetCrisisResourcesParams {
  serviceType?: string;
  is24_7?: boolean;
  geographicCoverage?: string;
  specialization?: string;
  limit?: number;
}

// GET /api/crisis/resources/nearby - Get local crisis resources by location
interface NearbyResourcesParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
}

// POST /api/crisis/sessions - Log a crisis intervention session
interface CreateCrisisSessionRequest {
  sessionType: string;
  resourceId?: number;
  crisisLevel: number;
  primaryConcern: string;
  copingStrategies?: string[];
}

// PUT /api/crisis/sessions/:id/end - End a crisis session
interface EndCrisisSessionRequest {
  outcome: string;
  notes?: string;
  followUpRequired?: boolean;
}
```

#### Safety Plan Endpoints
```typescript
// GET /api/users/me/safety-plan - Get user's safety plan
interface SafetyPlanResponse {
  plan: SafetyPlan;
  lastReviewed: string;
  nextReviewDate: string;
}

// POST /api/users/me/safety-plan - Create or update safety plan
interface UpdateSafetyPlanRequest {
  planName: string;
  warningSigns: string[];
  copingStrategies: string[];
  socialContacts: EmergencyContact[];
  professionalContacts: ProfessionalContact[];
}

// POST /api/users/me/safety-plan/review - Log safety plan review
interface SafetyPlanReviewRequest {
  changesMade: boolean;
  changesDescription?: string;
  comfortLevel: number; // 1-10 scale
}
```

#### Emergency Alert Endpoints
```typescript
// POST /api/crisis/alert - Send emergency alert to contacts
interface SendEmergencyAlertRequest {
  alertType: 'crisis' | 'safety_concern' | 'wellness_check';
  message?: string;
  contactIds: string[];
  locationSharing: boolean;
}

// GET /api/crisis/alert/history - Get alert history
interface AlertHistoryResponse {
  alerts: EmergencyAlert[];
  totalCount: number;
}
```

### Real-time Features Implementation

#### Emergency WebSocket Events
```typescript
// WebSocket event types for real-time crisis support
interface CrisisWebSocketEvents {
  'crisis:session_start': {
    userId: string;
    sessionId: number;
    sessionType: string;
    resourceId?: number;
  };
  
  'crisis:session_update': {
    sessionId: number;
    status: 'active' | 'ended' | 'escalated';
    timestamp: string;
  };
  
  'crisis:alert_triggered': {
    userId: string;
    alertId: string;
    alertType: string;
    contactsNotified: string[];
  };
  
  'crisis:resource_available': {
    resourceId: number;
    availability: 'online' | 'offline' | 'busy';
    waitTime?: number;
  };
}
```

#### Push Notifications for Crisis Support
```typescript
// Emergency notification service
class CrisisNotificationService {
  async sendEmergencyAlert(user: User, alertType: string, contacts: EmergencyContact[]) {
    const alertId = generateUniqueId();
    
    // Send push notifications to selected contacts
    for (const contact of contacts) {
      await this.sendContactNotification(contact, user, alertType, alertId);
    }
    
    // Log the alert for tracking
    await this.logEmergencyAlert(user.id, alertId, alertType, contacts);
  }
  
  async sendSafetyPlanReminder(userId: string) {
    // Send reminder to review safety plan
    const reminder = {
      title: "Safety Plan Review Reminder",
      body: "It's time to review and update your safety plan",
      data: { type: 'safety_plan_reminder' }
    };
    
    await pushNotificationService.send(userId, reminder);
  }
}
```

### Data Flow Integration

#### 1. Crisis Resource Management
```typescript
// services/crisisService.ts
export const crisisService = {
  getCrisisResources: async (params?: GetCrisisResourcesParams): Promise<CrisisResource[]> => {
    const response = await api.get('/crisis/resources', { params });
    return response.data.resources;
  },
  
  getLocalResources: async (location: UserLocation): Promise<CrisisResource[]> => {
    const response = await api.get('/crisis/resources/nearby', {
      params: {
        latitude: location.lat,
        longitude: location.lng,
        radiusKm: 50 // 50km radius
      }
    });
    return response.data.resources;
  },
  
  startCrisisSession: async (sessionData: CreateCrisisSessionRequest): Promise<CrisisSession> => {
    const response = await api.post('/crisis/sessions', sessionData);
    return response.data.session;
  },
  
  endCrisisSession: async (sessionId: number, outcomeData: EndCrisisSessionRequest): Promise<void> => {
    await api.put(`/crisis/sessions/${sessionId}/end`, outcomeData);
  }
};
```

#### 2. Safety Plan Integration
```typescript
// hooks/useSafetyPlan.ts
export const useSafetyPlan = (userId: string) => {
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  
  const loadSafetyPlan = async () => {
    try {
      const response = await api.get(`/users/${userId}/safety-plan`);
      setSafetyPlan(response.data.plan);
    } catch (error) {
      console.error('Failed to load safety plan:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateSafetyPlan = async (updates: UpdateSafetyPlanRequest) => {
    try {
      const response = await api.post(`/users/${userId}/safety-plan`, updates);
      setSafetyPlan(response.data.plan);
    } catch (error) {
      console.error('Failed to update safety plan:', error);
      throw error;
    }
  };
  
  return { safetyPlan, loading, loadSafetyPlan, updateSafetyPlan };
};
```

#### 3. Emergency Contact Management
```typescript
// In CrisisScreen component
const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
const [crisisResources, setCrisisResources] = useState<CrisisResource[]>([]);

useEffect(() => {
  loadEmergencyData();
}, []);

const loadEmergencyData = async () => {
  try {
    const [contactsResponse, resourcesResponse] = await Promise.all([
      api.get('/users/me/emergency-contacts'),
      crisisService.getCrisisResources({ is24_7: true })
    ]);
    
    setEmergencyContacts(contactsResponse.data.contacts);
    setCrisisResources(resourcesResponse);
  } catch (error) {
    console.error('Failed to load emergency data:', error);
  }
};
```

### Advanced Features Implementation

#### 1. Location-Based Crisis Resources
```sql
-- Extended location services for crisis resources
CREATE TABLE crisis_resource_locations (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES crisis_resources(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    operating_hours JSONB,
    is_mobile BOOLEAN DEFAULT FALSE, -- Mobile crisis units
    service_radius_km INTEGER, -- Service coverage area
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index for location-based queries
CREATE INDEX idx_crisis_locations_geo ON crisis_resource_locations 
USING GIST (ll_to_earth(latitude, longitude));

-- Function to find nearby crisis resources
CREATE OR REPLACE FUNCTION find_nearby_crisis_resources(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km INTEGER DEFAULT 50
) RETURNS TABLE(
    resource_id INTEGER,
    resource_name VARCHAR,
    phone_number VARCHAR,
    distance_km DECIMAL,
    service_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        cr.name,
        cr.phone_number,
        earth_distance(ll_to_earth(user_lat, user_lng), 
                      ll_to_earth(cl.latitude, cl.longitude)) / 1000 as distance_km,
        cr.service_type
    FROM crisis_resources cr
    JOIN crisis_resource_locations cl ON cr.id = cl.resource_id
    WHERE earth_distance(ll_to_earth(user_lat, user_lng), 
                        ll_to_earth(cl.latitude, cl.longitude)) <= radius_km * 1000
    AND cr.verification_status = 'verified'
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;
```

#### 2. Crisis Session Analytics
```sql
-- Materialized view for crisis intervention analytics
CREATE MATERIALIZED VIEW crisis_analytics AS
SELECT 
    DATE_TRUNC('month', start_time) as month,
    session_type,
    COUNT(*) as session_count,
    AVG(duration_seconds) as avg_duration,
    AVG(crisis_level) as avg_crisis_level,
    MODE() WITHIN GROUP (ORDER BY outcome) as most_common_outcome,
    COUNT(CASE WHEN outcome = 'resolved' THEN 1 END) as resolved_count,
    COUNT(CASE WHEN outcome = 'escalated' THEN 1 END) as escalated_count
FROM crisis_sessions 
WHERE start_time >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', start_time), session_type;

CREATE UNIQUE INDEX idx_crisis_analytics_month_type ON crisis_analytics(month, session_type);

-- Refresh the materialized view daily
CREATE OR REPLACE FUNCTION refresh_crisis_analytics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY crisis_analytics;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Emergency Alert System
```typescript
// Emergency alert service with escalation
class EmergencyAlertService {
  async triggerEmergencyAlert(user: User, alertType: string, options: AlertOptions) {
    const alertId = generateAlertId();
    
    // Create alert record
    const alert = await this.createAlertRecord(user.id, alertId, alertType, options);
    
    // Notify primary contacts
    const primaryResults = await this.notifyContacts(user.emergencyContacts.primary, alert);
    
    // If no response from primary contacts within 5 minutes, escalate
    if (primaryResults.noResponse.length > 0) {
      setTimeout(async () => {
        const secondaryResults = await this.notifyContacts(
          user.emergencyContacts.secondary, 
          alert, 
          'escalation'
        );
        
        // If still no response, notify crisis team
        if (secondaryResults.noResponse.length > 0) {
          await this.notifyCrisisTeam(alert);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
    
    return alertId;
  }
  
  private async notifyContacts(contacts: EmergencyContact[], alert: Alert, type: 'initial' | 'escalation' = 'initial') {
    const results = { successful: [], failed: [], noResponse: [] };
    
    for (const contact of contacts) {
      try {
        await this.sendContactAlert(contact, alert, type);
        results.successful.push(contact.id);
      } catch (error) {
        results.failed.push(contact.id);
      }
    }
    
    return results;
  }
}
```

### Security and Privacy Implementation

#### 1. Emergency Data Access Controls
```sql
-- Emergency access logging
CREATE TABLE emergency_access_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    accessed_by UUID REFERENCES users(id), -- Crisis team member
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN (
        'crisis_intervention', 'safety_check', 'emergency_contact'
    )),
    reason TEXT NOT NULL,
    data_accessed JSONB, -- Specific data fields accessed
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Row-level security for crisis data
ALTER TABLE crisis_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY crisis_team_access ON crisis_sessions
FOR ALL TO crisis_team_role
USING (true); -- Crisis team can access all sessions

CREATE POLICY user_access_own_data ON crisis_sessions
FOR ALL TO authenticated_user
USING (user_id = current_user_id());
```

#### 2. Consent Management for Emergency Contacts
```sql
CREATE TABLE emergency_contact_consents (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES users(id), -- The contact being given access
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
        'crisis_alerts', 'location_sharing', 'wellness_updates'
    )),
    granted BOOLEAN DEFAULT FALSE,
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP,
    expires_at TIMESTAMP,
    conditions JSONB, -- Specific conditions for consent
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_emergency_consents_user ON emergency_contact_consents(user_id, granted);
```

### Performance Optimization

#### 1. Crisis Resource Caching
```sql
-- Materialized view for frequently accessed crisis resources
CREATE MATERIALIZED VIEW verified_crisis_resources AS
SELECT 
    cr.*,
    cl.latitude,
    cl.longitude,
    cl.address,
    cl.city,
    cl.state
FROM crisis_resources cr
LEFT JOIN crisis_resource_locations cl ON cr.id = cl.resource_id
WHERE cr.verification_status = 'verified'
AND cr.is_available = true;

CREATE UNIQUE INDEX idx_verified_resources_id ON verified_crisis_resources(id);
CREATE INDEX idx_verified_resources_location ON verified_crisis_resources 
USING GIST (ll_to_earth(latitude, longitude));
```

#### 2. Real-time Availability Tracking
```typescript
// WebSocket service for resource availability
class CrisisResourceWebSocketService {
  private ws: WebSocket | null = null;
  private availabilityCache = new Map<number, ResourceAvailability>();
  
  connect() {
    this.ws = new WebSocket(CRISIS_WS_URL);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleAvailabilityUpdate(data);
    };
    
    // Request initial availability status
    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({ type: 'availability_request' }));
    };
  }
  
  private handleAvailabilityUpdate(update: ResourceAvailabilityUpdate) {
    this.availabilityCache.set(update.resourceId, update.availability);
    
    // Update UI in real-time
    this.notifySubscribers(update);
  }
  
  getResourceAvailability(resourceId: number): ResourceAvailability {
    return this.availabilityCache.get(resourceId) || { status: 'unknown', waitTime: null };
  }
}
```

