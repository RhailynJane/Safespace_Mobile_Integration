# Self-Assessment Module Frontend Documentation

## Overview

The Self-Assessment module provides comprehensive mental health screening tools including PHQ-9 (depression), GAD-7 (anxiety), stress assessment, and general mental health evaluations. The module features clinically-validated questionnaires with intuitive interfaces and progress tracking.

## Component Architecture

### File Structure
```
self-assessment/
├── index.tsx                 # Assessment selection screen
└── assessment/
    ├── selection.tsx         # Assessment type selection
    ├── phq9.tsx             # PHQ-9 depression screening
    ├── gad7.tsx             # GAD-7 anxiety screening
    ├── general-mental-health.tsx # Comprehensive assessment
    └── stress-test.tsx      # Stress assessment
```

## Core Components

### 1. AssessmentScreen (`index.tsx`)
**Purpose**: Initial assessment screen asking users about their assessment purpose.

**Key Features**:
- Purpose selection (before appointment, provider requested, personal check-in)
- Clean card-based interface
- Navigation to assessment selection

**State Management**:
```typescript
const [sideMenuVisible, setSideMenuVisible] = useState(false);
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState("assessment");
```

### 2. AssessmentSelectionScreen (`assessment/selection.tsx`)
**Purpose**: Screen for selecting specific assessment types.

**Key Features**:
- Multiple assessment options with descriptions
- Duration estimates for each assessment
- Color-coded categories for different assessment types

**Assessment Types**:
- Depression Screening (PHQ-9) - 5-7 minutes
- Anxiety Screening (GAD-7) - 3-5 minutes  
- General Mental Health - 10-15 minutes
- Stress Assessment - 5-8 minutes

### 3. Questionnaire Screens (`assessment/[type].tsx`)
**Purpose**: Individual assessment questionnaires with progress tracking.

**Common Features**:
- Progress bars and question counters
- Answer selection with visual feedback
- Navigation controls (back/next/complete)
- Completion screens with results

## Database Integration Guide

### PostgreSQL Schema Recommendations

#### Assessments Table
```sql
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN (
        'phq9', 'gad7', 'general_mental_health', 'stress', 'custom'
    )),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft', 'in_progress', 'completed', 'cancelled'
    )),
    purpose VARCHAR(50) CHECK (purpose IN (
        'before_appointment', 'provider_requested', 'personal_check_in', 'routine_screening'
    )),
    total_questions INTEGER NOT NULL,
    completed_questions INTEGER DEFAULT 0,
    total_score INTEGER,
    severity_level VARCHAR(50), -- mild, moderate, severe, etc.
    interpretation TEXT, -- Clinical interpretation of results
    recommendations JSONB, -- Personalized recommendations
    time_started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    time_completed TIMESTAMP,
    duration_seconds INTEGER, -- Total time taken
    version VARCHAR(20) DEFAULT '1.0', -- Assessment version for tracking changes
    is_anonymous BOOLEAN DEFAULT FALSE, -- For research purposes
    data_sharing_preferences JSONB, -- User preferences for data usage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_assessments_user ON assessments(user_id);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_created ON assessments(created_at DESC);
```

#### Assessment Questions Table
```sql
CREATE TABLE assessment_questions (
    id SERIAL PRIMARY KEY,
    assessment_type VARCHAR(50) NOT NULL,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    short_text VARCHAR(200), -- Short version for display
    domain VARCHAR(100), -- e.g., 'mood', 'anxiety', 'sleep'
    subdomain VARCHAR(100), -- e.g., 'depression_mood', 'anxiety_physical'
    response_type VARCHAR(20) DEFAULT 'likert' CHECK (response_type IN (
        'likert', 'multiple_choice', 'text', 'numeric'
    )),
    options JSONB, -- For multiple choice questions
    min_value INTEGER,
    max_value INTEGER,
    scoring_rules JSONB, -- How to score this question
    is_required BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_type, question_number, version)
);

-- Index for question lookup
CREATE INDEX idx_assessment_questions_type ON assessment_questions(assessment_type, sort_order);
```

