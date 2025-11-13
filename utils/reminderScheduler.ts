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
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      vibrationPattern: [0, 250, 250, 250],
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

function normalizeSchedule(obj: any): Record<string, string> {
  if (!obj || typeof obj !== 'object') return {};
  const entries = Object.entries(obj).map(([k, v]) => [String(k), String(v ?? '')]) as Array<[string, string]>;
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const out: Record<string, string> = {};
  for (const [k, v] of entries) out[k] = v;
  return out;
}

// Convert JS Date.getDay() (0=Sun..6=Sat) to Expo calendar weekday (1=Sun..7=Sat)
function getTodayExpoWeekday(now: Date): number {
  const jsDay = now.getDay(); // 0..6
  return jsDay === 0 ? 1 : jsDay + 1;
}

// Compute seconds delta from now to today's HH:mm(:ss) occurrence (positive = in future, negative = in past)
function secondsUntilTodayTime(hour: number, minute: number, second: number = 0): number {
  const now = new Date();
  const target = new Date(now.getTime());
  target.setHours(hour, minute, second, 0);
  return Math.floor((target.getTime() - now.getTime()) / 1000);
}

// Return true only when the target time today is in the PAST but within windowSeconds.
// This prevents an "immediate" catch-up fire right after saving changes.
function isPastWithinWindow(targetHour: number, targetMinute: number, windowSeconds = 300): boolean {
  const delta = secondsUntilTodayTime(targetHour, targetMinute, 0); // positive = future today, negative = already passed
  return delta < 0 && Math.abs(delta) <= windowSeconds;
}

async function cancelByKey(storageKey: string) {
  try {
    const saved = await AsyncStorage.getItem(storageKey);
    const ids: string[] = saved ? JSON.parse(saved) : [];
    await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  } catch (e) { /* ignore */ }
  await AsyncStorage.setItem(storageKey, JSON.stringify([]));
}

async function cancelByTitle(title: string) {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of all) {
      if ((n as any)?.content?.title === title) {
        try { await Notifications.cancelScheduledNotificationAsync((n as any).identifier); } catch (_e) { /* ignore */ }
      }
    }
  } catch (_e) {
    // ignore
  }
}

async function cleanupPastOneShots() {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const now = Date.now();
    for (const n of all) {
      const trigger = (n as any)?.trigger;
      // Check if it's a one-shot (Date trigger) that has already passed
      if (trigger instanceof Date) {
        if (trigger.getTime() < now) {
          console.log(`🧹 Cleaning up past one-shot notification: ${(n as any)?.content?.title}`);
          try { await Notifications.cancelScheduledNotificationAsync((n as any).identifier); } catch (_e) { /* ignore */ }
        }
      }
    }
  } catch (_e) {
    // ignore
  }
}

async function scheduleDaily(title: string, body: string, hour: number, minute: number, data?: Record<string, any>) {
  // Use calendar trigger anchored to the device timezone. Some Android versions ignore `second` for repeats.
  const tz = (Intl && Intl.DateTimeFormat().resolvedOptions().timeZone) || undefined;
  const trigger = ({ hour, minute, repeats: true, timezone: tz } as unknown) as Notifications.NotificationTriggerInput;
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, data: data || {} },
    trigger,
  });
  console.log(`🔔 Scheduled daily notification '${title}' at ${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')} (id=${id})`);
  return id;
}

async function scheduleWeekly(title: string, body: string, hour: number, minute: number, weekdays: number[], data?: Record<string, any>) {
  const ids: string[] = [];
  const tz = (Intl && Intl.DateTimeFormat().resolvedOptions().timeZone) || undefined;
  for (const weekday of weekdays) {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, data: data || {} },
      trigger: ({ hour, minute, weekday, repeats: true, timezone: tz } as unknown) as Notifications.NotificationTriggerInput,
    });
    ids.push(id);
  }
  console.log(`🔔 Scheduled weekly notification '${title}' on weekdays [${weekdays.join(',')}] at ${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')} (ids=${ids.join(',')})`);
  return ids;
}

async function scheduleOneShot(title: string, body: string, fireAt: Date, data?: Record<string, any>) {
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, data: data || {} },
    trigger: fireAt as any,
  });
  console.log(`🔔 Scheduled one-shot '${title}' at ${fireAt.toLocaleString()} local (id=${id})`);
  return id;
}

