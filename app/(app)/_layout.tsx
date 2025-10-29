// app/(app)/_layout.tsx
import { Stack, Redirect, router } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View, AppState, Text, TouchableOpacity } from "react-native";
import { useEffect, useRef, useState } from "react";
import activityApi from "../../utils/activityApi";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from "../../utils/apiBaseUrl";
import { registerForPushNotifications, addNotificationListeners } from "../../utils/pushNotifications";

export default function AppLayout() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const appState = useRef(AppState.currentState);
  const [banner, setBanner] = useState<{visible:boolean; title:string; body:string}>({visible:false, title:'', body:''});
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const pushSubsRef = useRef<{ remove: () => void } | null>(null);
  const baseURL = getApiBaseUrl();

  console.log('📱 AppLayout - Auth State:', { isLoaded, isSignedIn });

  // On sign-in or app foreground, record login once (no heartbeat/polling)
  useEffect(() => {
    if (!isSignedIn || !userId) return;

    const record = async () => {
      try {
        await activityApi.recordLogin(userId);
        console.log('✅ Presence: recorded login for user:', userId);
      } catch (error) {
        console.error('❌ recordLogin failed:', error);
      }
    };

    // Initial record when layout mounts for a signed-in user
    record();

    // Record again when app returns to foreground (no interval)
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
  }, [isSignedIn, userId]);

  // Simple in-app banner (foreground) by polling notifications API
  useEffect(() => {
    if (!isSignedIn || !userId) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
      // cleanup push listeners if any
      if (pushSubsRef.current) {
        try { pushSubsRef.current.remove(); } catch (_e) { /* no-op */ }
        pushSubsRef.current = null;
      }
      return;
    }

    let isMounted = true;
    const key = `lastSeenNotificationId:${userId}`;

    const checkNotifications = async () => {
      try {
        const res = await fetch(`${baseURL}/api/notifications/${userId}`);
        if (!res.ok) return;
        const json = await res.json();
  const rows: Array<{id:number; type:string; title:string; message:string; is_read:boolean; created_at:string}> = json.data || [];
  if (!rows || rows.length === 0) return;

        const lastSeenStr = await AsyncStorage.getItem(key);
        const lastSeenId = lastSeenStr ? parseInt(lastSeenStr, 10) : 0;
        const newest = rows[0]; // ordered desc by backend
  if (newest && newest.id > lastSeenId) {
          // Find first unread newer than last seen
          const firstNew = rows.find(r => r.id > lastSeenId && !r.is_read) || rows.find(r => r.id > lastSeenId);
          if (firstNew && isMounted) {
            setBanner({visible:true, title: firstNew.title || 'Notification', body: firstNew.message || ''});
            // update last seen to newest id to avoid repeated banners
            if (newest) await AsyncStorage.setItem(key, String(newest.id));
            // auto-hide after 3.5s
            setTimeout(() => setBanner(b => ({...b, visible:false})), 3500);
          } else {
            if (newest) await AsyncStorage.setItem(key, String(newest.id));
          }
        }
      } catch (e) {
        // ignore
      }
    };

    // kick once and then interval
    checkNotifications();
  const id = setInterval(checkNotifications, 15000);
  pollingRef.current = id;

    return () => {
      isMounted = false;
  clearInterval(id);
  pollingRef.current = null;
    };
  }, [isSignedIn, userId, baseURL]);

  // Register for push and attach listeners to show instant banners
  useEffect(() => {
    if (!isSignedIn || !userId) return;
    let mounted = true;
    (async () => {
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
        }
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
    <>
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
    </>
  );
}