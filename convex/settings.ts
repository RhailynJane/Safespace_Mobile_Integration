import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Store and retrieve app settings per user (by Clerk ID)

export const getSettings = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const row = await ctx.db
      .query("settings")
      .withIndex("by_user", (q: any) => q.eq("userId", clerkId))
      .first();
    return row ?? null;
  },
});

export const upsertSettings = mutation({
  args: {
    clerkId: v.string(),
    settings: v.object({
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
    }),
  },
  handler: async (ctx, { clerkId, settings }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q: any) => q.eq("userId", clerkId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...settings, updatedAt: now });
      return { ok: true as const, id: existing._id };
    }
    const id = await ctx.db.insert("settings", {
      userId: clerkId,
      ...settings,
      createdAt: now,
      updatedAt: now,
    });
    return { ok: true as const, id };
  },
});
