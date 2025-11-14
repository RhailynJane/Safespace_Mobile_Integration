// convex/activities.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Record user login activity
 * Updates presence status to online
 */
export const recordLogin = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const now = Date.now();

    // Check for recent login activity (within last 5 minutes) to avoid write conflicts
    const recentLogin = await ctx.db
      .query("activities")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.eq(q.field("activityType"), "login") && 
        q.gt(q.field("createdAt"), now - 5 * 60 * 1000)
      )
      .first();
    
    if (!recentLogin) {
      // Record activity log only if no recent login
      await ctx.db.insert("activities", {
        userId,
        activityType: "login",
        metadata: { timestamp: now },
        createdAt: now,
      });
    }

    // Update presence status
    const existingPresence = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existingPresence) {
      // Only update if lastSeen is older than 10 seconds to reduce write conflicts
      if (now - existingPresence.lastSeen > 10000) {
        await ctx.db.patch(existingPresence._id, {
          status: "online",
          lastSeen: now,
        });
      }
    } else {
      await ctx.db.insert("presence", {
        userId,
        status: "online",
        lastSeen: now,
      });
    }

    return { success: true, timestamp: now };
  },
});

/**
 * Record user logout activity
 * Updates presence status to offline
 */
export const recordLogout = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const now = Date.now();

    // Record activity log
    await ctx.db.insert("activities", {
      userId,
      activityType: "logout",
      metadata: { timestamp: now },
      createdAt: now,
    });

    // Update presence status
    const existingPresence = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existingPresence) {
      await ctx.db.patch(existingPresence._id, {
        status: "offline",
        lastSeen: now,
      });
    }

    return { success: true, timestamp: now };
  },
});

/**
 * Update user heartbeat (presence ping)
 * Keeps user marked as online
 */
export const heartbeat = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const now = Date.now();

    // Update presence
    const existingPresence = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existingPresence) {
      await ctx.db.patch(existingPresence._id, {
        status: "online",
        lastSeen: now,
      });
    } else {
      await ctx.db.insert("presence", {
        userId,
        status: "online",
        lastSeen: now,
      });
    }

    return { success: true, timestamp: now };
  },
});

/**
 * Get user presence status
 */
export const getPresenceStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!presence) {
      return {
        online: false,
        presence: "offline" as const,
        lastSeen: null,
      };
    }

    // Consider user online if last seen within 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const isOnline = presence.lastSeen > fiveMinutesAgo && presence.status === "online";

    return {
      online: isOnline,
      presence: isOnline ? ("online" as const) : ("offline" as const),
      lastSeen: presence.lastSeen,
    };
  },
});

/**
 * Get presence status for multiple users
 */
export const getPresenceStatusBatch = query({
  args: { userIds: v.array(v.string()) },
  handler: async (ctx, { userIds }) => {
    const result: Record<string, any> = {};
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    for (const userId of userIds) {
      const presence = await ctx.db
        .query("presence")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      if (!presence) {
        result[userId] = {
          online: false,
          presence: "offline",
          lastSeen: null,
        };
      } else {
        const isOnline = presence.lastSeen > fiveMinutesAgo && presence.status === "online";
        result[userId] = {
          online: isOnline,
          presence: isOnline ? "online" : "offline",
          lastSeen: presence.lastSeen,
        };
      }
    }

    return result;
  },
});

/**
 * Get user's recent activities
 */
export const getUserActivities = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 50 }) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    return activities;
  },
});
