import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Start a new video call session
 * Called when user joins the pre-call screen
 */
export const startSession = mutation({
  args: {
    appointmentId: v.optional(v.id("appointments")),
    supportWorkerName: v.string(),
    supportWorkerId: v.optional(v.string()),
    audioOption: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const now = Date.now();
    
    const sessionId = await ctx.db.insert("videoCallSessions", {
      appointmentId: args.appointmentId,
      userId,
      supportWorkerName: args.supportWorkerName,
      supportWorkerId: args.supportWorkerId,
      sessionStatus: "connecting",
      joinedAt: now,
      audioOption: args.audioOption || "phone",
      cameraEnabled: true,
      micEnabled: true,
      createdAt: now,
      updatedAt: now,
    });

    return { sessionId };
  },
});

/**
 * Update session when call connects
 */
export const markConnected = mutation({
  args: {
    sessionId: v.id("videoCallSessions"),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const now = Date.now();
    await ctx.db.patch(args.sessionId, {
      sessionStatus: "connected",
      connectedAt: now,
      updatedAt: now,
    });

    return { ok: true };
  },
});

/**
 * End a video call session
 */
export const endSession = mutation({
  args: {
    sessionId: v.id("videoCallSessions"),
    endReason: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const now = Date.now();
    const duration = session.connectedAt 
      ? Math.floor((now - session.connectedAt) / 1000) 
      : 0;

    await ctx.db.patch(args.sessionId, {
      sessionStatus: "ended",
      endedAt: now,
      duration,
      endReason: args.endReason || "user_left",
      updatedAt: now,
    });

    // If linked to appointment, update appointment status to completed
    if (session.appointmentId) {
      await ctx.db.patch(session.appointmentId, {
        status: "completed",
        updatedAt: now,
      });
    }

    return { ok: true, duration };
  },
});

/**
 * Update session settings (camera, mic, etc.)
 */
export const updateSessionSettings = mutation({
  args: {
    sessionId: v.id("videoCallSessions"),
    cameraEnabled: v.optional(v.boolean()),
    micEnabled: v.optional(v.boolean()),
    audioOption: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.cameraEnabled !== undefined) updates.cameraEnabled = args.cameraEnabled;
    if (args.micEnabled !== undefined) updates.micEnabled = args.micEnabled;
    if (args.audioOption !== undefined) updates.audioOption = args.audioOption;

    await ctx.db.patch(args.sessionId, updates);

    return { ok: true };
  },
});

/**
 * Report quality issues during a call
 */
export const reportQualityIssue = mutation({
  args: {
    sessionId: v.id("videoCallSessions"),
    issue: v.string(),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const issues = session.qualityIssues || [];
    issues.push(args.issue);

    await ctx.db.patch(args.sessionId, {
      qualityIssues: issues,
      updatedAt: Date.now(),
    });

    return { ok: true };
  },
});

/**
 * Get user's video call history
 */
export const getUserSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const limit = args.limit ?? 20;

    const sessions = await ctx.db
      .query("videoCallSessions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return sessions;
  },
});

/**
 * Get call analytics/statistics
 */
export const getCallStats = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const sessions = await ctx.db
      .query("videoCallSessions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const completedSessions = sessions.filter((s: any) => s.sessionStatus === "ended" && s.duration);
    const totalDuration = completedSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
    const avgDuration = completedSessions.length > 0 
      ? totalDuration / completedSessions.length 
      : 0;

    const failedSessions = sessions.filter((s: any) => s.sessionStatus === "failed");
    const qualityIssuesCount = sessions.reduce((sum: number, s: any) => 
      sum + (s.qualityIssues?.length || 0), 0
    );

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      failedSessions: failedSessions.length,
      totalDuration, // in seconds
      avgDuration, // in seconds
      qualityIssuesCount,
    };
  },
});

/**
 * Get active session for current user
 */
export const getActiveSession = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject as string;

    // Find the most recent session that's not ended
    const activeSessions = await ctx.db
      .query("videoCallSessions")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(5);

    const active = activeSessions.find(
      (s: any) => s.sessionStatus === "connecting" || s.sessionStatus === "connected"
    );

    return active || null;
  },
});
