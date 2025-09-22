# Video Consultations Module Frontend Documentation

## Overview

The Video Consultations module provides secure, HIPAA-compliant video therapy sessions with real-time communication features. The module includes appointment management, video call interface, chat functionality, and interactive session tools.

## Component Architecture

### File Structure
```
video-consultations/
├── index.tsx                 # Video session details and requirements
├── video-call.tsx           # Pre-call setup and audio configuration
└── video-call-meeting.tsx   # Active video call interface
```

## Core Components

### 1. VideoScreen (`index.tsx`)
**Purpose**: Video consultation details and technical requirements screen.

**Key Features**:
- Appointment information display
- Technical requirements checklist
- Privacy and security information
- Join meeting functionality

**State Management**:
```typescript
const [sideMenuVisible, setSideMenuVisible] = useState(false);
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState("video");
```

### 2. VideoCallScreen (`video-call.tsx`)
**Purpose**: Pre-call setup screen with audio configuration.

**Key Features**:
- Participant information display
- Audio option selection (phone audio/no audio)
- Meeting preparation interface
- Join now/cancel functionality

### 3. VideoCallMeetingScreen (`video-call-meeting.tsx`)
**Purpose**: Active video call interface with real-time features.

**Key Features**:
- Video/audio controls (camera, mic, leave)
- Real-time chat panel
- Emoji reactions system
- Raise hand functionality
- Session timer

## Database Integration Guide

### PostgreSQL Schema Recommendations

#### Video Sessions Table
```sql
CREATE TABLE video_sessions (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    session_uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    scheduled_start TIMESTAMP NOT NULL,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    duration_seconds INTEGER,
    session_status VARCHAR(20) DEFAULT 'scheduled' CHECK (session_status IN (
        'scheduled', 'joined', 'active', 'completed', 'cancelled', 'no_show'
    )),
    video_platform VARCHAR(50) DEFAULT 'custom', -- e.g., 'zoom', 'custom', 'third_party'
    meeting_url TEXT,
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(100),
    encryption_key TEXT, -- For end-to-end encryption
    recording_enabled BOOLEAN DEFAULT FALSE,
    recording_consent_given BOOLEAN DEFAULT FALSE,
    recording_url TEXT,
    technical_issues JSONB, -- Track any technical problems
    participant_join_times JSONB, -- Track when each participant joined
    quality_metrics JSONB, -- Audio/video quality data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_video_sessions_appointment ON video_sessions(appointment_id);
CREATE INDEX idx_video_sessions_provider ON video_sessions(provider_id, scheduled_start);
CREATE INDEX idx_video_sessions_patient ON video_sessions(patient_id, scheduled_start);
CREATE INDEX idx_video_sessions_status ON video_sessions(session_status);
CREATE INDEX idx_video_sessions_uuid ON video_sessions(session_uuid);
```

#### Session Participants Table
```sql
CREATE TABLE session_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES video_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    participant_role VARCHAR(20) CHECK (participant_role IN (
        'provider', 'patient', 'observer', 'translator'
    )),
    join_time TIMESTAMP,
    leave_time TIMESTAMP,
    duration_seconds INTEGER,
    device_info JSONB, -- {os: string, browser: string, ip: string}
    connection_quality VARCHAR(20), -- poor, fair, good, excellent
    audio_enabled BOOLEAN DEFAULT TRUE,
    video_enabled BOOLEAN DEFAULT TRUE,
    hand_raised BOOLEAN DEFAULT FALSE,
    last_heartbeat TIMESTAMP, -- For connection monitoring
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_participants_session ON session_participants(session_id);
CREATE INDEX idx_session_participants_user ON session_participants(user_id);
```

#### Session Chat Messages Table
```sql
CREATE TABLE session_chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES video_sessions(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN (
        'text', 'emoji', 'system', 'file'
    )),
    message_text TEXT,
    emoji_reaction VARCHAR(10), -- For emoji reactions
    file_url TEXT, -- For file attachments
    file_name VARCHAR(255),
    file_size INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    read_by JSONB, -- Track who read the message
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search index for chat messages
CREATE INDEX idx_chat_messages_session ON session_chat_messages(session_id, created_at);
CREATE INDEX idx_chat_messages_search ON session_chat_messages 
USING gin(to_tsvector('english', message_text));
```

