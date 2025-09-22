/**
* LLM Prompt: Create comprehensive React Native component documentation covering frontend implementation details and backend integration specs including PostgreSQL schema design and REST API endpoints. 
* Reference: chat.deepseek.com
*/

# SafeSpace Appointments System - Appointment Documentation

## 📱 Frontend Appointments Components

### Component Architecture Overview

The appointments system consists of 6 main screens that provide a complete appointment booking and management experience:

1. **AppointmentsScreen** (`/appointments`) - Main appointments dashboard
2. **BookAppointment** (`/appointments/book`) - Support worker selection
3. **BookAppointmentDetails** (`/appointments/details`) - Date/time selection
4. **ConfirmAppointment** (`/appointments/confirm`) - Final confirmation
5. **AppointmentConfirmation** (`/appointments/confirmation`) - Success screen
6. **AppointmentList** (`/appointments/appointment-list`) - Appointment management
7. **AppointmentDetail** (`/appointments/[id]/appointment-detail`) - Individual appointment view

---

### 1. AppointmentsScreen Component
**File**: `app/(app)/(tabs)/appointments/index.tsx`

**Purpose**: Main appointments dashboard with booking options

#### Key Features:
- **Book Appointment**: Primary call-to-action button
- **View Scheduled**: Access to existing appointments
- **Visual Design**: Elegant curved background with appointment illustration
- **Empty State**: Encourages first-time booking

#### UI Components:
- **Illustration**: Appointment management visual (from IconScout)
- **Primary Button**: "Book Appointment" - navigates to booking flow
- **Secondary Button**: "Check Scheduled Appointments" - views existing bookings

---

### 2. BookAppointment Component
**File**: `app/(app)/appointments/book.tsx`

**Purpose**: Support worker selection screen (Step 1 of 4)

#### Key Features:
- **Support Worker List**: Browse available mental health professionals
- **Search Functionality**: Filter support workers by name
- **Step Indicator**: Visual progress tracker (Step 1 of 4)
- **Profile Display**: Support worker avatars, names, and specialties

#### Support Worker Data Structure:
```typescript
const supportWorkers = [
  {
    id: 1,
    name: "Eric Young",
    title: "Support worker",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    specialties: ["Anxiety", "Depression", "Trauma"],
  }
];
```

#### Navigation Flow:
- Select support worker → Navigates to date/time selection with `supportWorkerId` parameter

---

### 3. BookAppointmentDetails Component
**File**: `app/(app)/appointments/details.tsx`

**Purpose**: Date and time selection (Step 2 of 4)

#### Key Features:
- **Session Type Selection**: Video Call, Phone Call, or In Person
- **Date Picker**: Available dates for the selected support worker
- **Time Slots**: Available time slots for selected date
- **Step Validation**: Requires both date and time selection to continue

#### Session Types:
```typescript
const SESSION_TYPES = ["Video Call", "Phone Call", "In Person"];
```

#### Available Dates/Times:
- Mock data showing available slots for demonstration
- Real implementation would fetch from backend API

---

### 4. ConfirmAppointment Component
**File**: `app/(app)/appointments/confirm.tsx`

**Purpose**: Final confirmation before booking (Step 3 of 4)

#### Key Features:
- **Appointment Summary**: Review all booking details
- **Optional Notes**: Add specific concerns for the support worker
- **Back/Confirm Buttons**: Final chance to modify or confirm
- **Step Indicator**: Shows progress (Step 3 of 4)

#### Data Display:
- Support worker name and details
- Selected date and time
- Session type
- User-provided notes

---

### 5. AppointmentConfirmation Component
**File**: `app/(app)/appointments/confirmation.tsx`

**Purpose**: Success screen after booking (Step 4 of 4)

#### Key Features:
- **Confirmation Message**: Success feedback
- **Appointment Details**: Final summary of booked appointment
- **Action Buttons**: 
  - "Check Appointments" - View appointment list
  - "Book Another Appointment" - Start new booking flow
- **Step Indicator**: Completion indicator (Step 4 of 4)

---

### 6. AppointmentList Component
**File**: `app/(app)/appointments/appointment-list.tsx`

