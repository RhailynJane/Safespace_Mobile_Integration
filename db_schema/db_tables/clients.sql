-- =============================================
-- CLIENTS TABLE - Complete definition with CMHA fields
-- =============================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Emergency Contact Information
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    emergency_contact_email VARCHAR(255),
    emergency_contact_address TEXT,
    
    -- Secondary Emergency Contact
    secondary_emergency_contact_name VARCHAR(255),
    secondary_emergency_contact_phone VARCHAR(50),
    secondary_emergency_contact_relationship VARCHAR(100),
    
    -- Legal/Guardian Information
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(50),
    guardian_relationship VARCHAR(100),
    legal_status VARCHAR(50),
    
    -- CMHA Demographics Fields
    pronouns VARCHAR(100),
    is_lgbtq VARCHAR(50),
    primary_language VARCHAR(100),
    mental_health_concerns VARCHAR(200),
    support_needed TEXT,
    ethnocultural_background VARCHAR(100),
    canada_status VARCHAR(100),
    date_came_to_canada DATE,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_legal_status CHECK (legal_status IN ('independent', 'guardianship', 'co_decision_making')),
    CONSTRAINT unique_client_user_id UNIQUE (user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- =============================================
-- CLIENT_PROFILES TABLE
-- =============================================
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
    
    -- CMHA Demographics Fields
    pronouns VARCHAR(100),
    is_lgbtq VARCHAR(50),
    primary_language VARCHAR(100),
    mental_health_concerns VARCHAR(200),
    support_needed TEXT,
    ethnocultural_background VARCHAR(100),
    canada_status VARCHAR(100),
    date_came_to_canada DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- ACCESSIBILITY_SETTINGS TABLE
-- =============================================
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

-- =============================================
-- SECURITY_SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS security_settings (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    biometric_lock_enabled BOOLEAN DEFAULT FALSE,
    auto_lock_timer VARCHAR(20) DEFAULT '5 minutes',
    hide_app_content BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- NOTIFICATION_SETTINGS TABLE
-- =============================================
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

-- =============================================
-- WELLBEING_SETTINGS TABLE
-- =============================================
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

-- =============================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- =============================================

-- Clients table indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Client profiles indexes
CREATE INDEX IF NOT EXISTS idx_client_profiles_clerk_user_id ON client_profiles(clerk_user_id);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_accessibility_settings_clerk_user_id ON accessibility_settings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_security_settings_clerk_user_id ON security_settings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_clerk_user_id ON notification_settings(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_wellbeing_settings_clerk_user_id ON wellbeing_settings(clerk_user_id);

-- =============================================
-- UPDATE EXISTING TABLES WITH CMHA FIELDS (if tables already exist)
-- =============================================

-- Add CMHA fields to existing clients table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clients') THEN
        ALTER TABLE clients 
        ADD COLUMN IF NOT EXISTS pronouns VARCHAR(100),
        ADD COLUMN IF NOT EXISTS is_lgbtq VARCHAR(50),
        ADD COLUMN IF NOT EXISTS primary_language VARCHAR(100),
        ADD COLUMN IF NOT EXISTS mental_health_concerns VARCHAR(200),
        ADD COLUMN IF NOT EXISTS support_needed TEXT,
        ADD COLUMN IF NOT EXISTS ethnocultural_background VARCHAR(100),
        ADD COLUMN IF NOT EXISTS canada_status VARCHAR(100),
        ADD COLUMN IF NOT EXISTS date_came_to_canada DATE;
    END IF;
END $$;

-- Add CMHA fields to existing client_profiles table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'client_profiles') THEN
        ALTER TABLE client_profiles 
        ADD COLUMN IF NOT EXISTS pronouns VARCHAR(100),
        ADD COLUMN IF NOT EXISTS is_lgbtq VARCHAR(50),
        ADD COLUMN IF NOT EXISTS primary_language VARCHAR(100),
        ADD COLUMN IF NOT EXISTS mental_health_concerns VARCHAR(200),
        ADD COLUMN IF NOT EXISTS support_needed TEXT,
        ADD COLUMN IF NOT EXISTS ethnocultural_background VARCHAR(100),
        ADD COLUMN IF NOT EXISTS canada_status VARCHAR(100),
        ADD COLUMN IF NOT EXISTS date_came_to_canada DATE;
    END IF;
END $$;

-- =============================================
-- VERIFY TABLE STRUCTURES
-- =============================================

-- Check clients table structure
SELECT 'clients' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;

-- Check client_profiles table structure
SELECT 'client_profiles' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'client_profiles' 
ORDER BY ordinal_position;

-- Check all settings tables
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('accessibility_settings', 'security_settings', 'notification_settings', 'wellbeing_settings')
ORDER BY table_name, ordinal_position;