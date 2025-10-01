import express, { Request, Response } from 'express';
import cors from 'cors';
import { Pool } from 'pg';
const API_BASE_URL = 'http://192.168.1.100:3001/api';


const app = express();
const PORT = 3001;
const axios = require('axios');


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

//Mood Tracking Interfaces and Endpoints
interface CreateMoodRequest {
  clerkUserId: string;
  moodType: 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad';
  intensity: number;
  notes?: string;
  factors?: string[];
}

interface MoodFilterParams {
  moodType?: string;
  startDate?: string;
  endDate?: string;
  factors?: string;
  limit?: string;
  offset?: string;
}

// =============================================
// MOOD TRACKING ENDPOINTS
// =============================================

// Create a new mood entry
app.post('/api/moods', async (req: Request<{}, {}, CreateMoodRequest>, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { clerkUserId, moodType, intensity, notes, factors } = req.body;

    // Validation
    if (!clerkUserId || !moodType || !intensity) {
      return res.status(400).json({ 
        error: 'clerkUserId, moodType, and intensity are required' 
      });
    }

    if (intensity < 1 || intensity > 5) {
      return res.status(400).json({ 
        error: 'Intensity must be between 1 and 5' 
      });
    }

    await client.query('BEGIN');

    // Get user's internal ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Insert mood entry
    const moodResult = await client.query(
      `INSERT INTO mood_entries (user_id, clerk_user_id, mood_type, intensity, notes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, mood_type, intensity, notes, created_at`,
      [userId, clerkUserId, moodType, intensity, notes || null]
    );

    const moodEntry = moodResult.rows[0];

    // Insert mood factors if provided
    if (factors && factors.length > 0) {
      const factorInserts = factors.map(factor =>
        client.query(
          'INSERT INTO mood_factors (mood_entry_id, factor) VALUES ($1, $2)',
          [moodEntry.id, factor]
        )
      );
      await Promise.all(factorInserts);
    }

    await client.query('COMMIT');

    // Get complete mood entry with factors
    const completeEntry = await client.query(
      `SELECT 
        me.id, me.mood_type, me.intensity, me.notes, me.created_at,
        get_mood_emoji(me.mood_type) as mood_emoji,
        get_mood_label(me.mood_type) as mood_label,
        COALESCE(
          json_agg(
            json_build_object('factor', mf.factor)
          ) FILTER (WHERE mf.factor IS NOT NULL),
          '[]'
        ) as mood_factors
      FROM mood_entries me
      LEFT JOIN mood_factors mf ON me.id = mf.mood_entry_id
      WHERE me.id = $1
      GROUP BY me.id`,
      [moodEntry.id]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Mood entry created successfully',
      mood: completeEntry.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating mood entry:', error.message);
    res.status(500).json({ 
      error: 'Failed to create mood entry',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Get recent moods for a user (last 10)
app.get('/api/moods/recent/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await pool.query(
      `SELECT 
        me.id, me.mood_type, me.intensity, me.notes, me.created_at,
        get_mood_emoji(me.mood_type) as mood_emoji,
        get_mood_label(me.mood_type) as mood_label,
        COALESCE(
          json_agg(
            json_build_object('factor', mf.factor)
          ) FILTER (WHERE mf.factor IS NOT NULL),
          '[]'
        ) as mood_factors
      FROM mood_entries me
      LEFT JOIN mood_factors mf ON me.id = mf.mood_entry_id
      WHERE me.clerk_user_id = $1
      GROUP BY me.id
      ORDER BY me.created_at DESC
      LIMIT $2`,
      [clerkUserId, limit]
    );

    res.json({ 
      moods: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('Error fetching recent moods:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch recent moods',
      details: error.message
    });
  }
});

// Get mood history with filters and search
app.get('/api/moods/history/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;
    const { 
      moodType, 
      startDate, 
      endDate, 
      factors, 
      limit = '50', 
      offset = '0' 
    } = req.query as MoodFilterParams;

    let query = `
      SELECT 
        me.id, me.mood_type, me.intensity, me.notes, me.created_at,
        get_mood_emoji(me.mood_type) as mood_emoji,
        get_mood_label(me.mood_type) as mood_label,
        COALESCE(
          json_agg(
            json_build_object('factor', mf.factor)
          ) FILTER (WHERE mf.factor IS NOT NULL),
          '[]'
        ) as mood_factors
      FROM mood_entries me
      LEFT JOIN mood_factors mf ON me.id = mf.mood_entry_id
      WHERE me.clerk_user_id = $1
    `;

    const params: any[] = [clerkUserId];
    let paramIndex = 2;

    // Filter by mood type
    if (moodType) {
      query += ` AND me.mood_type = $${paramIndex}`;
      params.push(moodType);
      paramIndex++;
    }

    // Filter by date range
    if (startDate) {
      query += ` AND me.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND me.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` GROUP BY me.id`;

    // Filter by factors (after grouping)
    if (factors) {
      const factorArray = factors.split(',').map(f => f.trim());
      query += ` HAVING bool_or(mf.factor = ANY($${paramIndex}))`;
      params.push(factorArray);
      paramIndex++;
    }

    query += ` ORDER BY me.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM mood_entries WHERE clerk_user_id = $1',
      [clerkUserId]
    );

    res.json({ 
      moods: result.rows,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error: any) {
    console.error('Error fetching mood history:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch mood history',
      details: error.message
    });
  }
});

// Get mood statistics for a user
app.get('/api/moods/stats/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;
    const { days = '30' } = req.query;

    const result = await pool.query(
      `SELECT 
        mood_type,
        COUNT(*) as count,
        AVG(intensity) as avg_intensity,
        get_mood_emoji(mood_type) as emoji,
        get_mood_label(mood_type) as label
      FROM mood_entries
      WHERE clerk_user_id = $1
        AND created_at >= NOW() - INTERVAL '${parseInt(days as string)} days'
      GROUP BY mood_type
      ORDER BY count DESC`,
      [clerkUserId]
    );

    // Get most common factors
    const factorsResult = await pool.query(
      `SELECT mf.factor, COUNT(*) as count
      FROM mood_factors mf
      JOIN mood_entries me ON mf.mood_entry_id = me.id
      WHERE me.clerk_user_id = $1
        AND me.created_at >= NOW() - INTERVAL '${parseInt(days as string)} days'
      GROUP BY mf.factor
      ORDER BY count DESC
      LIMIT 10`,
      [clerkUserId]
    );

    res.json({
      moodDistribution: result.rows,
      topFactors: factorsResult.rows,
      period: `${days} days`
    });

  } catch (error: any) {
    console.error('Error fetching mood stats:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch mood statistics',
      details: error.message
    });
  }
});

