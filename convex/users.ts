import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncCurrentUserOrg = mutation({
  args: { orgId: v.string() },
  handler: async (ctx, { orgId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Upsert user's orgId based on Clerk subject
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        orgId,
        updatedAt: now,
      });
      return { updated: true };
    }

    await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: identity.email ?? undefined,
      firstName: identity.givenName ?? undefined,
      lastName: identity.familyName ?? undefined,
      imageUrl: identity.pictureUrl ?? undefined,
      orgId,
      createdAt: now,
      updatedAt: now,
    });

    return { created: true };
  },
});

// Admin utility: set a user's org by email
export const setOrgByEmail = mutation({
  args: { email: v.string(), orgId: v.string() },
  handler: async (ctx, { email, orgId }) => {
    // Note: protect as needed (e.g., restrict to admin users)
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
    if (!user) throw new Error("User not found for email: " + email);
    await ctx.db.patch(user._id, { orgId, updatedAt: Date.now() });
    return { ok: true } as const;
  },
});

// Get current user's organization from Convex users table
export const getMyOrg = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const rec = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .first();
    return rec?.orgId ?? null;
  },
});

// Get assigned support worker for current user (client)
export const getMyAssignedWorker = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get the client user record
    const clientUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
      .first();

    if (!clientUser) return null;

    // Check if user has assignedUserId (they are a client with assigned worker)
    const assignedUserId = (clientUser as any).assignedUserId;
    if (!assignedUserId) return null;

    try {
      // Fetch the assigned support worker
      const worker = await ctx.db.get(assignedUserId);
      if (!worker) return null;

      return {
        id: worker._id,
        firstName: (worker as any).firstName || "",
        lastName: (worker as any).lastName || "",
        email: (worker as any).email || "",
        name: `${(worker as any).firstName || ""} ${(worker as any).lastName || ""}`.trim(),
      };
    } catch (error) {
      // If ID format is invalid, try looking up by clerkId in users table
      if (typeof assignedUserId === "string") {
        const workerByClerkId = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q: any) => q.eq("clerkId", assignedUserId))
          .first();
        
        if (workerByClerkId) {
          return {
            id: workerByClerkId._id,
            firstName: (workerByClerkId as any).firstName || "",
            lastName: (workerByClerkId as any).lastName || "",
            email: (workerByClerkId as any).email || "",
            name: `${(workerByClerkId as any).firstName || ""} ${(workerByClerkId as any).lastName || ""}`.trim(),
          };
        }
      }
      return null;
    }
  },
});
