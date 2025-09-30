-- =============================================
-- JOURNALING TABLES
-- =============================================

-- Journal templates table
CREATE TABLE journal_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    prompts JSONB NOT NULL, -- Array of prompt questions
    icon VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries table
CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clerk_user_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    emotion_type VARCHAR(20),
    emoji VARCHAR(10),
    template_id INTEGER REFERENCES journal_templates(id) ON DELETE SET NULL,
    share_with_support_worker BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_emotion_type CHECK (emotion_type IN ('very-sad', 'sad', 'neutral', 'happy', 'very-happy')),
    CONSTRAINT chk_content_length CHECK (char_length(content) <= 1000)
);

-- Journal tags table
CREATE TABLE journal_tags (
    id SERIAL PRIMARY KEY,
    journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_clerk_user_id ON journal_entries(clerk_user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at);
CREATE INDEX idx_journal_entries_shared ON journal_entries(share_with_support_worker) 
    WHERE share_with_support_worker = TRUE;
CREATE INDEX idx_journal_tags_entry_id ON journal_tags(journal_entry_id);
CREATE INDEX idx_journal_tags_tag ON journal_tags(tag);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_journal_entry_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_journal_entry_timestamp
BEFORE UPDATE ON journal_entries
FOR EACH ROW
EXECUTE FUNCTION update_journal_entry_timestamp();

-- Insert default templates
INSERT INTO journal_templates (name, description, prompts, icon) VALUES
('Daily Reflection', 'Reflect on your day and emotions', 
 '["What happened today that made you feel this way?", "What are you grateful for?", "What could you improve tomorrow?"]'::jsonb, 
 'sunny'),
('Gratitude Journal', 'Focus on positive moments', 
 '["What are three things you''re grateful for today?", "Who made you smile today?", "What small victory did you achieve?"]'::jsonb, 
 'heart'),
('Anxiety Check-in', 'Process anxious thoughts', 
 '["What is making you anxious right now?", "What evidence supports this worry?", "What is within your control?"]'::jsonb, 
 'alert-circle'),
('Free Writing', 'Write whatever comes to mind', 
 '["What''s on your mind right now?"]'::jsonb, 
 'create');

COMMENT ON COLUMN journal_entries.share_with_support_worker IS 
'Indicates if the user has chosen to share this journal entry with their assigned support worker';
COMMENT ON COLUMN journal_entries.content IS 
'Journal entry content with a maximum length of 1000 characters';