// Update a mood entry
app.put('/api/moods/:moodId', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { moodId } = req.params;
    const { intensity, notes, factors } = req.body;

    await client.query('BEGIN');

    // Update mood entry
    const updateResult = await client.query(
      `UPDATE mood_entries 
       SET intensity = COALESCE($1, intensity),
           notes = COALESCE($2, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [intensity, notes, moodId]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    // Update factors if provided
    if (factors) {
      // Delete existing factors
      await client.query('DELETE FROM mood_factors WHERE mood_entry_id = $1', [moodId]);
      
      // Insert new factors
      if (factors.length > 0) {
        const factorInserts = factors.map((factor: string) =>
          client.query(
            'INSERT INTO mood_factors (mood_entry_id, factor) VALUES ($1, $2)',
            [moodId, factor]
          )
        );
        await Promise.all(factorInserts);
      }
    }

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Mood entry updated successfully',
      mood: updateResult.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating mood entry:', error.message);
    res.status(500).json({ 
      error: 'Failed to update mood entry',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Delete a mood entry
app.delete('/api/moods/:moodId', async (req: Request, res: Response) => {
  try {
    const { moodId } = req.params;

    const result = await pool.query(
      'DELETE FROM mood_entries WHERE id = $1 RETURNING id',
      [moodId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    res.json({ 
      success: true, 
      message: 'Mood entry deleted successfully' 
    });

  } catch (error: any) {
    console.error('Error deleting mood entry:', error.message);
    res.status(500).json({ 
      error: 'Failed to delete mood entry',
      details: error.message
    });
  }
});

// Get all unique factors across user's mood entries
app.get('/api/moods/factors/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;

    const result = await pool.query(
      `SELECT DISTINCT mf.factor, COUNT(*) as usage_count
      FROM mood_factors mf
      JOIN mood_entries me ON mf.mood_entry_id = me.id
      WHERE me.clerk_user_id = $1
      GROUP BY mf.factor
      ORDER BY usage_count DESC`,
      [clerkUserId]
    );

    res.json({ 
      factors: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching factors:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch factors',
      details: error.message
    });
  }
});


// journal.types.ts
export interface CreateJournalRequest {
  clerkUserId: string;
  title: string;
  content: string;
  emotionType?: 'very-sad' | 'sad' | 'neutral' | 'happy' | 'very-happy';
  emoji?: string;
  templateId?: number;
  tags?: string[];
  shareWithSupportWorker?: boolean;
}

export interface UpdateJournalRequest {
  title?: string;
  content?: string;
  emotionType?: string;
  emoji?: string;
  tags?: string[];
  shareWithSupportWorker?: boolean;
}

export interface JournalFilters {
  emotionType?: string;
  startDate?: string;
  endDate?: string;
  tags?: string;
  limit?: number;
  offset?: number;
}


// =============================================
// JOURNALING ENDPOINTS
// =============================================

// Get all templates
app.get('/api/journal/templates', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, prompts, icon, created_at 
       FROM journal_templates 
       ORDER BY name`
    );

    res.json({ 
      templates: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching journal templates:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch journal templates',
      details: error.message
    });
  }
});