#### Session Events Table (For Analytics)
```sql
CREATE TABLE session_events (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES video_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- join, leave, mute, unmute, hand_raise, etc.
    event_data JSONB, -- Additional event-specific data
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_events_session ON session_events(session_id, timestamp);
CREATE INDEX idx_session_events_type ON session_events(event_type, timestamp);
```

#### Technical Requirements Table
```sql
CREATE TABLE video_technical_requirements (
    id SERIAL PRIMARY KEY,
    requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN (
        'system', 'privacy', 'network', 'browser'
    )),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    minimum_spec TEXT,
    recommended_spec TEXT,
    importance_level VARCHAR(20) DEFAULT 'recommended' CHECK (importance_level IN (
        'required', 'recommended', 'optional'
    )),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints Specification

#### Video Sessions Endpoints
```typescript
// GET /api/video-sessions - Get user's video sessions
interface GetVideoSessionsParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// POST /api/video-sessions - Create new video session
interface CreateVideoSessionRequest {
  appointmentId: number;
  scheduledStart: string;
  providerId: string;
}

// GET /api/video-sessions/:id - Get session details
interface VideoSessionResponse {
  session: VideoSession;
  participants: SessionParticipant[];
  technicalRequirements: TechnicalRequirement[];
}

// POST /api/video-sessions/:id/join - Join a video session
interface JoinSessionRequest {
  participantRole: string;
  deviceInfo: DeviceInfo;
}
```

#### Real-time Communication Endpoints
```typescript
// WebSocket connection for real-time features
interface VideoWebSocketEvents {
  'session:participant_joined': {
    sessionId: number;
    participant: SessionParticipant;
    participantCount: number;
  };
  
  'session:participant_left': {
    sessionId: number;
    userId: string;
    participantCount: number;
  };
  
  'session:chat_message': {
    sessionId: number;
    message: ChatMessage;
  };
  
  'session:participant_updated': {
    sessionId: number;
    participantId: string;
    updates: ParticipantUpdates;
  };
  
  'session:quality_metrics': {
    sessionId: number;
    metrics: QualityMetrics;
  };
}

// POST /api/video-sessions/:id/chat - Send chat message
interface SendChatMessageRequest {
  messageType: 'text' | 'emoji';
  messageText?: string;
  emojiReaction?: string;
}

// POST /api/video-sessions/:id/events - Log session event
interface LogSessionEventRequest {
  eventType: string;
  eventData?: any;
}
```

#### Technical Support Endpoints
```typescript
// GET /api/video-sessions/technical-requirements - Get technical requirements
interface TechnicalRequirementsResponse {
  requirements: TechnicalRequirement[];
  compatibilityCheck: CompatibilityResult;
}

// POST /api/video-sessions/:id/troubleshoot - Technical troubleshooting
interface TroubleshootRequest {
  issueType: string;
  description: string;
  systemInfo: SystemInfo;
}

// GET /api/video-sessions/:id/quality-metrics - Get connection quality
interface QualityMetricsResponse {
  audioQuality: number;
  videoQuality: number;
  latency: number;
  packetLoss: number;
}
```

### Real-time Features Implementation

#### WebSocket Service for Video Sessions
```typescript
class VideoWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connect(sessionId: number, userId: string, token: string) {
    this.ws = new WebSocket(`${VIDEO_WS_URL}?sessionId=${sessionId}&userId=${userId}&token=${token}`);
    
    this.ws.onopen = () => {
      console.log('Video WebSocket connected');
      this.reconnectAttempts = 0;
      this.heartbeat();
    };
    
    this.ws.onmessage = (event) => {
      this.handleMessage(JSON.parse(event.data));
    };
    
    this.ws.onclose = () => {
      this.handleDisconnection();
    };
    
