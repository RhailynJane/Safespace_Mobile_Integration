import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Record a heartbeat for the current authenticated user
export const heartbeat = mutation({
  args: { status: v.optional(v.string()) },
  handler: async (ctx: any, args: { status?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const userId = identity.subject; // Clerk user id
    const now = Date.now();
    const status = args.status ?? "online";

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { status, lastSeen: now });
    } else {
      await ctx.db.insert("presence", { userId, status, lastSeen: now });
    }
    return { ok: true, lastSeen: now } as const;
  },
});

// List users considered "online" within the last N ms (default 6 minutes)
export const onlineUsers = query({
  args: { sinceMs: v.optional(v.number()) },
  handler: async (ctx: any, args: { sinceMs?: number }) => {
    const cutoff = Date.now() - (args.sinceMs ?? 6 * 60 * 1000);
    const rows = await ctx.db
      .query("presence")
      .withIndex("by_lastSeen", (q: any) => q.gte("lastSeen", cutoff))
      .collect();
    return rows;
  },
});