**Purpose**: Manage existing appointments

#### Key Features:
- **Tab Interface**: Switch between Upcoming and Past appointments
- **Appointment Cards**: Visual display of appointment details
- **Empty States**: Messages when no appointments exist
- **Schedule Button**: Quick access to book new appointments

#### Appointment Status:
- **Upcoming**: Future appointments that haven't occurred
- **Past**: Completed appointments for reference

#### Appointment Card Display:
- Support worker name
- Date and time
- Session type with icons
- Status indicators

---

### 7. AppointmentDetail Component
**File**: `app/(app)/appointments/[id]/appointment-detail.tsx`

**Purpose**: Detailed view of individual appointment

#### Key Features:
- **Complete Details**: Full appointment information
- **Action Buttons**:
  - **Join Session**: Navigate to video consultation
  - **Reschedule**: Change appointment time/date
  - **Cancel**: Remove appointment with confirmation
- **Modals**: Confirmation dialogs for destructive actions

#### Action Flows:
- **Reschedule**: Shows available time slots in modal
- **Cancel**: Confirmation modal to prevent accidental cancellation
- **Join**: Direct navigation to video session

---

## 🗄️ Backend Database Schema

### Core Appointments Tables

#### 1. Support Workers Table
```sql
CREATE TABLE support_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    specialization VARCHAR(200) NOT NULL,
    qualifications TEXT,
    bio TEXT,
    avatar_url VARCHAR(500),
    hourly_rate DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    max_daily_sessions INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_support_workers_specialization ON support_workers(specialization);
CREATE INDEX idx_support_workers_availability ON support_workers(is_available);
CREATE INDEX idx_support_workers_user_id ON support_workers(user_id);
```

#### 2. Appointments Table
```sql
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    support_worker_id UUID REFERENCES support_workers(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('video', 'phone', 'in_person')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
    meeting_link VARCHAR(500),
    notes TEXT,
    cancellation_reason TEXT,
    rescheduled_from UUID REFERENCES appointments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_support_worker_id ON appointments(support_worker_id);
CREATE INDEX idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX idx_appointments_status ON appointments(status);
```

#### 3. Support Worker Availability Table
```sql
CREATE TABLE support_worker_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    support_worker_id UUID REFERENCES support_workers(id) ON DELETE CASCADE,
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
```

#### 4. Appointment Reviews Table
```sql
CREATE TABLE appointment_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure one review per appointment
CREATE UNIQUE INDEX idx_appointment_reviews_unique ON appointment_reviews(appointment_id, user_id);

-- Index for rating queries
CREATE INDEX idx_reviews_rating ON appointment_reviews(rating);
```

---

## 🔌 API Endpoints Specification

### Appointments Management Endpoints

#### 1. Get Available Support Workers
```http
GET /api/support-workers?specialization=anxiety&available=true
Authorization: Bearer <token>

Response (200):
{
  "support_workers": [
    {
      "id": "uuid",
      "first_name": "Eric",
      "last_name": "Young",
      "specialization": "Anxiety, Depression",
      "avatar_url": "https://example.com/avatar.jpg",
      "hourly_rate": 85.00,
      "is_available": true,
      "average_rating": 4.8
    }
  ],
  "total_count": 15
}
```

#### 2. Check Support Worker Availability
```http
GET /api/support-workers/{worker_id}/availability?date=2024-01-15
Authorization: Bearer <token>

Response (200):
{
  "available_slots": [
    "09:00:00",
    "10:30:00", 
    "14:00:00",
    "15:30:00"
  ],
  "date": "2024-01-15"
}
```

#### 3. Create Appointment
```http
POST /api/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "support_worker_id": "uuid",
  "appointment_date": "2024-01-15",
  "appointment_time": "10:30:00",
  "session_type": "video",
  "notes": "I'd like to discuss anxiety management techniques"
}

Response (201):
{
  "id": "uuid",
  "support_worker_id": "uuid",
  "appointment_date": "2024-01-15",
  "appointment_time": "10:30:00",
  "session_type": "video",
  "status": "scheduled",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "notes": "I'd like to discuss anxiety management techniques",
  "created_at": "2024-01-10T10:30:00Z"
}
```

