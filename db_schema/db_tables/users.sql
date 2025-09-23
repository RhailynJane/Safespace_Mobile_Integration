-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- USERS TABLE - Complete definition
-- =============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk user ID for authentication
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    date_of_birth DATE,
    age INTEGER, -- Calculate from date_of_birth or store directly
    gender VARCHAR(30), -- 'male', 'female', 'other', 'prefer-not-to-say', 'non-binary', etc.
    profile_image_url TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Canada',
    
    -- Role management
    role VARCHAR(50) NOT NULL DEFAULT 'client', -- 'admin', 'team-leader', 'support-worker', 'client', 'family-member'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'suspended', 'pending'
    
    -- Authentication fields (for non-Clerk users or backup)
    password_hash VARCHAR(255), -- Optional: for traditional auth fallback
    email_verified BOOLEAN DEFAULT TRUE, -- Assume true since Clerk handles verification
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'America/Edmonton', -- Calgary timezone
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
    
    -- Timestamps
    last_login TIMESTAMP,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_role CHECK (role IN ('admin', 'team-leader', 'support-worker', 'client', 'family-member')),
    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    CONSTRAINT chk_gender CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say', 'non-binary')),
    CONSTRAINT chk_age CHECK (age >= 0 AND age <= 150),
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_full_name ON users(first_name, last_name);
CREATE INDEX idx_users_phone ON users(phone_number);


