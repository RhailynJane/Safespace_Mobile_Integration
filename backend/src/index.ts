import express, { Request, Response } from "express";

// Extend the Request interface to include the `file` property
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
import cors from "cors";
import { Pool } from "pg";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";
const app = express();
const PORT = 3001;
const axios = require("axios");
import { PrismaClient } from "@prisma/client";


// Middleware
app.use(cors());
// Increase body size limit for base64 images (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "safespace",
  password: "password",
  port: 5432,
});

// Interface definitions
interface SyncUserRequest {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  gender?: string; // Add this line
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

const mapGenderToDatabase = (gender: string) => {
  const genderMap: { [key: string]: string } = {
    'Woman': 'female',
    'Man': 'male',
    'Non-Binary': 'non_binary',
    'Agender': 'other',
    'Gender-fluid': 'other',
    'Genderqueer': 'other',
    'Gender Variant': 'other',
    'Intersex': 'other',
    'Non-Conforming': 'other',
    'Questioning': 'other',
    'Transgender Man': 'male',
    'Transgender Woman': 'female',
    'Two-Spirit': 'other',
    'I don\'t identify with any gender': 'other',
    'I do not know': 'prefer_not_to_say',
    'Prefer not to answer': 'prefer_not_to_say'
  };
  return genderMap[gender] || 'other';
};

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to database:", err.message);
  } else {
    console.log("Connected to PostgreSQL database successfully!");
    if (release) release();
  }
});

// Test endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "SafeSpace API is running!",
    timestamp: new Date().toISOString(),
    port: PORT,
  });
});

// Get all users endpoint
app.get("/api/users", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching users:", error.message);
    res.status(500).json({
      error: "Database query failed",
      details: error.message,
    });
  }
});

