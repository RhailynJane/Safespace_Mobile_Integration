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
// SETTINGS ENDPOINTS
// =============================================

// Interface for client settings
interface ClientSettings {
  darkMode: boolean;
  textSize: string;
  highContrast: boolean;
  reduceMotion: boolean;
  biometricLock: boolean;
  autoLockTimer: string;
  notificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietStartTime: string;
  quietEndTime: string;
  reminderFrequency: string;
  crisisContact: string;
  therapistContact: string;
  safeMode: boolean;
  breakReminders: boolean;
  breathingDuration: string;
  breathingStyle: string;
  offlineMode: boolean;
}

// Interface for API response
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Get all settings for a client
app.get('/api/settings/:clerkUserId', async (req: Request, res: Response) => {
  try {
    // Extract clerkUserId from URL parameters
    const { clerkUserId } = req.params;
    
    console.log(`📥 Fetching settings for client: ${clerkUserId}`);
    
    // Validate clerkUserId parameter
    if (!clerkUserId) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Client ID is required',
        error: 'Missing clerkUserId parameter'
      };
      res.status(400).json(response);
      return;
    }

    // SQL query to join all settings tables and get client preferences
    const query = `
      SELECT 
        p.display_name,
        p.emergency_contact_phone as crisis_contact,
        p.therapist_contact,
        a.dark_mode_enabled as dark_mode,
        a.text_size,
        a.high_contrast_enabled as high_contrast,
        a.reduce_motion_enabled as reduce_motion,
        s.biometric_lock_enabled as biometric_lock,
        s.auto_lock_timer,
        n.enabled as notifications_enabled,
        n.quiet_hours_enabled,
        n.quiet_hours_start as quiet_start_time,
        n.quiet_hours_end as quiet_end_time,
        n.frequency as reminder_frequency,
        w.safe_mode_enabled as safe_mode,
        w.break_reminders_enabled as break_reminders,
        w.breathing_exercise_duration as breathing_duration,
        w.breathing_exercise_style as breathing_style,
        w.offline_mode_enabled as offline_mode
      FROM client_profiles p
      LEFT JOIN accessibility_settings a ON p.clerk_user_id = a.clerk_user_id
      LEFT JOIN security_settings s ON p.clerk_user_id = s.clerk_user_id
      LEFT JOIN notification_settings n ON p.clerk_user_id = n.clerk_user_id AND n.notification_type = 'general'
      LEFT JOIN wellbeing_settings w ON p.clerk_user_id = w.clerk_user_id
      WHERE p.clerk_user_id = $1
    `;

    // Execute the query with clerkUserId as parameter to prevent SQL injection
    const result = await pool.query(query, [clerkUserId]);
    
    // Check if client was found
    if (result.rows.length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Client settings not found',
        error: 'No settings found for this user'
      };
      res.status(404).json(response);
      return;
    }

    // Return successful response with settings data
    const response: ApiResponse<any> = {
      success: true,
      message: 'Settings retrieved successfully',
      data: result.rows[0]
    };
    res.status(200).json(response);

  } catch (error: any) {
    console.error('🚨 Error fetching settings:', error.message);
    
    const response: ApiResponse<null> = {
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    };
    res.status(500).json(response);
  }
});

