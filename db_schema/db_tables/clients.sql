-- =============================================
-- CLIENTS TABLE - Complete definition
-- =============================================
DROP TABLE IF EXISTS clients CASCADE;

CREATE TABLE clients (
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
    legal_status VARCHAR(50), -- 'independent', 'guardianship', 'co-decision-making'
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_legal_status CHECK (legal_status IN ('independent', 'guardianship', 'co-decision-making')),
    CONSTRAINT unique_client_user_id UNIQUE (user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_clients_user_id ON clients(user_id);