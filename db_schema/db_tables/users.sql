-- =============================================
-- USERS TABLE - Updated definition with CMHA fields
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    date_of_birth DATE,
    age INTEGER,
    gender VARCHAR(30),
    profile_image_url TEXT,
    last_active_at TIMESTAMP,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Canada',
    
    -- CMHA Demographics Fields
    pronouns VARCHAR(100),
    is_lgbtq VARCHAR(50),
    primary_language VARCHAR(100),
    mental_health_concerns VARCHAR(200),
    support_needed TEXT,
    ethnocultural_background VARCHAR(100),
    canada_status VARCHAR(100),
    date_came_to_canada DATE,
    
    role VARCHAR(50) NOT NULL DEFAULT 'client',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    
    password_hash VARCHAR(255),
    email_verified BOOLEAN DEFAULT TRUE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'America/Edmonton',
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
    
    last_login TIMESTAMP,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    last_logout_at TIMESTAMP,
    
    CONSTRAINT chk_role CHECK (role IN ('admin', 'team_leader', 'support_worker', 'client', 'family_member')),
    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    CONSTRAINT chk_gender CHECK (gender IN (
        'Agender',
        'Gender-fluid',
        'Genderqueer',
        'Gender Variant',
        'Intersex',
        'Man',
        'Non-Binary',
        'Non-Conforming',
        'Questioning',
        'Transgender Man',
        'Transgender Woman',
        'Two-Spirit',
        'I don''t identify with any gender',
        'I do not know',
        'Prefer not to answer',
        'Woman'
    )),
    CONSTRAINT chk_age CHECK (age >= 0 AND age <= 150),
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN last_logout_at TIMESTAMP;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Edmonton';
-- Create the missing enum types
CREATE TYPE "UserRole" AS ENUM ('admin', 'team_leader', 'support_worker', 'client', 'family_member');
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other', 'prefer_not_to_say', 'non_binary');
CREATE TYPE "AssessmentType" AS ENUM ('pre_survey', 'post_survey', 'periodic_check');
CREATE TYPE "MoodType" AS ENUM ('very_happy', 'happy', 'neutral', 'sad', 'very_sad');
CREATE TYPE "ConversationType" AS ENUM ('direct', 'group');
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'file', 'system');
CREATE TYPE "EmotionType" AS ENUM ('very_sad', 'sad', 'neutral', 'happy', 'very_happy');
CREATE TYPE "ResourceType" AS ENUM ('Affirmation', 'Quote', 'Article', 'Exercise', 'Guide');
CREATE TYPE "LegalStatus" AS ENUM ('independent', 'guardianship', 'co_decision_making');