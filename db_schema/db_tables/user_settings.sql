-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Display & Accessibility
    dark_mode BOOLEAN DEFAULT false,
    text_size VARCHAR(50) DEFAULT 'Medium',
    
    -- Privacy & Security
    auto_lock_timer VARCHAR(50) DEFAULT '5 minutes',
    
    -- Notifications
    notifications_enabled BOOLEAN DEFAULT true,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_start_time VARCHAR(10) DEFAULT '22:00',
    quiet_end_time VARCHAR(10) DEFAULT '08:00',
    reminder_frequency VARCHAR(50) DEFAULT 'Daily',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_clerk_user_id ON user_settings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);