import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getApiBaseUrl } from './apiBaseUrl';
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
) {
  // Skip adding listeners in Expo Go (SDK 53+)
  if (isExpoGo) {
    console.log('⚠️ Notification listeners not added in Expo Go');
    return { remove: () => {}, receiveSub: { remove: () => {} }, responseSub: { remove: () => {} } };
  }

  // Return a promise-based approach since we need to dynamically import
  let receiveSub: any = null;
  let responseSub: any = null;

  // Initialize listeners asynchronously
  (async () => {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    receiveSub = Notifications.addNotificationReceivedListener((notification: any) => {
      const { title, body } = notification.request.content;
      if (title || body) onReceive(title || 'Notification', body || '');
      // Let interested parts of the app refresh (e.g., bell badge)
      try { notificationEvents.publish({ type: 'received', title, body }); } catch { /* no-op */ }
    });

    responseSub = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data;
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
