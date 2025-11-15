/**
 * One-time migration: Sync settings from profiles.preferences to settings table
 * Run with: npx convex run migrations/syncSettingsToTable:syncAllSettings
 */

import { internalMutation } from "../_generated/server";

export const syncAllSettings = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("🔄 Starting settings sync from profiles.preferences to settings table...");
    
    // Get all profiles that have preferences
    const profiles = await ctx.db.query("profiles").collect();
    
    let synced = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const profile of profiles) {
      try {
        if (!profile.preferences) {
          skipped++;
          continue;
        }
        
        const prefs = profile.preferences;
        
        // Check if settings already exist for this user
        const existing = await ctx.db
          .query("settings")
          .withIndex("by_user", (q) => q.eq("userId", profile.clerkId))
          .first();
        
        const now = Date.now();
        const settingsData = {
          userId: profile.clerkId,
          darkMode: prefs.darkMode ?? false,
          textSize: prefs.textSize ?? "Medium",
          notificationsEnabled: prefs.notificationsEnabled ?? true,
          notifMoodTracking: prefs.notifMoodTracking ?? true,
          notifJournaling: prefs.notifJournaling ?? true,
          notifMessages: prefs.notifMessages ?? true,
          notifPostReactions: prefs.notifPostReactions ?? true,
          notifAppointments: prefs.notifAppointments ?? true,
          notifSelfAssessment: prefs.notifSelfAssessment ?? true,
          reminderFrequency: prefs.reminderFrequency ?? "Daily",
          moodReminderEnabled: prefs.moodReminderEnabled ?? false,
          moodReminderTime: prefs.moodReminderTime ?? "09:00",
          moodReminderFrequency: prefs.moodReminderFrequency ?? "Daily",
          moodReminderCustomSchedule: prefs.moodReminderCustomSchedule ?? {},
          journalReminderEnabled: prefs.journalReminderEnabled ?? false,
          journalReminderTime: prefs.journalReminderTime ?? "20:00",
          journalReminderFrequency: prefs.journalReminderFrequency ?? "Daily",
          journalReminderCustomSchedule: prefs.journalReminderCustomSchedule ?? {},
          appointmentReminderEnabled: prefs.appointmentReminderEnabled ?? true,
          appointmentReminderAdvanceMinutes: prefs.appointmentReminderAdvanceMinutes ?? 60,
          updatedAt: now,
        };
        
        if (existing) {
          // Update existing settings
          await ctx.db.patch(existing._id, settingsData);
          console.log(`✅ Updated settings for user: ${profile.clerkId}`);
        } else {
          // Create new settings entry
          await ctx.db.insert("settings", {
            ...settingsData,
            createdAt: now,
          });
          console.log(`✅ Created settings for user: ${profile.clerkId}`);
        }
        
        synced++;
      } catch (error) {
        console.error(`❌ Error syncing settings for user ${profile.clerkId}:`, error);
        errors++;
      }
    }
    
    console.log(`\n📊 Sync complete:`);
    console.log(`   ✅ Synced: ${synced}`);
    console.log(`   ⏭️  Skipped (no preferences): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    
    return {
      success: true,
      synced,
      skipped,
      errors,
      total: profiles.length,
    };
  },
});