#### Assessment Responses Table
```sql
CREATE TABLE assessment_responses (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES assessment_questions(id),
    question_number INTEGER NOT NULL,
    response_value INTEGER, -- For numeric responses
    response_text TEXT, -- For text responses
    response_time_seconds INTEGER, -- Time taken to answer
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
    flags JSONB, -- Any flags raised by this response
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, question_id)
);

-- Indexes for analytics
CREATE INDEX idx_assessment_responses_assessment ON assessment_responses(assessment_id);
CREATE INDEX idx_assessment_responses_question ON assessment_responses(question_id);
```

#### Assessment Scoring Rules Table
```sql
CREATE TABLE assessment_scoring_rules (
    id SERIAL PRIMARY KEY,
    assessment_type VARCHAR(50) NOT NULL,
    score_range_low INTEGER NOT NULL,
    score_range_high INTEGER NOT NULL,
    severity_level VARCHAR(50) NOT NULL,
    interpretation TEXT NOT NULL,
    recommendations JSONB NOT NULL, -- Array of recommendations
    urgency_level VARCHAR(20) CHECK (urgency_level IN (
        'low', 'medium', 'high', 'crisis'
    )),
    notification_required BOOLEAN DEFAULT FALSE,
    notification_template TEXT,
    provider_alert_required BOOLEAN DEFAULT FALSE,
    self_care_suggestions JSONB,
    professional_recommendations JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    version VARCHAR(20) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick score lookup
CREATE INDEX idx_scoring_rules_type_range ON assessment_scoring_rules(
    assessment_type, score_range_low, score_range_high
);
```

#### User Assessment History Table
```sql
CREATE TABLE user_assessment_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL,
    completion_date DATE NOT NULL,
    total_score INTEGER NOT NULL,
    severity_level VARCHAR(50),
    trend_direction VARCHAR(20) CHECK (trend_direction IN (
        'improving', 'stable', 'worsening', 'new'
    )),
    previous_score INTEGER,
    score_change INTEGER, -- Change from previous assessment
    significant_change BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for trend analysis
CREATE INDEX idx_user_assessment_history ON user_assessment_history(
    user_id, assessment_type, completion_date DESC
);
```

### API Endpoints Specification

#### Assessments Endpoints
```typescript
// GET /api/assessments - Get user's assessment history
interface GetAssessmentsParams {
  assessmentType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// POST /api/assessments - Start new assessment
interface CreateAssessmentRequest {
  assessmentType: string;
  purpose?: string;
  isAnonymous?: boolean;
}

// GET /api/assessments/:id - Get specific assessment details
interface AssessmentDetailResponse {
  assessment: Assessment;
  questions: AssessmentQuestion[];
  previousResults?: AssessmentHistory[];
}

// PUT /api/assessments/:id - Update assessment progress
interface UpdateAssessmentRequest {
  status?: string;
  completedQuestions?: number;
}
```

#### Questions Endpoints
```typescript
// GET /api/assessments/:assessmentType/questions - Get questions for assessment
interface GetQuestionsResponse {
  questions: AssessmentQuestion[];
  assessmentInfo: AssessmentInfo;
}

// POST /api/assessments/:id/responses - Submit question response
interface SubmitResponseRequest {
  questionId: number;
  questionNumber: number;
  responseValue: number;
  responseText?: string;
  responseTimeSeconds: number;
}
```

#### Results Endpoints
```typescript
// POST /api/assessments/:id/complete - Complete assessment and get results
interface CompleteAssessmentResponse {
  assessment: Assessment;
  score: number;
  severityLevel: string;
  interpretation: string;
  recommendations: Recommendation[];
  trends: TrendAnalysis;
  emergencyContacts?: EmergencyContact[];
}

// GET /api/users/me/assessment-trends - Get assessment trends over time
interface AssessmentTrendsResponse {
  trends: {
    assessmentType: string;
    dataPoints: TrendDataPoint[];
    overallTrend: string;
    significantChanges: SignificantChange[];
  }[];
}
```

### Real-time Features Implementation

