CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE, -- Clerk user ID for authentication
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20), -- 'male', 'female', 'other', 'prefer-not-to-say'
    profile_image_url TEXT,
    
    -- Role management
    role VARCHAR(50) NOT NULL DEFAULT 'patient', -- 'admin', 'team-leader', 'support-worker', 'patient'
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'suspended', 'pending'
    
    -- Authentication fields (for non-Clerk users or backup)
    password_hash VARCHAR(255), -- Optional: for traditional auth fallback
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    last_login TIMESTAMP,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for better performance
    CONSTRAINT chk_role CHECK (role IN ('admin', 'team-leader', 'support-worker', 'clients', 'family-member')),
    CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'suspended', 'pending'))
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_created_at ON users(created_at);