// Sync user endpoint
app.post(
  "/api/sync-user",
  async (req: Request<{}, {}, SyncUserRequest>, res: Response) => {
    try {
      const { clerkUserId, email, firstName, lastName, phoneNumber, gender } = req.body;

      if (!clerkUserId || !email) {
        return res.status(400).json({
          error: "clerkUserId and email are required",
        });
      }

      const result = await prisma.user.upsert({
        where: {
          clerk_user_id: clerkUserId,
        },
        update: {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone_number: phoneNumber,
          gender: gender ? { set: mapGenderToDatabase(gender) } : undefined,
          updated_at: new Date(), // Explicitly set updated_at
        },
        create: {
          clerk_user_id: clerkUserId,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone_number: phoneNumber,
          gender: gender ? mapGenderToDatabase(gender) : undefined,
          role: 'client',
          status: 'active',
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date(), // Explicitly set for create too
        },
      });

      res.json({
        success: true,
        message: "User synced successfully",
        user: result,
      });
    } catch (error: any) {
      console.error("Error syncing user:", error.message);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }
);

app.post("/api/users/sync", async (req: Request, res: Response) => {
  try {
    const {
      clerk_user_id,
      email,
      first_name,
      last_name,
      phone_number,
      profile_image_url,
      email_verified,
      created_at,
    } = req.body;

    console.log("Received user sync request via /api/users/sync:", {
      clerk_user_id,
      email,
    });

    // Validate required fields
    if (!clerk_user_id || !email || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: clerk_user_id, email, first_name, last_name",
      });
    }

    const result = await prisma.user.upsert({
      where: {
        clerk_user_id: clerk_user_id,
      },
      update: {
        first_name: first_name,
        last_name: last_name,
        email: email,
        phone_number: phone_number,
        profile_image_url: profile_image_url,
        email_verified: email_verified || false,
        updated_at: new Date(), // Explicitly set updated_at
      },
      create: {
        clerk_user_id: clerk_user_id,
        first_name: first_name,
        last_name: last_name,
        email: email,
        phone_number: phone_number,
        profile_image_url: profile_image_url,
        email_verified: email_verified || false,
        role: 'client',
        status: 'active',
        created_at: new Date(created_at),
        updated_at: new Date(), // Explicitly set for create too
      },
    });

    console.log(
      "User synced successfully via /api/users/sync:",
      result.id
    );

    res.status(200).json({
      success: true,
      message: "User synced successfully",
      user: result,
    });
  } catch (error: any) {
    console.error("Database sync error in /api/users/sync:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// =============================================
// USER ACTIVITY ENDPOINTS (login/logout/heartbeat/status)
// =============================================

// Record successful login (and set active)
app.post("/api/users/login-activity", async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.body as { clerkUserId?: string };
    if (!clerkUserId) {
      return res.status(400).json({ success: false, message: "clerkUserId is required" });
    }

    const result = await pool.query(
      `UPDATE users
       SET last_login_at = CURRENT_TIMESTAMP,
           last_login = CURRENT_TIMESTAMP,
           last_active_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE clerk_user_id = $1
       RETURNING id, clerk_user_id, last_login_at, last_active_at, last_logout_at`,
      [clerkUserId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating login activity:", error.message);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

// Record logout
app.post("/api/users/logout-activity", async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.body as { clerkUserId?: string };
    if (!clerkUserId) {
      return res.status(400).json({ success: false, message: "clerkUserId is required" });
    }

    const result = await pool.query(
      `UPDATE users
       SET last_logout_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE clerk_user_id = $1
       RETURNING id, clerk_user_id, last_login_at, last_active_at, last_logout_at`,
      [clerkUserId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating logout activity:", error.message);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

// Heartbeat to update last_active_at
app.post("/api/users/heartbeat", async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.body as { clerkUserId?: string };
    if (!clerkUserId) {
      return res.status(400).json({ success: false, message: "clerkUserId is required" });
    }

    const result = await pool.query(
      `UPDATE users
       SET last_active_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE clerk_user_id = $1
       RETURNING id, clerk_user_id, last_login_at, last_active_at, last_logout_at`,
      [clerkUserId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating heartbeat:", error.message);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

// Get single user's online status and timestamps
app.get("/api/users/status/:clerkUserId", async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;
    const result = await pool.query(
      `SELECT last_active_at, last_login_at, last_logout_at
       FROM users WHERE clerk_user_id = $1`,
      [clerkUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

  const { last_active_at, last_login_at, last_logout_at } = result.rows[0];
    const now = new Date();
    const activeAt = last_active_at ? new Date(last_active_at) : null;
  const loginAt = last_login_at ? new Date(last_login_at) : null;
    const logoutAt = last_logout_at ? new Date(last_logout_at) : null;
    const onlineWindowMs = 30 * 1000; // 30 seconds for immediate online detection
    const activeRecently = activeAt ? now.getTime() - activeAt.getTime() <= onlineWindowMs : false;
  
  // Check if user explicitly logged out after their last activity
  const loggedOutAfterActive = logoutAt && activeAt ? logoutAt > activeAt : false;
  
  // Grace period: only ignore logout if it happened within 5s of login AND login is recent
  const graceMs = 5000;
  const loginRecent = loginAt ? now.getTime() - loginAt.getTime() <= onlineWindowMs : false;
  const logoutInGracePeriod = logoutAt && loginAt && loginRecent ? 
    (logoutAt.getTime() <= loginAt.getTime() + graceMs) : false;
  
  // User is online if: active recently AND (not logged out OR logout is in grace period)
  const online = activeRecently && (!loggedOutAfterActive || logoutInGracePeriod);

    res.json({
      success: true,
      data: { online, last_active_at, last_login_at, last_logout_at }
    });
  } catch (error: any) {
    console.error("Error fetching user status:", error.message);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

// Batch status for multiple users
app.post("/api/users/status-batch", async (req: Request, res: Response) => {
  try {
    const { clerkUserIds } = req.body as { clerkUserIds?: string[] };
    if (!clerkUserIds || clerkUserIds.length === 0) {
      return res.status(400).json({ success: false, message: "clerkUserIds[] is required" });
    }

    const params = clerkUserIds.map((_, i) => `$${i + 1}`).join(",");
    const result = await pool.query(
      `SELECT clerk_user_id, last_active_at, last_login_at, last_logout_at
       FROM users WHERE clerk_user_id IN (${params})`,
      clerkUserIds
    );

    const now = new Date();
    const onlineWindowMs = 30 * 1000; // 30 seconds for immediate online detection
    const statusMap: Record<string, { online: boolean; last_active_at: string | null; last_login_at: string | null; last_logout_at: string | null; }> = {};

    for (const row of result.rows) {
      const activeAt = row.last_active_at ? new Date(row.last_active_at) : null;
      const loginAt = row.last_login_at ? new Date(row.last_login_at) : null;
      const logoutAt = row.last_logout_at ? new Date(row.last_logout_at) : null;
      const activeRecently = activeAt ? now.getTime() - activeAt.getTime() <= onlineWindowMs : false;
      
      // Check if user explicitly logged out after their last activity
      const loggedOutAfterActive = logoutAt && activeAt ? logoutAt > activeAt : false;
      
      // Grace period: only ignore logout if it happened within 5s of login AND login is recent
      const graceMs = 5000;
      const loginRecent = loginAt ? now.getTime() - loginAt.getTime() <= onlineWindowMs : false;
      const logoutInGracePeriod = logoutAt && loginAt && loginRecent ? 
        (logoutAt.getTime() <= loginAt.getTime() + graceMs) : false;
      
      // User is online if: active recently AND (not logged out OR logout is in grace period)
      const online = activeRecently && (!loggedOutAfterActive || logoutInGracePeriod);
      
      statusMap[row.clerk_user_id] = {
        online,
        last_active_at: row.last_active_at || null,
        last_login_at: row.last_login_at || null,
        last_logout_at: row.last_logout_at || null,
      };
    }

    res.json({ success: true, data: statusMap });
  } catch (error: any) {
    console.error("Error fetching batch status:", error.message);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
});

// Create client endpoint
app.post(
  "/api/clients",
  async (req: Request<{}, {}, CreateClientRequest>, res: Response) => {
    try {
      const {
        userId,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelationship,
      } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
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
        [
          userId,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelationship,
        ]
      );

      res.json({
        success: true,
        message: "Client created successfully",
        client: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error creating client:", error.message);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }
);

// =============================================
// ASSESSMENT ENDPOINTS
// =============================================

// Check if assessment is due for a user
app.get(
  "/api/assessments/is-due/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;

      // First get the user's internal ID
      const userResult = await pool.query(
        "SELECT id FROM users WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const userId = userResult.rows[0].id;

      // Check if assessment is due using the database function
      const result = await pool.query(
        "SELECT is_assessment_due($1) as is_due",
        [userId]
      );

      res.json({
        isDue: result.rows[0].is_due,
        userId: userId,
      });
    } catch (error: any) {
      console.error("Error checking assessment:", error.message);
      res.status(500).json({
        error: "Failed to check assessment status",
        details: error.message,
      });
    }
  }
);

// Submit assessment
app.post(
  "/api/assessments/submit",
  async (req: Request<{}, {}, SubmitAssessmentRequest>, res: Response) => {
    try {
      const {
        clerkUserId,
        responses,
        totalScore,
        assessmentType = "pre-survey",
      } = req.body;

      if (!clerkUserId || !responses || totalScore === undefined) {
        return res.status(400).json({
          error: "clerkUserId, responses, and totalScore are required",
        });
      }

      // Get user's internal ID
      const userResult = await pool.query(
        "SELECT id FROM users WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
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

      console.log("Assessment submitted successfully:", result.rows[0]);

      res.json({
        success: true,
        message: "Assessment submitted successfully",
        assessment: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error submitting assessment:", error.message);
      res.status(500).json({
        error: "Failed to submit assessment",
        details: error.message,
      });
    }
  }
);

// Get user's assessment history
app.get(
  "/api/assessments/history/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;

      // Get user's internal ID
      const userResult = await pool.query(
        "SELECT id FROM users WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
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
        count: result.rows.length,
      });
    } catch (error: any) {
      console.error("Error fetching assessment history:", error.message);
      res.status(500).json({
        error: "Failed to fetch assessment history",
        details: error.message,
      });
    }
  }
);

// Get latest assessment for a user
app.get(
  "/api/assessments/latest/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;

      // Get user's internal ID
      const userResult = await pool.query(
        "SELECT id FROM users WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
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
      console.error("Error fetching latest assessment:", error.message);
      res.status(500).json({
        error: "Failed to fetch latest assessment",
        details: error.message,
      });
    }
  }
);

// =============================================
// COMMUNITY FORUM ENDPOINTS - MOVE THESE UP
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
app.get("/api/community/categories", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "SELECT * FROM community_categories ORDER BY name"
    );

    res.json({
      categories: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error("Error fetching categories:", error.message);
    res.status(500).json({
      error: "Failed to fetch categories",
      details: error.message,
    });
  }
});

// Get all posts with filters
app.get("/api/community/posts", async (req: Request, res: Response) => {
  try {
    const { category, page = "1", limit = "20", authorId } = req.query as any;

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

    if (category && category !== "Trending") {
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

    params.push(Number.parseInt(limit), (Number.parseInt(page) - 1) * Number.parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      posts: result.rows,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total: result.rows.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching community posts:", error.message);
    res.status(500).json({
      error: "Failed to fetch community posts",
      details: error.message,
    });
  }
});

// Get single post by ID
app.get("/api/community/posts/:id", async (req: Request, res: Response) => {
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
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ post: result.rows[0] });
  } catch (error: any) {
    console.error("Error fetching post:", error.message);
    res.status(500).json({
      error: "Failed to fetch post",
      details: error.message,
    });
  }
});

// Create new post
app.post(
  "/api/community/posts",
  async (req: Request<{}, {}, CreatePostRequest>, res: Response) => {
    try {
      const {
        clerkUserId,
        title,
        content,
        category,
        isPrivate = false,
        isDraft = false,
      } = req.body;

      if (!clerkUserId || !title || !content || !category) {
        return res.status(400).json({
          error: "clerkUserId, title, content, and category are required",
        });
      }

      // Get user info if available, otherwise use default
      let authorName = "Anonymous User";
      try {
        const userResult = await pool.query(
          "SELECT first_name, last_name FROM users WHERE clerk_user_id = $1",
          [clerkUserId]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          authorName =
            `${user.first_name} ${user.last_name}`.trim() || "Community Member";
        }
      } catch (userError) {
        console.error("User not found in database:", userError);
        authorName = "Anonymous User";
      }

      // Get category ID
      const categoryResult = await pool.query(
        "SELECT id FROM community_categories WHERE name = $1",
        [category]
      );

      if (categoryResult.rows.length === 0) {
        return res.status(400).json({ error: "Invalid category" });
      }

      const categoryId = categoryResult.rows[0].id;

      // Create post
      const result = await pool.query(
        `INSERT INTO community_posts (title, content, category_id, author_id, author_name, is_private, is_draft) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
        [
          title,
          content,
          categoryId,
          clerkUserId,
          authorName,
          isPrivate,
          isDraft,
        ]
      );

      res.status(201).json({
        success: true,
        message: isDraft ? "Post saved as draft" : "Post created successfully",
        post: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error creating post:", error.message);
      res.status(500).json({
        error: "Failed to create post",
        details: error.message,
      });
    }
  }
);

// React to post
app.post(
  "/api/community/posts/:id/reactions",
  async (
    req: Request<{ id: string }, {}, PostReactionRequest>,
    res: Response
  ) => {
    const client = await pool.connect();

    try {
      const { id } = req.params;
      const { clerkUserId, emoji } = req.body;

      if (!clerkUserId || !emoji) {
        return res.status(400).json({
          error: "clerkUserId and emoji are required",
        });
      }

      await client.query("BEGIN");

      // Check if user already reacted with this emoji
      const existingReaction = await client.query(
        "SELECT id FROM post_reactions WHERE post_id = $1 AND user_id = $2 AND emoji = $3",
        [Number.parseInt(id), clerkUserId, emoji]
      );

      let reactionChange = 0;

      if (existingReaction.rows.length > 0) {
        // Remove existing reaction
        await client.query(
          "DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2 AND emoji = $3",
          [Number.parseInt(id), clerkUserId, emoji]
        );
        reactionChange = -1;
      } else {
        // Remove any existing reaction from this user to this post
        await client.query(
          "DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2",
          [Number.parseInt(id), clerkUserId]
        );

        // Add new reaction
        await client.query(
          "INSERT INTO post_reactions (post_id, user_id, emoji) VALUES ($1, $2, $3)",
          [Number.parseInt(id), clerkUserId, emoji]
        );
        reactionChange = 1;
      }

      // Update reaction count
      await client.query(
        "UPDATE community_posts SET reaction_count = GREATEST(0, reaction_count + $1) WHERE id = $2",
        [reactionChange, Number.parseInt(id)]
      );

      // Get updated reaction counts by emoji
      const reactionCounts = await client.query(
        `SELECT emoji, COUNT(*) as count 
       FROM post_reactions 
       WHERE post_id = $1 
       GROUP BY emoji`,
        [Number.parseInt(id)]
      );

      // Convert to object format
      const reactions: { [key: string]: number } = {};
      for (const row of reactionCounts.rows) {
        reactions[row.emoji] = Number.parseInt(row.count);
      }

      // Check if user has any reaction to this post
      const userReactionResult = await client.query(
        "SELECT emoji FROM post_reactions WHERE post_id = $1 AND user_id = $2",
        [Number.parseInt(id), clerkUserId]
      );

      const userReaction =
        userReactionResult.rows.length > 0
          ? userReactionResult.rows[0].emoji
          : null;

      await client.query("COMMIT");

      res.json({
        success: true,
        message: reactionChange > 0 ? "Reaction added" : "Reaction removed",
        reactions,
        userReaction,
        reactionChange,
      });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Error reacting to post:", error.message);
      res.status(500).json({
        error: "Failed to react to post",
        details: error.message,
      });
    } finally {
      client.release();
    }
  }
);

// Get user reaction for a post
app.get(
  "/api/community/posts/:id/user-reaction/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { id, clerkUserId } = req.params;

      const result = await pool.query(
        "SELECT emoji FROM post_reactions WHERE post_id = $1 AND user_id = $2",
        [Number.parseInt(id), clerkUserId]
      );

      res.json({
        userReaction: result.rows.length > 0 ? result.rows[0].emoji : null,
      });
    } catch (error: any) {
      console.error("Error fetching user reaction:", error.message);
      res.status(500).json({
        error: "Failed to fetch user reaction",
        details: error.message,
      });
    }
  }
);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log("\nSafeSpace Backend Server Started!");
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Android emulator URL: http://10.0.2.2:${PORT}`);
  console.log(`Test in browser: http://localhost:${PORT}/api/users`);
  console.log("Server logs will appear below...\n");
});

// Handle server shutdown gracefully
process.on("SIGINT", async () => {
  console.log("\nShutting down server...");
  await pool.end();
  process.exit(0);
});

//Mood Tracking Interfaces and Endpoints
interface CreateMoodRequest {
  clerkUserId: string;
  moodType: "very-happy" | "happy" | "neutral" | "sad" | "very-sad";
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

// Update post
app.put("/api/community/posts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, isDraft, category } = req.body;

    const result = await pool.query(
      `UPDATE community_posts 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           is_draft = COALESCE($3, is_draft),
           category_id = COALESCE((SELECT id FROM community_categories WHERE name = $4), category_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, content, isDraft, category, Number.parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({
      success: true,
      message: "Post updated successfully",
      post: result.rows[0],
    });
  } catch (error: any) {
    console.error("Error updating post:", error.message);
    res.status(500).json({
      error: "Failed to update post",
      details: error.message,
    });
  }
});

// Delete post
app.delete("/api/community/posts/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM community_posts WHERE id = $1 RETURNING id",
      [Number.parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting post:", error.message);
    res.status(500).json({
      error: "Failed to delete post",
      details: error.message,
    });
  }
});

// Remove reaction
app.delete(
  "/api/community/posts/:id/reactions/:emoji",
  async (req: Request, res: Response) => {
    try {
      const { id, emoji } = req.params;
      const { clerkUserId } = req.body;

      if (!clerkUserId) {
        return res.status(400).json({ error: "clerkUserId is required" });
      }

      const result = await pool.query(
        "DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2 AND emoji = $3",
        [Number.parseInt(id), clerkUserId, emoji]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Reaction not found" });
      }

      // Update reaction count
      await pool.query(
        "UPDATE community_posts SET reaction_count = GREATEST(0, reaction_count - 1) WHERE id = $1",
        [Number.parseInt(id)]
      );

      res.json({ success: true, message: "Reaction removed successfully" });
    } catch (error: any) {
      console.error("Error removing reaction:", error.message);
      res.status(500).json({
        error: "Failed to remove reaction",
        details: error.message,
      });
    }
  }
);

// Toggle bookmark
app.post(
  "/api/community/posts/:id/bookmark",
  async (
    req: Request<{ id: string }, {}, { clerkUserId: string }>,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      const { clerkUserId } = req.body;

      if (!clerkUserId) {
        return res.status(400).json({ error: "clerkUserId is required" });
      }

      // Check if already bookmarked
      const existingBookmark = await pool.query(
        "SELECT id FROM post_bookmarks WHERE post_id = $1 AND user_id = $2",
        [Number.parseInt(id), clerkUserId]
      );

      if (existingBookmark.rows.length > 0) {
        // Remove bookmark
        await pool.query(
          "DELETE FROM post_bookmarks WHERE post_id = $1 AND user_id = $2",
          [Number.parseInt(id), clerkUserId]
        );
        res.json({ bookmarked: false, message: "Bookmark removed" });
      } else {
        // Add bookmark
        await pool.query(
          "INSERT INTO post_bookmarks (post_id, user_id) VALUES ($1, $2)",
          [Number.parseInt(id), clerkUserId]
        );
        res.json({ bookmarked: true, message: "Post bookmarked" });
      }
    } catch (error: any) {
      console.error("Error toggling bookmark:", error.message);
      res.status(500).json({
        error: "Failed to toggle bookmark",
        details: error.message,
      });
    }
  }
);

// Get user's bookmarked posts
app.get(
  "/api/community/bookmarks/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;
      const { page = "1", limit = "20" } = req.query;

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
        [
          clerkUserId,
          Number.parseInt(limit as string),
          (Number.parseInt(page as string) - 1) * Number.parseInt(limit as string),
        ]
      );

      res.json({
        bookmarks: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      console.error("Error fetching bookmarks:", error.message);
      res.status(500).json({
        error: "Failed to fetch bookmarks",
        details: error.message,
      });
    }
  }
);

// Get user's posts
app.get(
  "/api/community/my-posts/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;
      const { includeDrafts = "false" } = req.query;

      let query = `
      SELECT 
        cp.*,
        cc.name as category_name
      FROM community_posts cp
      LEFT JOIN community_categories cc ON cp.category_id = cc.id
      WHERE cp.author_id = $1
    `;

      const params = [clerkUserId];

      if (includeDrafts === "false") {
        query += " AND cp.is_draft = false";
      }

      query += " ORDER BY cp.created_at DESC";

      const result = await pool.query(query, params);

      res.json({
        posts: result.rows,
        count: result.rows.length,
      });
    } catch (error: any) {
      console.error("Error fetching user posts:", error.message);
      res.status(500).json({
        error: "Failed to fetch user posts",
        details: error.message,
      });
    }
  }
);

// =============================================
// MOOD TRACKING ENDPOINTS
// =============================================

// Create a new mood entry
app.post(
  "/api/moods",
  async (req: Request<{}, {}, CreateMoodRequest>, res: Response) => {
    const client = await pool.connect();

    try {
      const { clerkUserId, moodType, intensity, notes, factors } = req.body;

      // Validation
      if (!clerkUserId || !moodType || !intensity) {
        return res.status(400).json({
          error: "clerkUserId, moodType, and intensity are required",
        });
      }

      if (intensity < 1 || intensity > 5) {
        return res.status(400).json({
          error: "Intensity must be between 1 and 5",
        });
      }

      await client.query("BEGIN");

      // Get user's internal ID
      const userResult = await client.query(
        "SELECT id FROM users WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      if (userResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "User not found" });
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
        const factorInserts = factors.map((factor) =>
          client.query(
            "INSERT INTO mood_factors (mood_entry_id, factor) VALUES ($1, $2)",
            [moodEntry.id, factor]
          )
        );
        await Promise.all(factorInserts);
      }

      await client.query("COMMIT");

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
        message: "Mood entry created successfully",
        mood: completeEntry.rows[0],
      });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Error creating mood entry:", error.message);
      res.status(500).json({
        error: "Failed to create mood entry",
        details: error.message,
      });
    } finally {
      client.release();
    }
  }
);

// Get recent moods for a user (last 10)
app.get(
  "/api/moods/recent/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;
      const limit = Number.parseInt(req.query.limit as string) || 10;

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
        count: result.rows.length,
      });
    } catch (error: any) {
      console.error("Error fetching recent moods:", error.message);
      res.status(500).json({
        error: "Failed to fetch recent moods",
        details: error.message,
      });
    }
  }
);

// Get mood history with filters and search
app.get(
  "/api/moods/history/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;
      const {
        moodType,
        startDate,
        endDate,
        factors,
        limit = "50",
        offset = "0",
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
        const factorArray = factors.split(",").map((f) => f.trim());
        query += ` HAVING bool_or(mf.factor = ANY($${paramIndex}))`;
        params.push(factorArray);
        paramIndex++;
      }

      query += ` ORDER BY me.created_at DESC LIMIT $${paramIndex} OFFSET $${
        paramIndex + 1
      }`;
      params.push(Number.parseInt(limit), Number.parseInt(offset));

      const result = await pool.query(query, params);

      // Get total count for pagination
      const countResult = await pool.query(
        "SELECT COUNT(*) FROM mood_entries WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      res.json({
        moods: result.rows,
        count: result.rows.length,
        total: Number.parseInt(countResult.rows[0].count),
        limit: Number.parseInt(limit),
        offset: Number.parseInt(offset),
      });
    } catch (error: any) {
      console.error("Error fetching mood history:", error.message);
      res.status(500).json({
        error: "Failed to fetch mood history",
        details: error.message,
      });
    }
  }
);

// Get mood statistics for a user
app.get(
  "/api/moods/stats/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;
      const { days = "30" } = req.query;

      // Convert days to string explicitly
      const daysString = String(Number.parseInt(days as string, 10) || 30);

      const result = await pool.query(
        `SELECT 
        mood_type,
        COUNT(*) as count,
        AVG(intensity) as avg_intensity,
        get_mood_emoji(mood_type) as emoji,
        get_mood_label(mood_type) as label
      FROM mood_entries
      WHERE clerk_user_id = $1
        AND created_at >= NOW() - INTERVAL '${Number.parseInt(daysString)} days'
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
        AND me.created_at >= NOW() - INTERVAL '${Number.parseInt(daysString)} days'
      GROUP BY mf.factor
      ORDER BY count DESC
      LIMIT 10`,
        [clerkUserId]
      );

      res.json({
        moodDistribution: result.rows,
        topFactors: factorsResult.rows,
        period: `${Number(days)} days`,
      });
    } catch (error: any) {
      console.error("Error fetching mood stats:", error.message);
      res.status(500).json({
        error: "Failed to fetch mood statistics",
        details: error.message,
      });
    }
  }
);

// Update a mood entry
app.put("/api/moods/:moodId", async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { moodId } = req.params;
    const { intensity, notes, factors } = req.body;

    await client.query("BEGIN");

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
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Mood entry not found" });
    }

    // Update factors if provided
    if (factors) {
      // Delete existing factors
      await client.query("DELETE FROM mood_factors WHERE mood_entry_id = $1", [
        moodId,
      ]);

      // Insert new factors
      if (factors.length > 0) {
        const factorInserts = factors.map((factor: string) =>
          client.query(
            "INSERT INTO mood_factors (mood_entry_id, factor) VALUES ($1, $2)",
            [moodId, factor]
          )
        );
        await Promise.all(factorInserts);
      }
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Mood entry updated successfully",
      mood: updateResult.rows[0],
    });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Error updating mood entry:", error.message);
    res.status(500).json({
      error: "Failed to update mood entry",
      details: error.message,
    });
  } finally {
    client.release();
  }
});

// Delete a mood entry
app.delete("/api/moods/:moodId", async (req: Request, res: Response) => {
  try {
    const { moodId } = req.params;

    const result = await pool.query(
      "DELETE FROM mood_entries WHERE id = $1 RETURNING id",
      [moodId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Mood entry not found" });
    }

    res.json({
      success: true,
      message: "Mood entry deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting mood entry:", error.message);
    res.status(500).json({
      error: "Failed to delete mood entry",
      details: error.message,
    });
  }
});

// Get all unique factors across user's mood entries
app.get(
  "/api/moods/factors/:clerkUserId",
  async (req: Request, res: Response) => {
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
        factors: result.rows,
      });
    } catch (error: any) {
      console.error("Error fetching factors:", error.message);
      res.status(500).json({
        error: "Failed to fetch factors",
        details: error.message,
      });
    }
  }
);

// journal.types.ts
export interface CreateJournalRequest {
  clerkUserId: string;
  title: string;
  content: string;
  emotionType?: "very-sad" | "sad" | "neutral" | "happy" | "very-happy";
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
app.get("/api/journal/templates", async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description, prompts, icon, created_at 
       FROM journal_templates 
       ORDER BY name`
    );

    res.json({
      templates: result.rows,
      count: result.rows.length,
    });
  } catch (error: any) {
    console.error("Error fetching journal templates:", error.message);
    res.status(500).json({
      error: "Failed to fetch journal templates",
      details: error.message,
    });
  }
});

// Create a new journal entry
app.post(
  "/api/journal",
  async (req: Request<{}, {}, CreateJournalRequest>, res: Response) => {
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
        shareWithSupportWorker,
      } = req.body;

      // Validation
      if (!clerkUserId || !title || !content) {
        return res.status(400).json({
          error: "clerkUserId, title, and content are required",
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          error: "Content must not exceed 1000 characters",
        });
      }

      await client.query("BEGIN");

      // Get user's internal ID
      const userResult = await client.query(
        "SELECT id FROM users WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      if (userResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "User not found" });
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
          shareWithSupportWorker || false,
        ]
      );

      const entry = entryResult.rows[0];

      // Insert tags if provided
      if (tags && tags.length > 0) {
        const tagInserts = tags.map((tag) =>
          client.query(
            "INSERT INTO journal_tags (journal_entry_id, tag) VALUES ($1, $2)",
            [entry.id, tag]
          )
        );
        await Promise.all(tagInserts);
      }

      await client.query("COMMIT");

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
        message: "Journal entry created successfully",
        entry: completeEntry.rows[0],
      });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Error creating journal entry:", error.message);
      res.status(500).json({
        error: "Failed to create journal entry",
        details: error.message,
      });
    } finally {
      client.release();
    }
  }
);

// Get recent journal entries
app.get(
  "/api/journal/recent/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;
      const limit = Number.parseInt(req.query.limit as string) || 10;

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
        count: result.rows.length,
      });
    } catch (error: any) {
      console.error("Error fetching recent journal entries:", error.message);
      res.status(500).json({
        error: "Failed to fetch recent journal entries",
        details: error.message,
      });
    }
  }
);

// Get journal history with filters
app.get(
  "/api/journal/history/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;
      const {
        emotionType,
        startDate,
        endDate,
        tags,
        limit = "50",
        offset = "0",
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
        const tagArray = tags.split(",").map((t: string) => t.trim());
        query += ` HAVING bool_or(jt.tag = ANY($${paramIndex}))`;
        params.push(tagArray);
        paramIndex++;
      }

      query += ` ORDER BY je.created_at DESC LIMIT $${paramIndex} OFFSET $${
        paramIndex + 1
      }`;
      params.push(Number.parseInt(limit), Number.parseInt(offset));

      const result = await pool.query(query, params);

      // Get total count
      const countResult = await pool.query(
        "SELECT COUNT(*) FROM journal_entries WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      res.json({
        entries: result.rows,
        count: result.rows.length,
        total: Number.parseInt(countResult.rows[0].count),
        limit: Number.parseInt(limit),
        offset: Number.parseInt(offset),
      });
    } catch (error: any) {
      console.error("Error fetching journal history:", error.message);
      res.status(500).json({
        error: "Failed to fetch journal history",
        details: error.message,
      });
    }
  }
);

// Get single journal entry by ID
app.get("/api/journal/:entryId", async (req: Request, res: Response) => {
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
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json({ entry: result.rows[0] });
  } catch (error: any) {
    console.error("Error fetching journal entry:", error.message);
    res.status(500).json({
      error: "Failed to fetch journal entry",
      details: error.message,
    });
  }
});

// Update journal entry
app.put(
  "/api/journal/:entryId",
  async (
    req: Request<{ entryId: string }, {}, UpdateJournalRequest>,
    res: Response
  ) => {
    const client = await pool.connect();

    try {
      const { entryId } = req.params;
      const {
        title,
        content,
        emotionType,
        emoji,
        tags,
        shareWithSupportWorker,
      } = req.body;

      if (content && content.length > 1000) {
        return res.status(400).json({
          error: "Content must not exceed 1000 characters",
        });
      }

      await client.query("BEGIN");

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
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Journal entry not found" });
      }

      // Update tags if provided
      if (tags) {
        // Delete existing tags
        await client.query(
          "DELETE FROM journal_tags WHERE journal_entry_id = $1",
          [entryId]
        );

        // Insert new tags
        if (tags.length > 0) {
          const tagInserts = tags.map((tag: string) =>
            client.query(
              "INSERT INTO journal_tags (journal_entry_id, tag) VALUES ($1, $2)",
              [entryId, tag]
            )
          );
          await Promise.all(tagInserts);
        }
      }

      await client.query("COMMIT");

      res.json({
        success: true,
        message: "Journal entry updated successfully",
        entry: updateResult.rows[0],
      });
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("Error updating journal entry:", error.message);
      res.status(500).json({
        error: "Failed to update journal entry",
        details: error.message,
      });
    } finally {
      client.release();
    }
  }
);

// Delete journal entry
app.delete("/api/journal/:entryId", async (req: Request, res: Response) => {
  try {
    const { entryId } = req.params;

    const result = await pool.query(
      "DELETE FROM journal_entries WHERE id = $1 RETURNING id",
      [entryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Journal entry not found" });
    }

    res.json({
      success: true,
      message: "Journal entry deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting journal entry:", error.message);
    res.status(500).json({
      error: "Failed to delete journal entry",
      details: error.message,
    });
  }
});

// Get entries shared with support worker
app.get(
  "/api/journal/shared/:supportWorkerId",
  async (req: Request, res: Response) => {
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
      console.error("Error fetching shared journal entries:", error.message);
      res.status(500).json({ error: "Failed to fetch shared entries" });
    }
  }
);

// =============================================
// RESOURCES ENDPOINTS
// =============================================

// Get all resources
app.get("/api/resources", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM resources 
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// Get resources by category
app.get("/api/resources/category/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const result = await pool.query(
      "SELECT * FROM resources WHERE category = $1 ORDER BY created_at DESC",
      [category]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching category resources:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

// Search resources
app.get("/api/resources/search", async (req, res) => {
  try {
    const { q } = req.query;

    const searchQuery = typeof q === "string" ? q : "";

    const result = await pool.query(
      `
      SELECT * FROM resources 
      WHERE title ILIKE $1 
         OR content ILIKE $1 
         OR $2 = ANY(tags)
      ORDER BY created_at DESC
    `,
      [`%${searchQuery}%`, searchQuery]
    );

    res.json(result.rows);
  } catch (error: any) {
    console.error("Error searching resources:", error.message);
    res.status(500).json({ error: "Failed to search resources" });
  }
});

// Get single resource
app.get("/api/resources/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query("SELECT * FROM resources WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Resource not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching resource:", error);
    res.status(500).json({ error: "Failed to fetch resource" });
  }
});

// =============================================
// BOOKMARKS ENDPOINTS
// =============================================

// Get user's bookmarks
app.get("/api/bookmarks/:clerkUserId", async (req, res) => {
  try {
    const { clerkUserId } = req.params;

    // Get user_id from clerk_user_id
    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Get bookmarked resources
    const result = await pool.query(
      `
      SELECT r.*, b.saved_at 
      FROM resources r
      INNER JOIN bookmarks b ON r.id = b.resource_id
      WHERE b.user_id = $1
      ORDER BY b.saved_at DESC
    `,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

// Add bookmark
app.post("/api/bookmarks", async (req, res) => {
  try {
    const { clerkUserId, resourceId } = req.body;

    // Get user_id
    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Insert bookmark (ON CONFLICT to handle duplicates)
    const result = await pool.query(
      `
      INSERT INTO bookmarks (user_id, resource_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, resource_id) DO NOTHING
      RETURNING *
    `,
      [userId, resourceId]
    );

    res.json({
      success: true,
      bookmark: result.rows[0],
      message: "Resource bookmarked successfully",
    });
  } catch (error) {
    console.error("Error adding bookmark:", error);
    res.status(500).json({ error: "Failed to add bookmark" });
  }
});

// Remove bookmark
app.delete("/api/bookmarks/:clerkUserId/:resourceId", async (req, res) => {
  try {
    const { clerkUserId, resourceId } = req.params;

    // Get user_id
    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    // Delete bookmark
    await pool.query(
      "DELETE FROM bookmarks WHERE user_id = $1 AND resource_id = $2",
      [userId, resourceId]
    );

    res.json({
      success: true,
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    res.status(500).json({ error: "Failed to remove bookmark" });
  }
});

// Check if resource is bookmarked
app.get("/api/bookmarks/:clerkUserId/check/:resourceId", async (req, res) => {
  try {
    const { clerkUserId, resourceId } = req.params;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.json({ isBookmarked: false });
    }

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      "SELECT EXISTS(SELECT 1 FROM bookmarks WHERE user_id = $1 AND resource_id = $2) as is_bookmarked",
      [userId, resourceId]
    );

    res.json({ isBookmarked: result.rows[0].is_bookmarked });
  } catch (error) {
    console.error("Error checking bookmark:", error);
    res.status(500).json({ error: "Failed to check bookmark" });
  }
});

// External API service
class ExternalApiService {
  async getRandomQuote() {
    try {
      const response = await axios.get("https://zenquotes.io/api/random");
      if (response.data?.[0]) {
        return {
          quote: response.data[0].q,
          author: response.data[0].a,
        };
      }
    } catch (error) {
      console.error("Error fetching quote:", error);
    }
    return null;
  }

  async getRandomAffirmation() {
    try {
      const response = await axios.get("https://www.affirmations.dev");
      return response.data.affirmation;
    } catch (error) {
      console.error("Error fetching affirmation:", error);
    }
    return null;
  }
}

const externalApiService = new ExternalApiService();

app.get("/api/external/quote", async (req, res) => {
  try {
    const quote = await externalApiService.getRandomQuote();
    if (quote) {
      res.json(quote);
    } else {
      res.status(500).json({ error: "Failed to fetch quote" });
    }
  } catch (error) {
    console.error("Error fetching external quote:", error);
    res.status(500).json({ error: "Failed to fetch quote" });
  }
});

app.get("/api/external/affirmation", async (req, res) => {
  try {
    const affirmation = await externalApiService.getRandomAffirmation();
    if (affirmation) {
      res.json({ affirmation });
    } else {
      res.status(500).json({ error: "Failed to fetch affirmation" });
    }
  } catch (error) {
    console.error("Error fetching external affirmation:", error);
    res.status(500).json({ error: "Failed to fetch affirmation" });
  }
});


// =============================================
// MESSAGING ENDPOINTS - PRISMA VERSION
// =============================================

// Get all conversations for a user
// Replace the existing conversations endpoint with this updated version
app.get(
  "/api/messages/conversations/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;

      // console.log("💬 Fetching conversations for user:", clerkUserId);

      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              user: {
                clerk_user_id: clerkUserId
              }
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  clerk_user_id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  profile_image_url: true,
                  last_active_at: true,
                }
              }
            }
          },
          messages: {
            orderBy: {
              created_at: 'desc'
            },
            take: 1
          },
          _count: {
            select: {
              messages: {
                where: {
                  NOT: {
                    read_status: {
                      some: {
                        user: {
                          clerk_user_id: clerkUserId
                        }
                      }
                    }
                  },
                  sender: {
                    clerk_user_id: {
                      not: clerkUserId
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          updated_at: 'desc'
        }
      });

      // Get online status for all participants
      const conversationsWithOnlineStatus = await Promise.all(
        conversations.map(async (conversation) => {
          const lastMessage = conversation.messages[0];
          
          // Get participants with real online status
          const participantsWithStatus = await Promise.all(
            conversation.participants.map(async (p) => {
              const online = await getUserOnlineStatus(p.user.clerk_user_id);
              return {
                id: p.user.id,
                clerk_user_id: p.user.clerk_user_id,
                first_name: p.user.first_name,
                last_name: p.user.last_name,
                email: p.user.email,
                profile_image_url: p.user.profile_image_url,
                online,
                last_active_at: p.user.last_active_at
              };
            })
          );

          return {
            id: conversation.id.toString(),
            title: conversation.title,
            conversation_type: conversation.conversation_type,
            updated_at: conversation.updated_at.toISOString(),
            created_at: conversation.created_at.toISOString(),
            last_message: lastMessage?.message_text || '',
            last_message_time: lastMessage?.created_at.toISOString(),
            unread_count: conversation._count.messages,
            participants: participantsWithStatus
          };
        })
      );

      console.log(`💬 Returning ${conversationsWithOnlineStatus.length} conversations for user ${clerkUserId}`);
      conversationsWithOnlineStatus.forEach(c => {
        if (c.unread_count > 0) {
          console.log(`  📬 Conversation ${c.id}: ${c.unread_count} unread messages`);
        }
      });

      // console.log(`💬 Found ${conversationsWithOnlineStatus.length} conversations for user ${clerkUserId}`);

      res.json({
        success: true,
        data: conversationsWithOnlineStatus,
      });
    } catch (error: any) {
      console.error("💬 Get conversations error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to fetch conversations",
        error: error.message,
      });
    }
  }
);

// Get messages for a conversation
app.get(
  "/api/messages/conversations/:conversationId/messages",
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { clerkUserId } = req.query;
      // Safely extract page and limit as strings
      const pageRaw = req.query.page;
      const limitRaw = req.query.limit;
      const pageStr = Array.isArray(pageRaw) ? pageRaw[0] : pageRaw;
      const limitStr = Array.isArray(limitRaw) ? limitRaw[0] : limitRaw;
      const page = typeof pageStr === "string" ? pageStr : "1";
      const limit = typeof limitStr === "string" ? limitStr : "50";

      console.log(`💬 Loading messages for conversation ${conversationId}, user ${clerkUserId}`);

      // Validate conversationId is a valid number
      const conversationIdNum = Number.parseInt(conversationId);
      if (Number.isNaN(conversationIdNum)) {
        console.error(`💬 Invalid conversation ID: "${conversationId}"`);
        return res.status(400).json({
          success: false,
          message: "Invalid conversation ID",
        });
      }

      const pageNum = Number.parseInt(page) || 1;
      const limitNum = Number.parseInt(limit) || 50;
      const skip = (pageNum - 1) * limitNum;

      // Verify user is participant
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversation_id: conversationIdNum,
          user: {
            clerk_user_id: clerkUserId as string
          }
        }
      });

      if (!participant) {
        console.log(`💬 User ${clerkUserId} is not a participant of conversation ${conversationId}`);
        return res.status(403).json({
          success: false,
          message: "Access denied to this conversation",
        });
      }

      // Get messages
      const messages = await prisma.message.findMany({
        where: {
          conversation_id: conversationIdNum
        },
        include: {
          sender: {
            select: {
              id: true,
              clerk_user_id: true,
              first_name: true,
              last_name: true,
              profile_image_url: true
            }
          }
        },
        orderBy: {
          created_at: 'asc'
        },
        skip,
        take: limitNum
      });

      // Format response with file attachments
      const formattedMessages = messages.map(message => ({
        id: message.id.toString(),
        message_text: message.message_text,
        message_type: message.message_type,
        created_at: message.created_at.toISOString(),
        attachment_url: message.attachment_url, // This should now be populated
        file_name: message.file_name,
        file_size: message.file_size,
        sender: {
          id: message.sender.id,
          clerk_user_id: message.sender.clerk_user_id,
          first_name: message.sender.first_name,
          last_name: message.sender.last_name,
          profile_image_url: message.sender.profile_image_url,
          online: false
        }
      }));

      res.json({
        success: true,
        data: formattedMessages,
        pagination: {
          page: pageNum,
          limit: limitNum,
          hasMore: messages.length === limitNum,
        },
      });
  } catch (error: any) {
    console.error("💬 Get messages error:", error);
    console.error("💬 Error stack:", error.stack);
    console.error("💬 Error message:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message
    });
  }
});

