import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Return the authenticated user's identity (via Clerk token provided by the client)
export const whoami = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      subject: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      name: identity.name,
      email: identity.email,
      pictureUrl: identity.pictureUrl,
    };
  },
});

// Upsert the current user's profile in Convex DB using identity + optional overrides
export const syncUser = mutation({
  args: {
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx: any, args: { email?: string; firstName?: string; lastName?: string; imageUrl?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const clerkId = identity.subject as string;
    const now = Date.now();

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q: any) => q.eq("clerkId", clerkId))
      .first();

    const doc = {
      clerkId,
      email: args.email ?? identity.email ?? undefined,
      firstName: args.firstName ?? identity.givenName ?? undefined,
      lastName: args.lastName ?? identity.familyName ?? undefined,
      imageUrl: args.imageUrl ?? identity.pictureUrl ?? undefined,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return { updated: true } as const;
    }
    await ctx.db.insert("users", doc);
    return { created: true } as const;
  },
});