#### 4. Get User Appointments
```http
GET /api/appointments?status=upcoming&page=1&limit=10
Authorization: Bearer <token>

Response (200):
{
  "appointments": [
    {
      "id": "uuid",
      "support_worker": {
        "id": "uuid",
        "first_name": "Eric",
        "last_name": "Young",
        "specialization": "Anxiety, Depression"
      },
      "appointment_date": "2024-01-15",
      "appointment_time": "10:30:00",
      "session_type": "video",
      "status": "scheduled",
      "meeting_link": "https://meet.google.com/abc-defg-hij"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_appointments": 25
  }
}
```

#### 5. Get Appointment Details
```http
GET /api/appointments/{appointment_id}
Authorization: Bearer <token>

Response (200):
{
  "id": "uuid",
  "support_worker": {
    "id": "uuid",
    "first_name": "Eric",
    "last_name": "Young",
    "email": "eric.young@clinic.com",
    "phone_number": "+1234567890",
    "specialization": "Anxiety, Depression",
    "qualifications": "PhD in Psychology, Licensed Therapist",
    "bio": "Specialized in anxiety disorders with 10 years of experience...",
    "avatar_url": "https://example.com/avatar.jpg",
    "hourly_rate": 85.00
  },
  "appointment_date": "2024-01-15",
  "appointment_time": "10:30:00",
  "duration_minutes": 60,
  "session_type": "video",
  "status": "scheduled",
  "meeting_link": "https://meet.google.com/abc-defg-hij",
  "notes": "I'd like to discuss anxiety management techniques",
  "created_at": "2024-01-10T10:30:00Z"
}
```

#### 6. Reschedule Appointment
```http
PUT /api/appointments/{appointment_id}/reschedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "new_date": "2024-01-20",
  "new_time": "14:00:00"
}

Response (200):
{
  "id": "uuid",
  "appointment_date": "2024-01-20",
  "appointment_time": "14:00:00",
  "status": "scheduled",
  "previous_date": "2024-01-15",
  "previous_time": "10:30:00"
}
```

#### 7. Cancel Appointment
```http
PUT /api/appointments/{appointment_id}/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "cancellation_reason": "Unexpected work commitment"
}

Response (200):
{
  "id": "uuid",
  "status": "cancelled",
  "cancelled_at": "2024-01-12T09:15:00Z"
}
```

#### 8. Submit Appointment Review
```http
POST /api/appointments/{appointment_id}/review
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "review_text": "Eric was very understanding and provided helpful techniques.",
  "is_anonymous": false
}

Response (201):
{
  "id": "uuid",
  "rating": 5,
  "review_text": "Eric was very understanding and provided helpful techniques.",
  "created_at": "2024-01-16T11:30:00Z"
}
```

---

## 🔐 Database Service Functions