// Send a message
app.post(
  "/api/messages/conversations/:conversationId/messages",
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { clerkUserId, messageText, messageType = "text" } = req.body;

      console.log(`💬 Sending message to conversation ${conversationId}: "${messageText}" from user ${clerkUserId}`);

      if (!clerkUserId || !messageText?.trim()) {
        return res.status(400).json({
          success: false,
          message: "clerkUserId and messageText are required",
        });
      }

      // Get user and verify participation in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Get user and verify they're a participant
        const user = await tx.user.findUnique({
          where: { clerk_user_id: clerkUserId }
        });

        if (!user) {
          throw new Error("User not found");
        }

        const participant = await tx.conversationParticipant.findFirst({
          where: {
            conversation_id: Number.parseInt(conversationId),
            user_id: user.id
          }
        });

        if (!participant) {
          throw new Error("Access denied to this conversation");
        }

        // Create message
        const message = await tx.message.create({
          data: {
            conversation_id: Number.parseInt(conversationId),
            sender_id: user.id,
            message_text: messageText.trim(),
            message_type: messageType
          },
          include: {
            sender: {
              select: {
                id: true,
                clerk_user_id: true,
                first_name: true,
                last_name: true,
                profile_image_url: true
              }
            }
          }
        });

        // Update conversation timestamp
        await tx.conversation.update({
          where: { id: Number.parseInt(conversationId) },
          data: { updated_at: new Date() }
        });

        return message;
      });

      console.log(`💬 Message sent successfully: ${result.id}`);

      const formattedMessage = {
        id: result.id.toString(),
        message_text: result.message_text,
        message_type: result.message_type,
        created_at: result.created_at.toISOString(),
        sender: {
          id: result.sender.id,
          clerk_user_id: result.sender.clerk_user_id,
          first_name: result.sender.first_name,
          last_name: result.sender.last_name,
          profile_image_url: result.sender.profile_image_url,
          online: false
        }
      };

      res.json({
        success: true,
        message: "Message sent successfully",
        data: formattedMessage,
      });
    } catch (error: any) {
      console.error("💬 Send message error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to send message",
        error: error.message,
      });
    }
  }
);

