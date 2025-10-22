-- =============================================
-- MOOD TRACKING TABLES
-- =============================================

-- Mood entries table
CREATE TABLE mood_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clerk_user_id VARCHAR(255) NOT NULL,
    mood_type VARCHAR(20) NOT NULL,
    intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 5),
    notes TEXT,
    share_with_support_worker BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_mood_type CHECK (mood_type IN ('very_happy', 'happy', 'neutral', 'sad', 'very_sad'))
);

-- Add comment to document the share column
COMMENT ON COLUMN mood_entries.share_with_support_worker IS 
'Indicates if the user has chosen to share this mood entry with their assigned support worker';

-- Mood factors table (what influenced the mood)
CREATE TABLE mood_factors (
    id SERIAL PRIMARY KEY,
    mood_entry_id INTEGER NOT NULL REFERENCES mood_entries(id) ON DELETE CASCADE,
    factor VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_clerk_user_id ON mood_entries(clerk_user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at);
CREATE INDEX idx_mood_entries_mood_type ON mood_entries(mood_type);
CREATE INDEX idx_mood_entries_shared ON mood_entries(share_with_support_worker) 
    WHERE share_with_support_worker = TRUE;
CREATE INDEX idx_mood_factors_mood_entry_id ON mood_factors(mood_entry_id);
CREATE INDEX idx_mood_factors_factor ON mood_factors(factor);

-- Function to get mood emoji
CREATE OR REPLACE FUNCTION get_mood_emoji(mood_type VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE mood_type
        WHEN 'very-happy' THEN '😄'
        WHEN 'happy' THEN '🙂'
        WHEN 'neutral' THEN '😐'
        WHEN 'sad' THEN '🙁'
        WHEN 'very-sad' THEN '😢'
        ELSE '😐'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get mood label
CREATE OR REPLACE FUNCTION get_mood_label(mood_type VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE mood_type
        WHEN 'very-happy' THEN 'Very Happy'
        WHEN 'happy' THEN 'Happy'
        WHEN 'neutral' THEN 'Neutral'
        WHEN 'sad' THEN 'Sad'
        WHEN 'very-sad' THEN 'Very Sad'
        ELSE 'Unknown'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mood_entry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mood_entry_timestamp
BEFORE UPDATE ON mood_entries
FOR EACH ROW
EXECUTE FUNCTION update_mood_entry_timestamp();