### Appointments Service
```javascript
class AppointmentsService {
  async createAppointment(userId, appointmentData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if support worker is available at requested time
      const availabilityQuery = `
        SELECT 1 FROM support_worker_availability 
        WHERE support_worker_id = $1 
        AND day_of_week = EXTRACT(DOW FROM $2::date)
        AND $3::time BETWEEN start_time AND end_time
        AND (valid_until IS NULL OR valid_until >= $2::date)
        AND valid_from <= $2::date
      `;
      
      const availabilityResult = await client.query(availabilityQuery, [
        appointmentData.support_worker_id,
        appointmentData.appointment_date,
        appointmentData.appointment_time
      ]);
      
      if (availabilityResult.rows.length === 0) {
        throw new Error('Support worker not available at requested time');
      }
      
      // Check for conflicting appointments
      const conflictQuery = `
        SELECT 1 FROM appointments 
        WHERE support_worker_id = $1 
        AND appointment_date = $2 
        AND appointment_time = $3 
        AND status IN ('scheduled', 'confirmed')
      `;
      
      const conflictResult = await client.query(conflictQuery, [
        appointmentData.support_worker_id,
        appointmentData.appointment_date,
        appointmentData.appointment_time
      ]);
      
      if (conflictResult.rows.length > 0) {
        throw new Error('Time slot already booked');
      }
      
      // Generate meeting link for video sessions
      let meetingLink = null;
      if (appointmentData.session_type === 'video') {
        meetingLink = this.generateMeetingLink();
      }
      
      // Insert appointment
      const appointmentQuery = `
        INSERT INTO appointments (
          user_id, support_worker_id, appointment_date, appointment_time,
          session_type, meeting_link, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const appointmentResult = await client.query(appointmentQuery, [
        userId,
        appointmentData.support_worker_id,
        appointmentData.appointment_date,
        appointmentData.appointment_time,
        appointmentData.session_type,
        meetingLink,
        appointmentData.notes || null
      ]);
      
      await client.query('COMMIT');
      return appointmentResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserAppointments(userId, filters = {}) {
    const { status, page = 1, limit = 10 } = filters;
    
    let whereClause = 'WHERE a.user_id = $1';
    const queryParams = [userId];
    let paramCount = 1;
    
    // Add status filter
    if (status) {
      paramCount++;
      if (status === 'upcoming') {
        whereClause += ` AND (a.appointment_date > CURRENT_DATE OR 
                          (a.appointment_date = CURRENT_DATE AND a.appointment_time > CURRENT_TIME)) 
                         AND a.status IN ('scheduled', 'confirmed')`;
      } else if (status === 'past') {
        whereClause += ` AND (a.appointment_date < CURRENT_DATE OR 
                          (a.appointment_date = CURRENT_DATE AND a.appointment_time < CURRENT_TIME)) 
                         AND a.status IN ('completed', 'cancelled', 'no_show')`;
      } else {
        whereClause += ` AND a.status = $${paramCount}`;
        queryParams.push(status);
      }
    }
    
    const offset = (page - 1) * limit;
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);
    
    const query = `
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.session_type,
        a.status,
        a.meeting_link,
        a.notes,
        sw.first_name || ' ' || sw.last_name as support_worker_name,
        sw.specialization,
        sw.avatar_url
      FROM appointments a
      JOIN support_workers sw ON a.support_worker_id = sw.id
      ${whereClause}
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM appointments a
      ${whereClause}
    `;
    
    const [appointmentsResult, countResult] = await Promise.all([
      client.query(query, queryParams),
      client.query(countQuery, queryParams.slice(0, 1)) // Only user_id for count
    ]);
    
    const totalCount = parseInt(countResult.rows[0].total_count);
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      appointments: appointmentsResult.rows,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_appointments: totalCount,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };
  }

  async rescheduleAppointment(appointmentId, newDate, newTime) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current appointment details
      const currentAppointmentQuery = 'SELECT * FROM appointments WHERE id = $1';
      const currentResult = await client.query(currentAppointmentQuery, [appointmentId]);
      
      if (currentResult.rows.length === 0) {
        throw new Error('Appointment not found');
      }
      
      const currentAppointment = currentResult.rows[0];
      
      // Check new time availability
      const availabilityQuery = `
        SELECT 1 FROM support_worker_availability 
        WHERE support_worker_id = $1 
        AND day_of_week = EXTRACT(DOW FROM $2::date)
        AND $3::time BETWEEN start_time AND end_time
        AND (valid_until IS NULL OR valid_until >= $2::date)
        AND valid_from <= $2::date
      `;
      
      const availabilityResult = await client.query(availabilityQuery, [
        currentAppointment.support_worker_id,
        newDate,
        newTime
      ]);
      
      if (availabilityResult.rows.length === 0) {
        throw new Error('Support worker not available at requested time');
      }
      
      // Check for conflicts
      const conflictQuery = `
        SELECT 1 FROM appointments 
        WHERE support_worker_id = $1 
        AND appointment_date = $2 
        AND appointment_time = $3 
        AND status IN ('scheduled', 'confirmed')
        AND id != $4
      `;
      
      const conflictResult = await client.query(conflictQuery, [
        currentAppointment.support_worker_id,
        newDate,
        newTime,
        appointmentId
      ]);
      
      if (conflictResult.rows.length > 0) {
        throw new Error('Time slot already booked');
      }
      
      // Update appointment
      const updateQuery = `
        UPDATE appointments 
        SET appointment_date = $1, appointment_time = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const updateResult = await client.query(updateQuery, [newDate, newTime, appointmentId]);
      
      await client.query('COMMIT');
      return updateResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelAppointment(appointmentId, cancellationReason) {
    const query = `
      UPDATE appointments 
      SET status = 'cancelled', 
          cancellation_reason = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await client.query(query, [cancellationReason, appointmentId]);
    return result.rows[0];
  }

  // Helper methods
  generateMeetingLink() {
    // Generate a unique meeting link (in real app, integrate with video service API)
    const randomId = Math.random().toString(36).substring(2, 15);
    return `https://meet.safespace.com/${randomId}`;
  }
}
```

### Support Workers Service
```javascript
class SupportWorkersService {
  async getAvailableSupportWorkers(filters = {}) {
    const { specialization, available = true, page = 1, limit = 10 } = filters;
    
    let whereClause = 'WHERE sw.is_available = $1';
    const queryParams = [available];
    let paramCount = 1;
    
    // Add specialization filter
    if (specialization) {
      paramCount++;
      whereClause += ` AND sw.specialization ILIKE $${paramCount}`;
      queryParams.push(`%${specialization}%`);
    }
    
    const offset = (page - 1) * limit;
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);
    
