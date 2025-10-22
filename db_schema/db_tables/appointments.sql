-- =============================================
-- SAFESPACE APPOINTMENTS SYSTEM - Complete Schema
-- Updated to match specification with UUIDs and support_workers table
-- =============================================

-- =============================================
-- 1. SUPPORT WORKERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS support_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    specialization VARCHAR(200) NOT NULL,
    qualifications TEXT,
    bio TEXT,
    avatar_url VARCHAR(500),
    hourly_rate DECIMAL(10,2),
    is_available BOOLEAN DEFAULT TRUE,
    max_daily_sessions INTEGER DEFAULT 8,
    years_experience INTEGER,
    license_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    CONSTRAINT fk_support_worker_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Indexes for support_workers
CREATE INDEX IF NOT EXISTS idx_support_workers_user_id ON support_workers(user_id);
CREATE INDEX IF NOT EXISTS idx_support_workers_specialization ON support_workers(specialization);
CREATE INDEX IF NOT EXISTS idx_support_workers_availability ON support_workers(is_available);
CREATE INDEX IF NOT EXISTS idx_support_workers_email ON support_workers(email);

-- Comments
COMMENT ON TABLE support_workers IS 'Mental health support workers/therapists available for appointments';
COMMENT ON COLUMN support_workers.specialization IS 'Primary area of expertise (e.g., "Anxiety, Depression, Trauma")';
COMMENT ON COLUMN support_workers.is_available IS 'Whether the support worker is currently accepting new appointments';
COMMENT ON COLUMN support_workers.max_daily_sessions IS 'Maximum number of sessions per day';

-- =============================================
-- 2. SUPPORT WORKER AVAILABILITY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS support_worker_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    support_worker_id UUID NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to support_workers
    CONSTRAINT fk_availability_support_worker
        FOREIGN KEY (support_worker_id)
        REFERENCES support_workers(id)
        ON DELETE CASCADE,
    
    -- Ensure end time is after start time
    CONSTRAINT chk_time_order CHECK (end_time > start_time),
    
    -- Ensure valid_until is after valid_from if set
    CONSTRAINT chk_valid_dates CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

