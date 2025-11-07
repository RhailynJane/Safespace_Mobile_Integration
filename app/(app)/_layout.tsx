// app/(app)/_layout.tsx
import { Stack, Redirect, router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View, AppState, Text, TouchableOpacity } from "react-native";
import { useEffect, useRef, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotifications, addNotificationListeners } from "../../utils/pushNotifications";
import { scheduleFromSettings } from "../../utils/reminderScheduler";
import { ConvexReactClient, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useConvexActivity } from "../../utils/hooks/useConvexActivity";
import { useConvexSettings } from "../../utils/hooks/useConvexSettings";
import { NotificationsProvider } from "../../contexts/NotificationsContext";

export default function AppLayout() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const appState = useRef(AppState.currentState);
  const [banner, setBanner] = useState<{visible:boolean; title:string; body:string}>({visible:false, title:'', body:''});
  const pushSubsRef = useRef<{ remove: () => void } | null>(null);
  const [convexClient, setConvexClient] = useState<ConvexReactClient | null>(null);
  const lastNotificationIdRef = useRef<string | null>(null);

  console.log('📱 AppLayout - Auth State:', { isLoaded, isSignedIn });

  // Initialize Convex client
  useEffect(() => {
    const initConvex = async () => {
      try {
        const url = await AsyncStorage.getItem('convexUrl');
        if (url) {
          const client = new ConvexReactClient(url);
          setConvexClient(client);
          console.log('� Convex client initialized in AppLayout');
        }
      } catch (error) {
        console.error('❌ Failed to initialize Convex client:', error);
      }
    };
    initConvex();
  }, []);

  // Initialize activity and settings hooks
  const { recordLogin } = useConvexActivity(convexClient);
  const { loadSettings } = useConvexSettings(convexClient);

  // On sign-in or app foreground, record login with Convex
  useEffect(() => {
    if (!isSignedIn || !userId) return;

    const record = async () => {
      try {
        await recordLogin(userId);
        console.log('✅ Presence: recorded login for user:', userId);
      } catch (error) {
        console.error('❌ recordLogin failed:', error);
      }
    };

    // Initial record when layout mounts for a signed-in user
    record();

    // Record again when app returns to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 App foregrounded - refreshing presence');
        record();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isSignedIn, userId, recordLogin]);

  // Load settings from Convex and schedule reminders
  useEffect(() => {
    if (!isSignedIn || !userId || !convexClient) return;

    const loadUserSettings = async () => {
      try {
        await loadSettings(userId);
        
        // Load settings from Convex to schedule reminders
        const convexSettings = await convexClient.query(api.settings.getUserSettings, { userId });
        if (convexSettings) {
          // Map to UserSettings format for scheduler
          const mappedSettings = {
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
          
          await scheduleFromSettings(mappedSettings);
          console.log('⚙️ Settings loaded and reminders scheduled');
        }
      } catch (error) {
        console.error('❌ Failed to load settings:', error);
      }
    };

    loadUserSettings();
  }, [isSignedIn, userId, convexClient, loadSettings]);

  // Real-time notifications - now handled by NotificationsProvider
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  
  useEffect(() => {
    if (!convexClient || !userId) return;

    let mounted = true;
    
    const fetchNotifications = async () => {
      try {
        const result = await convexClient.query(
          api.notifications.getNotifications,
          { userId, limit: 10 }
        );

        if (mounted && result?.notifications) {
          setNotificationsList(result.notifications);
        }
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Poll every 10 seconds for new notifications (for banner display)
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [convexClient, userId]);

  // Show banner for new notifications
  useEffect(() => {
    if (notificationsList.length === 0) return;

    const latestNotification = notificationsList[0];
    
    // Check if this is a new notification we haven't seen
    if (lastNotificationIdRef.current !== latestNotification.id) {
      const isRemType = (t?: string) => t === 'mood' || t === 'journaling';
      
      // Only show banner for non-reminder notifications
      if (!isRemType(latestNotification.type) && !latestNotification.isRead) {
        setBanner({
          visible: true,
          title: latestNotification.title || 'Notification',
          body: latestNotification.message || ''
        });

        // Auto-hide after 3.5s
        setTimeout(() => setBanner(b => ({ ...b, visible: false })), 3500);
      }

      // Update last seen notification ID
      lastNotificationIdRef.current = latestNotification.id;
    }
  }, [notificationsList]);

  // Register for push and attach listeners to show instant banners
  useEffect(() => {
    if (!isSignedIn || !userId) return;
    let mounted = true;
    (async () => {
      // Ensure a notification handler is set so local notifications show in foreground (incl. Expo Go)
      try {
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
            // iOS presentation options
            shouldShowBanner: true,
            shouldShowList: true,
          })
        });
      } catch (_e) {
        // ignore if module not available
      }

      try {
        await registerForPushNotifications(userId);
      } catch (e) {
        // ignore
      }
      if (!mounted) return;
      // Attach listeners
      const subs = addNotificationListeners(
        (title, body) => {
          setBanner({ visible: true, title: title || 'Notification', body: body || '' });
          setTimeout(() => setBanner(b => ({ ...b, visible: false })), 3500);
        },
        // on tap: deep-link based on notification type
        (data) => {
          try {
            const type = data?.type as string | undefined;
            if (!type) return;
            // Messages -> open chat by conversationId
            if (type === 'message' && data?.conversationId) {
              const cid = String(data.conversationId);
              router.push(`/(app)/(tabs)/messages/message-chat-screen?id=${encodeURIComponent(cid)}`);
              return;
            }
            // Post reactions -> open post detail
            if (type === 'post_reactions') {
              const postId = data?.postId ?? data?.post_id;
              if (postId) {
                router.push(`/(app)/(tabs)/community-forum/post-detail?id=${encodeURIComponent(String(postId))}`);
                return;
              }
              router.push('/(app)/(tabs)/community-forum');
              return;
            }
            // Appointments -> open appointments tab
            if (type === 'appointment') {
              router.push('/(app)/(tabs)/appointments');
              return;
            }
            // Mood tracking reminder
            if (type === 'mood') {
              router.push('/(app)/mood-tracking');
              return;
            }
            // Journaling reminder
            if (type === 'journaling') {
              router.push('/(app)/journal');
              return;
            }
            // Self assessment reminder
            if (type === 'self_assessment') {
              router.push('/(app)/self-assessment');
              return;
            }
            // Fallback: notifications screen if present
            router.push('/(app)/notifications');
          } catch (_e) {
            // no-op
          }
        },
        userId
      );
      pushSubsRef.current = subs;
    })();
    return () => {
      mounted = false;
      if (pushSubsRef.current) {
        try { pushSubsRef.current.remove(); } catch (_e) { /* no-op */ }
        pushSubsRef.current = null;
      }
    };
  }, [isSignedIn, userId]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7BB8A8" />
      </View>
    );
  }

  if (!isSignedIn) {
    console.log('🚨 AppLayout redirecting to login - user not signed in');
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <NotificationsProvider convexClient={convexClient} userId={userId}>
      {/* Foreground in-app banner */}
      {banner.visible && (
        <View style={{
          position: 'absolute',
          top: 16,
          left: 16,
          right: 16,
          zIndex: 999,
          backgroundColor: 'rgba(0,0,0,0.85)',
          borderRadius: 12,
          padding: 12,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 }
        }}>
          <View style={{flexDirection:'row', alignItems:'flex-start'}}>
            <View style={{flex:1}}>
              <Text style={{color:'#fff', fontWeight:'600', fontSize:14}}>{banner.title}</Text>
              <Text style={{color:'#fff', marginTop:4, fontSize:13}} numberOfLines={3}>{banner.body}</Text>
            </View>
            <TouchableOpacity onPress={() => setBanner(b => ({...b, visible:false}))}>
              <Text style={{color:'#ccc', marginLeft:8}}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="crisis-support" />
      <Stack.Screen name="journal" />
      <Stack.Screen name="mood-tracking" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="resources" />
      <Stack.Screen name="self-assessment" />
      <Stack.Screen name="video-consultations" />
      </Stack>
    </NotificationsProvider>
  );
}