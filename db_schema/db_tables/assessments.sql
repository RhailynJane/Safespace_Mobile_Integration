-- =============================================
-- ASSESSMENTS TABLE
-- =============================================
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL DEFAULT 'pre_survey',
    
    responses JSONB NOT NULL,
    total_score INTEGER,
    
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    submitted_to_worker BOOLEAN DEFAULT FALSE,
    reviewed_by_worker BOOLEAN DEFAULT FALSE,
    assigned_worker_id INTEGER REFERENCES users(id),
    
    next_due_date TIMESTAMP,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_assessment_type CHECK (assessment_type IN ('pre_survey', 'post_survey', 'periodic_check')),
    CONSTRAINT chk_total_score CHECK (total_score >= 7 AND total_score <= 35)
);

CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_completed_at ON assessments(completed_at);
CREATE INDEX idx_assessments_next_due_date ON assessments(next_due_date);
CREATE INDEX idx_assessments_type ON assessments(assessment_type);


-- Function to set next due date
CREATE OR REPLACE FUNCTION set_next_assessment_due_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.next_due_date := NEW.completed_at + INTERVAL '6 months';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_next_assessment_due_date
    BEFORE INSERT ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION set_next_assessment_due_date();

-- Function to check if assessment is due
CREATE OR REPLACE FUNCTION is_assessment_due(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    last_assessment_date TIMESTAMP;
    six_months_ago TIMESTAMP;
BEGIN
    SELECT completed_at INTO last_assessment_date
    FROM assessments
    WHERE user_id = p_user_id
    ORDER BY completed_at DESC
    LIMIT 1;
    
    IF last_assessment_date IS NULL THEN
        RETURN TRUE;
    END IF;
    
    six_months_ago := CURRENT_TIMESTAMP - INTERVAL '6 months';
    
    RETURN last_assessment_date < six_months_ago;
END;
$$ LANGUAGE plpgsql;