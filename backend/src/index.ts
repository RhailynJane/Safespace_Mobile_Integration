
import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = 3001; // Different from Metro's 8081

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection - UPDATE THESE CREDENTIALS TO MATCH YOUR SETUP
const pool = new Pool({
  user: 'postgres',           // Your PostgreSQL username
  host: 'localhost',          // Usually localhost
  database: 'safespace',      // Your database name
  password: 'password',       // YOUR ACTUAL PASSWORD HERE - UPDATE THIS!
  port: 5432,                // Default PostgreSQL port
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

// Test database connection with better error handling
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:');
    console.error('Error details:', err.message);
    console.error('Connection config:', {
      user: pool.options.user,
      host: pool.options.host,
      database: pool.options.database,
      port: pool.options.port
    });
    console.error('\n🔧 To fix database connection:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your database name and password');
    console.error('3. Verify the database "safespace" exists');
  } else {
    console.log('✅ Connected to PostgreSQL database successfully!');
    console.log(`📊 Database: ${pool.options.database} on ${pool.options.host}:${pool.options.port}`);
    if (release) release();
  }
});

// Test endpoint to verify server is working
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'SafeSpace API is running!', 
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Get all users endpoint with better error handling
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    console.log('📋 Fetching users from database...');
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    console.log(`✅ Found ${result.rows.length} users`);
    res.json(result.rows);
  } catch (error: any) {
    console.error('❌ Error fetching users:', error.message);
    res.status(500).json({ 
      error: 'Database query failed',
      details: error.message,
      query: 'SELECT * FROM users ORDER BY created_at DESC'
    });
  }
});

// Sync user endpoint with detailed logging
app.post('/api/sync-user', async (req: Request<{}, {}, SyncUserRequest>, res: Response) => {
  try {
    const { clerkUserId, email, firstName, lastName, phoneNumber } = req.body;

    console.log('👤 Received sync request for user:', { clerkUserId, email, firstName, lastName });

    if (!clerkUserId || !email) {
      console.log('❌ Missing required fields');
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

    console.log('✅ User synced successfully:', result.rows[0]);

    res.json({ 
      success: true, 
      message: 'User synced successfully',
      user: result.rows[0]
    });

  } catch (error: any) {
    console.error('❌ Error syncing user:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
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
    
    console.log('👥 Creating client record for user:', userId);

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

    console.log('✅ Client created successfully:', result.rows[0]);

    res.json({ 
      success: true, 
      message: 'Client created successfully',
      client: result.rows[0]
    });

  } catch (error: any) {
    console.error('❌ Error creating client:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Start server with better logging
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 SafeSpace Backend Server Started!');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📍 From your computer: http://192.168.1.100:${PORT}`);
  console.log(`📍 Android emulator URL: http://10.0.2.2:${PORT}`);
  console.log(`🔍 Test in browser: http://localhost:${PORT}/api/users`);
  console.log(`📱 Your Expo app is on: http://192.168.1.100:8081`);
  console.log('📝 Server logs will appear below...\n');
});

// Handle server shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await pool.end();
  process.exit(0);
});