import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { UserSettings } from './settingsApi';

type WeekKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

const WEEKDAY_MAP: Record<WeekKey, number> = {
  sun: 1, // Expo Notifications calendar weekday: 1 = Sunday
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7,
};

async function ensurePermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    if (req.status !== 'granted') {
      console.log('🔕 Notification permission not granted');
      return false;
    }
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  return true;
}

function parseTime(value: string): { hour: number; minute: number } {
  const [hStr, mStr] = (value || '09:00').split(':');
  const hour = Math.max(0, Math.min(23, parseInt(hStr || '9', 10) || 0));
  const minute = Math.max(0, Math.min(59, parseInt(mStr || '0', 10) || 0));
  return { hour, minute };
}

async function cancelByKey(storageKey: string) {
  try {
    const saved = await AsyncStorage.getItem(storageKey);
    const ids: string[] = saved ? JSON.parse(saved) : [];
    await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  } catch (e) { /* ignore */ }
  await AsyncStorage.setItem(storageKey, JSON.stringify([]));
}

async function scheduleDaily(title: string, body: string, hour: number, minute: number) {
  // Add a seconds offset to avoid matching "right now" at second 0 which may fire immediately on some platforms
  const trigger = ({ hour, minute, second: 30, repeats: true } as unknown) as Notifications.NotificationTriggerInput;
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger,
  });
}

async function scheduleWeekly(title: string, body: string, hour: number, minute: number, weekdays: number[]) {
  const ids: string[] = [];
  for (const weekday of weekdays) {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: ({ hour, minute, weekday, second: 30, repeats: true } as unknown) as Notifications.NotificationTriggerInput,
    });
    ids.push(id);
  }
  return ids;
}

export async function scheduleFromSettings(settings: UserSettings) {
  const perms = await ensurePermissions();
  if (!perms) return;

  // MOOD
  await cancelByKey('moodReminderIds');
  let moodIds: string[] = [];
  if (settings.notificationsEnabled && settings.moodReminderEnabled && settings.notifMoodTracking) {
    const { hour, minute } = parseTime(settings.moodReminderTime);
    if (settings.moodReminderFrequency === 'Custom' && settings.moodReminderCustomSchedule) {
      const weekdays: number[] = Object.keys(settings.moodReminderCustomSchedule)
        .filter((k) => !!(settings.moodReminderCustomSchedule as any)[k])
        .map(k => WEEKDAY_MAP[k as WeekKey])
        .filter(Boolean);
      if (weekdays.length > 0) {
        // For custom, allow per-day specific times; if provided, schedule per day with its own time
        const perDayIds: string[] = [];
        for (const key of Object.keys(settings.moodReminderCustomSchedule)) {
          const t = (settings.moodReminderCustomSchedule as any)[key];
          if (!t) continue;
          const { hour: h, minute: m } = parseTime(String(t));
          const wk = WEEKDAY_MAP[key as WeekKey];
          if (!wk) continue;
          const id = await Notifications.scheduleNotificationAsync({
            content: { title: 'Mood check-in', body: 'How are you feeling today?', sound: true },
            trigger: ({ hour: h, minute: m, weekday: wk, second: 30, repeats: true } as unknown) as Notifications.NotificationTriggerInput,
          });
          perDayIds.push(id);
        }
        moodIds = perDayIds;
      } else {
        moodIds = await scheduleWeekly('Mood check-in', 'How are you feeling today?', hour, minute, [2,3,4,5,6,7,1]);
      }
    } else if (settings.moodReminderFrequency === 'Daily') {
      const id = await scheduleDaily('Mood check-in', 'How are you feeling today?', hour, minute);
      moodIds = [id];
    }
  }
  await AsyncStorage.setItem('moodReminderIds', JSON.stringify(moodIds));

  // JOURNAL
  await cancelByKey('journalReminderIds');
  let journalIds: string[] = [];
  if (settings.notificationsEnabled && settings.journalReminderEnabled && settings.notifJournaling) {
    const { hour, minute } = parseTime(settings.journalReminderTime);
    if (settings.journalReminderFrequency === 'Custom' && settings.journalReminderCustomSchedule) {
      const perDayIds: string[] = [];
      for (const key of Object.keys(settings.journalReminderCustomSchedule)) {
        const t = (settings.journalReminderCustomSchedule as any)[key];
        if (!t) continue;
        const { hour: h, minute: m } = parseTime(String(t));
        const wk = WEEKDAY_MAP[key as WeekKey];
        if (!wk) continue;
        const id = await Notifications.scheduleNotificationAsync({
          content: { title: 'Journaling reminder', body: 'Take a moment to jot your thoughts.', sound: true },
          trigger: ({ hour: h, minute: m, weekday: wk, second: 30, repeats: true } as unknown) as Notifications.NotificationTriggerInput,
        });
        perDayIds.push(id);
      }
      journalIds = perDayIds;
    } else if (settings.journalReminderFrequency === 'Daily') {
      const id = await scheduleDaily('Journaling reminder', 'Take a moment to jot your thoughts.', hour, minute);
      journalIds = [id];
    }
  }
  await AsyncStorage.setItem('journalReminderIds', JSON.stringify(journalIds));
}

export async function cancelAllReminders() {
  await cancelByKey('moodReminderIds');
  await cancelByKey('journalReminderIds');
}