    this.ws.onerror = (error) => {
      console.error('Video WebSocket error:', error);
    };
  }
  
  private heartbeat() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'heartbeat' }));
      setTimeout(() => this.heartbeat(), 30000); // Every 30 seconds
    }
  }
  
  private handleMessage(message: VideoWebSocketMessage) {
    switch (message.type) {
      case 'participant_joined':
        this.onParticipantJoined(message.data);
        break;
      case 'chat_message':
        this.onChatMessage(message.data);
        break;
      case 'participant_updated':
        this.onParticipantUpdated(message.data);
        break;
      case 'quality_update':
        this.onQualityUpdate(message.data);
        break;
    }
  }
  
  sendChatMessage(message: string) {
    this.ws?.send(JSON.stringify({
      type: 'chat_message',
      data: { message }
    }));
  }
  
  sendParticipantUpdate(updates: ParticipantUpdates) {
    this.ws?.send(JSON.stringify({
      type: 'participant_update',
      data: updates
    }));
  }
  
  private handleDisconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect(...arguments); // Reconnect with same parameters
      }, 1000 * this.reconnectAttempts);
    }
  }
}
```

#### Real-time Quality Monitoring
```typescript
class VideoQualityMonitor {
  private qualityCheckInterval: NodeJS.Timeout | null = null;
  
  startMonitoring(sessionId: number) {
    this.qualityCheckInterval = setInterval(() => {
      this.checkQuality(sessionId);
    }, 5000); // Check every 5 seconds
  }
  
  stopMonitoring() {
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
    }
  }
  
  private async checkQuality(sessionId: number) {
    try {
      const metrics = await this.getQualityMetrics();
      
      if (this.isQualityPoor(metrics)) {
        this.triggerQualityAlert(sessionId, metrics);
      }
      
      // Send metrics to server for analytics
      await this.reportQualityMetrics(sessionId, metrics);
    } catch (error) {
      console.error('Quality monitoring error:', error);
    }
  }
  
  private isQualityPoor(metrics: QualityMetrics): boolean {
    return metrics.audioQuality < 3 || 
           metrics.videoQuality < 3 || 
           metrics.latency > 500 || 
           metrics.packetLoss > 0.1;
  }
  
  private triggerQualityAlert(sessionId: number, metrics: QualityMetrics) {
    // Show user-friendly quality alert
    this.showQualityAlert(metrics);
    
    // Log the issue for technical support
    this.logQualityIssue(sessionId, metrics);
  }
}
```

### Data Flow Integration

#### 1. Video Session Management
```typescript
// services/videoSessionService.ts
export const videoSessionService = {
  createSession: async (appointmentId: number): Promise<VideoSession> => {
    const response = await api.post('/api/video-sessions', { appointmentId });
    return response.data.session;
  },
  
  joinSession: async (sessionId: number, deviceInfo: DeviceInfo): Promise<JoinSessionResponse> => {
    const response = await api.post(`/api/video-sessions/${sessionId}/join`, {
      participantRole: 'patient',
      deviceInfo
    });
    return response.data;
  },
  
  getSessionDetails: async (sessionId: number): Promise<VideoSessionDetails> => {
    const response = await api.get(`/api/video-sessions/${sessionId}`);
    return response.data;
  },
  
  sendChatMessage: async (sessionId: number, message: string): Promise<void> => {
    await api.post(`/api/video-sessions/${sessionId}/chat`, {
      messageType: 'text',
      messageText: message
    });
  },
  
  updateParticipantStatus: async (sessionId: number, updates: ParticipantUpdates): Promise<void> => {
    await api.put(`/api/video-sessions/${sessionId}/participant`, updates);
  }
};
```

#### 2. Frontend State Management for Video Calls
```typescript
// hooks/useVideoSession.ts
export const useVideoSession = (sessionId: number) => {
  const [session, setSession] = useState<VideoSession | null>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [connectionQuality, setConnectionQuality] = useState<QualityMetrics | null>(null);
  const [wsService, setWsService] = useState<VideoWebSocketService | null>(null);
  
  useEffect(() => {
    initializeSession();
    return () => {
      wsService?.disconnect();
    };
  }, [sessionId]);
  
  const initializeSession = async () => {
    try {
      const sessionDetails = await videoSessionService.getSessionDetails(sessionId);
      setSession(sessionDetails.session);
      setParticipants(sessionDetails.participants);
      
      // Initialize WebSocket connection
      const ws = new VideoWebSocketService();
      ws.connect(sessionId, user.id, authToken);
      ws.onParticipantJoined = handleParticipantJoined;
      ws.onChatMessage = handleChatMessage;
      setWsService(ws);
      
    } catch (error) {
      console.error('Failed to initialize video session:', error);
    }
  };
  
  const handleParticipantJoined = (participant: SessionParticipant) => {
    setParticipants(prev => [...prev, participant]);
  };
  
  const handleChatMessage = (message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  };
  
  const sendMessage = async (message: string) => {
    if (wsService) {
      wsService.sendChatMessage(message);
      await videoSessionService.sendChatMessage(sessionId, message);
    }
  };
  
  return {
    session,
    participants,
    chatMessages,
    connectionQuality,
    sendMessage,
    updateParticipantStatus: (updates: ParticipantUpdates) => 
      videoSessionService.updateParticipantStatus(sessionId, updates)
  };
};
```

#### 3. Technical Requirements Checking
```typescript
// utils/technicalCompatibility.ts
export class TechnicalCompatibilityChecker {
  static async checkCompatibility(): Promise<CompatibilityResult> {
    const checks = {
      browser: this.checkBrowserCompatibility(),
      network: await this.checkNetworkSpeed(),
      audio: await this.checkAudioDevices(),
      video: await this.checkVideoDevices(),
      permissions: await this.checkPermissions()
    };
    
    const results = await Promise.all(Object.values(checks));
    const isCompatible = results.every(result => result.compatible);
    
    return {
      isCompatible,
      details: Object.keys(checks).reduce((acc, key, index) => {
        acc[key] = results[index];
        return acc;
      }, {} as Record<string, CompatibilityCheck>)
    };
  }
  