#### Assessment Progress Tracking
```typescript
// WebSocket events for real-time progress tracking
interface AssessmentWebSocketEvents {
  'assessment:started': {
    assessmentId: number;
    userId: string;
    assessmentType: string;
  };
  
  'assessment:progress': {
    assessmentId: number;
    completedQuestions: number;
    totalQuestions: number;
    percentage: number;
  };
  
  'assessment:completed': {
    assessmentId: number;
    userId: string;
    score: number;
    severityLevel: string;
    recommendations: string[];
  };
  
  'assessment:alert': {
    assessmentId: number;
    userId: string;
    alertType: 'crisis' | 'urgent' | 'follow_up';
    message: string;
    contacts: string[];
  };
}
```

#### Automated Scoring and Alerts
```typescript
// Automated scoring service with alert system
class AssessmentScoringService {
  async scoreAssessment(assessmentId: number): Promise<AssessmentResult> {
    const assessment = await this.getAssessment(assessmentId);
    const responses = await this.getResponses(assessmentId);
    
    // Calculate total score
    const totalScore = this.calculateScore(responses, assessment.assessmentType);
    
    // Determine severity level
    const severity = this.determineSeverity(assessment.assessmentType, totalScore);
    
    // Check for crisis indicators
    const crisisIndicators = this.checkCrisisIndicators(responses);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      assessment.assessmentType, 
      totalScore, 
      severity,
      crisisIndicators
    );
    
    // Trigger alerts if needed
    if (crisisIndicators.length > 0) {
      await this.triggerCrisisAlert(assessment.userId, crisisIndicators);
    }
    
    return {
      totalScore,
      severity,
      interpretation: this.getInterpretation(assessment.assessmentType, totalScore),
      recommendations,
      crisisIndicators
    };
  }
  
  private checkCrisisIndicators(responses: AssessmentResponse[]): CrisisIndicator[] {
    const indicators: CrisisIndicator[] = [];
    
    // Check for suicidal ideation (PHQ-9 question 9)
    const suicideResponse = responses.find(r => r.questionNumber === 9);
    if (suicideResponse && suicideResponse.responseValue >= 2) {
      indicators.push({
        type: 'suicidal_ideation',
        severity: 'high',
        questionNumber: 9,
        responseValue: suicideResponse.responseValue
      });
    }
    
    // Add other crisis checks...
    return indicators;
  }
}
```

### Data Flow Integration

#### 1. Assessment Service Layer
```typescript
// services/assessmentService.ts
export const assessmentService = {
  startAssessment: async (assessmentData: CreateAssessmentRequest): Promise<Assessment> => {
    const response = await api.post('/api/assessments', assessmentData);
    return response.data.assessment;
  },
  
  getQuestions: async (assessmentType: string): Promise<AssessmentQuestion[]> => {
    const response = await api.get(`/api/assessments/${assessmentType}/questions`);
    return response.data.questions;
  },
  
  submitResponse: async (
    assessmentId: number, 
    responseData: SubmitResponseRequest
  ): Promise<void> => {
    await api.post(`/api/assessments/${assessmentId}/responses`, responseData);
  },
  
  completeAssessment: async (assessmentId: number): Promise<AssessmentResult> => {
    const response = await api.post(`/api/assessments/${assessmentId}/complete`);
    return response.data;
  },
  
  getAssessmentHistory: async (params?: GetAssessmentsParams): Promise<AssessmentHistory[]> => {
    const response = await api.get('/api/assessments', { params });
    return response.data.assessments;
  }
};
```

#### 2. Frontend State Management
```typescript
// hooks/useAssessment.ts
export const useAssessment = (assessmentType: string) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  
  const startAssessment = async (purpose?: string) => {
    try {
      const newAssessment = await assessmentService.startAssessment({
        assessmentType,
        purpose
      });
      setAssessment(newAssessment);
      
      const assessmentQuestions = await assessmentService.getQuestions(assessmentType);
      setQuestions(assessmentQuestions);
    } catch (error) {
      console.error('Failed to start assessment:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const submitResponse = async (questionNumber: number, responseValue: number) => {
    if (!assessment) return;
    
    try {
      await assessmentService.submitResponse(assessment.id, {
        questionId: questions[questionNumber].id,
        questionNumber: questionNumber + 1,
        responseValue,
        responseTimeSeconds: 30 // This would be calculated
      });
      
      setResponses(prev => ({ ...prev, [questionNumber]: responseValue }));
    } catch (error) {
      console.error('Failed to submit response:', error);
    }
  };
  
  const completeAssessment = async (): Promise<AssessmentResult> => {
    if (!assessment) throw new Error('No active assessment');
    
    return await assessmentService.completeAssessment(assessment.id);
  };
  
  return {
    assessment,
    questions,
    currentQuestion,
    responses,
    loading,
    startAssessment,
    submitResponse,
    completeAssessment,
    setCurrentQuestion
  };
};
```