// Mark all messages in a conversation as read for the current user
app.post(
  "/api/messages/conversations/:conversationId/mark-read",
  async (req: Request, res: Response) => {
    try {
      const { conversationId } = req.params;
      const { clerkUserId } = req.body as { clerkUserId?: string };

      if (!clerkUserId) {
        return res.status(400).json({ success: false, message: "clerkUserId is required" });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Find user
        const user = await tx.user.findUnique({ where: { clerk_user_id: clerkUserId } });
        if (!user) {
          throw new Error("User not found");
        }

        // Verify user is a participant in this conversation
        const participant = await tx.conversationParticipant.findFirst({
          where: {
            conversation_id: Number.parseInt(conversationId),
            user_id: user.id,
          },
        });
        if (!participant) {
          throw new Error("Access denied to this conversation");
        }

        // Get IDs of messages in this conversation that were sent by others and are not yet marked as read by this user
        const messagesToMark = await tx.message.findMany({
          where: {
            conversation_id: Number.parseInt(conversationId),
            sender_id: { not: user.id },
            read_status: { none: { user_id: user.id } },
          },
          select: { id: true },
        });

        if (messagesToMark.length === 0) {
          return { created: 0 };
        }

        // Create read status entries, skipping duplicates just in case
        const createRes = await tx.messageReadStatus.createMany({
          data: messagesToMark.map((m) => ({ message_id: m.id, user_id: user.id })),
          skipDuplicates: true,
        });

        return { created: createRes.count };
      });

      res.json({ success: true, message: "Messages marked as read", data: result });
    } catch (error: any) {
      console.error("💬 Mark-read error:", error.message || error);
      const msg = error instanceof Error ? error.message : "Failed to mark messages as read";
      const status = msg.includes("Access denied") ? 403 : msg.includes("User not found") ? 404 : 500;
      res.status(status).json({ success: false, message: msg });
    }
  }
);

