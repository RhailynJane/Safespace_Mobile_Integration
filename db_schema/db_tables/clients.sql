CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Patient-specific information
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_contact_relationship VARCHAR(100),
    
    -- Medical information
    primary_diagnosis TEXT,
    secondary_diagnoses TEXT[],
    allergies TEXT[],
    current_medications TEXT[],
    
    -- Care details
    care_plan TEXT,
    special_requirements TEXT,
    mobility_requirements VARCHAR(100),
    communication_preferences TEXT,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clients_user_id ON clients(user_id);