#### 3. Crisis Detection and Response
```typescript
// Crisis detection and response system
class CrisisDetectionService {
  private crisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'want to die',
    'harm myself', 'self harm', 'cannot go on'
  ];
  
  async checkForCrisis(responses: AssessmentResponse[]): Promise<CrisisAlert | null> {
    // Check numeric responses for crisis indicators
    const crisisResponses = responses.filter(response => 
      this.isCrisisResponse(response)
    );
    
    // Check text responses for crisis keywords
    const textResponses = responses.filter(r => r.responseText);
    const keywordMatches = this.checkForKeywords(textResponses);
    
    if (crisisResponses.length > 0 || keywordMatches.length > 0) {
      return await this.generateCrisisAlert(
        crisisResponses, 
        keywordMatches
      );
    }
    
    return null;
  }
  
  private isCrisisResponse(response: AssessmentResponse): boolean {
    // PHQ-9 question 9 (suicidal ideation) with high score
    if (response.questionNumber === 9 && response.responseValue >= 2) {
      return true;
    }
    
    // Add other crisis detection rules
    return false;
  }
  
  async generateCrisisAlert(
    crisisResponses: AssessmentResponse[], 
    keywordMatches: TextResponse[]
  ): Promise<CrisisAlert> {
    const alert: CrisisAlert = {
      type: 'crisis',
      severity: 'high',
      timestamp: new Date().toISOString(),
      triggers: [
        ...crisisResponses.map(r => ({
          type: 'assessment_response',
          questionNumber: r.questionNumber,
          responseValue: r.responseValue
        })),
        ...keywordMatches.map(m => ({
          type: 'keyword_match',
          keyword: m.matchedKeyword,
          context: m.context
        }))
      ],
      recommendedActions: [
        {
          action: 'contact_crisis_line',
          priority: 'immediate',
          resource: {
            name: 'National Suicide Prevention Lifeline',
            phone: '988',
            available: true
          }
        },
        {
          action: 'notify_provider',
          priority: 'high',
          message: 'Patient showing crisis indicators in assessment'
        }
      ]
    };
    
    // Trigger immediate notifications
    await this.triggerEmergencyNotifications(alert);
    
    return alert;
  }
}
```

### Advanced Features Implementation

#### 1. Adaptive Questionnaires
```sql
-- Support for adaptive questioning based on responses
CREATE TABLE assessment_branching_rules (
    id SERIAL PRIMARY KEY,
    assessment_type VARCHAR(50) NOT NULL,
    trigger_question_id INTEGER REFERENCES assessment_questions(id),
    trigger_response_value INTEGER,
    trigger_operator VARCHAR(10) DEFAULT '=' CHECK (trigger_operator IN (
        '=', '>', '>=', '<', '<=', '!='
    )),
    target_question_id INTEGER REFERENCES assessment_questions(id),
    action VARCHAR(20) CHECK (action IN ('show', 'hide', 'skip_to')),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_branching_rules_assessment ON assessment_branching_rules(assessment_type);
```

#### 2. Longitudinal Analysis
```sql
-- Materialized view for trend analysis
CREATE MATERIALIZED VIEW assessment_trends AS
SELECT 
    uah.user_id,
    uah.assessment_type,
    DATE_TRUNC('month', uah.completion_date) as month,
    COUNT(*) as assessment_count,
    AVG(uah.total_score) as average_score,
    MIN(uah.total_score) as min_score,
    MAX(uah.total_score) as max_score,
    -- Calculate trend direction
    CASE 
        WHEN LAG(uah.total_score) OVER (PARTITION BY uah.user_id, uah.assessment_type ORDER BY uah.completion_date) IS NULL THEN 'baseline'
        WHEN uah.total_score > LAG(uah.total_score) OVER (PARTITION BY uah.user_id, uah.assessment_type ORDER BY uah.completion_date) THEN 'improving'
        WHEN uah.total_score < LAG(uah.total_score) OVER (PARTITION BY uah.user_id, uah.assessment_type ORDER BY uah.completion_date) THEN 'worsening'
        ELSE 'stable'
    END as trend_direction
FROM user_assessment_history uah
WHERE uah.completion_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY uah.user_id, uah.assessment_type, DATE_TRUNC('month', uah.completion_date');

CREATE UNIQUE INDEX idx_assessment_trends_user_type_month ON assessment_trends(user_id, assessment_type, month);
```