// Create new conversation
app.post("/api/messages/conversations", async (req: Request, res: Response) => {
  try {
    const {
      clerkUserId,
      participantIds,
      title,
      conversationType = "direct",
    } = req.body;

    console.log("💬 Creating conversation:", { clerkUserId, participantIds, title });

    if (!clerkUserId || !participantIds || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "clerkUserId and participantIds are required",
      });
    }

    let isExistingConversation = false;

    const result = await prisma.$transaction(async (tx) => {
      // Get creator user
      const creator = await tx.user.findUnique({
        where: { clerk_user_id: clerkUserId }
      });

      if (!creator) {
        throw new Error("User not found");
      }

      // Get participant users
      const participants = await tx.user.findMany({
        where: {
          clerk_user_id: {
            in: [clerkUserId, ...participantIds]
          }
        }
      });

      if (participants.length < 2) {
        throw new Error("At least one other valid participant is required");
      }

      // Check if a direct conversation already exists between these users
      if (conversationType === "direct" && participants.length === 2) {
        const participantUserIds = participants.map(p => p.id);
        
        // Find existing conversation with exactly these participants
        const existingConversation = await tx.conversation.findFirst({
          where: {
            conversation_type: "direct",
            AND: participantUserIds.map(userId => ({
              participants: {
                some: {
                  user_id: userId
                }
              }
            })),
            participants: {
              // Ensure exactly 2 participants (no more, no less)
              none: {
                user_id: {
                  notIn: participantUserIds
                }
              }
            }
          }
        });

        if (existingConversation) {
          console.log(`💬 Found existing conversation ${existingConversation.id}, returning it`);
          isExistingConversation = true;
          return existingConversation;
        }
      }

      // Generate conversation title if not provided
      let conversationTitle = title;
      if (!conversationTitle) {
        const otherParticipants = participants.filter(p => p.clerk_user_id !== clerkUserId);
        const names = otherParticipants.map(p => `${p.first_name} ${p.last_name}`.trim());
        conversationTitle = names.join(', ');
      }

      // Create conversation
      const conversation = await tx.conversation.create({
        data: {
          title: conversationTitle,
          conversation_type: conversationType,
          created_by: creator.id,
          participants: {
            create: participants.map(participant => ({
              user_id: participant.id
            }))
          }
        }
      });

      return conversation;
    });

    console.log(`💬 Conversation created successfully: ${result.id}`);

    res.status(201).json({
      success: true,
      message: isExistingConversation ? "Existing conversation found" : "Conversation created successfully",
      data: {
        id: result.id.toString(),
        title: result.title,
        conversation_type: result.conversation_type,
        created_at: result.created_at.toISOString(),
        updated_at: result.updated_at.toISOString(),
        isExisting: isExistingConversation
      },
    });
  } catch (error: any) {
    console.error("💬 Create conversation error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message,
    });
  }
});

