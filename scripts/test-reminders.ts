/**
 * Test reminder scheduling
 * Run with: npx tsx scripts/test-reminders.ts
 */

import { scheduleFromSettings } from '../utils/reminderScheduler';
import { UserSettings } from '../utils/settingsApi';

async function testReminders() {
  console.log('🧪 Testing reminder scheduling...\n');

  const testSettings: UserSettings = {
    darkMode: false,
    textSize: 'Medium',
    notificationsEnabled: true,
    notifMoodTracking: true,
    notifJournaling: true,
    notifMessages: true,
    notifPostReactions: true,
    notifAppointments: true,
    notifSelfAssessment: true,
    reminderFrequency: 'Daily',
    moodReminderEnabled: true,
    moodReminderTime: new Date(Date.now() + 2 * 60 * 1000).toTimeString().slice(0, 5), // 2 minutes from now
    moodReminderFrequency: 'Daily',
    moodReminderCustomSchedule: {},
    journalReminderEnabled: true,
    journalReminderTime: new Date(Date.now() + 3 * 60 * 1000).toTimeString().slice(0, 5), // 3 minutes from now
    journalReminderFrequency: 'Daily',
    journalReminderCustomSchedule: {},
    appointmentReminderEnabled: true,
    appointmentReminderAdvanceMinutes: 60,
  };

  console.log('📋 Test settings:');
  console.log('  Notifications enabled:', testSettings.notificationsEnabled);
  console.log('  Mood tracking enabled:', testSettings.notifMoodTracking);
  console.log('  Mood reminder enabled:', testSettings.moodReminderEnabled);
  console.log('  Mood reminder time:', testSettings.moodReminderTime);
  console.log('  Journal reminder enabled:', testSettings.journalReminderEnabled);
  console.log('  Journal reminder time:', testSettings.journalReminderTime);
  console.log('');

  try {
    await scheduleFromSettings(testSettings);
    console.log('\n✅ Reminders scheduled successfully!');
    console.log('\n💡 Check your device in the next few minutes for notifications.');
  } catch (error) {
    console.error('\n❌ Error scheduling reminders:', error);
  }
}

testReminders();