#### 3. Cultural Adaptation
```sql
-- Support for culturally adapted assessments
CREATE TABLE assessment_cultural_adaptations (
    id SERIAL PRIMARY KEY,
    assessment_type VARCHAR(50) NOT NULL,
    culture_code VARCHAR(10) NOT NULL, -- en-US, es-MX, etc.
    question_adaptations JSONB, -- Translated/adapted questions
    response_adaptations JSONB, -- Adapted response options
    scoring_adjustments JSONB, -- Culture-specific scoring
    norms JSONB, -- Culture-specific normative data
    is_active BOOLEAN DEFAULT TRUE,
    adapted_by VARCHAR(100),
    adaptation_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cultural_adaptations_type_culture ON assessment_cultural_adaptations(assessment_type, culture_code);
```

### Security and Privacy Implementation

#### 1. Sensitive Data Handling
```sql
-- Enhanced privacy controls for sensitive assessment data
CREATE TABLE assessment_privacy_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL,
    data_retention_days INTEGER DEFAULT 1095, -- 3 years default
    allow_research_use BOOLEAN DEFAULT FALSE,
    allow_clinical_training BOOLEAN DEFAULT FALSE,
    share_with_providers BOOLEAN DEFAULT TRUE,
    emergency_override BOOLEAN DEFAULT TRUE, -- Allow crisis access
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, assessment_type)
);

-- Audit trail for sensitive data access
CREATE TABLE assessment_access_log (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE,
    accessed_by UUID REFERENCES users(id), -- Provider or system
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN (
        'clinical_review', 'emergency', 'research', 'system_processing'
    )),
    access_reason TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Compliance and Consent
```sql
-- Consent management for assessments
CREATE TABLE assessment_consents (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL,
    consent_type VARCHAR(50) NOT NULL CHECK (consent_type IN (
        'data_collection', 'data_usage', 'emergency_contact', 'provider_sharing'
    )),
    granted BOOLEAN DEFAULT FALSE,
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP,
    consent_text TEXT, -- Text that was presented
    version VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Partitioning for large tables
CREATE TABLE assessment_responses_2024 
PARTITION OF assessment_responses 
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Query optimization indexes
CREATE INDEX CONCURRENTLY idx_responses_assessment_question 
ON assessment_responses(assessment_id, question_number);

CREATE INDEX CONCURRENTLY idx_assessments_user_status 
ON assessments(user_id, status) 
WHERE status IN ('in_progress', 'completed');

-- Full-text search for text responses
CREATE INDEX idx_response_text_search ON assessment_responses 
USING gin(to_tsvector('english', response_text));
```

#### 2. Frontend Performance
```typescript
// Optimized question rendering with virtualization
import { FlashList } from '@shopify/flash-list';

const QuestionList = ({ questions, responses, onAnswerSelect }) => (
  <FlashList
    data={questions}
    renderItem={({ item, index }) => (
      <QuestionCard
        question={item}
        questionNumber={index}
        selectedAnswer={responses[index]}
        onAnswerSelect={onAnswerSelect}
      />
    )}
    estimatedItemSize={200}
    keyExtractor={(item, index) => `question-${index}`}
  />
);

// Response caching for offline capability
const useResponseCache = (assessmentId: string) => {
  const cacheKey = `assessment-${assessmentId}-responses`;
  
  const saveResponses = useCallback((responses: Record<number, number>) => {
    AsyncStorage.setItem(cacheKey, JSON.stringify(responses));
  }, [cacheKey]);
  
  const loadResponses = useCallback(async (): Promise<Record<number, number>> => {
    const cached = await AsyncStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : {};
  }, [cacheKey]);
  
  return { saveResponses, loadResponses };
};
```