// Get available contacts for messaging
app.get(
  "/api/messages/contacts/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;

      console.log("👥 Fetching contacts for user:", clerkUserId);

      const contacts = await prisma.user.findMany({
        where: {
          clerk_user_id: {
            not: clerkUserId
          },
          status: 'active'
        },
        select: {
          id: true,
          clerk_user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_image_url: true,
          role: true
        },
        orderBy: [
          { first_name: 'asc' },
          { last_name: 'asc' }
        ]
      });

      // Check for existing conversations
      const contactsWithConversations = await Promise.all(
        contacts.map(async (contact) => {
          const existingConversation = await prisma.conversation.findFirst({
            where: {
              AND: [
                {
                  participants: {
                    some: {
                      user: {
                        clerk_user_id: clerkUserId
                      }
                    }
                  }
                },
                {
                  participants: {
                    some: {
                      user: {
                        clerk_user_id: contact.clerk_user_id
                      }
                    }
                  }
                },
                {
                  conversation_type: 'direct'
                }
              ]
            }
          });

          return {
            ...contact,
            online: false,
            has_existing_conversation: !!existingConversation
          };
        })
      );

      console.log(`👥 Found ${contactsWithConversations.length} contacts for user ${clerkUserId}`);

      res.json({
        success: true,
        data: contactsWithConversations,
      });
    } catch (error: any) {
      console.error("👥 Get contacts error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to fetch contacts",
        error: error.message,
      });
    }
  }
);

// Search users by name or email
app.get(
  "/api/messages/search-users/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
  const { clerkUserId } = req.params;
  const { q: searchQuery } = req.query;

      console.log(`🔍 Searching users for ${clerkUserId}, query: "${searchQuery}"`);

      if (!searchQuery || typeof searchQuery !== "string" || searchQuery.trim() === "") {
        return res.json({
          success: true,
          data: [],
        });
      }

      const q = searchQuery.trim();
      const isEmailQuery = q.includes("@") && !q.includes(" ");

      // Exact match by email when the query looks like an email
      const whereClause: any = {
        clerk_user_id: { not: clerkUserId },
        status: 'active',
      };

      if (isEmailQuery) {
        whereClause.email = { equals: q, mode: 'insensitive' };
      } else {
        whereClause.OR = [
          { first_name: { contains: q, mode: 'insensitive' } },
          { last_name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ];
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          clerk_user_id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_image_url: true,
          role: true
        },
        orderBy: [
          { first_name: 'asc' },
          { last_name: 'asc' }
        ],
        take: 20
      });

      const formattedUsers = users.map(user => ({
        ...user,
        online: false,
        has_existing_conversation: false
      }));

      console.log(`🔍 Found ${formattedUsers.length} users matching "${searchQuery}"`);

      res.json({
        success: true,
        data: formattedUsers,
      });
    } catch (error: any) {
      console.error("🔍 Search users error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to search users",
        error: error.message,
      });
    }
  }
);

// Update user activity
// Update user activity endpoint - call this every minute when user is active
app.post("/api/users/:clerkUserId/activity", async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;

    const updatedUser = await prisma.user.update({
      where: { clerk_user_id: clerkUserId },
      data: { 
        last_active_at: new Date(),
        updated_at: new Date() 
      }
    });

    // console.log(`👤 Updated activity for user ${clerkUserId}`);

    res.json({ 
      success: true, 
      message: "Activity updated",
      data: {
        last_active_at: updatedUser.last_active_at
      }
    });
  } catch (error: any) {
    console.error("Error updating user activity:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update activity",
      error: error.message,
    });
  }
});

// Helper function to determine online status
function isUserOnline(lastActiveAt: Date | null): boolean {
  if (!lastActiveAt) return false;
  
  const now = new Date();
  const lastActive = new Date(lastActiveAt);
  const minutesSinceLastActive = (now.getTime() - lastActive.getTime()) / (1000 * 60);
  
  // Consider user online if active in last 5 minutes
  return minutesSinceLastActive <= 5;
}


// Update the conversations endpoint to include online status
app.get(
  "/api/messages/conversations/:clerkUserId",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;

      // console.log("💬 Fetching conversations for user:", clerkUserId);

      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              user: {
                clerk_user_id: clerkUserId
              }
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  clerk_user_id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  profile_image_url: true,
                  last_active_at: true, // Include last_active_at
                  updated_at: true
                }
              }
            }
          },
          messages: {
            orderBy: {
              created_at: 'desc'
            },
            take: 1
          },
          _count: {
            select: {
              messages: {
                where: {
                  NOT: {
                    read_status: {
                      some: {
                        user: {
                          clerk_user_id: clerkUserId
                        }
                      }
                    }
                  },
                  sender: {
                    clerk_user_id: {
                      not: clerkUserId
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          updated_at: 'desc'
        }
      });

      // console.log(`💬 Raw conversations data:`, JSON.stringify(conversations, null, 2));

      const formattedConversations = conversations.map(conversation => {
        const lastMessage = conversation.messages[0];
        
        // Get ALL participants with online status
        const allParticipants = conversation.participants.map(p => ({
          id: p.user.id,
          clerk_user_id: p.user.clerk_user_id,
          first_name: p.user.first_name,
          last_name: p.user.last_name,
          email: p.user.email,
          profile_image_url: p.user.profile_image_url,
          online: isUserOnline(p.user.last_active_at),
          last_active_at: p.user.last_active_at
        }));

        // console.log(`💬 Conversation ${conversation.id} has ${allParticipants.length} participants:`, allParticipants);

        return {
          id: conversation.id.toString(),
          title: conversation.title,
          conversation_type: conversation.conversation_type,
          updated_at: conversation.updated_at.toISOString(),
          created_at: conversation.created_at.toISOString(),
          last_message: lastMessage?.message_text || '',
          last_message_time: lastMessage?.created_at.toISOString(),
          unread_count: conversation._count.messages,
          participants: allParticipants
        };
      });

      console.log(`💬 Found ${formattedConversations.length} conversations for user ${clerkUserId}`);

      res.json({
        success: true,
        data: formattedConversations,
      });
    } catch (error: any) {
      console.error("💬 Get conversations error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to fetch conversations",
        error: error.message,
      });
    }
  }
);

async function getUserOnlineStatus(clerkUserId: string): Promise<boolean> {
  try {
    // First try to get from your database
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId },
      select: { last_active_at: true }
    });

    if (user?.last_active_at) {
      const now = new Date();
      const lastActive = new Date(user.last_active_at);
      const minutesSinceLastActive = (now.getTime() - lastActive.getTime()) / (1000 * 60);
      
      // Consider user online if active in last 3 minutes (more aggressive)
      return minutesSinceLastActive <= 3;
    }

    // If no activity data, return false
    return false;
  } catch (error) {
    console.error("Error checking user online status:", error);
    return false; // Ensure a value is returned in case of an error
  }
}


// Removed duplicate import of PrismaClient
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

const prisma = new PrismaClient();

// Configure multer (add this if not already present)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + safeFileName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

app.post('/api/messages/upload-attachment', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { conversationId, clerkUserId, messageType = 'file' } = req.body;

    if (!conversationId || !clerkUserId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'conversationId and clerkUserId are required'
      });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId }
    });

    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: Number.parseInt(conversationId),
        user_id: user.id
      }
    });

    if (!participant) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation'
      });
    }

    // Construct file URL
    const fileUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;

    // Create message with file attachment - FIXED VERSION
    const message = await prisma.message.create({
      data: {
        conversation_id: Number.parseInt(conversationId),
        sender_id: user.id,
        message_text: `Shared ${messageType}: ${req.file.originalname}`,
        message_type: messageType,
        attachment_url: fileUrl, // ✅ Now valid
        file_name: req.file.originalname, // ✅ Now valid
        file_size: req.file.size, // ✅ Now valid
      },
      include: {
        sender: {
          select: {
            id: true,
            clerk_user_id: true,
            first_name: true,
            last_name: true,
            profile_image_url: true
          }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: Number.parseInt(conversationId) },
      data: { updated_at: new Date() }
    });

    // Format response - FIXED VERSION
    const formattedMessage = {
      id: message.id.toString(),
      message_text: message.message_text,
      message_type: message.message_type,
      created_at: message.created_at.toISOString(),
      attachment_url: message.attachment_url,
      file_name: message.file_name,
      file_size: message.file_size,
      sender: {
        id: message.sender.id,
        clerk_user_id: message.sender.clerk_user_id,
        first_name: message.sender.first_name,
        last_name: message.sender.last_name,
        profile_image_url: message.sender.profile_image_url,
        online: false
      }
    };

    // Optional: Save to file_uploads table using manual SQL
    try {
      const db = require('../services/db'); // Your database connection
      await db.query(`
        INSERT INTO file_uploads 
          (message_id, original_name, stored_name, file_path, file_size, mime_type, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        message.id,
        req.file.originalname,
        req.file.filename,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        user.id
      ]);
      console.log('📁 File upload record created successfully');
    } catch (uploadError) {
      console.error('📁 Failed to create file_uploads record:', uploadError);
      // Don't fail the entire request if this fails
    }

    console.log(`📁 File uploaded successfully: ${req.file.originalname}`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: formattedMessage
    });

  } catch (error) {
    console.error('📁 File upload error:', error);
    
    // Clean up file if upload failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: (error as any).message
    });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// =============================================
// PROFILE IMAGE UPLOAD ENDPOINT
// =============================================

app.post('/api/upload/profile-image/:clerkUserId', upload.single('profileImage'), async (req, res) => {
  try {
    const { clerkUserId } = req.params;

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image uploaded' 
      });
    }

    console.log('📸 Uploading profile image for user:', clerkUserId);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { clerk_user_id: clerkUserId }
    });

    if (!user) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Construct image URL
    const imageUrl = `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'}/uploads/${req.file.filename}`;

    // Update user's profile image URL in database
    await prisma.user.update({
      where: { clerk_user_id: clerkUserId },
      data: { 
        profile_image_url: imageUrl,
        updated_at: new Date()
      }
    });

    console.log('✅ Profile image updated successfully:', imageUrl);

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        imageUrl: imageUrl
      }
    });

  } catch (error) {
    console.error('❌ Profile image upload error:', error);
    
    // Clean up file if upload failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Profile image upload failed',
      error: (error as any).message
    });
  }
});