-- Indexes for availability
CREATE INDEX IF NOT EXISTS idx_availability_worker_day ON support_worker_availability(support_worker_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_dates ON support_worker_availability(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_availability_recurring ON support_worker_availability(support_worker_id, is_recurring);

COMMENT ON TABLE support_worker_availability IS 'Defines when support workers are available for appointments';
COMMENT ON COLUMN support_worker_availability.day_of_week IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN support_worker_availability.is_recurring IS 'Whether this availability repeats weekly';

-- =============================================
-- 3. APPOINTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    support_worker_id UUID NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    timezone VARCHAR(50) DEFAULT 'America/Edmonton',
    
    -- Session details
    session_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    meeting_link VARCHAR(500),
    notes TEXT,
    
    -- Cancellation/Rescheduling
    cancellation_reason TEXT,
    cancelled_by INTEGER,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    rescheduled_from UUID,
    rescheduled_at TIMESTAMP WITH TIME ZONE,
    
    -- Reminders
    reminder_sent BOOLEAN DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Foreign keys
    CONSTRAINT fk_appointment_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_appointment_support_worker
        FOREIGN KEY (support_worker_id)
        REFERENCES support_workers(id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_appointment_cancelled_by
        FOREIGN KEY (cancelled_by)
        REFERENCES users(id)
        ON DELETE SET NULL,
        
    CONSTRAINT fk_appointment_rescheduled_from
        FOREIGN KEY (rescheduled_from)
        REFERENCES appointments(id)
        ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT chk_session_type CHECK (session_type IN ('video', 'phone', 'in_person')),
    CONSTRAINT chk_status CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),
    CONSTRAINT chk_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);

-- Indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_support_worker_id ON appointments(support_worker_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_session_type ON appointments(session_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_appointments_user_upcoming 
    ON appointments(user_id, appointment_date, appointment_time)
    WHERE status IN ('scheduled', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_appointments_worker_schedule
    ON appointments(support_worker_id, appointment_date, appointment_time)
    WHERE status IN ('scheduled', 'confirmed');

COMMENT ON TABLE appointments IS 'All appointment bookings between clients and support workers';
COMMENT ON COLUMN appointments.status IS 'scheduled, confirmed, completed, cancelled, no_show, rescheduled';
COMMENT ON COLUMN appointments.session_type IS 'video, phone, or in_person';

-- =============================================
-- 4. APPOINTMENT REVIEWS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS appointment_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    would_recommend BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_review_appointment
        FOREIGN KEY (appointment_id)
        REFERENCES appointments(id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_review_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    
    -- One review per appointment per user
    CONSTRAINT unique_review_per_appointment UNIQUE(appointment_id, user_id)
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON appointment_reviews(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON appointment_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON appointment_reviews(rating);

COMMENT ON TABLE appointment_reviews IS 'Client reviews and ratings for completed appointments';

-- =============================================
-- HELPER VIEWS
-- =============================================

-- View: Upcoming Appointments with Full Details
CREATE OR REPLACE VIEW upcoming_appointments_view AS
SELECT 
    a.id,
    a.user_id,
    a.support_worker_id,
    a.appointment_date,
    a.appointment_time,
    a.duration_minutes,
    a.session_type,
    a.status,
    a.meeting_link,
    a.notes,
    a.created_at,
    -- Client details
    u.first_name as client_first_name,
    u.last_name as client_last_name,
    u.email as client_email,
    u.phone_number as client_phone,
    u.profile_image_url as client_avatar,
    -- Support worker details
    sw.first_name as support_worker_first_name,
    sw.last_name as support_worker_last_name,
    sw.email as support_worker_email,
    sw.phone_number as support_worker_phone,
    sw.avatar_url as support_worker_avatar,
    sw.specialization as support_worker_specialization
FROM appointments a
INNER JOIN users u ON a.user_id = u.id
INNER JOIN support_workers sw ON a.support_worker_id = sw.id
WHERE a.status IN ('scheduled', 'confirmed')
    AND a.appointment_date >= CURRENT_DATE
ORDER BY a.appointment_date, a.appointment_time;

-- View: Past Appointments with Full Details
CREATE OR REPLACE VIEW past_appointments_view AS
SELECT 
    a.id,
    a.user_id,
    a.support_worker_id,
    a.appointment_date,
    a.appointment_time,
    a.duration_minutes,
    a.session_type,
    a.status,
    a.meeting_link,
    a.notes,
    a.completed_at,
    a.created_at,
    -- Client details
    u.first_name as client_first_name,
    u.last_name as client_last_name,
    u.email as client_email,
    -- Support worker details
    sw.first_name as support_worker_first_name,
    sw.last_name as support_worker_last_name,
    sw.email as support_worker_email,
    sw.specialization as support_worker_specialization,
    sw.avatar_url as support_worker_avatar,
    -- Review information
    ar.rating,
    ar.review_text
FROM appointments a
INNER JOIN users u ON a.user_id = u.id
INNER JOIN support_workers sw ON a.support_worker_id = sw.id
LEFT JOIN appointment_reviews ar ON a.id = ar.appointment_id AND ar.user_id = a.user_id
WHERE (
    a.status IN ('completed', 'no_show', 'cancelled') OR
    (a.status IN ('scheduled', 'confirmed') AND a.appointment_date < CURRENT_DATE)
)
ORDER BY a.appointment_date DESC, a.appointment_time DESC;

-- View: Support Worker Statistics
CREATE OR REPLACE VIEW support_worker_stats AS
SELECT 
    sw.id as support_worker_id,
    sw.first_name,
    sw.last_name,
    sw.specialization,
    sw.is_available,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'cancelled' THEN a.id END) as cancelled_appointments,
    COALESCE(AVG(ar.rating), 0) as average_rating,
    COUNT(DISTINCT ar.id) as review_count
FROM support_workers sw
LEFT JOIN appointments a ON sw.id = a.support_worker_id
LEFT JOIN appointment_reviews ar ON a.id = ar.appointment_id
GROUP BY sw.id, sw.first_name, sw.last_name, sw.specialization, sw.is_available;

-- =============================================
-- TRIGGERS & FUNCTIONS
-- =============================================

-- Auto-update updated_at timestamp for support_workers
CREATE OR REPLACE FUNCTION update_support_workers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_workers_timestamp
    BEFORE UPDATE ON support_workers
    FOR EACH ROW
    EXECUTE FUNCTION update_support_workers_updated_at();

-- Auto-update updated_at timestamp for appointments
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointments_timestamp
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();

-- Set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_appointment_completed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_completed_timestamp
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION set_appointment_completed_timestamp();

-- Set cancelled_at when status changes to cancelled
CREATE OR REPLACE FUNCTION set_appointment_cancelled_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        NEW.cancelled_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_cancelled_timestamp
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION set_appointment_cancelled_timestamp();

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Check for appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflict(
    p_support_worker_id UUID,
    p_appointment_date DATE,
    p_appointment_time TIME,
    p_duration_minutes INTEGER DEFAULT 60,
    p_exclude_appointment_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
    end_time TIME;
BEGIN
    end_time := p_appointment_time + (p_duration_minutes || ' minutes')::INTERVAL;
    
    SELECT COUNT(*) INTO conflict_count
    FROM appointments
    WHERE support_worker_id = p_support_worker_id
        AND appointment_date = p_appointment_date
        AND status IN ('scheduled', 'confirmed')
        AND (id IS NULL OR id != p_exclude_appointment_id)
        AND (
            (appointment_time < end_time AND 
             (appointment_time + (duration_minutes || ' minutes')::INTERVAL) > p_appointment_time)
        );
    
    RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Get available time slots for a support worker on a specific date
CREATE OR REPLACE FUNCTION get_available_time_slots(
    p_support_worker_id UUID,
    p_date DATE,
    p_slot_duration_minutes INTEGER DEFAULT 30
) RETURNS TABLE(time_slot TIME) AS $$
DECLARE
    day_of_week INTEGER;
BEGIN
    day_of_week := EXTRACT(DOW FROM p_date);
    
    RETURN QUERY
    WITH availability_windows AS (
        SELECT start_time, end_time
        FROM support_worker_availability
        WHERE support_worker_id = p_support_worker_id
            AND day_of_week = get_available_time_slots.day_of_week
            AND (valid_until IS NULL OR valid_until >= p_date)
            AND valid_from <= p_date
    ),
    booked_slots AS (
        SELECT appointment_time, duration_minutes
        FROM appointments
        WHERE support_worker_id = p_support_worker_id
            AND appointment_date = p_date
            AND status IN ('scheduled', 'confirmed')
    ),
    generated_slots AS (
        SELECT generate_series(
            aw.start_time,
            aw.end_time - (p_slot_duration_minutes || ' minutes')::INTERVAL,
            (p_slot_duration_minutes || ' minutes')::INTERVAL
        )::TIME as slot_time
        FROM availability_windows aw
    )
    SELECT gs.slot_time
    FROM generated_slots gs
    WHERE NOT EXISTS (
        SELECT 1
        FROM booked_slots bs
        WHERE gs.slot_time < (bs.appointment_time + (bs.duration_minutes || ' minutes')::INTERVAL)
            AND (gs.slot_time + (p_slot_duration_minutes || ' minutes')::INTERVAL) > bs.appointment_time
    )
    ORDER BY gs.slot_time;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE support_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_worker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reviews ENABLE ROW LEVEL SECURITY;

-- Support Workers Policies (public read, admin write)
CREATE POLICY support_workers_select_all ON support_workers
    FOR SELECT
    USING (true); -- Anyone can view support workers

CREATE POLICY support_workers_update_own ON support_workers
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- Availability Policies
CREATE POLICY availability_select_all ON support_worker_availability
    FOR SELECT
    USING (true); -- Anyone can view availability

CREATE POLICY availability_manage_own ON support_worker_availability
    FOR ALL
    USING (
        support_worker_id IN (
            SELECT id FROM support_workers WHERE user_id = current_setting('app.current_user_id')::INTEGER
        )
    );

-- Appointments Policies
CREATE POLICY appointments_select_own ON appointments
    FOR SELECT
    USING (
        user_id = current_setting('app.current_user_id')::INTEGER OR
        support_worker_id IN (
            SELECT id FROM support_workers WHERE user_id = current_setting('app.current_user_id')::INTEGER
        )
    );

CREATE POLICY appointments_insert_own ON appointments
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY appointments_update_own ON appointments
    FOR UPDATE
    USING (
        user_id = current_setting('app.current_user_id')::INTEGER OR
        support_worker_id IN (
            SELECT id FROM support_workers WHERE user_id = current_setting('app.current_user_id')::INTEGER
        )
    );

-- Reviews Policies
CREATE POLICY reviews_select_all ON appointment_reviews
    FOR SELECT
    USING (true); -- Reviews are public

CREATE POLICY reviews_insert_own ON appointment_reviews
    FOR INSERT
    WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

CREATE POLICY reviews_update_own ON appointment_reviews
    FOR UPDATE
    USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- =============================================
-- SAMPLE DATA (Optional - uncomment to use)
-- =============================================
/*
-- Insert sample support workers
INSERT INTO support_workers (user_id, first_name, last_name, email, specialization, bio, hourly_rate, is_available)
VALUES 
    (2, 'Eric', 'Young', 'eric.young@safespace.com', 'Anxiety, Depression, Trauma', 'Experienced therapist specializing in anxiety disorders', 120.00, TRUE),
    (3, 'Michael', 'Chen', 'michael.chen@safespace.com', 'Anxiety, Depression, Trauma', 'Compassionate support for mental health challenges', 110.00, TRUE);

-- Insert sample availability (Monday-Friday, 9 AM - 5 PM)
INSERT INTO support_worker_availability (support_worker_id, day_of_week, start_time, end_time, valid_from)
SELECT id, dow, '09:00:00', '17:00:00', CURRENT_DATE
FROM support_workers, generate_series(1, 5) as dow;
*/

-- =============================================
-- MAINTENANCE FUNCTIONS
-- =============================================

-- Clean up old cancelled appointments
CREATE OR REPLACE FUNCTION cleanup_old_appointments(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM appointments
    WHERE status = 'cancelled'
        AND cancelled_at < CURRENT_TIMESTAMP - (days_old || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_appointments IS 'Deletes cancelled appointments older than specified days';