// Create a new journal entry
app.post('/api/journal', async (req: Request<{}, {}, CreateJournalRequest>, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { 
      clerkUserId, 
      title, 
      content, 
      emotionType, 
      emoji, 
      templateId,
      tags, 
      shareWithSupportWorker 
    } = req.body;

    // Validation
    if (!clerkUserId || !title || !content) {
      return res.status(400).json({ 
        error: 'clerkUserId, title, and content are required' 
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({ 
        error: 'Content must not exceed 1000 characters' 
      });
    }

    await client.query('BEGIN');

    // Get user's internal ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Insert journal entry
    const entryResult = await client.query(
      `INSERT INTO journal_entries (
        user_id, clerk_user_id, title, content, emotion_type, emoji, 
        template_id, share_with_support_worker
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, title, content, emotion_type, emoji, template_id, 
                 share_with_support_worker, created_at, updated_at`,
      [
        userId, 
        clerkUserId, 
        title, 
        content, 
        emotionType || null, 
        emoji || null,
        templateId || null,
        shareWithSupportWorker || false
      ]
    );

    const entry = entryResult.rows[0];

    // Insert tags if provided
    if (tags && tags.length > 0) {
      const tagInserts = tags.map(tag =>
        client.query(
          'INSERT INTO journal_tags (journal_entry_id, tag) VALUES ($1, $2)',
          [entry.id, tag]
        )
      );
      await Promise.all(tagInserts);
    }

    await client.query('COMMIT');

    // Get complete entry with tags
    const completeEntry = await client.query(
      `SELECT 
        je.id, je.title, je.content, je.emotion_type, je.emoji, 
        je.template_id, je.share_with_support_worker, je.created_at, je.updated_at,
        COALESCE(
          json_agg(jt.tag) FILTER (WHERE jt.tag IS NOT NULL),
          '[]'
        ) as tags
      FROM journal_entries je
      LEFT JOIN journal_tags jt ON je.id = jt.journal_entry_id
      WHERE je.id = $1
      GROUP BY je.id`,
      [entry.id]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Journal entry created successfully',
      entry: completeEntry.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error creating journal entry:', error.message);
    res.status(500).json({ 
      error: 'Failed to create journal entry',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Get recent journal entries
app.get('/api/journal/recent/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await pool.query(
      `SELECT 
        je.id, je.title, je.content, je.emotion_type, je.emoji, 
        je.template_id, je.share_with_support_worker, je.created_at, je.updated_at,
        COALESCE(
          json_agg(jt.tag) FILTER (WHERE jt.tag IS NOT NULL),
          '[]'
        ) as tags
      FROM journal_entries je
      LEFT JOIN journal_tags jt ON je.id = jt.journal_entry_id
      WHERE je.clerk_user_id = $1
      GROUP BY je.id
      ORDER BY je.created_at DESC
      LIMIT $2`,
      [clerkUserId, limit]
    );

    res.json({ 
      entries: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('Error fetching recent journal entries:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch recent journal entries',
      details: error.message
    });
  }
});

// Get journal history with filters
app.get('/api/journal/history/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;
    const { 
      emotionType, 
      startDate, 
      endDate, 
      tags, 
      limit = '50', 
      offset = '0' 
    } = req.query as any;

    let query = `
      SELECT 
        je.id, je.title, je.content, je.emotion_type, je.emoji, 
        je.template_id, je.share_with_support_worker, je.created_at, je.updated_at,
        COALESCE(
          json_agg(jt.tag) FILTER (WHERE jt.tag IS NOT NULL),
          '[]'
        ) as tags
      FROM journal_entries je
      LEFT JOIN journal_tags jt ON je.id = jt.journal_entry_id
      WHERE je.clerk_user_id = $1
    `;

    const params: any[] = [clerkUserId];
    let paramIndex = 2;

    // Filter by emotion type
    if (emotionType) {
      query += ` AND je.emotion_type = $${paramIndex}`;
      params.push(emotionType);
      paramIndex++;
    }

    // Filter by date range
    if (startDate) {
      query += ` AND je.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND je.created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` GROUP BY je.id`;

    // Filter by tags (after grouping)
    if (tags) {
      const tagArray = tags.split(',').map((t: string) => t.trim());
      query += ` HAVING bool_or(jt.tag = ANY($${paramIndex}))`;
      params.push(tagArray);
      paramIndex++;
    }

    query += ` ORDER BY je.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM journal_entries WHERE clerk_user_id = $1',
      [clerkUserId]
    );

    res.json({ 
      entries: result.rows,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error: any) {
    console.error('Error fetching journal history:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch journal history',
      details: error.message
    });
  }
});

// Get single journal entry by ID
app.get('/api/journal/:entryId', async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;

    const result = await pool.query(
      `SELECT 
        je.id, je.title, je.content, je.emotion_type, je.emoji, 
        je.template_id, je.share_with_support_worker, je.created_at, je.updated_at,
        COALESCE(
          json_agg(jt.tag) FILTER (WHERE jt.tag IS NOT NULL),
          '[]'
        ) as tags
      FROM journal_entries je
      LEFT JOIN journal_tags jt ON je.id = jt.journal_entry_id
      WHERE je.id = $1
      GROUP BY je.id`,
      [entryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json({ entry: result.rows[0] });

  } catch (error: any) {
    console.error('Error fetching journal entry:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch journal entry',
      details: error.message
    });
  }
});

// Update journal entry
app.put('/api/journal/:entryId', async (req: Request<{entryId: string}, {}, UpdateJournalRequest>, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { entryId } = req.params;
    const { title, content, emotionType, emoji, tags, shareWithSupportWorker } = req.body;

    if (content && content.length > 1000) {
      return res.status(400).json({ 
        error: 'Content must not exceed 1000 characters' 
      });
    }

    await client.query('BEGIN');

    // Update journal entry
    const updateResult = await client.query(
      `UPDATE journal_entries 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           emotion_type = COALESCE($3, emotion_type),
           emoji = COALESCE($4, emoji),
           share_with_support_worker = COALESCE($5, share_with_support_worker),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [title, content, emotionType, emoji, shareWithSupportWorker, entryId]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    // Update tags if provided
    if (tags) {
      // Delete existing tags
      await client.query('DELETE FROM journal_tags WHERE journal_entry_id = $1', [entryId]);
      
      // Insert new tags
      if (tags.length > 0) {
        const tagInserts = tags.map((tag: string) =>
          client.query(
            'INSERT INTO journal_tags (journal_entry_id, tag) VALUES ($1, $2)',
            [entryId, tag]
          )
        );
        await Promise.all(tagInserts);
      }
    }

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Journal entry updated successfully',
      entry: updateResult.rows[0]
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error updating journal entry:', error.message);
    res.status(500).json({ 
      error: 'Failed to update journal entry',
      details: error.message
    });
  } finally {
    client.release();
  }
});

// Delete journal entry
app.delete('/api/journal/:entryId', async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;

    const result = await pool.query(
      'DELETE FROM journal_entries WHERE id = $1 RETURNING id',
      [entryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }

    res.json({ 
      success: true, 
      message: 'Journal entry deleted successfully' 
    });

  } catch (error: any) {
    console.error('Error deleting journal entry:', error.message);
    res.status(500).json({ 
      error: 'Failed to delete journal entry',
      details: error.message
    });
  }
});

// Get entries shared with support worker
app.get('/api/journal/shared/:supportWorkerId', async (req: Request, res: Response) => {
  try {
    const { supportWorkerId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        je.id, je.title, je.content, je.emotion_type, je.emoji, je.created_at,
        u.first_name, u.last_name, u.clerk_user_id
      FROM journal_entries je
      JOIN users u ON je.user_id = u.id
      WHERE je.share_with_support_worker = TRUE
        AND u.assigned_support_worker_id = $1
      ORDER BY je.created_at DESC
      LIMIT 50`,
      [supportWorkerId]
    );

    res.json({ entries: result.rows });
  } catch (error: any) {
    console.error('Error fetching shared journal entries:', error.message);
    res.status(500).json({ error: 'Failed to fetch shared entries' });
  }
});

// =============================================
// RESOURCES ENDPOINTS
// =============================================

// Get all resources
app.get('/api/resources', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM resources 
      ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Get resources by category
app.get('/api/resources/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM resources WHERE category = $1 ORDER BY created_at DESC',
      [category]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching category resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Search resources
app.get('/api/resources/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    const result = await pool.query(`
      SELECT * FROM resources 
      WHERE title ILIKE $1 
         OR content ILIKE $1 
         OR $2 = ANY(tags)
      ORDER BY created_at DESC
    `, [`%${q}%`, q]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching resources:', error);
    res.status(500).json({ error: 'Failed to search resources' });
  }
});

// Get single resource
app.get('/api/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM resources WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// =============================================
// BOOKMARKS ENDPOINTS
// =============================================

// Get user's bookmarks
app.get('/api/bookmarks/:clerkUserId', async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    
    // Get user_id from clerk_user_id
    const userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [clerkUserId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Get bookmarked resources
    const result = await pool.query(`
      SELECT r.*, b.saved_at 
      FROM resources r
      INNER JOIN bookmarks b ON r.id = b.resource_id
      WHERE b.user_id = $1
      ORDER BY b.saved_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// Add bookmark
app.post('/api/bookmarks', async (req, res) => {
  try {
    const { clerkUserId, resourceId } = req.body;
    
    // Get user_id
    const userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [clerkUserId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Insert bookmark (ON CONFLICT to handle duplicates)
    const result = await pool.query(`
      INSERT INTO bookmarks (user_id, resource_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, resource_id) DO NOTHING
      RETURNING *
    `, [userId, resourceId]);
    
    res.json({ 
      success: true, 
      bookmark: result.rows[0],
      message: 'Resource bookmarked successfully'
    });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ error: 'Failed to add bookmark' });
  }
});

// Remove bookmark
app.delete('/api/bookmarks/:clerkUserId/:resourceId', async (req, res) => {
  try {
    const { clerkUserId, resourceId } = req.params;
    
    // Get user_id
    const userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [clerkUserId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Delete bookmark
    await pool.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND resource_id = $2',
      [userId, resourceId]
    );
    
    res.json({ 
      success: true,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

// Check if resource is bookmarked
app.get('/api/bookmarks/:clerkUserId/check/:resourceId', async (req, res) => {
  try {
    const { clerkUserId, resourceId } = req.params;
    
    const userResult = await pool.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [clerkUserId]
    );
    
    if (userResult.rows.length === 0) {
      return res.json({ isBookmarked: false });
    }
    
    const userId = userResult.rows[0].id;
    
    const result = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM bookmarks WHERE user_id = $1 AND resource_id = $2) as is_bookmarked',
      [userId, resourceId]
    );
    
    res.json({ isBookmarked: result.rows[0].is_bookmarked });
  } catch (error) {
    console.error('Error checking bookmark:', error);
    res.status(500).json({ error: 'Failed to check bookmark' });
  }
});

// External API service
class ExternalApiService {
  async getRandomQuote() {
    try {
      const response = await axios.get('https://zenquotes.io/api/random');
      if (response.data && response.data[0]) {
        return {
          quote: response.data[0].q,
          author: response.data[0].a
        };
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
    }
    return null;
  }

  async getRandomAffirmation() {
    try {
      const response = await axios.get('https://www.affirmations.dev');
      return response.data.affirmation;
    } catch (error) {
      console.error('Error fetching affirmation:', error);
    }
    return null;
  }
}

const externalApiService = new ExternalApiService();

// Add these endpoints to your backend
app.get('/api/external/quote', async (req, res) => {
  try {
    const quote = await externalApiService.getRandomQuote();
    if (quote) {
      res.json(quote);
    } else {
      res.status(500).json({ error: 'Failed to fetch quote' });
    }
  } catch (error) {
    console.error('Error fetching external quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

app.get('/api/external/affirmation', async (req, res) => {
  try {
    const affirmation = await externalApiService.getRandomAffirmation();
    if (affirmation) {
      res.json({ affirmation });
    } else {
      res.status(500).json({ error: 'Failed to fetch affirmation' });
    }
  } catch (error) {
    console.error('Error fetching external affirmation:', error);
    res.status(500).json({ error: 'Failed to fetch affirmation' });
  }
});


// =============================================
// COMMUNITY FORUM ENDPOINTS
// =============================================

// Community Forum Interfaces
interface CreatePostRequest {
  clerkUserId: string;
  title: string;
  content: string;
  category: string;
  isPrivate?: boolean;
  isDraft?: boolean;
}

interface PostReactionRequest {
  clerkUserId: string;
  emoji: string;
}

// Get all categories
app.get('/api/community/categories', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM community_categories ORDER BY name'
    );

    res.json({
      categories: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching categories:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch categories',
      details: error.message
    });
  }
});

// Get all posts with filters
app.get('/api/community/posts', async (req: Request, res: Response) => {
  try {
    const { category, page = '1', limit = '20', authorId } = req.query as any;

    let query = `
      SELECT 
        cp.*,
        cc.name as category_name,
        cp.author_name,
        COUNT(DISTINCT pr.id) as reaction_count,
        COUNT(DISTINCT pb.id) as bookmark_count,
        COALESCE(
          json_object_agg(
            pr.emoji, 
            reaction_counts.count
          ) FILTER (WHERE pr.emoji IS NOT NULL),
          '{}'
        ) as reactions
      FROM community_posts cp
      LEFT JOIN community_categories cc ON cp.category_id = cc.id
      LEFT JOIN post_reactions pr ON cp.id = pr.post_id
      LEFT JOIN post_bookmarks pb ON cp.id = pb.post_id
      LEFT JOIN (
        SELECT post_id, emoji, COUNT(*) as count
        FROM post_reactions
        GROUP BY post_id, emoji
      ) reaction_counts ON cp.id = reaction_counts.post_id AND pr.emoji = reaction_counts.emoji
      WHERE cp.is_draft = false
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (category && category !== 'Trending') {
      params.push(category);
      query += ` AND cc.name = $${paramIndex}`;
      paramIndex++;
    }

    if (authorId) {
      params.push(authorId);
      query += ` AND cp.author_id = $${paramIndex}`;
      paramIndex++;
    }

    query += ` GROUP BY cp.id, cc.name
               ORDER BY cp.reaction_count DESC, cp.created_at DESC 
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);
    
    res.json({
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching community posts:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch community posts',
      details: error.message
    });
  }
});

// Get single post by ID
app.get('/api/community/posts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        cp.*,
        cc.name as category_name,
        cp.author_name,
        COALESCE(
          json_object_agg(
            pr.emoji, 
            reaction_counts.count
          ) FILTER (WHERE pr.emoji IS NOT NULL),
          '{}'
        ) as reactions
      FROM community_posts cp
      LEFT JOIN community_categories cc ON cp.category_id = cc.id
      LEFT JOIN post_reactions pr ON cp.id = pr.post_id
      LEFT JOIN (
        SELECT post_id, emoji, COUNT(*) as count
        FROM post_reactions
        GROUP BY post_id, emoji
      ) reaction_counts ON cp.id = reaction_counts.post_id AND pr.emoji = reaction_counts.emoji
      WHERE cp.id = $1
      GROUP BY cp.id, cc.name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ post: result.rows[0] });
  } catch (error: any) {
    console.error('Error fetching post:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch post',
      details: error.message
    });
  }
});

// Create new post
app.post('/api/community/posts', async (req: Request<{}, {}, CreatePostRequest>, res: Response) => {
  try {
    const { clerkUserId, title, content, category, isPrivate = false, isDraft = false } = req.body;

    if (!clerkUserId || !title || !content || !category) {
      return res.status(400).json({ 
        error: 'clerkUserId, title, content, and category are required' 
      });
    }

    // Get user info if available, otherwise use default
    let authorName = 'Anonymous User';
    try {
      const userResult = await pool.query(
        'SELECT first_name, last_name FROM users WHERE clerk_user_id = $1',
        [clerkUserId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        authorName = `${user.first_name} ${user.last_name}`.trim() || 'Community Member';
      }
    } catch (userError) {
      console.log('User not found in database, using default author name');
    }

    // Get category ID
    const categoryResult = await pool.query(
      'SELECT id FROM community_categories WHERE name = $1',
      [category]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const categoryId = categoryResult.rows[0].id;

    // Create post
    const result = await pool.query(
      `INSERT INTO community_posts (title, content, category_id, author_id, author_name, is_private, is_draft) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [title, content, categoryId, clerkUserId, authorName, isPrivate, isDraft]
    );

    res.status(201).json({ 
      success: true, 
      message: isDraft ? 'Post saved as draft' : 'Post created successfully',
      post: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error creating post:', error.message);
    res.status(500).json({ 
      error: 'Failed to create post',
      details: error.message
    });
  }
});

// React to post
app.post('/api/community/posts/:id/reactions', async (req: Request<{id: string}, {}, PostReactionRequest>, res: Response) => {
  try {
    const { id } = req.params;
    const { clerkUserId, emoji } = req.body;

    if (!clerkUserId || !emoji) {
      return res.status(400).json({ 
        error: 'clerkUserId and emoji are required' 
      });
    }

    // Add reaction
    await pool.query(
      `INSERT INTO post_reactions (post_id, user_id, emoji) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (post_id, user_id, emoji) DO NOTHING`,
      [parseInt(id), clerkUserId, emoji]
    );

    // Update reaction count
    await pool.query(
      'UPDATE community_posts SET reaction_count = reaction_count + 1 WHERE id = $1',
      [parseInt(id)]
    );

    res.json({ success: true, message: 'Reaction added successfully' });

  } catch (error: any) {
    console.error('Error reacting to post:', error.message);
    res.status(500).json({ 
      error: 'Failed to react to post',
      details: error.message
    });
  }
});

// Remove reaction
app.delete('/api/community/posts/:id/reactions/:emoji', async (req: Request, res: Response) => {
  try {
    const { id, emoji } = req.params;
    const { clerkUserId } = req.body;

    if (!clerkUserId) {
      return res.status(400).json({ error: 'clerkUserId is required' });
    }

    const result = await pool.query(
      'DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2 AND emoji = $3',
      [parseInt(id), clerkUserId, emoji]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Reaction not found' });
    }

    // Update reaction count
    await pool.query(
      'UPDATE community_posts SET reaction_count = GREATEST(0, reaction_count - 1) WHERE id = $1',
      [parseInt(id)]
    );

    res.json({ success: true, message: 'Reaction removed successfully' });

  } catch (error: any) {
    console.error('Error removing reaction:', error.message);
    res.status(500).json({ 
      error: 'Failed to remove reaction',
      details: error.message
    });
  }
});

// Toggle bookmark
app.post('/api/community/posts/:id/bookmark', async (req: Request<{id: string}, {}, {clerkUserId: string}>, res: Response) => {
  try {
    const { id } = req.params;
    const { clerkUserId } = req.body;

    if (!clerkUserId) {
      return res.status(400).json({ error: 'clerkUserId is required' });
    }

    // Check if already bookmarked
    const existingBookmark = await pool.query(
      'SELECT id FROM post_bookmarks WHERE post_id = $1 AND user_id = $2',
      [parseInt(id), clerkUserId]
    );

    if (existingBookmark.rows.length > 0) {
      // Remove bookmark
      await pool.query(
        'DELETE FROM post_bookmarks WHERE post_id = $1 AND user_id = $2',
        [parseInt(id), clerkUserId]
      );
      res.json({ bookmarked: false, message: 'Bookmark removed' });
    } else {
      // Add bookmark
      await pool.query(
        'INSERT INTO post_bookmarks (post_id, user_id) VALUES ($1, $2)',
        [parseInt(id), clerkUserId]
      );
      res.json({ bookmarked: true, message: 'Post bookmarked' });
    }

  } catch (error: any) {
    console.error('Error toggling bookmark:', error.message);
    res.status(500).json({ 
      error: 'Failed to toggle bookmark',
      details: error.message
    });
  }
});

// Get user's bookmarked posts
app.get('/api/community/bookmarks/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;
    const { page = '1', limit = '20' } = req.query;

    const result = await pool.query(
      `SELECT 
        cp.*,
        cc.name as category_name,
        cp.author_name,
        pb.created_at as bookmarked_at
      FROM community_posts cp
      INNER JOIN post_bookmarks pb ON cp.id = pb.post_id
      LEFT JOIN community_categories cc ON cp.category_id = cc.id
      WHERE pb.user_id = $1 AND cp.is_draft = false
      ORDER BY pb.created_at DESC
      LIMIT $2 OFFSET $3`,
      [clerkUserId, parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string)]
    );

    res.json({
      bookmarks: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('Error fetching bookmarks:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch bookmarks',
      details: error.message
    });
  }
});

// Get user's posts
app.get('/api/community/my-posts/:clerkUserId', async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;
    const { includeDrafts = 'false' } = req.query;

    let query = `
      SELECT 
        cp.*,
        cc.name as category_name
      FROM community_posts cp
      LEFT JOIN community_categories cc ON cp.category_id = cc.id
      WHERE cp.author_id = $1
    `;

    const params = [clerkUserId];

    if (includeDrafts === 'false') {
      query += ' AND cp.is_draft = false';
    }

    query += ' ORDER BY cp.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      posts: result.rows,
      count: result.rows.length
    });

  } catch (error: any) {
    console.error('Error fetching user posts:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch user posts',
      details: error.message
    });
  }
});

class CommunityForumApi {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Posts
  async getPosts(filters?: { category?: string; page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return this.fetchWithAuth(`/community/posts?${params.toString()}`);
  }

  async getPostById(id: number) {
    return this.fetchWithAuth(`/community/posts/${id}`);
  }

  async createPost(postData: {
    title: string;
    content: string;
    category: string;
    isPrivate?: boolean;
    isDraft?: boolean;
  }) {
    return this.fetchWithAuth('/community/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  // Reactions
  async reactToPost(postId: number, emoji: string) {
    return this.fetchWithAuth(`/community/posts/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  async removeReaction(postId: number, emoji: string) {
    return this.fetchWithAuth(`/community/posts/${postId}/reactions/${emoji}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
  }

  // Bookmarks
  async toggleBookmark(postId: number) {
    return this.fetchWithAuth(`/community/posts/${postId}/bookmark`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getBookmarkedPosts(clerkUserId: string) {
    return this.fetchWithAuth(`/community/bookmarks/${clerkUserId}`);
  }

  // User posts
  async getUserPosts(clerkUserId: string, includeDrafts = false) {
    return this.fetchWithAuth(`/community/my-posts/${clerkUserId}?includeDrafts=${includeDrafts}`);
  }

  // Categories
  async getCategories() {
    return this.fetchWithAuth('/community/categories');
  }
}

export const communityApi = new CommunityForumApi();
