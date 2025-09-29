-- =============================================
-- ASSESSMENTS TABLE
-- =============================================
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL DEFAULT 'pre-survey',
    
    responses JSONB NOT NULL,
    total_score INTEGER,
    
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_to_worker BOOLEAN DEFAULT FALSE,
    reviewed_by_worker BOOLEAN DEFAULT FALSE,
    assigned_worker_id INTEGER REFERENCES users(id),
    
    next_due_date TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_assessment_type CHECK (assessment_type IN ('pre-survey', 'post-survey', 'periodic-check')),
    CONSTRAINT chk_total_score CHECK (total_score >= 7 AND total_score <= 35)
);

CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at);
CREATE INDEX idx_assessments_next_due_date ON assessments(next_due_date);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);