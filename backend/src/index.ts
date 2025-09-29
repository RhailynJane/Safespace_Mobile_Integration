import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'safespace',
  password: 'password',
  port: 5432,
});

// Interface definitions
interface SyncUserRequest {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

interface CreateClientRequest {
  userId: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

interface SubmitAssessmentRequest {
  clerkUserId: string;
  responses: Record<string, number>;
  totalScore: number;
  assessmentType?: string;
}

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to PostgreSQL database successfully!');
    if (release) release();
  }
});

// Test endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'SafeSpace API is running!', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Get all users endpoint
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ 
      error: 'Database query failed',
      details: error.message
    });
  }
});

// Sync user endpoint
app.post('/api/sync-user', async (req: Request<{}, {}, SyncUserRequest>, res: Response) => {
  try {
    const { clerkUserId, email, firstName, lastName, phoneNumber } = req.body;

    if (!clerkUserId || !email) {
      return res.status(400).json({ 
        error: 'clerkUserId and email are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO users (clerk_user_id, first_name, last_name, email, phone_number, role, status) 
       VALUES ($1, $2, $3, $4, $5, 'client', 'active')
       ON CONFLICT (clerk_user_id) 
       DO UPDATE SET 
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         email = EXCLUDED.email,
         phone_number = EXCLUDED.phone_number,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, clerk_user_id, email`,
      [clerkUserId, firstName, lastName, email, phoneNumber]
    );

    res.json({ 
      success: true, 
      message: 'User synced successfully',
      user: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error syncing user:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Create client endpoint
app.post('/api/clients', async (req: Request<{}, {}, CreateClientRequest>, res: Response) => {
  try {
    const { userId, emergencyContactName, emergencyContactPhone, emergencyContactRelationship } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await pool.query(
      `INSERT INTO clients (user_id, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         emergency_contact_name = EXCLUDED.emergency_contact_name,
         emergency_contact_phone = EXCLUDED.emergency_contact_phone,
         emergency_contact_relationship = EXCLUDED.emergency_contact_relationship,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, emergencyContactName, emergencyContactPhone, emergencyContactRelationship]
    );

    res.json({ 
      success: true, 
      message: 'Client created successfully',
      client: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error creating client:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// =============================================
// ASSESSMENT ENDPOINTS
// =============================================

// Check if assessment is due for a user
app.get('/api/assessments/is-due/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;

    // First get the user's internal ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Check if assessment is due using the database function
    const result = await pool.query(
      'SELECT is_assessment_due($1) as is_due',
      [userId]
    );

    res.json({ 
      isDue: result.rows[0].is_due,
      userId: userId
    });

  } catch (error: any) {
    console.error('Error checking assessment:', error.message);
    res.status(500).json({ 
      error: 'Failed to check assessment status',
      details: error.message
    });
  }
});

// Submit assessment
app.post('/api/assessments/submit', async (req: Request<{}, {}, SubmitAssessmentRequest>, res: Response) => {
  try {
    const { clerkUserId, responses, totalScore, assessmentType = 'pre-survey' } = req.body;

    if (!clerkUserId || !responses || totalScore === undefined) {
      return res.status(400).json({ 
        error: 'clerkUserId, responses, and totalScore are required' 
      });
    }

    // Get user's internal ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Insert assessment
    const result = await pool.query(
      `INSERT INTO assessments 
       (user_id, assessment_type, responses, total_score, submitted_to_worker) 
       VALUES ($1, $2, $3, $4, true) 
       RETURNING id, user_id, assessment_type, total_score, completed_at, next_due_date`,
      [userId, assessmentType, JSON.stringify(responses), totalScore]
    );

    console.log('Assessment submitted successfully:', result.rows[0]);

    res.json({ 
      success: true, 
      message: 'Assessment submitted successfully',
      assessment: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error submitting assessment:', error.message);
    res.status(500).json({ 
      error: 'Failed to submit assessment',
      details: error.message
    });
  }
});

// Get user's assessment history
app.get('/api/assessments/history/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;

    // Get user's internal ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Get assessment history
    const result = await pool.query(
      `SELECT id, assessment_type, total_score, completed_at, next_due_date, 
              submitted_to_worker, reviewed_by_worker
       FROM assessments 
       WHERE user_id = $1 
       ORDER BY completed_at DESC`,
      [userId]
    );

    res.json({ 
      assessments: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('Error fetching assessment history:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch assessment history',
      details: error.message
    });
  }
});

// Get latest assessment for a user
app.get('/api/assessments/latest/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;

    // Get user's internal ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Get latest assessment
    const result = await pool.query(
      `SELECT id, assessment_type, total_score, responses, completed_at, next_due_date, 
              submitted_to_worker, reviewed_by_worker
       FROM assessments 
       WHERE user_id = $1 
       ORDER BY completed_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ assessment: null });
    }

    res.json({ assessment: result.rows[0] });

  } catch (error: any) {
    console.error('Error fetching latest assessment:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch latest assessment',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\nSafeSpace Backend Server Started!');
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Android emulator URL: http://10.0.2.2:${PORT}`);
  console.log(`Test in browser: http://localhost:${PORT}/api/users`);
  console.log('Server logs will appear below...\n');
});

// Handle server shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  await pool.end();
  process.exit(0);
});