// =============================================
// PROFILE ENDPOINTS - UPDATED FOR client_profiles TABLE
// =============================================

// Interface for profile data
interface ClientProfileData {
  // From users table
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  
  // From client_profiles table
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  
  // CMHA Demographics fields
  pronouns?: string;
  isLGBTQ?: string;
  primaryLanguage?: string;
  mentalHealthConcerns?: string;
  supportNeeded?: string;
  ethnoculturalBackground?: string;
  canadaStatus?: string;
  dateCameToCanada?: string;
  
  // Additional fields
  profileImage?: string;
  notifications?: boolean;
  shareWithSupportWorker?: boolean;
}

// Get complete client profile
app.get("/api/client-profile/:clerkUserId", async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;

    console.log('📋 Fetching client profile for:', clerkUserId);

    // Get user data from users table
    const userResult = await pool.query(
      `SELECT 
        id, first_name, last_name, email, phone_number, date_of_birth, gender,
        address, city, state, postal_code, country, profile_image_url
       FROM users 
       WHERE clerk_user_id = $1`,
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const user = userResult.rows[0];

    // Get client profile data with all CMHA fields
    const clientProfileResult = await pool.query(
      `SELECT 
        phone_number, date_of_birth,
        emergency_contact_name, emergency_contact_phone, therapist_contact,
        pronouns, is_lgbtq, primary_language, mental_health_concerns,
        support_needed, ethnocultural_background, canada_status, date_came_to_canada
       FROM client_profiles 
       WHERE clerk_user_id = $1`,
      [clerkUserId]
    );

    const clientProfile = clientProfileResult.rows[0] || {};

    // Combine the data
    const profileData: ClientProfileData = {
      // From users table
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phoneNumber: clientProfile.phone_number || user.phone_number,
      dateOfBirth: clientProfile.date_of_birth || user.date_of_birth,
      gender: user.gender,
      address: user.address,
      city: user.city,
      state: user.state,
      postalCode: user.postal_code,
      country: user.country,
      profileImage: user.profile_image_url,
      
      // Emergency contacts
      emergencyContactName: clientProfile.emergency_contact_name,
      emergencyContactPhone: clientProfile.emergency_contact_phone,
      emergencyContactRelationship: clientProfile.therapist_contact,
      
      // CMHA Demographics
      pronouns: clientProfile.pronouns,
      isLGBTQ: clientProfile.is_lgbtq,
      primaryLanguage: clientProfile.primary_language,
      mentalHealthConcerns: clientProfile.mental_health_concerns,
      supportNeeded: clientProfile.support_needed,
      ethnoculturalBackground: clientProfile.ethnocultural_background,
      canadaStatus: clientProfile.canada_status,
      dateCameToCanada: clientProfile.date_came_to_canada
    };

    console.log('✅ Client profile fetched successfully');

    res.json({
      success: true,
      data: profileData
    });

  } catch (error: any) {
    console.error("❌ Error fetching client profile:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch client profile",
      error: error.message
    });
  }
});

// Update client profile
app.put("/api/client-profile/:clerkUserId", async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { clerkUserId } = req.params;
    const profileData: Partial<ClientProfileData> = req.body;

    console.log('🔄 Updating client profile for:', clerkUserId, profileData);

    await client.query('BEGIN');

    // 1. Update users table
    const updateUserQuery = `
      UPDATE users 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        email = COALESCE($3, email),
        phone_number = COALESCE($4, phone_number),
        date_of_birth = COALESCE($5, date_of_birth),
        gender = COALESCE($6, gender),
        address = COALESCE($7, address),
        city = COALESCE($8, city),
        state = COALESCE($9, state),
        postal_code = COALESCE($10, postal_code),
        country = COALESCE($11, country),
        updated_at = CURRENT_TIMESTAMP
      WHERE clerk_user_id = $12
      RETURNING *
    `;

    const userUpdateResult = await client.query(updateUserQuery, [
      profileData.firstName,
      profileData.lastName,
      profileData.email,
      profileData.phoneNumber,
      profileData.dateOfBirth,
      profileData.gender,
      profileData.address,
      profileData.city,
      profileData.state,
      profileData.postalCode,
      profileData.country,
      clerkUserId
    ]);

    if (userUpdateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // 2. Update or insert into client_profiles table with all CMHA fields
    const upsertClientProfileQuery = `
      INSERT INTO client_profiles (
        clerk_user_id, 
        display_name,
        email,
        phone_number,
        date_of_birth,
        emergency_contact_name, 
        emergency_contact_phone,
        therapist_contact,
        pronouns,
        is_lgbtq,
        primary_language,
        mental_health_concerns,
        support_needed,
        ethnocultural_background,
        canada_status,
        date_came_to_canada,
        updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
      ON CONFLICT (clerk_user_id) 
      DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, client_profiles.display_name),
        email = COALESCE(EXCLUDED.email, client_profiles.email),
        phone_number = COALESCE(EXCLUDED.phone_number, client_profiles.phone_number),
        date_of_birth = COALESCE(EXCLUDED.date_of_birth, client_profiles.date_of_birth),
        emergency_contact_name = COALESCE(EXCLUDED.emergency_contact_name, client_profiles.emergency_contact_name),
        emergency_contact_phone = COALESCE(EXCLUDED.emergency_contact_phone, client_profiles.emergency_contact_phone),
        therapist_contact = COALESCE(EXCLUDED.therapist_contact, client_profiles.therapist_contact),
        pronouns = COALESCE(EXCLUDED.pronouns, client_profiles.pronouns),
        is_lgbtq = COALESCE(EXCLUDED.is_lgbtq, client_profiles.is_lgbtq),
        primary_language = COALESCE(EXCLUDED.primary_language, client_profiles.primary_language),
        mental_health_concerns = COALESCE(EXCLUDED.mental_health_concerns, client_profiles.mental_health_concerns),
        support_needed = COALESCE(EXCLUDED.support_needed, client_profiles.support_needed),
        ethnocultural_background = COALESCE(EXCLUDED.ethnocultural_background, client_profiles.ethnocultural_background),
        canada_status = COALESCE(EXCLUDED.canada_status, client_profiles.canada_status),
        date_came_to_canada = COALESCE(EXCLUDED.date_came_to_canada, client_profiles.date_came_to_canada),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const displayName = `${profileData.firstName} ${profileData.lastName}`.trim();
    
    const clientProfileUpdateResult = await client.query(upsertClientProfileQuery, [
      clerkUserId,
      displayName,
      profileData.email,
      profileData.phoneNumber,
      profileData.dateOfBirth,
      profileData.emergencyContactName,
      profileData.emergencyContactPhone,
      profileData.emergencyContactRelationship,
      profileData.pronouns,
      profileData.isLGBTQ,
      profileData.primaryLanguage,
      profileData.mentalHealthConcerns,
      profileData.supportNeeded,
      profileData.ethnoculturalBackground,
      profileData.canadaStatus,
      profileData.dateCameToCanada
    ]);

    await client.query('COMMIT');

    console.log('✅ Client profile updated successfully');

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: userUpdateResult.rows[0],
        clientProfile: clientProfileUpdateResult.rows[0]
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error("❌ Error updating client profile:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Update profile image (keep this the same)
app.put("/api/client-profile/:clerkUserId/profile-image", async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;
    const { profileImageBase64 } = req.body;

    if (!profileImageBase64) {
      return res.status(400).json({
        success: false,
        message: "profileImageBase64 is required"
      });
    }

    console.log('📸 Storing base64 profile image for user:', clerkUserId);

    // Store the base64 image directly in the database
    const result = await pool.query(
      `UPDATE users 
       SET profile_image_url = $1, updated_at = CURRENT_TIMESTAMP
       WHERE clerk_user_id = $2
       RETURNING profile_image_url`,
      [profileImageBase64, clerkUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log('✅ Profile image stored in database successfully');

    res.json({
      success: true,
      message: "Profile image updated successfully",
      data: {
        profileImageUrl: result.rows[0].profile_image_url
      }
    });

  } catch (error: any) {
    console.error("❌ Error updating profile image:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update profile image",
      error: error.message
    });
  }
});

// =============================================
// SETTINGS ENDPOINTS 
// =============================================

// Interfaces for Settings
interface UserSettings {
  // Display & Accessibility
  darkMode: boolean;
  textSize: string;
  
  // Privacy & Security
  autoLockTimer: string;

  // Notifications
  notificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietStartTime: string;
  quietEndTime: string;
  reminderFrequency: string;
}

// Get user settings
app.get("/api/settings/:clerkUserId", async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;
    console.log('🔧 Fetching settings for user:', clerkUserId);

    // Get user's internal ID
    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    const userId = userResult.rows[0].id;

    // Get user settings
    const result = await pool.query(
      `SELECT * FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default settings if none exist
      console.log('🔧 No settings found, returning defaults');
      return res.json({
        success: true,
        settings: {
          dark_mode: false,
          text_size: "Medium",
          auto_lock_timer: "5 minutes",
          notifications_enabled: true,
          quiet_hours_enabled: false,
          quiet_start_time: "22:00",
          quiet_end_time: "08:00",
          reminder_frequency: "Daily",
        },
      });
    }

    console.log('🔧 Settings found:', result.rows[0]);
    res.json({
      success: true,
      settings: result.rows[0],
    });
  } catch (error: any) {
    console.error("❌ Error fetching settings:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to fetch settings",
      details: error.message,
    });
  }
});

