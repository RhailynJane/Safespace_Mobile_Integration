-- Appointments Table
-- Stores scheduled appointments between clients and support workers
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    appointment_type VARCHAR(50) DEFAULT 'consultation',
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no-show')),
    notes TEXT,
    location VARCHAR(255),
    is_virtual BOOLEAN DEFAULT FALSE,
    meeting_link TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_worker_id ON appointments(worker_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_reminder ON appointments(reminder_sent, appointment_date, appointment_time);

-- Composite index for upcoming appointments query
CREATE INDEX IF NOT EXISTS idx_appointments_upcoming ON appointments(appointment_date, appointment_time, status) WHERE status IN ('scheduled', 'confirmed');

-- Function to get upcoming appointments for a user
CREATE OR REPLACE FUNCTION get_upcoming_appointments(user_id_param INTEGER, days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
    id INTEGER,
    client_id INTEGER,
    worker_id INTEGER,
    appointment_date DATE,
    appointment_time TIME,
    duration_minutes INTEGER,
    appointment_type VARCHAR(50),
    status VARCHAR(20),
    notes TEXT,
    location VARCHAR(255),
    is_virtual BOOLEAN,
    meeting_link TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id, a.client_id, a.worker_id, a.appointment_date, a.appointment_time,
        a.duration_minutes, a.appointment_type, a.status, a.notes,
        a.location, a.is_virtual, a.meeting_link
    FROM appointments a
    WHERE (a.client_id = user_id_param OR a.worker_id = user_id_param)
    AND a.appointment_date >= CURRENT_DATE
    AND a.appointment_date <= CURRENT_DATE + days_ahead
    AND a.status IN ('scheduled', 'confirmed')
    ORDER BY a.appointment_date, a.appointment_time;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointment_timestamp
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointment_timestamp();
