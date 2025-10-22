import express, { Request, Response } from "express";
import cors from "cors";
import { Pool } from "pg";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

const app = express();
const PORT = 3001;
const axios = require("axios");

// Middleware
app.use(cors());
app.use(express.json());

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

// Get a specific user by their Clerk ID
app.get("/api/users/:clerkUserId", async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;
    
    const result = await pool.query(
      "SELECT * FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error fetching user:", error.message);
    res.status(500).json({
      error: "Failed to fetch user",
      details: error.message,
    });
  }
});

// Sync user endpoint
app.post(
  "/api/sync-user",
  async (req: Request<{}, {}, SyncUserRequest>, res: Response) => {
    try {
      const { clerkUserId, email, firstName, lastName, phoneNumber } = req.body;

      if (!clerkUserId || !email) {
        return res.status(400).json({
          error: "clerkUserId and email are required",
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
        message: "User synced successfully",
        user: result.rows[0],
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

// Get client emergency contact info
app.get("/api/clients/by-clerk/:clerkUserId", async (req: Request, res: Response) => {
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
    
    // Get client info
    const clientResult = await pool.query(
      "SELECT * FROM clients WHERE user_id = $1",
      [userId]
    );
    
    if (clientResult.rows.length === 0) {
      return res.json({ client: null });
    }
    
    res.json(clientResult.rows[0]);
  } catch (error: any) {
    console.error("Error fetching client:", error.message);
    res.status(500).json({
      error: "Failed to fetch client",
      details: error.message,
    });
  }
});

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

    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      posts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
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
        console.log("User not found in database, using default author name");
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
        [parseInt(id), clerkUserId, emoji]
      );

      let reactionChange = 0;

      if (existingReaction.rows.length > 0) {
        // Remove existing reaction
        await client.query(
          "DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2 AND emoji = $3",
          [parseInt(id), clerkUserId, emoji]
        );
        reactionChange = -1;
      } else {
        // Remove any existing reaction from this user to this post
        await client.query(
          "DELETE FROM post_reactions WHERE post_id = $1 AND user_id = $2",
          [parseInt(id), clerkUserId]
        );

        // Add new reaction
        await client.query(
          "INSERT INTO post_reactions (post_id, user_id, emoji) VALUES ($1, $2, $3)",
          [parseInt(id), clerkUserId, emoji]
        );
        reactionChange = 1;
      }

      // Update reaction count
      await client.query(
        "UPDATE community_posts SET reaction_count = GREATEST(0, reaction_count + $1) WHERE id = $2",
        [reactionChange, parseInt(id)]
      );

      // Get updated reaction counts by emoji
      const reactionCounts = await client.query(
        `SELECT emoji, COUNT(*) as count 
       FROM post_reactions 
       WHERE post_id = $1 
       GROUP BY emoji`,
        [parseInt(id)]
      );

      // Convert to object format
      const reactions: { [key: string]: number } = {};
      reactionCounts.rows.forEach((row: any) => {
        reactions[row.emoji] = parseInt(row.count);
      });

      // Check if user has any reaction to this post
      const userReactionResult = await client.query(
        "SELECT emoji FROM post_reactions WHERE post_id = $1 AND user_id = $2",
        [parseInt(id), clerkUserId]
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
        [parseInt(id), clerkUserId]
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
)

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
      [title, content, isDraft, category, parseInt(id)]
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
      [parseInt(id)]
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
        [parseInt(id), clerkUserId, emoji]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Reaction not found" });
      }

      // Update reaction count
      await pool.query(
        "UPDATE community_posts SET reaction_count = GREATEST(0, reaction_count - 1) WHERE id = $1",
        [parseInt(id)]
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
        [parseInt(id), clerkUserId]
      );

      if (existingBookmark.rows.length > 0) {
        // Remove bookmark
        await pool.query(
          "DELETE FROM post_bookmarks WHERE post_id = $1 AND user_id = $2",
          [parseInt(id), clerkUserId]
        );
        res.json({ bookmarked: false, message: "Bookmark removed" });
      } else {
        // Add bookmark
        await pool.query(
          "INSERT INTO post_bookmarks (post_id, user_id) VALUES ($1, $2)",
          [parseInt(id), clerkUserId]
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
          parseInt(limit as string),
          (parseInt(page as string) - 1) * parseInt(limit as string),
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
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);

      // Get total count for pagination
      const countResult = await pool.query(
        "SELECT COUNT(*) FROM mood_entries WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      res.json({
        moods: result.rows,
        count: result.rows.length,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
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
        period: `${days} days`,
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
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);

      // Get total count
      const countResult = await pool.query(
        "SELECT COUNT(*) FROM journal_entries WHERE clerk_user_id = $1",
        [clerkUserId]
      );

      res.json({
        entries: result.rows,
        count: result.rows.length,
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit),
        offset: parseInt(offset),
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

    const result = await pool.query(
      `
      SELECT * FROM resources 
      WHERE title ILIKE $1 
         OR content ILIKE $1 
         OR $2 = ANY(tags)
      ORDER BY created_at DESC
    `,
      [`%${q}%`, q]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error searching resources:", error);
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
      if (response.data && response.data[0]) {
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

// Add these endpoints to your backend
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
// SETTINGS ENDPOINTS
// =============================================

// Interfaces for Settings
interface UserSettings {
  // Display & Accessibility
  darkMode: boolean;
  textSize: string;
  highContrast: boolean;
  reduceMotion: boolean;
  
  // Privacy & Security
  biometricLock: boolean;
  autoLockTimer: string;
  
  // Notifications
  notificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietStartTime: string;
  quietEndTime: string;
  reminderFrequency: string;
  
  // Contacts
  crisisContact: string;
  therapistContact: string;
  
  // Wellbeing
  safeMode: boolean;
  breakReminders: boolean;
  breathingDuration: string;
  breathingStyle: string;
  offlineMode: boolean;
}

interface UpdateSettingsRequest {
  clerkUserId: string;
  settings: Partial<UserSettings>;
}

// Get user settings
app.get("/api/settings/:clerkUserId", async (req: Request, res: Response) => {
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

    // Get user settings
    const result = await pool.query(
      `SELECT * FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        settings: {
          darkMode: false,
          textSize: "Medium",
          highContrast: false,
          reduceMotion: false,
          biometricLock: false,
          autoLockTimer: "5 minutes",
          notificationsEnabled: true,
          quietHoursEnabled: false,
          quietStartTime: "22:00",
          quietEndTime: "08:00",
          reminderFrequency: "Daily",
          crisisContact: "",
          therapistContact: "",
          safeMode: false,
          breakReminders: true,
          breathingDuration: "5 minutes",
          breathingStyle: "4-7-8 Technique",
          offlineMode: false,
        }
      });
    }

    res.json({ settings: result.rows[0] });
  } catch (error: any) {
    console.error("Error fetching settings:", error.message);
    res.status(500).json({
      error: "Failed to fetch settings",
      details: error.message,
    });
  }
});

// Update user settings
app.put(
  "/api/settings/:clerkUserId",
  async (req: Request<{ clerkUserId: string }, {}, { settings: Partial<UserSettings> }>, res: Response) => {
    try {
      const { clerkUserId } = req.params;
      const { settings } = req.body;

      if (!settings) {
        return res.status(400).json({ error: "Settings data is required" });
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

      // Upsert settings
      const result = await pool.query(
        `INSERT INTO user_settings (
          user_id, clerk_user_id, 
          dark_mode, text_size, high_contrast, reduce_motion,
          biometric_lock, auto_lock_timer,
          notifications_enabled, quiet_hours_enabled, quiet_start_time, quiet_end_time, reminder_frequency,
          crisis_contact, therapist_contact,
          safe_mode, break_reminders, breathing_duration, breathing_style, offline_mode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          dark_mode = COALESCE($3, user_settings.dark_mode),
          text_size = COALESCE($4, user_settings.text_size),
          high_contrast = COALESCE($5, user_settings.high_contrast),
          reduce_motion = COALESCE($6, user_settings.reduce_motion),
          biometric_lock = COALESCE($7, user_settings.biometric_lock),
          auto_lock_timer = COALESCE($8, user_settings.auto_lock_timer),
          notifications_enabled = COALESCE($9, user_settings.notifications_enabled),
          quiet_hours_enabled = COALESCE($10, user_settings.quiet_hours_enabled),
          quiet_start_time = COALESCE($11, user_settings.quiet_start_time),
          quiet_end_time = COALESCE($12, user_settings.quiet_end_time),
          reminder_frequency = COALESCE($13, user_settings.reminder_frequency),
          crisis_contact = COALESCE($14, user_settings.crisis_contact),
          therapist_contact = COALESCE($15, user_settings.therapist_contact),
          safe_mode = COALESCE($16, user_settings.safe_mode),
          break_reminders = COALESCE($17, user_settings.break_reminders),
          breathing_duration = COALESCE($18, user_settings.breathing_duration),
          breathing_style = COALESCE($19, user_settings.breathing_style),
          offline_mode = COALESCE($20, user_settings.offline_mode),
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [
          userId,
          clerkUserId,
          settings.darkMode,
          settings.textSize,
          settings.highContrast,
          settings.reduceMotion,
          settings.biometricLock,
          settings.autoLockTimer,
          settings.notificationsEnabled,
          settings.quietHoursEnabled,
          settings.quietStartTime,
          settings.quietEndTime,
          settings.reminderFrequency,
          settings.crisisContact,
          settings.therapistContact,
          settings.safeMode,
          settings.breakReminders,
          settings.breathingDuration,
          settings.breathingStyle,
          settings.offlineMode,
        ]
      );

      res.json({
        success: true,
        message: "Settings updated successfully",
        settings: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error updating settings:", error.message);
      res.status(500).json({
        error: "Failed to update settings",
        details: error.message,
      });
    }
  }
);

// Batch update specific setting categories
app.patch(
  "/api/settings/:clerkUserId/category/:category",
  async (req: Request, res: Response) => {
    try {
      const { clerkUserId, category } = req.params;
      const updates = req.body;

      // Validate category
      const validCategories = ['display', 'privacy', 'notifications', 'contacts', 'wellbeing'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid settings category" });
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

      // Build dynamic update query based on category
      let updateFields: string[] = [];
      let updateValues: any[] = [userId];
      let paramIndex = 2;

      Object.keys(updates).forEach((key) => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${snakeKey} = $${paramIndex}`);
        updateValues.push(updates[key]);
        paramIndex++;
      });

      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No valid updates provided" });
      }

      const query = `
        UPDATE user_settings 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, updateValues);

      res.json({
        success: true,
        message: `${category} settings updated successfully`,
        settings: result.rows[0],
      });
    } catch (error: any) {
      console.error("Error updating category settings:", error.message);
      res.status(500).json({
        error: "Failed to update settings",
        details: error.message,
      });
    }
  }
);

// Reset settings to default
app.post("/api/settings/:clerkUserId/reset", async (req: Request, res: Response) => {
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

    // Delete existing settings (will trigger default values on next fetch)
    await pool.query("DELETE FROM user_settings WHERE user_id = $1", [userId]);

    res.json({
      success: true,
      message: "Settings reset to defaults successfully",
    });
  } catch (error: any) {
    console.error("Error resetting settings:", error.message);
    res.status(500).json({
      error: "Failed to reset settings",
      details: error.message,
    });
  }
});

// Export settings (for backup/migration)
app.get("/api/settings/:clerkUserId/export", async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.params;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE clerk_user_id = $1",
      [clerkUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = userResult.rows[0].id;

    const result = await pool.query(
      "SELECT * FROM user_settings WHERE user_id = $1",
      [userId]
    );

    res.json({
      exportDate: new Date().toISOString(),
      settings: result.rows[0] || {},
    });
  } catch (error: any) {
    console.error("Error exporting settings:", error.message);
    res.status(500).json({
      error: "Failed to export settings",
      details: error.message,
    });
  }
});

// =============================================
// APPOINTMENTS ENDPOINTS
// =============================================

// Get all appointments for a user
app.get("/api/appointments", async (req: Request, res: Response) => {
  try {
    const { clerkUserId } = req.query;

    if (!clerkUserId) {
      return res.status(400).json({ error: "clerkUserId is required" });
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

    // Get all appointments for this user
    const query = `
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.session_type,
        a.status,
        a.meeting_link,
        a.notes,
        a.created_at,
        a.updated_at,
        sw.id as support_worker_id,
        sw.first_name as support_worker_first_name,
        sw.last_name as support_worker_last_name,
        sw.specialization,
        sw.avatar_url
      FROM appointments a
      LEFT JOIN support_workers sw ON a.support_worker_id = sw.id
      WHERE a.user_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `;

    const result = await pool.query(query, [userId]);

    // Format appointments for frontend
    const appointments = result.rows.map(row => ({
      id: row.id,
      supportWorker: `${row.support_worker_first_name} ${row.support_worker_last_name}`,
      supportWorkerId: row.support_worker_id,
      date: row.appointment_date,
      time: row.appointment_time,
      duration: row.duration_minutes,
      type: row.session_type,
      status: row.status,
      meetingLink: row.meeting_link,
      notes: row.notes,
      specialization: row.specialization,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({
      success: true,
      appointments: appointments,
      count: appointments.length
    });

  } catch (error: any) {
    console.error("Error fetching appointments:", error.message);
    res.status(500).json({
      error: "Failed to fetch appointments",
      details: error.message,
    });
  }
});

// Create a new appointment
app.post("/api/appointments", async (req: Request, res: Response) => {
  try {
    const {
      clerkUserId,
      supportWorkerId,
      appointmentDate,
      appointmentTime,
      sessionType,
      notes,
      duration = 60
    } = req.body;

    // Validate required fields
    if (!clerkUserId || !supportWorkerId || !appointmentDate || !appointmentTime || !sessionType) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["clerkUserId", "supportWorkerId", "appointmentDate", "appointmentTime", "sessionType"]
      });
    }

    // Validate session type
    const validSessionTypes = ['video', 'phone', 'in_person'];
    if (!validSessionTypes.includes(sessionType.toLowerCase().replace(' ', '_'))) {
      return res.status(400).json({ 
        error: "Invalid session type. Must be one of: video, phone, in_person" 
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

    // Check if support worker exists
    const supportWorkerCheck = await pool.query(
      "SELECT id FROM support_workers WHERE id = $1",
      [supportWorkerId]
    );

    if (supportWorkerCheck.rows.length === 0) {
      return res.status(404).json({ error: "Support worker not found" });
    }

    // Check for time slot conflicts
    const conflictCheck = await pool.query(
      `SELECT id FROM appointments 
       WHERE support_worker_id = $1 
       AND appointment_date = $2 
       AND appointment_time = $3 
       AND status IN ('scheduled', 'confirmed')`,
      [supportWorkerId, appointmentDate, appointmentTime]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: "Time slot already booked",
        message: "This time slot is not available. Please select another time."
      });
    }

    // Generate meeting link for video sessions
    let meetingLink = null;
    if (sessionType.toLowerCase() === 'video' || sessionType.toLowerCase() === 'video call') {
      const randomId = Math.random().toString(36).substring(2, 15);
      meetingLink = `https://meet.safespace.com/${randomId}`;
    }

    // Create the appointment
    const insertQuery = `
      INSERT INTO appointments (
        user_id, 
        support_worker_id, 
        appointment_date, 
        appointment_time,
        duration_minutes,
        session_type, 
        status,
        meeting_link,
        notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const formattedSessionType = sessionType.toLowerCase().replace(' ', '_');

    const result = await pool.query(insertQuery, [
      userId,
      supportWorkerId,
      appointmentDate,
      appointmentTime,
      duration,
      formattedSessionType,
      'scheduled',
      meetingLink,
      notes
    ]);

    // Get support worker details for response
    const swResult = await pool.query(
      "SELECT first_name, last_name, specialization, avatar_url FROM support_workers WHERE id = $1",
      [supportWorkerId]
    );

    const appointment = result.rows[0];
    const supportWorker = swResult.rows[0];

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment: {
        id: appointment.id,
        supportWorker: supportWorker ? `${supportWorker.first_name} ${supportWorker.last_name}` : 'Support Worker',
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        type: appointment.session_type,
        status: appointment.status,
        meetingLink: appointment.meeting_link,
        notes: appointment.notes
      }
    });

  } catch (error: any) {
    console.error("Error creating appointment:", error.message);
    res.status(500).json({
      error: "Failed to create appointment",
      details: error.message,
    });
  }
});

// Reschedule an appointment
app.put("/api/appointments/:id/reschedule", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newDate, newTime, reason } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({ 
        error: "newDate and newTime are required" 
      });
    }

    // Check if appointment exists
    const appointmentCheck = await pool.query(
      "SELECT * FROM appointments WHERE id = $1",
      [id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const currentAppointment = appointmentCheck.rows[0];

    // Check if appointment can be rescheduled (not completed or cancelled)
    if (['completed', 'cancelled'].includes(currentAppointment.status)) {
      return res.status(400).json({ 
        error: `Cannot reschedule ${currentAppointment.status} appointment` 
      });
    }

    // Check for time slot conflicts with the new time
    const conflictCheck = await pool.query(
      `SELECT id FROM appointments 
       WHERE support_worker_id = $1 
       AND appointment_date = $2 
       AND appointment_time = $3 
       AND status IN ('scheduled', 'confirmed')
       AND id != $4`,
      [currentAppointment.support_worker_id, newDate, newTime, id]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: "Time slot already booked",
        message: "The new time slot is not available. Please select another time."
      });
    }

    // Update the appointment
    const updateQuery = `
      UPDATE appointments 
      SET 
        appointment_date = $1, 
        appointment_time = $2,
        notes = CASE 
          WHEN notes IS NULL THEN $3
          ELSE notes || E'\\n\\nRescheduled: ' || $3
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const reschedulingNote = reason || `Rescheduled from ${currentAppointment.appointment_date} at ${currentAppointment.appointment_time}`;

    const result = await pool.query(updateQuery, [
      newDate,
      newTime,
      reschedulingNote,
      id
    ]);

    // Get support worker details for response
    const swResult = await pool.query(
      "SELECT first_name, last_name FROM support_workers WHERE id = $1",
      [currentAppointment.support_worker_id]
    );

    const appointment = result.rows[0];
    const supportWorker = swResult.rows[0];

    res.json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment: {
        id: appointment.id,
        supportWorker: supportWorker ? `${supportWorker.first_name} ${supportWorker.last_name}` : 'Support Worker',
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        type: appointment.session_type,
        status: appointment.status,
        notes: appointment.notes
      }
    });

  } catch (error: any) {
    console.error("Error rescheduling appointment:", error.message);
    res.status(500).json({
      error: "Failed to reschedule appointment",
      details: error.message,
    });
  }
});

// Cancel an appointment
app.put("/api/appointments/:id/cancel", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    // Check if appointment exists
    const appointmentCheck = await pool.query(
      "SELECT * FROM appointments WHERE id = $1",
      [id]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const currentAppointment = appointmentCheck.rows[0];

    // Check if appointment can be cancelled
    if (['completed', 'cancelled'].includes(currentAppointment.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel ${currentAppointment.status} appointment` 
      });
    }

    // Update the appointment status to cancelled
    const updateQuery = `
      UPDATE appointments 
      SET 
        status = 'cancelled',
        cancellation_reason = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      cancellationReason || 'Cancelled by user',
      id
    ]);

    const appointment = result.rows[0];

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment: {
        id: appointment.id,
        status: appointment.status,
        cancellationReason: appointment.cancellation_reason,
        cancelledAt: appointment.updated_at
      }
    });

  } catch (error: any) {
    console.error("Error cancelling appointment:", error.message);
    res.status(500).json({
      error: "Failed to cancel appointment",
      details: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`SafeSpace API server running on http://localhost:${PORT}`);
  console.log(`API documentation: http://localhost:${PORT}/`);
  console.log('Press Ctrl+C to stop the server');
});