// Update user settings
app.put(
  "/api/settings/:clerkUserId",
  async (
    req: Request<{ clerkUserId: string }, {}, { settings: Partial<UserSettings> }>,
    res: Response
  ) => {
    try {
      const { clerkUserId } = req.params;
      const { settings } = req.body;

      console.log('🔧 Updating settings for user:', clerkUserId, settings);

      if (!settings) {
        return res.status(400).json({ 
          success: false,
          error: "Settings data is required" 
        });
      }

      // Get user's internal ID
      const userResult = await pool.query(
        "SELECT id FROM users WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: "User not found" 
        });
      }

      const userId = userResult.rows[0].id;

      // Check if settings already exist
      const existingSettings = await pool.query(
        "SELECT id FROM user_settings WHERE user_id = $1",
        [userId]
      );

      let result;
      
      if (existingSettings.rows.length > 0) {
        // UPDATE existing settings
        result = await pool.query(
          `UPDATE user_settings 
           SET 
             dark_mode = COALESCE($1, dark_mode),
             text_size = COALESCE($2, text_size),
             auto_lock_timer = COALESCE($3, auto_lock_timer),
             notifications_enabled = COALESCE($4, notifications_enabled),
             quiet_hours_enabled = COALESCE($5, quiet_hours_enabled),
             quiet_start_time = COALESCE($6, quiet_start_time),
             quiet_end_time = COALESCE($7, quiet_end_time),
             reminder_frequency = COALESCE($8, reminder_frequency),
             updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $9
           RETURNING *`,
          [
            settings.darkMode,
            settings.textSize,
            settings.autoLockTimer,
            settings.notificationsEnabled,
            settings.quietHoursEnabled,
            settings.quietStartTime,
            settings.quietEndTime,
            settings.reminderFrequency,
            userId
          ]
        );
      } else {
        // INSERT new settings
        result = await pool.query(
          `INSERT INTO user_settings (
            user_id, clerk_user_id, 
            dark_mode, text_size, auto_lock_timer,
            notifications_enabled, quiet_hours_enabled, quiet_start_time, quiet_end_time, reminder_frequency
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [
            userId,
            clerkUserId,
            settings.darkMode ?? false,
            settings.textSize ?? 'Medium',
            settings.autoLockTimer ?? '5 minutes',
            settings.notificationsEnabled ?? true,
            settings.quietHoursEnabled ?? false,
            settings.quietStartTime ?? '22:00',
            settings.quietEndTime ?? '08:00',
            settings.reminderFrequency ?? 'Daily'
          ]
        );
      }

      console.log('✅ Settings updated successfully:', result.rows[0]);
      res.json({
        success: true,
        message: "Settings updated successfully",
        settings: result.rows[0],
      });
    } catch (error: any) {
      console.error("❌ Error updating settings:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to update settings",
        details: error.message,
      });
    }
  }
);

// Reset settings to default
app.post(
  "/api/settings/:clerkUserId/reset",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId } = req.params;
      console.log('🔧 Resetting settings for user:', clerkUserId);

      // Get user's internal ID
      const userResult = await pool.query(
        "SELECT id FROM users WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: "User not found" 
        });
      }

      const userId = userResult.rows[0].id;

      // Delete existing settings (will trigger default values on next fetch)
      await pool.query("DELETE FROM user_settings WHERE user_id = $1", [
        userId,
      ]);

      console.log('✅ Settings reset successfully');
      res.json({
        success: true,
        message: "Settings reset to defaults successfully",
      });
    } catch (error: any) {
      console.error("❌ Error resetting settings:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to reset settings",
        details: error.message,
      });
    }
  }
);

// Update settings category
app.patch(
  "/api/settings/:clerkUserId/category/:category",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId, category } = req.params;
      const updates = req.body;

      console.log('🔧 Updating category:', category, 'for user:', clerkUserId, updates);

      // Validate category
      const validCategories = ["display", "privacy", "notifications"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid settings category" 
        });
      }

      // Get user's internal ID
      const userResult = await pool.query(
        "SELECT id FROM users WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: "User not found" 
        });
      }

      const userId = userResult.rows[0].id;

      // Build dynamic update query based on category
      let updateFields: string[] = [];
      let updateValues: any[] = [userId];
      let paramIndex = 2;

      for (const key of Object.keys(updates)) {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        updateFields.push(`${snakeKey} = $${paramIndex}`);
        updateValues.push(updates[key]);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: "No valid updates provided" 
        });
      }

      const query = `
        UPDATE user_settings 
        SET ${updateFields.join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, updateValues);

      console.log('✅ Category settings updated successfully');
      res.json({
        success: true,
        message: `${category} settings updated successfully`,
        settings: result.rows[0],
      });
    } catch (error: any) {
      console.error("❌ Error updating category settings:", error.message);
      res.status(500).json({
        success: false,
        error: "Failed to update settings",
        details: error.message,
      });
    }
  }
);
// =============================================
// HELP ENDPOINTS
// =============================================

interface HelpItem {
  id?: string;
  title: string;
  content: string;
  type?: 'guide' | 'faq' | 'contact';
  sort_order?: number;
  related_features?: string[];
  estimated_read_time?: number;
  last_updated?: string;
}

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  content: HelpItem[];
  expanded?: boolean;
  sort_order?: number;
  description?: string;
  category?: 'getting_started' | 'features' | 'support' | 'privacy' | 'troubleshooting';
  priority?: 'high' | 'medium' | 'low';
}

// Help endpoints
app.get('/api/help-sections', async (req, res) => {
  try {
    const { include } = req.query;
    const client = await pool.connect();

    try {
      // Fetch all help sections
      const sectionsQuery = `
        SELECT id, title, icon, sort_order, created_at, updated_at 
        FROM help_sections 
        ORDER BY sort_order ASC
      `;
      const sectionsResult = await client.query(sectionsQuery);
      
      const sections: HelpSection[] = sectionsResult.rows;

      // If include=items, fetch items for each section
      if (include === 'items') {
        for (const section of sections) {
          const itemsQuery = `
            SELECT id, title, content, type, sort_order, created_at, updated_at
            FROM help_items 
            WHERE section_id = $1 
            ORDER BY sort_order ASC
          `;
          const itemsResult = await client.query(itemsQuery, [section.id]);
          section.content = itemsResult.rows.map(item => ({
            ...item,
            related_features: [],
            estimated_read_time: Math.ceil(item.content.length / 200), // ~200 chars per minute
            last_updated: item.updated_at
          }));
        }
      } else {
        // Initialize empty content array
        for (const section of sections) {
          section.content = [];
        }
      }

      res.json(sections);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching help sections:', error);
    res.status(500).json({ 
      error: 'Failed to fetch help sections',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/help-sections/:sectionId/items', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const client = await pool.connect();

    try {
      // First verify the section exists
      const sectionCheck = await client.query(
        'SELECT id FROM help_sections WHERE id = $1',
        [sectionId]
      );

      if (sectionCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Help section not found' });
      }

      // Fetch items for the specific section
      const itemsQuery = `
        SELECT id, title, content, type, sort_order, created_at, updated_at
        FROM help_items 
        WHERE section_id = $1 
        ORDER BY sort_order ASC
      `;
      const itemsResult = await client.query(itemsQuery, [sectionId]);

      const items: HelpItem[] = itemsResult.rows.map(item => ({
        ...item,
        related_features: [],
        estimated_read_time: Math.ceil(item.content.length / 200), // ~200 chars per minute
        last_updated: item.updated_at
      }));

      res.json(items);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching help items:', error);
    res.status(500).json({ 
      error: 'Failed to fetch help items',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/help/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const client = await pool.connect();

    try {
      const searchQuery = `
        SELECT hi.id, hi.title, hi.content, hi.type, hi.section_id, hs.title as section_title
        FROM help_items hi
        JOIN help_sections hs ON hi.section_id = hs.id
        WHERE hi.title ILIKE $1 OR hi.content ILIKE $1
        ORDER BY 
          CASE 
            WHEN hi.title ILIKE $1 THEN 1
            ELSE 2
          END,
          hi.sort_order ASC
      `;
      
      const searchResult = await client.query(searchQuery, [`%${q}%`]);

      const items: HelpItem[] = searchResult.rows.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type,
        related_features: [],
        estimated_read_time: Math.ceil(item.content.length / 200),
        last_updated: item.updated_at
      }));

      res.json(items);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error searching help content:', error);
    res.status(500).json({ 
      error: 'Failed to search help content',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/help-sections/:sectionId/view', async (req, res) => {
  try {
    const { sectionId } = req.params;
    const client = await pool.connect();

    try {
      // Verify section exists
      const sectionCheck = await client.query(
        'SELECT id FROM help_sections WHERE id = $1',
        [sectionId]
      );

      if (sectionCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Help section not found' });
      }

      // In a real app, you might want to:
      // 1. Track user ID if authenticated
      // 2. Store view timestamps
      // 3. Update analytics
      
      console.log(`Help section viewed: ${sectionId}`);
      
      res.json({ success: true, message: 'View tracked' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error tracking help section view:', error);
    res.status(500).json({ 
      error: 'Failed to track view',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/users/:clerkUserId/logout', async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    const client = await pool.connect();

    try {
      const updateQuery = `
        UPDATE users 
        SET last_logout_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE clerk_user_id = $1
        RETURNING id, clerk_user_id, last_logout_at
      `;
      
      const result = await client.query(updateQuery, [clerkUserId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ 
        success: true, 
        message: 'Logout timestamp updated',
        user: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating logout timestamp:', error);
    res.status(500).json({ 
      error: 'Failed to update logout timestamp',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.post('/api/users/:clerkUserId/login', async (req, res) => {
  try {
    const { clerkUserId } = req.params;
    const client = await pool.connect();

    try {
      const updateQuery = `
        UPDATE users 
        SET last_login_at = CURRENT_TIMESTAMP,
            last_login = CURRENT_TIMESTAMP,
            last_active_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE clerk_user_id = $1
        RETURNING id, clerk_user_id, last_login_at
      `;
      
      const result = await client.query(updateQuery, [clerkUserId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ 
        success: true, 
        message: 'Login timestamp updated',
        user: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating login timestamp:', error);
    res.status(500).json({ 
      error: 'Failed to update login timestamp',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});