export async function scheduleFromSettings(settings: UserSettings) {
  const perms = await ensurePermissions();
  if (!perms) return;

  // Clean up any past one-shot notifications that might be lingering
  await cleanupPastOneShots();

  // Build a compact signature of relevant reminder settings to avoid unnecessary cancel/reschedule bursts
  const signature = JSON.stringify({
    notificationsEnabled: settings.notificationsEnabled,
    mood: {
      enabled: settings.moodReminderEnabled,
      time: (settings.moodReminderTime || '').trim(),
      freq: settings.moodReminderFrequency,
      custom: normalizeSchedule(settings.moodReminderCustomSchedule),
    },
    journal: {
      enabled: settings.journalReminderEnabled,
      time: (settings.journalReminderTime || '').trim(),
      freq: settings.journalReminderFrequency,
      custom: normalizeSchedule(settings.journalReminderCustomSchedule),
    },
  });

  const sigKey = 'reminderSettingsSignature';
  const [prevSig, prevMoodIds, prevJournalIds] = await Promise.all([
    AsyncStorage.getItem(sigKey),
    AsyncStorage.getItem('moodReminderIds'),
    AsyncStorage.getItem('journalReminderIds'),
  ]);
  const hasExistingSchedules = (() => {
    try {
      const a = prevMoodIds ? JSON.parse(prevMoodIds) : [];
      const b = prevJournalIds ? JSON.parse(prevJournalIds) : [];
      return (Array.isArray(a) && a.length > 0) || (Array.isArray(b) && b.length > 0);
    } catch { return false; }
  })();

  if (prevSig === signature && hasExistingSchedules) {
    // No changes; avoid rescheduling to prevent spurious immediate fires on reload/save
    console.log('⏭️ Skipping reminder reschedule: settings unchanged');
    // Opportunistic de-duplication: keep at most one (daily) or up to 7 (weekly) per type
    try {
      const all = await Notifications.getAllScheduledNotificationsAsync();
      const keepByTitleCount: Record<string, number> = {};
      for (const n of all) {
        const t = n.content?.title || '';
        keepByTitleCount[t] = (keepByTitleCount[t] || 0) + 1;
      }
      const limits: Record<string, number> = {
        'Mood check-in': 7,
        'Journaling reminder': 7,
      };
      // Cancel extras beyond limit per title
      for (const n of all) {
        const title = n.content?.title || '';
        const limit = limits[title];
        if (!limit) continue;
        const current = keepByTitleCount[title] ?? 0;
        if (current > limit) {
          try {
            await Notifications.cancelScheduledNotificationAsync((n as any).identifier);
          } catch (_e) {
            // ignore
          }
          keepByTitleCount[title] = current - 1;
        }
      }
    } catch (_e) {
      // ignore
    }
    return;
  }

  // MOOD
  // Hard cancel by title to remove any orphans left from older versions
  await cancelByTitle('Mood check-in');
  await cancelByKey('moodReminderIds');
  let moodIds: string[] = [];
  if (settings.notificationsEnabled && settings.moodReminderEnabled && settings.notifMoodTracking) {
    const { hour, minute } = parseTime(settings.moodReminderTime);
    console.log(`🗓️ Scheduling MOOD reminders: freq=${settings.moodReminderFrequency}, time=${settings.moodReminderTime}, customDays=${Object.keys(settings.moodReminderCustomSchedule || {}).join(',')}`);
  if (settings.moodReminderFrequency === 'Custom' && settings.moodReminderCustomSchedule) {
      const perDayIds: string[] = [];
      for (const key of Object.keys(settings.moodReminderCustomSchedule)) {
        const t = (settings.moodReminderCustomSchedule as any)[key];
        if (!t) continue;
        const { hour: h, minute: m } = parseTime(String(t));
        const wk = WEEKDAY_MAP[key as WeekKey];
        if (!wk) continue;
        const todayWk = getTodayExpoWeekday(new Date());
        if (wk === todayWk) {
          const delta = secondsUntilTodayTime(h, m, 0);
          console.log(`🕐 MOOD Custom ${key}: delta=${delta}s`);
          // Bridge for today if needed (in addition to weekly repeating below)
          if (delta < 0) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(h, m, 0, 0);
            const idOnce = await scheduleOneShot('Mood check-in', 'How are you feeling today?', nextWeek, { type: 'mood', bootstrap: true });
            perDayIds.push(idOnce);
          } else if (delta >= 0 && delta <= 300) {
            const today = new Date();
            today.setHours(h, m, 0, 0);
            const msUntil = today.getTime() - Date.now();
            if (msUntil >= 0 && msUntil < 3000) today.setSeconds(today.getSeconds() + 2);
            const idOnce = await scheduleOneShot('Mood check-in', 'How are you feeling today?', today, { type: 'mood', bootstrap: true });
            perDayIds.push(idOnce);
          }
        }
        console.log(`📅 Scheduling weekly MOOD for ${key} at ${h}:${m} (weekday=${wk})`);
        const id = await Notifications.scheduleNotificationAsync({
          content: { title: 'Mood check-in', body: 'How are you feeling today?', sound: true, data: { type: 'mood' } },
          trigger: ({ hour: h, minute: m, weekday: wk, repeats: true, timezone: (Intl && Intl.DateTimeFormat().resolvedOptions().timeZone) || undefined } as unknown) as Notifications.NotificationTriggerInput,
        });
        perDayIds.push(id);
        console.log(`🔔 Scheduled weekly MOOD id=${id} for ${key}`);
      }
      console.log(`🔔 Scheduled custom MOOD ids=${perDayIds.join(',')}`);
      moodIds = perDayIds;
    } else if (settings.moodReminderFrequency === 'Daily') {
      const delta = secondsUntilTodayTime(hour, minute, 0);
      console.log(`🕐 MOOD Daily check: target=${settings.moodReminderTime}, delta=${delta}s (${Math.floor(delta/60)}m ${delta%60}s)`);
      // Always schedule the repeating daily as the backbone
      console.log(`📅 MOOD scheduling repeating daily backbone`);
      const repId = await scheduleDaily('Mood check-in', 'How are you feeling today?', hour, minute, { type: 'mood' });
      const ids: string[] = [repId];
      if (delta < 0) {
        // Time has passed for today - add a one-shot for tomorrow to bridge
        console.log(`⏭️ MOOD time passed today; adding one-shot for tomorrow`);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(hour, minute, 0, 0);
        const onceId = await scheduleOneShot('Mood check-in', 'How are you feeling today?', tomorrow, { type: 'mood', bootstrap: true });
        ids.push(onceId);
      } else if (delta >= 0 && delta <= 300) {
        // Within 5 min window: add a one-shot for today
        console.log(`⚡ MOOD within 5min; adding one-shot for today`);
        const d = new Date();
        d.setHours(hour, minute, 0, 0);
        const msUntil = d.getTime() - Date.now();
        if (msUntil >= 0 && msUntil < 3000) d.setSeconds(d.getSeconds() + 2);
        const onceId = await scheduleOneShot('Mood check-in', 'How are you feeling today?', d, { type: 'mood', bootstrap: true });
        ids.push(onceId);
      }
      moodIds = ids;
    }
  }
  await AsyncStorage.setItem('moodReminderIds', JSON.stringify(moodIds));

  // JOURNAL
  // Hard cancel by title to remove any orphans left from older versions
  await cancelByTitle('Journaling reminder');
  await cancelByKey('journalReminderIds');
  // Safety: if journaling toggle is off, also cancel any stray scheduled reminders by title
  if (!(settings.notificationsEnabled && settings.journalReminderEnabled && settings.notifJournaling)) {
    await cancelByTitle('Journaling reminder');
  }
  let journalIds: string[] = [];
  if (settings.notificationsEnabled && settings.journalReminderEnabled && settings.notifJournaling) {
    const { hour, minute } = parseTime(settings.journalReminderTime);
    console.log(`🗓️ Scheduling JOURNAL reminders: freq=${settings.journalReminderFrequency}, time=${settings.journalReminderTime}, customDays=${Object.keys(settings.journalReminderCustomSchedule || {}).join(',')}`);
    if (settings.journalReminderFrequency === 'Custom' && settings.journalReminderCustomSchedule) {
      const perDayIds: string[] = [];
      for (const key of Object.keys(settings.journalReminderCustomSchedule)) {
        const t = (settings.journalReminderCustomSchedule as any)[key];
        if (!t) continue;
        const { hour: h, minute: m } = parseTime(String(t));
        const wk = WEEKDAY_MAP[key as WeekKey];
        if (!wk) continue;
        const todayWk = getTodayExpoWeekday(new Date());
        if (wk === todayWk) {
          const delta = secondsUntilTodayTime(h, m, 0);
          console.log(`🕐 JOURNAL Custom ${key}: delta=${delta}s`);
          // Bridge for today if needed (in addition to weekly repeating below)
          if (delta < 0) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            nextWeek.setHours(h, m, 0, 0);
            const idOnce = await scheduleOneShot('Journaling reminder', 'Take a moment to jot your thoughts.', nextWeek, { type: 'journaling', bootstrap: true });
            perDayIds.push(idOnce);
          } else if (delta >= 0 && delta <= 300) {
            const today = new Date();
            today.setHours(h, m, 0, 0);
            const msUntil = today.getTime() - Date.now();
            if (msUntil >= 0 && msUntil < 3000) today.setSeconds(today.getSeconds() + 2);
            const idOnce = await scheduleOneShot('Journaling reminder', 'Take a moment to jot your thoughts.', today, { type: 'journaling', bootstrap: true });
            perDayIds.push(idOnce);
          }
        }
        console.log(`📅 Scheduling weekly JOURNAL for ${key} at ${h}:${m} (weekday=${wk})`);
        const id = await Notifications.scheduleNotificationAsync({
          content: { title: 'Journaling reminder', body: 'Take a moment to jot your thoughts.', sound: true, data: { type: 'journaling' } },
          trigger: ({ hour: h, minute: m, weekday: wk, repeats: true, timezone: (Intl && Intl.DateTimeFormat().resolvedOptions().timeZone) || undefined } as unknown) as Notifications.NotificationTriggerInput,
        });
        perDayIds.push(id);
        console.log(`🔔 Scheduled weekly JOURNAL id=${id} for ${key}`);
      }
      console.log(`🔔 Scheduled custom JOURNAL ids=${perDayIds.join(',')}`);
      journalIds = perDayIds;
    } else if (settings.journalReminderFrequency === 'Daily') {
      const delta = secondsUntilTodayTime(hour, minute, 0);
      console.log(`🕐 JOURNAL Daily check: target=${settings.journalReminderTime}, delta=${delta}s (${Math.floor(delta/60)}m ${delta%60}s)`);
      // Always schedule the repeating daily as the backbone
      console.log(`📅 JOURNAL scheduling repeating daily backbone`);
      const repId = await scheduleDaily('Journaling reminder', 'Take a moment to jot your thoughts.', hour, minute, { type: 'journaling' });
      const ids: string[] = [repId];
      if (delta < 0) {
        console.log(`⏭️ JOURNAL time passed today; adding one-shot for tomorrow`);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(hour, minute, 0, 0);
        const onceId = await scheduleOneShot('Journaling reminder', 'Take a moment to jot your thoughts.', tomorrow, { type: 'journaling', bootstrap: true });
        ids.push(onceId);
      } else if (delta >= 0 && delta <= 300) {
        console.log(`⚡ JOURNAL within 5min; adding one-shot for today`);
        const d = new Date();
        d.setHours(hour, minute, 0, 0);
        const msUntil = d.getTime() - Date.now();
        if (msUntil >= 0 && msUntil < 3000) d.setSeconds(d.getSeconds() + 2);
        const onceId = await scheduleOneShot('Journaling reminder', 'Take a moment to jot your thoughts.', d, { type: 'journaling', bootstrap: true });
        ids.push(onceId);
      }
      journalIds = ids;
    }
  }
  await AsyncStorage.setItem('journalReminderIds', JSON.stringify(journalIds));

  // Persist the signature after successful (re)schedule
  await AsyncStorage.setItem(sigKey, signature);
}

export async function cancelAllReminders() {
  await cancelByKey('moodReminderIds');
  await cancelByKey('journalReminderIds');
}