  private static checkBrowserCompatibility(): CompatibilityCheck {
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = userAgent.includes('chrome');
    const isFirefox = userAgent.includes('firefox');
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    
    return {
      compatible: isChrome || isFirefox || isSafari,
      message: isChrome ? 'Chrome browser detected' : 
               isFirefox ? 'Firefox browser detected' :
               isSafari ? 'Safari browser detected' : 'Unsupported browser',
      severity: isChrome || isFirefox || isSafari ? 'info' : 'warning'
    };
  }
  
  private static async checkNetworkSpeed(): Promise<CompatibilityCheck> {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/network-test');
      const endTime = Date.now();
      
      const latency = endTime - startTime;
      const compatible = latency < 1000; // Less than 1 second
      
      return {
        compatible,
        message: `Network latency: ${latency}ms`,
        severity: compatible ? 'info' : 'warning'
      };
    } catch (error) {
      return {
        compatible: false,
        message: 'Network test failed',
        severity: 'error'
      };
    }
  }
}
```

### Advanced Features Implementation

#### 1. End-to-End Encryption
```sql
-- Encryption key management
CREATE TABLE video_encryption_keys (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES video_sessions(id) ON DELETE CASCADE,
    key_type VARCHAR(20) CHECK (key_type IN ('session', 'recording')),
    encryption_key TEXT NOT NULL, -- Encrypted base64 key
    key_rotation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX idx_encryption_keys_session ON video_encryption_keys(session_id);
```

#### 2. Recording Management
```sql
-- Session recordings table
CREATE TABLE session_recordings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES video_sessions(id) ON DELETE CASCADE,
    recording_start TIMESTAMP NOT NULL,
    recording_end TIMESTAMP,
    file_size_bytes BIGINT,
    file_url TEXT,
    storage_location VARCHAR(100), -- s3, local, etc.
    encryption_key_id INTEGER REFERENCES video_encryption_keys(id),
    consent_verified BOOLEAN DEFAULT FALSE,
    access_log JSONB, -- Who accessed the recording and when
    retention_period_days INTEGER DEFAULT 1095, -- 3 years
    auto_delete_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_session_recordings_session ON session_recordings(session_id);
CREATE INDEX idx_session_recordings_retention ON session_recordings(auto_delete_date);
```

#### 3. Advanced Analytics
```sql
-- Materialized view for session analytics
CREATE MATERIALIZED VIEW video_session_analytics AS
SELECT 
    DATE_TRUNC('month', vs.scheduled_start) as month,
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE vs.session_status = 'completed') as completed_sessions,
    COUNT(*) FILTER (WHERE vs.session_status = 'cancelled') as cancelled_sessions,
    COUNT(*) FILTER (WHERE vs.session_status = 'no_show') as no_show_sessions,
    AVG(vs.duration_seconds) as average_duration,
    AVG(sp.duration_seconds) as average_participant_duration,
    COUNT(DISTINCT vs.provider_id) as unique_providers,
    COUNT(DISTINCT vs.patient_id) as unique_patients,
    -- Quality metrics
    AVG((vs.quality_metrics->>'audio_quality')::numeric) as avg_audio_quality,
    AVG((vs.quality_metrics->>'video_quality')::numeric) as avg_video_quality
