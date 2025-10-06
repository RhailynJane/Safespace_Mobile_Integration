-- Run this in pgAdmin on your safespace database

-- Create client_profiles table
CREATE TABLE IF NOT EXISTS client_profiles (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(255),
    phone_number VARCHAR(20),
    date_of_birth DATE,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    therapist_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create accessibility_settings table
CREATE TABLE IF NOT EXISTS accessibility_settings (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    dark_mode_enabled BOOLEAN DEFAULT FALSE,
    text_size VARCHAR(20) DEFAULT 'Medium',
    high_contrast_enabled BOOLEAN DEFAULT FALSE,
    reduce_motion_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create security_settings table
CREATE TABLE IF NOT EXISTS security_settings (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    biometric_lock_enabled BOOLEAN DEFAULT FALSE,
    auto_lock_timer VARCHAR(20) DEFAULT '5 minutes',
    hide_app_content BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'general',
    enabled BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'Daily',
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clerk_user_id, notification_type)
);

-- Create wellbeing_settings table
CREATE TABLE IF NOT EXISTS wellbeing_settings (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    safe_mode_enabled BOOLEAN DEFAULT FALSE,
    break_reminders_enabled BOOLEAN DEFAULT TRUE,
    breathing_exercise_duration VARCHAR(20) DEFAULT '5 minutes',
    breathing_exercise_style VARCHAR(50) DEFAULT '4-7-8 Technique',
    offline_mode_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_clerk_user_id ON client_profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_accessibility_settings_clerk_user_id ON accessibility_settings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_security_settings_clerk_user_id ON security_settings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_clerk_user_id ON notification_settings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_settings_clerk_user_id ON wellbeing_settings(clerk_user_id);