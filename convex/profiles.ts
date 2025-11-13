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
	 * Update profile image from a Convex Storage file id by generating a public URL.
	 */
	export const updateProfileImageFromStorage = mutation({
		args: { clerkId: v.string(), storageId: v.id("_storage") },
		handler: async (ctx, { clerkId, storageId }) => {
			const rawUrl = await ctx.storage.getUrl(storageId);
			const url = rawUrl ?? undefined; // normalize null to undefined for schema
			const profile = await ctx.db
				.query("profiles")
				.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
				.first();

			if (profile) {
						await ctx.db.patch(profile._id, { profileImageUrl: url, updatedAt: Date.now() });
				return profile._id;
			}
					return await ctx.db.insert("profiles", { clerkId, profileImageUrl: url, updatedAt: Date.now() });
		}
	});

/**
 * Save all user settings (notifications, reminders, display preferences)
 */
export const saveSettings = mutation({
	args: {
		clerkId: v.string(),
		preferences: v.object({
			theme: v.optional(v.string()),
			notifications: v.optional(v.boolean()),
			// Display settings
			darkMode: v.optional(v.boolean()),
			textSize: v.optional(v.string()),
			// Notification toggles
			notificationsEnabled: v.optional(v.boolean()),
			notifMoodTracking: v.optional(v.boolean()),
			notifJournaling: v.optional(v.boolean()),
			notifMessages: v.optional(v.boolean()),
			notifPostReactions: v.optional(v.boolean()),
			notifAppointments: v.optional(v.boolean()),
			notifSelfAssessment: v.optional(v.boolean()),
			// Reminder settings
			reminderFrequency: v.optional(v.string()),
			moodReminderEnabled: v.optional(v.boolean()),
			moodReminderTime: v.optional(v.string()),
			moodReminderFrequency: v.optional(v.string()),
			moodReminderCustomSchedule: v.optional(v.any()),
			journalReminderEnabled: v.optional(v.boolean()),
			journalReminderTime: v.optional(v.string()),
			journalReminderFrequency: v.optional(v.string()),
			journalReminderCustomSchedule: v.optional(v.any()),
			appointmentReminderEnabled: v.optional(v.boolean()),
			appointmentReminderAdvanceMinutes: v.optional(v.number()),
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

/**
 * Update profile preferences (legacy - for theme/notifications only)
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

/**
 * Simple user search across users/profiles by name or email substring.
 * NOTE: For small datasets this full scan is acceptable; for production add lowercased fields + indexes.
 */
export const searchUsers = query({
	args: { term: v.string(), limit: v.optional(v.number()) },
	handler: async (ctx, { term, limit }) => {
		const q = term.trim().toLowerCase();
		const max = limit ?? 20;

		// Load users and optionally augment with profile image
		const allUsers = await ctx.db.query("users").collect();
		const matches = allUsers.filter((u: any) => {
			const name = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
			const email = (u.email || '').toLowerCase();
			return name.includes(q) || email.includes(q);
		}).slice(0, max);

		const enriched = await Promise.all(matches.map(async (u: any) => {
			const prof = await ctx.db
				.query("profiles")
				.withIndex("by_clerkId", (q2) => q2.eq("clerkId", u.clerkId))
				.first();
			return {
				clerkId: u.clerkId,
				firstName: u.firstName || '',
				lastName: u.lastName || '',
				email: u.email || '',
				imageUrl: prof?.profileImageUrl || u.imageUrl,
			};
		}));

		return enriched;
	},
});

/**
 * Get a combined view of a user's base info and extended profile.
 */
export const getFullProfile = query({
	args: { clerkId: v.string() },
	handler: async (ctx, { clerkId }) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.first();

		const profile = await ctx.db
			.query("profiles")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.first();

		return {
			clerkId,
			firstName: user?.firstName || undefined,
			lastName: user?.lastName || undefined,
			email: user?.email || undefined,
			imageUrl: user?.imageUrl || undefined,
			phoneNumber: profile?.phoneNumber || undefined,
			location: profile?.location || profile?.city || undefined,
			bio: profile?.bio || undefined,
			profileImageUrl: profile?.profileImageUrl || user?.imageUrl || undefined,
			dateOfBirth: profile?.dateOfBirth,
			gender: profile?.gender,
			pronouns: profile?.pronouns,
			isLGBTQ: profile?.isLGBTQ,
			primaryLanguage: profile?.primaryLanguage,
			mentalHealthConcerns: profile?.mentalHealthConcerns,
			supportNeeded: profile?.supportNeeded,
			ethnoculturalBackground: profile?.ethnoculturalBackground,
			canadaStatus: profile?.canadaStatus,
			dateCameToCanada: profile?.dateCameToCanada,
			address: profile?.address,
			city: profile?.city,
			postalCode: profile?.postalCode,
			country: profile?.country,
			emergencyContactName: profile?.emergencyContactName,
			emergencyContactPhone: profile?.emergencyContactPhone,
			emergencyContactRelationship: profile?.emergencyContactRelationship,
			preferences: profile?.preferences,
			updatedAt: profile?.updatedAt || user?.updatedAt || Date.now(),
		};
	},
});

/**
 * Update extended profile fields for a user (upsert on profiles table).
 */
export const updateExtendedProfile = mutation({
	args: {
		clerkId: v.string(),
		// Core
		phoneNumber: v.optional(v.string()),
		location: v.optional(v.string()),
		profileImageUrl: v.optional(v.string()),
		bio: v.optional(v.string()),
		// Extended
		dateOfBirth: v.optional(v.string()),
		gender: v.optional(v.string()),
		pronouns: v.optional(v.string()),
		isLGBTQ: v.optional(v.string()),
		primaryLanguage: v.optional(v.string()),
		mentalHealthConcerns: v.optional(v.string()),
		supportNeeded: v.optional(v.string()),
		ethnoculturalBackground: v.optional(v.string()),
		canadaStatus: v.optional(v.string()),
		dateCameToCanada: v.optional(v.string()),
		// Address
		address: v.optional(v.string()),
		city: v.optional(v.string()),
		postalCode: v.optional(v.string()),
		country: v.optional(v.string()),
		// Emergency contact
		emergencyContactName: v.optional(v.string()),
		emergencyContactPhone: v.optional(v.string()),
		emergencyContactRelationship: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { clerkId, ...updates } = args;
		const now = Date.now();
		const existing = await ctx.db
			.query("profiles")
			.withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, { ...updates, updatedAt: now });
			return existing._id;
		}
		return await ctx.db.insert("profiles", { clerkId, ...updates, updatedAt: now });
	},
});
