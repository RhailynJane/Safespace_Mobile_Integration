<!-- To be deleted later  -->

1. GET /api/appointments

Purpose: Fetch all appointments for a user
Query Parameters: clerkUserId (required)
Returns: List of appointments with support worker details
Frontend Usage: AppointmentList component to display upcoming and past appointments

2. POST /api/appointments

Purpose: Create a new appointment
Required Fields:

clerkUserId: User's Clerk ID
supportWorkerId: ID of the selected support worker
appointmentDate: Date of the appointment (YYYY-MM-DD)
appointmentTime: Time of the appointment (HH:MM:SS)
sessionType: Type of session (video, phone, in_person)


Optional Fields:

notes: Additional notes for the appointment
duration: Duration in minutes (default: 60)


Frontend Usage: ConfirmAppointment component when booking is confirmed

3. PUT /api/appointments/:id/reschedule

Purpose: Reschedule an existing appointment
URL Parameter: id (appointment ID)
Required Fields:

newDate: New appointment date
newTime: New appointment time


Optional Fields:

reason: Reason for rescheduling


Frontend Usage: AppointmentDetail component's reschedule functionality

4. PUT /api/appointments/:id/cancel

Purpose: Cancel an appointment
URL Parameter: id (appointment ID)
Optional Fields:

cancellationReason: Reason for cancellation


Frontend Usage: AppointmentDetail component's cancel functionality

🗄️ Database Requirements
Before using these endpoints, you need to create the required database tables. Run the provided SQL script (appointments_schema.sql) to create:

support_workers table - Stores support worker profiles
appointments table - Stores appointment records
support_worker_availability table - Stores availability schedules (optional for future use)

Run the SQL Script:
bashpsql -U postgres -d safespace -f appointments_schema.sql
🔧 Integration Steps
1. Update Your Backend:
Replace your current index.ts with the updated version (index_complete.ts) that includes the appointment endpoints.
2. Install Dependencies (if not already installed):
bashnpm install express cors pg
npm install --save-dev @types/express @types/cors @types/pg
3. Update Frontend API Calls:
In your React Native components, update the mock data to use actual API calls:
javascript// Example: Fetching appointments
const fetchAppointments = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/appointments?clerkUserId=${user.id}`);
    const data = await response.json();
    setAppointments(data.appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
  }
};

// Example: Creating an appointment
const createAppointment = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clerkUserId: user.id,
        supportWorkerId: selectedWorker.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        sessionType: selectedType,
        notes: appointmentNotes
      })
    });
    const data = await response.json();
    if (data.success) {
      // Navigate to confirmation screen
      router.push('/appointments/confirmation');
    }
  } catch (error) {
    console.error('Error creating appointment:', error);
  }
};
📋 Features Implemented
✅ Core Features:

User appointment history retrieval
New appointment booking with conflict detection
Appointment rescheduling with availability check
Appointment cancellation with reason tracking
Meeting link generation for video appointments
Support worker information integration

🔒 Validation & Security:

User authentication via Clerk ID
Input validation for all required fields
Session type validation
Time slot conflict detection
Status validation (prevents cancelling already cancelled appointments)
Proper error handling and HTTP status codes

📊 Data Management:

Automatic timestamp tracking (created_at, updated_at)
Appointment notes and cancellation reasons
Support for different session types (video, phone, in-person)
Meeting link generation for video sessions

🚀 Next Steps
Required:

Run the SQL schema to create the database tables
Replace your current index.ts with the updated version
Test the endpoints with a tool like Postman or Thunder Client
Update your React Native components to use the actual API

Optional Enhancements:

Add support worker endpoints (GET /api/support-workers)
Add availability checking endpoints
Add appointment reminder notifications
Add appointment review/rating system
Implement real video conferencing integration (replace mock meeting links)

📝 Testing the Endpoints
Test with cURL:
bash# Get appointments
curl "http://localhost:3001/api/appointments?clerkUserId=YOUR_CLERK_ID"

# Create appointment
curl -X POST http://localhost:3001/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "clerkUserId": "YOUR_CLERK_ID",
    "supportWorkerId": 1,
    "appointmentDate": "2025-10-07",
    "appointmentTime": "10:30:00",
    "sessionType": "video",
    "notes": "First session"
  }'

# Reschedule appointment
curl -X PUT http://localhost:3001/api/appointments/1/reschedule \
  -H "Content-Type: application/json" \
  -d '{
    "newDate": "2025-10-08",
    "newTime": "14:00:00",
    "reason": "Schedule conflict"
  }'

# Cancel appointment
curl -X PUT http://localhost:3001/api/appointments/1/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "cancellationReason": "Unable to attend"
  }'
📚 Files Provided

index_complete.ts - Your updated Express server with appointment endpoints
appointments_schema.sql - SQL script to create required database tables
README_appointments.md - This documentation file

🛠️ Troubleshooting
Common Issues:

"Support worker not found" error

Run the SQL schema to insert sample support workers
Or manually add support workers to the database


"User not found" error

Ensure the user exists in the users table
Check that the Clerk ID is correct


Database connection errors

Verify PostgreSQL is running
Check database credentials in the connection pool


Time slot conflicts

The system prevents double-booking
Try a different time if you get a conflict error