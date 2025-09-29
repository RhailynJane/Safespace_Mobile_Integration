-- =============================================
-- ASSESSMENTS TABLE
-- =============================================
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL DEFAULT 'pre-survey', -- 'pre-survey', 'post-survey', 'periodic-check'
    
    -- Assessment responses (store as JSONB for flexibility)
    responses JSONB NOT NULL, -- Stores all question-answer pairs
    total_score INTEGER, -- Calculated score (7-35 for SWEMWBS)
    
    -- Assessment metadata
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_to_worker BOOLEAN DEFAULT FALSE,
    reviewed_by_worker BOOLEAN DEFAULT FALSE,
    assigned_worker_id INTEGER REFERENCES users(id), -- Support worker who will review
    
    -- Next assessment tracking
    next_due_date TIMESTAMP, -- Automatically calculated as 6 months from completion
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_assessment_type CHECK (assessment_type IN ('pre-survey', 'post-survey', 'periodic-check')),
    CONSTRAINT chk_total_score CHECK (total_score >= 7 AND total_score <= 35)
);

-- =============================================
-- ASSESSMENT REMINDERS TABLE (Optional)
-- =============================================
CREATE TABLE assessment_reminders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_assessment_date TIMESTAMP NOT NULL,
    next_due_date TIMESTAMP NOT NULL,
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one active reminder per user
    CONSTRAINT unique_active_reminder UNIQUE (user_id)
);

-- Create indexes for performance
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at);
CREATE INDEX idx_assessments_next_due_date ON assessments(next_due_date);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);
CREATE INDEX idx_assessment_reminders_user_id ON assessment_reminders(user_id);
CREATE INDEX idx_assessment_reminders_next_due ON assessment_reminders(next_due_date);

-- =============================================
-- FUNCTION: Automatically set next_due_date
-- =============================================
CREATE OR REPLACE FUNCTION set_next_assessment_due_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Set next due date to 6 months from completion
    NEW.next_due_date := NEW.completed_at + INTERVAL '6 months';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate next due date
CREATE TRIGGER trg_set_next_assessment_due_date
    BEFORE INSERT ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION set_next_assessment_due_date();

-- =============================================
-- FUNCTION: Check if assessment is due
-- =============================================
CREATE OR REPLACE FUNCTION is_assessment_due(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    last_assessment_date TIMESTAMP;
    six_months_ago TIMESTAMP;
BEGIN
    -- Get the most recent assessment completion date
    SELECT completed_at INTO last_assessment_date
    FROM assessments
    WHERE user_id = p_user_id
    ORDER BY completed_at DESC
    LIMIT 1;
    
    -- If no assessment exists, it's due (new user)
    IF last_assessment_date IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Calculate if 6 months have passed
    six_months_ago := CURRENT_TIMESTAMP - INTERVAL '6 months';
    
    RETURN last_assessment_date < six_months_ago;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: Get days until next assessment
-- =============================================
CREATE OR REPLACE FUNCTION days_until_next_assessment(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    next_due TIMESTAMP;
BEGIN
    SELECT next_due_date INTO next_due
    FROM assessments
    WHERE user_id = p_user_id
    ORDER BY completed_at DESC
    LIMIT 1;
    
    -- If no assessment exists, return 0 (due now)
    IF next_due IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate days remaining
    RETURN EXTRACT(DAY FROM (next_due - CURRENT_TIMESTAMP))::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEW: Users with pending assessments
-- =============================================
CREATE OR REPLACE VIEW users_with_pending_assessments AS
SELECT 
    u.id,
    u.clerk_user_id,
    u.first_name,
    u.last_name,
    u.email,
    a.completed_at as last_assessment_date,
    a.next_due_date,
    CASE 
        WHEN a.completed_at IS NULL THEN TRUE
        WHEN CURRENT_TIMESTAMP >= a.next_due_date THEN TRUE
        ELSE FALSE
    END as is_due
FROM users u
LEFT JOIN LATERAL (
    SELECT completed_at, next_due_date
    FROM assessments
    WHERE user_id = u.id
    ORDER BY completed_at DESC
    LIMIT 1
) a ON TRUE
WHERE u.role = 'client' AND u.status = 'active';