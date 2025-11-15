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
