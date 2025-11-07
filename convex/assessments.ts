/**
 * Assessments Module - Convex Backend
 * 
 * Handles mental wellbeing self-assessment submissions and tracking
 * Based on Short Warwick-Edinburgh Mental Wellbeing Scale (SWEMWBS)
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// 6 months in milliseconds
const ASSESSMENT_INTERVAL = 6 * 30 * 24 * 60 * 60 * 1000;

/**
 * Transform database assessment to client format
 * Handles timezone conversion
 */
function toClient(doc: any) {
  const completedDate = new Date(doc.completedAt).toLocaleString('en-US', {
    timeZone: 'America/Edmonton',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const nextDue = doc.nextDueDate ? new Date(doc.nextDueDate).toLocaleString('en-US', {
    timeZone: 'America/Edmonton',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  }) : null;

  return {
    id: doc._id,
    userId: doc.userId,
    assessmentType: doc.assessmentType,
    responses: doc.responses,
    totalScore: doc.totalScore,
    completedAt: completedDate,
    nextDueDate: nextDue,
    notes: doc.notes,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

/**
 * Check if user has a pending assessment (due or overdue)
 */
export const isAssessmentDue = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Get the most recent assessment
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_user_and_completed", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);
    
    if (assessments.length === 0) {
      // No assessments yet - it's due
      return { isDue: true, daysUntilDue: 0 };
    }
    
    const latest = assessments[0]!;
    const now = Date.now();
    
    if (latest.nextDueDate && now >= latest.nextDueDate) {
      // Next due date has passed
      const daysPast = Math.floor((now - latest.nextDueDate) / (1000 * 60 * 60 * 24));
      return { isDue: true, daysUntilDue: -daysPast };
    }
    
    if (latest.nextDueDate) {
      // Calculate days until due
      const daysUntil = Math.ceil((latest.nextDueDate - now) / (1000 * 60 * 60 * 24));
      return { isDue: false, daysUntilDue: daysUntil };
    }
    
    // Fallback: if no nextDueDate, check if 6 months have passed since last assessment
    const timeSinceLastAssessment = now - latest.completedAt;
    if (timeSinceLastAssessment >= ASSESSMENT_INTERVAL) {
      const daysPast = Math.floor(timeSinceLastAssessment / (1000 * 60 * 60 * 24)) - 180; // 6 months = ~180 days
      return { isDue: true, daysUntilDue: -daysPast };
    }
    
    const daysUntil = Math.ceil((ASSESSMENT_INTERVAL - timeSinceLastAssessment) / (1000 * 60 * 60 * 24));
    return { isDue: false, daysUntilDue: daysUntil };
  },
});

/**
 * Get latest assessment for a user
 */
export const getLatestAssessment = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_user_and_completed", (q) => q.eq("userId", userId))
      .order("desc")
      .take(1);
    
    if (assessments.length === 0) return null;
    
    return toClient(assessments[0]);
  },
});

/**
 * Get assessment history for a user
 */
export const getAssessmentHistory = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 10 }) => {
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_user_and_completed", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    
    return assessments.map(toClient);
  },
});

/**
 * Get assessment statistics for a user
 */
export const getAssessmentStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    if (assessments.length === 0) {
      return {
        totalAssessments: 0,
        averageScore: null,
        latestScore: null,
        trend: null, // 'improving' | 'stable' | 'declining'
      };
    }
    
    // Sort by completion date
    const sorted = assessments.sort((a, b) => b.completedAt - a.completedAt);
    
    const totalScore = assessments.reduce((sum, a) => sum + a.totalScore, 0);
    const averageScore = totalScore / assessments.length;
    const latestScore = sorted[0]!.totalScore;
    
    // Calculate trend (compare latest to previous)
    let trend: 'improving' | 'stable' | 'declining' | null = null;
    if (sorted.length >= 2) {
      const previousScore = sorted[1]!.totalScore;
      const diff = latestScore - previousScore;
      
      if (diff > 2) trend = 'improving';
      else if (diff < -2) trend = 'declining';
      else trend = 'stable';
    }
    
    return {
      totalAssessments: assessments.length,
      averageScore: Math.round(averageScore * 10) / 10,
      latestScore,
      trend,
      scores: sorted.map(a => ({
        score: a.totalScore,
        date: new Date(a.completedAt).toISOString(),
      })),
    };
  },
});

/**
 * Submit a new assessment
 */
export const submitAssessment = mutation({
  args: {
    userId: v.string(),
    assessmentType: v.string(),
    responses: v.any(), // JSON object of responses
    totalScore: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const nextDue = now + ASSESSMENT_INTERVAL; // 6 months from now
    
    const assessmentId = await ctx.db.insert("assessments", {
      userId: args.userId,
      assessmentType: args.assessmentType,
      responses: args.responses,
      totalScore: args.totalScore,
      completedAt: now,
      nextDueDate: nextDue,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });
    
    // Create notification for completion
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "self_assessment",
      title: "Assessment Completed",
      message: `Your wellbeing assessment has been recorded. Score: ${args.totalScore}/35. Next assessment due in 6 months.`,
      isRead: false,
      createdAt: now,
    });
    
    // Log activity
    await ctx.db.insert("activities", {
      userId: args.userId,
      activityType: "assessment_completed",
      metadata: { 
        assessmentId, 
        score: args.totalScore,
        type: args.assessmentType,
      },
      createdAt: now,
    });
    
    return { 
      id: assessmentId,
      nextDueDate: new Date(nextDue).toISOString(),
    };
  },
});

/**
 * Update assessment notes (for support workers or self-reflection)
 */
export const updateAssessmentNotes = mutation({
  args: {
    assessmentId: v.id("assessments"),
    notes: v.string(),
  },
  handler: async (ctx, { assessmentId, notes }) => {
    await ctx.db.patch(assessmentId, {
      notes,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Get assessments due in the next N days (for reminder system)
 */
export const getUpcomingDueAssessments = query({
  args: { 
    userId: v.string(),
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, { userId, daysAhead = 7 }) => {
    const now = Date.now();
    const futureDate = now + (daysAhead * 24 * 60 * 60 * 1000);
    
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.and(
          q.gte(q.field("nextDueDate"), now),
          q.lte(q.field("nextDueDate"), futureDate)
        )
      )
      .collect();
    
    return assessments.map(toClient);
  },
});