FROM video_sessions vs
LEFT JOIN session_participants sp ON vs.id = sp.session_id
WHERE vs.scheduled_start >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', vs.scheduled_start);

CREATE UNIQUE INDEX idx_video_analytics_month ON video_session_analytics(month);
```

### Security and Privacy Implementation

#### 1. HIPAA Compliance Features
```sql
-- Access control and audit logging
CREATE TABLE video_session_access_log (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES video_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN (
        'join', 'view', 'record', 'download', 'delete'
    )),
    access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    access_granted BOOLEAN DEFAULT TRUE,
    reason TEXT,
    consent_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_video_access_log_session ON video_session_access_log(session_id, access_time);
CREATE INDEX idx_video_access_log_user ON video_session_access_log(user_id, access_time);

-- Consent management
CREATE TABLE video_consents (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id INTEGER REFERENCES video_sessions(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
        'recording', 'data_processing', 'third_party_sharing'
    )),
    granted BOOLEAN DEFAULT FALSE,
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP,
    consent_text TEXT NOT NULL,
    version VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Emergency Protocols
```sql
-- Emergency contact and crisis protocols
CREATE TABLE video_emergency_protocols (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES video_sessions(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES users(id),
    emergency_type VARCHAR(50) CHECK (emergency_type IN (
        'medical', 'psychiatric', 'technical', 'safety'
    )),
    trigger_reason TEXT,
    action_taken JSONB,
    contacts_notified JSONB, -- Emergency contacts notified
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Partitioning for large tables
CREATE TABLE session_events_2024 
PARTITION OF session_events 
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Query optimization indexes
CREATE INDEX CONCURRENTLY idx_video_sessions_active 
ON video_sessions(session_status) 
WHERE session_status IN ('scheduled', 'joined', 'active');

CREATE INDEX CONCURRENTLY idx_chat_messages_recent 
ON session_chat_messages(session_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- Connection pooling configuration
-- Consider using PgBouncer for connection pooling
```

#### 2. Frontend Performance
```typescript
// Optimized video component with lazy loading
import { memo, useCallback } from 'react';

const VideoParticipant = memo(({ participant, isSelfView }: VideoParticipantProps) => {
  const handleQualityAdjustment = useCallback((quality: number) => {
    // Adjust video quality based on network conditions
    if (quality < 3) {
      // Reduce resolution for poor connections
    }
  }, []);
  
  return (
    <View style={styles.videoContainer}>
      <VideoStream
        participant={participant}
        onQualityChange={handleQualityAdjustment}
        adaptiveBitrate={true}
      />
      <ParticipantOverlay participant={participant} />
    </View>
  );
});

// Chat virtualization for large message history
import { FlashList } from '@shopify/flash-list';

const ChatMessagesList = ({ messages }: { messages: ChatMessage[] }) => (
  <FlashList
    data={messages}
    renderItem={({ item }) => <ChatMessageItem message={item} />}
    estimatedItemSize={80}
    inverted
    maintainVisibleContentPosition={{
      minIndexForVisible: 0,
      autoscrollToTopThreshold: 10,
    }}
  />
);
```
