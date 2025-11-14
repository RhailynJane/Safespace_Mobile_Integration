import { mutation } from "./_generated/server";
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
