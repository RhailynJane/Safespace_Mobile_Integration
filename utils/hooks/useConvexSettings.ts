// utils/hooks/useConvexSettings.ts
import { useState, useEffect, useCallback } from 'react';
import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserSettings {
  // Display & Accessibility
  darkMode: boolean;
  textSize: string;

  // Notifications
  notificationsEnabled: boolean;
  notifMoodTracking: boolean;
  notifJournaling: boolean;
  notifMessages: boolean;
  notifPostReactions: boolean;
  notifAppointments: boolean;
  notifSelfAssessment: boolean;
  reminderFrequency: string;

  // Mood Reminders
  moodReminderEnabled: boolean;
  moodReminderTime: string;
  moodReminderFrequency: string;
  moodReminderCustomSchedule: Record<string, string>;

  // Journal Reminders
  journalReminderEnabled: boolean;
  journalReminderTime: string;
  journalReminderFrequency: string;
  journalReminderCustomSchedule: Record<string, string>;

  // Appointment Reminders
  appointmentReminderEnabled: boolean;
  appointmentReminderAdvanceMinutes: number;
}

const DEFAULT_SETTINGS: UserSettings = {
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
  moodReminderEnabled: false,
  moodReminderTime: '09:00',
  moodReminderFrequency: 'Daily',
  moodReminderCustomSchedule: {},
  journalReminderEnabled: false,
  journalReminderTime: '20:00',
  journalReminderFrequency: 'Daily',
  journalReminderCustomSchedule: {},
  appointmentReminderEnabled: true,
  appointmentReminderAdvanceMinutes: 60,
};

export function useConvexSettings(convexClient: ConvexReactClient | null) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingConvex, setIsUsingConvex] = useState(false);

  // Load settings from Convex
  const loadSettings = useCallback(async (userId: string) => {
    if (!convexClient) {
      console.log('⚙️ No Convex client available for settings');
      return;
    }

    try {
      setLoading(true);
      setIsUsingConvex(true);

  // Use consolidated getSettings (clerkId)
  const convexSettings = await convexClient.query(api.settings.getSettings, { clerkId: userId });

      if (convexSettings) {
        // Map Convex settings to UserSettings format
        const mapped: UserSettings = {
          darkMode: convexSettings.darkMode,
          textSize: convexSettings.textSize,
          notificationsEnabled: convexSettings.notificationsEnabled,
          notifMoodTracking: convexSettings.notifMoodTracking,
          notifJournaling: convexSettings.notifJournaling,
          notifMessages: convexSettings.notifMessages,
          notifPostReactions: convexSettings.notifPostReactions,
          notifAppointments: convexSettings.notifAppointments,
          notifSelfAssessment: convexSettings.notifSelfAssessment,
          reminderFrequency: convexSettings.reminderFrequency,
          moodReminderEnabled: convexSettings.moodReminderEnabled,
          moodReminderTime: convexSettings.moodReminderTime,
          moodReminderFrequency: convexSettings.moodReminderFrequency,
          moodReminderCustomSchedule: convexSettings.moodReminderCustomSchedule || {},
          journalReminderEnabled: convexSettings.journalReminderEnabled,
          journalReminderTime: convexSettings.journalReminderTime,
          journalReminderFrequency: convexSettings.journalReminderFrequency,
          journalReminderCustomSchedule: convexSettings.journalReminderCustomSchedule || {},
          appointmentReminderEnabled: convexSettings.appointmentReminderEnabled,
          appointmentReminderAdvanceMinutes: convexSettings.appointmentReminderAdvanceMinutes,
        };

        // Overlay local storage values for reminder times
        const [localMoodTime, localJournalTime, localMoodSchedule, localJournalSchedule] = await Promise.all([
          AsyncStorage.getItem('moodReminderTime'),
          AsyncStorage.getItem('journalReminderTime'),
          AsyncStorage.getItem('moodReminderCustomSchedule'),
          AsyncStorage.getItem('journalReminderCustomSchedule'),
        ]);

        if (localMoodTime) mapped.moodReminderTime = localMoodTime;
        if (localJournalTime) mapped.journalReminderTime = localJournalTime;
        if (localMoodSchedule) {
          try { 
            mapped.moodReminderCustomSchedule = JSON.parse(localMoodSchedule); 
          } catch (_) {
            // Ignore parse error, keep default
          }
        }
        if (localJournalSchedule) {
          try { 
            mapped.journalReminderCustomSchedule = JSON.parse(localJournalSchedule); 
          } catch (_) {
            // Ignore parse error, keep default
          }
        }

        setSettings(mapped);
        console.log('⚙️ Loaded settings from Convex');
      } else {
        // No settings found, use defaults
        setSettings(DEFAULT_SETTINGS);
        console.log('⚙️ No settings found, using defaults');
      }
    } catch (err) {
      console.error('❌ Error loading settings from Convex:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, [convexClient]);

  // Save settings to Convex
  const saveSettings = useCallback(async (userId: string, newSettings: UserSettings) => {
    if (!convexClient) {
      console.warn('⚠️ No Convex client, settings not saved');
      return;
    }

    try {
      setLoading(true);
      setIsUsingConvex(true);

      // Use upsertSettings mutation with settings object
      await convexClient.mutation(api.settings.upsertSettings, {
        clerkId: userId,
        settings: newSettings,
      });

      // Persist local reminder times
      await Promise.all([
        AsyncStorage.setItem('moodReminderTime', newSettings.moodReminderTime),
        AsyncStorage.setItem('journalReminderTime', newSettings.journalReminderTime),
        AsyncStorage.setItem('moodReminderCustomSchedule', JSON.stringify(newSettings.moodReminderCustomSchedule)),
        AsyncStorage.setItem('journalReminderCustomSchedule', JSON.stringify(newSettings.journalReminderCustomSchedule)),
      ]);

      setSettings(newSettings);
      console.log('⚙️ Settings saved to Convex');
    } catch (err) {
      console.error('❌ Error saving settings to Convex:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  }, [convexClient]);

  // Update specific settings fields
  const updateSettings = useCallback(async (userId: string, updates: Partial<UserSettings>) => {
    if (!convexClient) {
      console.warn('⚠️ No Convex client, settings not updated');
      return;
    }

    try {
      setLoading(true);

      // Fallback approach: fetch existing then patch via upsert (partial)
      const existing = await convexClient.query(api.settings.getSettings, { clerkId: userId });
      const merged = { ...(existing || {}), ...updates } as any;
      await convexClient.mutation(api.settings.upsertSettings, {
        clerkId: userId,
        settings: merged,
      });

      setSettings(prev => ({ ...prev, ...updates }));
      console.log('⚙️ Settings updated in Convex');
    } catch (err) {
      console.error('❌ Error updating settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  }, [convexClient]);

  // Reset settings to defaults
  const resetSettings = useCallback(async (userId: string) => {
    if (!convexClient) {
      console.warn('⚠️ No Convex client, settings not reset');
      return;
    }

    try {
      setLoading(true);

      // Reset by overwriting with defaults via upsert
      await convexClient.mutation(api.settings.upsertSettings, {
        clerkId: userId,
        settings: DEFAULT_SETTINGS,
      });
      setSettings(DEFAULT_SETTINGS);
      console.log('⚙️ Settings reset to defaults (upsert)');
    } catch (err) {
      console.error('❌ Error resetting settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
    } finally {
      setLoading(false);
    }
  }, [convexClient]);

  return {
    settings,
    loading,
    error,
    isUsingConvex,
    loadSettings,
    saveSettings,
    updateSettings,
    resetSettings,
  };
}
