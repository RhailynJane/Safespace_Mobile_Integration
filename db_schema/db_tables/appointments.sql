-- =============================================
-- APPOINTMENTS SYSTEM TABLES
-- =============================================

-- Support Workers Table
CREATE TABLE IF NOT EXISTS support_workers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    specialization VARCHAR(200) NOT NULL,
    qualifications TEXT,
    bio TEXT,
    avatar_url VARCHAR(500),
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 75.00,
    is_available BOOLEAN DEFAULT TRUE,
    max_daily_sessions INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_support_workers_specialization ON support_workers(specialization);
CREATE INDEX idx_support_workers_availability ON support_workers(is_available);
CREATE INDEX idx_support_workers_user_id ON support_workers(user_id);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    support_worker_id INTEGER NOT NULL REFERENCES support_workers(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('video', 'phone', 'in_person')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    meeting_link VARCHAR(500),
    notes TEXT,
    cancellation_reason TEXT,
    rescheduled_from INTEGER REFERENCES appointments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_support_worker_id ON appointments(support_worker_id);
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Support Worker Availability Table (optional for future use)
CREATE TABLE IF NOT EXISTS support_worker_availability (
    id SERIAL PRIMARY KEY,
    support_worker_id INTEGER NOT NULL REFERENCES support_workers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    valid_from DATE NOT NULL,
    valid_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient availability queries
CREATE INDEX idx_availability_worker_day ON support_worker_availability(support_worker_id, day_of_week);
CREATE INDEX idx_availability_dates ON support_worker_availability(valid_from, valid_until);

-- =============================================
-- SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample support workers
INSERT INTO support_workers (user_id, first_name, last_name, email, specialization, avatar_url, hourly_rate) VALUES 
(1, 'Eric', 'Young', 'eric.young@safespace.com', 'Anxiety, Depression, Trauma', 'https://randomuser.me/api/portraits/men/1.jpg', 75.00),
(2, 'Michael', 'Chen', 'michael.chen@safespace.com', 'Anxiety, Depression, Trauma', 'https://randomuser.me/api/portraits/men/2.jpg', 80.00)
ON CONFLICT (email) DO NOTHING;

-- Insert sample availability (Monday to Friday, 9 AM to 5 PM)
INSERT INTO support_worker_availability (support_worker_id, day_of_week, start_time, end_time, valid_from) 
SELECT 
    sw.id,
    day_num,
    '09:00:00'::time,
    '17:00:00'::time,
    CURRENT_DATE
FROM 
    support_workers sw
    CROSS JOIN generate_series(1, 5) AS day_num -- Monday to Friday
WHERE sw.email IN ('eric.young@safespace.com', 'michael.chen@safespace.com')
ON CONFLICT DO NOTHING;

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to appointments table
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to support_workers table  
CREATE TRIGGER update_support_workers_updated_at 
    BEFORE UPDATE ON support_workers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();