// Update client settings
app.put('/api/settings/:clerkUserId', async (req: Request, res: Response) => {
  // Get database client for transaction management
  const client = await pool.connect();
  
  try {
    // Extract clerkUserId from URL parameters and settings from request body
    const { clerkUserId } = req.params;
    const settings = req.body;
    
    console.log(`🔄 Updating settings for client: ${clerkUserId}`, settings);
    
    // Validate required parameters
    if (!clerkUserId) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Client ID is required',
        error: 'Missing clerkUserId parameter'
      };
      res.status(400).json(response);
      return;
    }

    if (!settings || Object.keys(settings).length === 0) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Settings data is required',
        error: 'Missing settings in request body'
      };
      res.status(400).json(response);
      return;
    }

    // Start a database transaction to ensure all updates succeed or fail together
    await client.query('BEGIN');

    // Update accessibility settings if provided
    if (settings.darkMode !== undefined || settings.textSize !== undefined || 
        settings.highContrast !== undefined || settings.reduceMotion !== undefined) {
      
      const accessibilityQuery = `
        INSERT INTO accessibility_settings 
          (clerk_user_id, dark_mode_enabled, text_size, high_contrast_enabled, reduce_motion_enabled, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (clerk_user_id) 
        DO UPDATE SET 
          dark_mode_enabled = EXCLUDED.dark_mode_enabled,
          text_size = EXCLUDED.text_size,
          high_contrast_enabled = EXCLUDED.high_contrast_enabled,
          reduce_motion_enabled = EXCLUDED.reduce_motion_enabled,
          updated_at = EXCLUDED.updated_at
      `;
      
      await client.query(accessibilityQuery, [
        clerkUserId,
        settings.darkMode || false, 
        settings.textSize || 'Medium', 
        settings.highContrast || false, 
        settings.reduceMotion || false
      ]);
    }

    // Update security settings if provided
    if (settings.biometricLock !== undefined || settings.autoLockTimer !== undefined) {
      const securityQuery = `
        INSERT INTO security_settings 
          (clerk_user_id, biometric_lock_enabled, auto_lock_timer, updated_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (clerk_user_id) 
        DO UPDATE SET 
          biometric_lock_enabled = EXCLUDED.biometric_lock_enabled,
          auto_lock_timer = EXCLUDED.auto_lock_timer,
          updated_at = EXCLUDED.updated_at
      `;
      
      await client.query(securityQuery, [
        clerkUserId,
        settings.biometricLock || false, 
        settings.autoLockTimer || '5 minutes'
      ]);
    }

    // Update notification settings if provided
    if (settings.notificationsEnabled !== undefined || settings.quietHoursEnabled !== undefined ||
        settings.quietStartTime !== undefined || settings.quietEndTime !== undefined ||
        settings.reminderFrequency !== undefined) {
      
      const notificationQuery = `
        INSERT INTO notification_settings 
          (clerk_user_id, notification_type, enabled, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, frequency, updated_at)
        VALUES ($1, 'general', $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (clerk_user_id, notification_type) 
        DO UPDATE SET 
          enabled = EXCLUDED.enabled,
          quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
          quiet_hours_start = EXCLUDED.quiet_hours_start,
          quiet_hours_end = EXCLUDED.quiet_hours_end,
          frequency = EXCLUDED.frequency,
          updated_at = EXCLUDED.updated_at
      `;
      
      await client.query(notificationQuery, [
        clerkUserId,
        settings.notificationsEnabled !== undefined ? settings.notificationsEnabled : true,
        settings.quietHoursEnabled || false,
        settings.quietStartTime || '22:00',
        settings.quietEndTime || '08:00',
        settings.reminderFrequency || 'Daily'
      ]);
    }

    // Update wellbeing settings if provided
    if (settings.safeMode !== undefined || settings.breakReminders !== undefined ||
        settings.breathingDuration !== undefined || settings.breathingStyle !== undefined ||
        settings.offlineMode !== undefined) {
      
      const wellbeingQuery = `
        INSERT INTO wellbeing_settings 
          (clerk_user_id, safe_mode_enabled, break_reminders_enabled, breathing_exercise_duration, breathing_exercise_style, offline_mode_enabled, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (clerk_user_id) 
        DO UPDATE SET 
          safe_mode_enabled = EXCLUDED.safe_mode_enabled,
          break_reminders_enabled = EXCLUDED.break_reminders_enabled,
          breathing_exercise_duration = EXCLUDED.breathing_exercise_duration,
          breathing_exercise_style = EXCLUDED.breathing_exercise_style,
          offline_mode_enabled = EXCLUDED.offline_mode_enabled,
          updated_at = EXCLUDED.updated_at
      `;
      
      await client.query(wellbeingQuery, [
        clerkUserId,
        settings.safeMode || false,
        settings.breakReminders !== undefined ? settings.breakReminders : true,
        settings.breathingDuration || '5 minutes',
        settings.breathingStyle || '4-7-8 Technique',
        settings.offlineMode || false
      ]);
    }

    // Update client profile contacts if provided
    if (settings.crisisContact !== undefined || settings.therapistContact !== undefined) {
      // First check if client profile exists
      const profileCheck = await client.query(
        'SELECT id FROM client_profiles WHERE clerk_user_id = $1',
        [clerkUserId]
      );

      if (profileCheck.rows.length === 0) {
        // Create client profile if it doesn't exist
        const profileQuery = `
          INSERT INTO client_profiles 
            (clerk_user_id, emergency_contact_phone, therapist_contact, updated_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        `;
        
        await client.query(profileQuery, [
          clerkUserId,
          settings.crisisContact || '',
          settings.therapistContact || ''
        ]);
      } else {
        // Update existing profile
        const profileQuery = `
          UPDATE client_profiles 
          SET emergency_contact_phone = COALESCE($1, emergency_contact_phone),
              therapist_contact = COALESCE($2, therapist_contact),
              updated_at = CURRENT_TIMESTAMP
          WHERE clerk_user_id = $3
        `;
        
        await client.query(profileQuery, [
          settings.crisisContact,
          settings.therapistContact,
          clerkUserId
        ]);
      }
    }

    // Commit the transaction if all queries succeeded
    await client.query('COMMIT');
    
    // Return successful response
    const response: ApiResponse<any> = {
      success: true,
      message: 'Settings updated successfully',
      data: { message: 'All settings saved successfully' }
    };
    res.status(200).json(response);

  } catch (error: any) {
    // Rollback the transaction if any query failed
    await client.query('ROLLBACK');
    console.error('🚨 Error updating settings:', error.message);
    
    const response: ApiResponse<null> = {
      success: false,
      message: 'Failed to update settings',
      error: error.message
    };
    res.status(500).json(response);
  } finally {
    // Always release the client back to the pool
    client.release();
  }
});

