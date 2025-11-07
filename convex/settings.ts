// convex/settings.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get user settings
 * Returns settings for a user, or creates default settings if none exist
 */
export const getUserSettings = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Find existing settings
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      return existing;
    }

    // Return default settings if none exist (don't create in query)
    return null;
  },
});

/**
 * Create or update user settings
 * Upserts settings for a user with optimistic updates
 */
export const saveSettings = mutation({
  args: {
    userId: v.string(),
    darkMode: v.boolean(),
    textSize: v.string(),
    notificationsEnabled: v.boolean(),
    notifMoodTracking: v.boolean(),
    notifJournaling: v.boolean(),
    notifMessages: v.boolean(),
    notifPostReactions: v.boolean(),
    notifAppointments: v.boolean(),
    notifSelfAssessment: v.boolean(),
    reminderFrequency: v.string(),
    moodReminderEnabled: v.boolean(),
    moodReminderTime: v.string(),
    moodReminderFrequency: v.string(),
    moodReminderCustomSchedule: v.any(),
    journalReminderEnabled: v.boolean(),
    journalReminderTime: v.string(),
    journalReminderFrequency: v.string(),
    journalReminderCustomSchedule: v.any(),
    appointmentReminderEnabled: v.boolean(),
    appointmentReminderAdvanceMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, ...settings } = args;
    const now = Date.now();

    // Find existing settings
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update existing settings
      await ctx.db.patch(existing._id, {
        ...settings,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new settings
      const id = await ctx.db.insert("settings", {
        userId,
        ...settings,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

/**
 * Update specific settings fields
 * Partial update for granular control
 */
export const updateSettings = mutation({
  args: {
    userId: v.string(),
    updates: v.any(), // Flexible updates object
  },
  handler: async (ctx, { userId, updates }) => {
    // Find existing settings
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!existing) {
      throw new Error("Settings not found. Call saveSettings first.");
    }

    // Update only provided fields
    await ctx.db.patch(existing._id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return existing._id;
  },
});

/**
 * Reset settings to defaults
 */
export const resetSettings = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const now = Date.now();

    // Default settings
    const defaults = {
      darkMode: false,
      textSize: "Medium",
      notificationsEnabled: true,
      notifMoodTracking: true,
      notifJournaling: true,
      notifMessages: true,
      notifPostReactions: true,
      notifAppointments: true,
      notifSelfAssessment: true,
      reminderFrequency: "Daily",
      moodReminderEnabled: false,
      moodReminderTime: "09:00",
      moodReminderFrequency: "Daily",
      moodReminderCustomSchedule: {},
      journalReminderEnabled: false,
      journalReminderTime: "20:00",
      journalReminderFrequency: "Daily",
      journalReminderCustomSchedule: {},
      appointmentReminderEnabled: true,
      appointmentReminderAdvanceMinutes: 60,
    };

    // Find existing settings
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      // Update to defaults
      await ctx.db.patch(existing._id, {
        ...defaults,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create with defaults
      const id = await ctx.db.insert("settings", {
        userId,
        ...defaults,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});
