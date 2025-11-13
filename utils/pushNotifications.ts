import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getApiBaseUrl } from './apiBaseUrl';
import settingsAPI from './settingsApi';
import { scheduleFromSettings } from './reminderScheduler';
import notificationEvents from './notificationEvents';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Lazy load notifications module to avoid importing in Expo Go
let Notifications: any = null;

async function getNotificationsModule() {
  if (isExpoGo) {
    return null;
  }
  if (!Notifications) {
    Notifications = await import('expo-notifications');
    // Configure how notifications are shown when the app is foregrounded
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        // iOS presentation options in newer SDKs
        shouldShowBanner: true,
        shouldShowList: true,
      })
    });
  }
  return Notifications;
}

async function getProjectId(): Promise<string | undefined> {
  // Try to resolve projectId for bare or dev clients
  // For Expo Go on SDK 54+, getExpoPushTokenAsync requires projectId
  // We'll attempt best-effort lookup
  const easProjectId = (Constants as any).easConfig?.projectId || (Constants as any).expoConfig?.extra?.eas?.projectId || (Constants as any).manifest2?.extra?.eas?.projectId;
  return easProjectId;
}

export async function registerForPushNotifications(clerkUserId: string): Promise<string | null> {
  try {
    // Skip push notification registration in Expo Go (SDK 53+)
    if (isExpoGo) {
      console.log('⚠️ Push notifications are not supported in Expo Go (SDK 53+).');
      console.log('   To enable push notifications, create a development build:');
      console.log('   Run: npx expo run:android or npx expo run:ios');
      return null;
    }

    const Notifications = await getNotificationsModule();
    if (!Notifications) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('🔕 Notifications permission not granted');
      return null;
    }

    // Android channel for heads-up notifications
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        bypassDnd: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const projectId = await getProjectId();
    let tokenData;
    try {
      if (projectId) {
        tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      } else {
        // For development without projectId, try without it
        console.log('⚠️ No projectId found, attempting without it (may not work in production)');
        tokenData = await Notifications.getExpoPushTokenAsync();
      }
    } catch (tokenError: any) {
      if (tokenError.message?.includes('projectId')) {
        console.log('⚠️ Push notifications require an Expo project. Run "eas init" to set up your project.');
        console.log('   For now, push notifications will be disabled.');
        return null;
      }
      if (tokenError.message?.match(/FirebaseApp|DEFAULT|Firebase/i)) {
        console.log('⚠️ Android push setup incomplete: Firebase app not initialized.');
        console.log('   Make sure you have google-services.json and FCM configured in your dev build.');
        console.log('   See: https://docs.expo.dev/push-notifications/fcm/');
        return null;
      }
      throw tokenError;
    }
    
    const token = tokenData?.data;
    if (!token) return null;

    // Register token with backend
    const baseURL = getApiBaseUrl();
    await fetch(`${baseURL}/api/push/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkUserId, token, platform: Platform.OS })
    });

    console.log('✅ Registered Expo push token');
    return token;
  } catch (e) {
    console.log('⚠️ registerForPushNotifications failed:', e);
    return null;
  }
}

export function addNotificationListeners(
  onReceive: (title: string, body: string) => void,
  onTap?: (data: any) => void,
  clerkUserId?: string,
) {
  // Skip adding listeners in Expo Go (SDK 53+)
  if (isExpoGo) {
    console.log('⚠️ Notification listeners not added in Expo Go');
    return { remove: () => {}, receiveSub: { remove: () => {} }, responseSub: { remove: () => {} } };
  }

  // Return a promise-based approach since we need to dynamically import
  let receiveSub: any = null;
  let responseSub: any = null;
  const loggedIds = new Set<string>();

  async function logLocalReminderIfNeeded(notification: any) {
    try {
      const data = notification?.request?.content?.data || {};
      const type = data?.type as string | undefined;
      const title = notification?.request?.content?.title as string | undefined;
      const body = notification?.request?.content?.body as string | undefined;
      const identifier = notification?.request?.identifier as string | undefined;
      if (!clerkUserId) return;
      if (!type || (type !== 'mood' && type !== 'journaling')) return;
      if (identifier && loggedIds.has(identifier)) return; // de-dup
      
      // Log notification to Convex so it appears in notification bell
      console.log(`📝 Notification fired: type=${type}, title=${title}`);
      
      try {
        // Call Convex mutation directly via HTTP
        const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
        if (!convexUrl) {
          console.log('⚠️ No Convex URL configured');
          return;
        }

        const response = await fetch(`${convexUrl}/api/mutation`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: 'notifications:createNotification',
            args: {
              userId: clerkUserId,
              type: type,
              title: title || (type === 'mood' ? 'Mood check-in' : 'Journaling reminder'),
              message: body || (type === 'mood' ? 'How are you feeling today?' : 'Take a moment to jot your thoughts.'),
            },
            format: 'json',
          })
        });
        
        if (response.ok) {
          console.log('✅ Notification saved to Convex');
        } else {
          const errorText = await response.text();
          console.log('⚠️ Failed to save notification to Convex:', response.status, errorText);
        }
      } catch (error) {
        console.log('⚠️ Failed to save notification:', error);
      }
      
      if (identifier) loggedIds.add(identifier);
    } catch (_e) {
      console.log('⚠️ Failed to log notification:', _e);
      // ignore logging failures
    }
  }

  // Initialize listeners asynchronously
  (async () => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    receiveSub = Notifications.addNotificationReceivedListener(async (notification: any) => {
      const { title, body } = notification.request.content;
      if (title || body) onReceive(title || 'Notification', body || '');
      // Let interested parts of the app refresh (e.g., bell badge)
      try { notificationEvents.publish({ type: 'received', title, body }); } catch { /* no-op */ }
      // If this is a local reminder, log it to backend to appear in bell
      await logLocalReminderIfNeeded(notification);
      // Reschedule the next occurrence for daily reminders (since we use one-time triggers)
      try {
        const data = notification?.request?.content?.data || {};
        if (clerkUserId && (data?.type === 'mood' || data?.type === 'journaling')) {
          console.log(`🔄 Rescheduling next ${data.type} reminder after fire`);
          const settings = await settingsAPI.fetchSettings(clerkUserId);
          await scheduleFromSettings(settings);
        }
      } catch (_e) { /* no-op */ }
    });

    responseSub = Notifications.addNotificationResponseReceivedListener(async (response: any) => {
      const data = response.notification.request.content.data;
      // Also log on tap in case receive listener didn't run (background state)
      await logLocalReminderIfNeeded(response.notification);
      // Reschedule the next occurrence for daily reminders
      try {
        if (clerkUserId && (data?.type === 'mood' || data?.type === 'journaling')) {
          console.log(`🔄 Rescheduling next ${data.type} reminder after tap`);
          const settings = await settingsAPI.fetchSettings(clerkUserId);
          await scheduleFromSettings(settings);
        }
      } catch (_e) { /* no-op */ }
      if (onTap) onTap(data);
    });
  })();

  return {
    remove: () => {
      try { receiveSub?.remove(); } catch (_e) { /* no-op */ }
      try { responseSub?.remove(); } catch (_e) { /* no-op */ }
    }
  };
}
