import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get user profile
 */
export const getProfile = query({
	args: { clerkId: v.string() },
	handler: async (ctx, { clerkId }) => {
		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.first();

		return profile;
	},
});

/**
 * Sync or update user profile
 */
export const syncProfile = mutation({
	args: {
		clerkId: v.string(),
		phoneNumber: v.optional(v.string()),
		location: v.optional(v.string()),
		bio: v.optional(v.string()),
		profileImageUrl: v.optional(v.string()),
		preferences: v.optional(v.object({
			theme: v.optional(v.string()),
			notifications: v.optional(v.boolean()),
		})),
	},
	handler: async (ctx, args) => {
		const { clerkId, ...profileData } = args;

		// Check if profile exists
		const existing = await ctx.db
			.query("profiles")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.first();

		if (existing) {
			// Update existing profile
			await ctx.db.patch(existing._id, {
				...profileData,
				updatedAt: Date.now(),
			});
			return existing._id;
		} else {
			// Create new profile
			return await ctx.db.insert("profiles", {
				clerkId,
				...profileData,
				updatedAt: Date.now(),
			});
		}
	},
});

/**
 * Update profile image
 */
export const updateProfileImage = mutation({
	args: {
		clerkId: v.string(),
		profileImageUrl: v.string(),
	},
	handler: async (ctx, { clerkId, profileImageUrl }) => {
		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.first();

		if (profile) {
			await ctx.db.patch(profile._id, {
				profileImageUrl,
				updatedAt: Date.now(),
			});
			return profile._id;
		} else {
			return await ctx.db.insert("profiles", {
				clerkId,
				profileImageUrl,
				updatedAt: Date.now(),
			});
		}
	},
});

/**
 * Update profile preferences
 */
export const updatePreferences = mutation({
	args: {
		clerkId: v.string(),
		preferences: v.object({
			theme: v.optional(v.string()),
			notifications: v.optional(v.boolean()),
		}),
	},
	handler: async (ctx, { clerkId, preferences }) => {
		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.first();

		if (profile) {
			await ctx.db.patch(profile._id, {
				preferences,
				updatedAt: Date.now(),
			});
			return profile._id;
		} else {
			return await ctx.db.insert("profiles", {
				clerkId,
				preferences,
				updatedAt: Date.now(),
			});
		}
	},
});