// Initialize default settings for a new client
app.post('/api/settings/:clerkUserId/initialize', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { clerkUserId } = req.params;
    
    console.log(`🎯 Initializing default settings for client: ${clerkUserId}`);
    
    if (!clerkUserId) {
      const response: ApiResponse<null> = {
        success: false,
        message: 'Client ID is required',
        error: 'Missing clerkUserId parameter'
      };
      res.status(400).json(response);
      return;
    }

    await client.query('BEGIN');

    // Initialize accessibility settings with defaults
    await client.query(`
      INSERT INTO accessibility_settings 
        (clerk_user_id, dark_mode_enabled, text_size, high_contrast_enabled, reduce_motion_enabled)
      VALUES ($1, false, 'Medium', false, false)
      ON CONFLICT (clerk_user_id) DO NOTHING
    `, [clerkUserId]);

    // Initialize security settings with defaults
    await client.query(`
      INSERT INTO security_settings 
        (clerk_user_id, biometric_lock_enabled, auto_lock_timer, hide_app_content)
      VALUES ($1, false, '5 minutes', true)
      ON CONFLICT (clerk_user_id) DO NOTHING
    `, [clerkUserId]);

    // Initialize notification settings with defaults
    await client.query(`
      INSERT INTO notification_settings 
        (clerk_user_id, notification_type, enabled, frequency, quiet_hours_enabled, quiet_hours_start, quiet_hours_end)
      VALUES 
        ($1, 'general', true, 'Daily', false, '22:00', '08:00'),
        ($1, 'reminders', true, 'Daily', false, '22:00', '08:00'),
        ($1, 'crisis', true, 'Daily', false, '22:00', '08:00')
      ON CONFLICT (clerk_user_id, notification_type) DO NOTHING
    `, [clerkUserId]);

    // Initialize wellbeing settings with defaults
    await client.query(`
      INSERT INTO wellbeing_settings 
        (clerk_user_id, safe_mode_enabled, break_reminders_enabled, breathing_exercise_duration, breathing_exercise_style, offline_mode_enabled)
      VALUES ($1, false, true, '5 minutes', '4-7-8 Technique', false)
      ON CONFLICT (clerk_user_id) DO NOTHING
    `, [clerkUserId]);

    // Initialize client profile if it doesn't exist
    await client.query(`
      INSERT INTO client_profiles (clerk_user_id)
      VALUES ($1)
      ON CONFLICT (clerk_user_id) DO NOTHING
    `, [clerkUserId]);

    await client.query('COMMIT');

    const response: ApiResponse<any> = {
      success: true,
      message: 'Default settings initialized successfully',
      data: { clerkUserId }
    };
    res.status(201).json(response);

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('🚨 Error initializing settings:', error.message);
    
    const response: ApiResponse<null> = {
      success: false,
      message: 'Failed to initialize settings',
      error: error.message
    };
    res.status(500).json(response);
  } finally {
    client.release();
  }
});