    const query = `
      SELECT 
        sw.id,
        sw.first_name,
        sw.last_name,
        sw.specialization,
        sw.avatar_url,
        sw.hourly_rate,
        sw.is_available,
        COALESCE(AVG(ar.rating), 0) as average_rating,
        COUNT(ar.id) as review_count
      FROM support_workers sw
      LEFT JOIN appointments a ON sw.id = a.support_worker_id
      LEFT JOIN appointment_reviews ar ON a.id = ar.appointment_id
      ${whereClause}
      GROUP BY sw.id
      ORDER BY average_rating DESC, review_count DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM support_workers sw
      ${whereClause}
    `;
    
    const [workersResult, countResult] = await Promise.all([
      client.query(query, queryParams),
      client.query(countQuery, queryParams.slice(0, paramCount - 2)) // Exclude limit/offset
    ]);
    
    const totalCount = parseInt(countResult.rows[0].total_count);
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      support_workers: workersResult.rows,
      total_count: totalCount,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };
  }

  async getSupportWorkerAvailability(workerId, date) {
    const dayOfWeek = new Date(date).getDay();
    
    const query = `
      SELECT 
        swa.start_time,
        swa.end_time
      FROM support_worker_availability swa
      WHERE swa.support_worker_id = $1
      AND swa.day_of_week = $2
      AND (swa.valid_until IS NULL OR swa.valid_until >= $3::date)
      AND swa.valid_from <= $3::date
    `;
    
    const result = await client.query(query, [workerId, dayOfWeek, date]);
    
    // Generate available time slots based on availability windows
    const availableSlots = [];
    result.rows.forEach(availability => {
      const slots = this.generateTimeSlots(
        availability.start_time,
        availability.end_time,
        30 // 30-minute intervals
      );
      availableSlots.push(...slots);
    });
    
    // Remove slots that are already booked
    const bookedSlotsQuery = `
      SELECT appointment_time
      FROM appointments
      WHERE support_worker_id = $1
      AND appointment_date = $2
      AND status IN ('scheduled', 'confirmed')
    `;
    
    const bookedResult = await client.query(bookedSlotsQuery, [workerId, date]);
    const bookedTimes = bookedResult.rows.map(row => row.appointment_time);
    
    const availableTimes = availableSlots.filter(slot => 
      !bookedTimes.includes(slot)
    );
    
    return {
      available_slots: availableTimes,
      date: date
    };
  }

  // Helper method to generate time slots
  generateTimeSlots(startTime, endTime, intervalMinutes) {
    const slots = [];
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    let current = new Date(start);
    while (current < end) {
      slots.push(current.toTimeString().slice(0, 8)); // HH:MM:SS format
      current.setMinutes(current.getMinutes() + intervalMinutes);
    }
    
    return slots;
  }
}
```

