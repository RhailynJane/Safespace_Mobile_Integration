/**
 * LLM Prompt: Add concise inline comments to this React Native component.
 */

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../components/BottomNavigation";
import CurvedBackground from "../../../components/CurvedBackground";
import { AppHeader } from "../../../components/AppHeader";
import { useTheme } from "../../../contexts/ThemeContext";
import { useUser } from "@clerk/clerk-expo";
import { useConvexAppointments } from "../../../utils/hooks/useConvexAppointments";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

const { width } = Dimensions.get("window");

type Appointment = {
  id: string;
  supportWorker: string;
  date: string; // display date
  isoDate?: string; // YYYY-MM-DD for comparisons
  time: string;
  type: string;
  status: "upcoming" | "past" | "cancelled";
  mstNumeric?: number;
  meetingLink?: string;
};

/**
 * VideoScreen Component
 *
 * A screen that displays video consultation details and technical requirements.
 * Users can view their upcoming meeting and join the video call.
 * Features a beautiful curved background and comprehensive navigation.
 */
export default function VideoScreen() {
  const { theme, scaledFontSize } = useTheme();
  const { user } = useUser();
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("video");
  const [upcoming, setUpcoming] = useState<Appointment | null>(null);
  const startSession = useMutation(api.videoCallSessions.startSession);
  const endSession = useMutation(api.videoCallSessions.endSession);
  const pruneStale = useMutation(api.videoCallSessions.pruneStaleSessions as any);
  const activeSession = useQuery(api.videoCallSessions.getActiveSession, {} as any) as any | null;
  const callStats = useQuery(api.videoCallSessions.getCallStats, {} as any) as any | null;

  // Determine user's organization (prefer Convex users table, fallback to Clerk metadata)
  const myOrgFromConvex = useQuery(api.users.getMyOrg, {});
  const orgId = useMemo(() => {
    if (typeof myOrgFromConvex === 'string' && myOrgFromConvex.length > 0) return myOrgFromConvex;
    const meta = (user?.publicMetadata as any) || {};
    return meta.orgId || 'cmha-calgary';
  }, [myOrgFromConvex, user?.publicMetadata]);
  const isSAIT = orgId === 'sait';
  const roleLabel = isSAIT ? 'Peer Support' : 'Support Worker';

  // Local Convex client instance
  const providerClient = useConvex();
  // Convex auth readiness check (prevents unauthenticated mutations)
  const whoami = useQuery(api.auth.whoami as any, {} as any) as any;

  // Use the appointments hook for data management
  const { 
    appointments: convexAppointments, 
    loading,
    error,
    isUsingConvex 
  } = useConvexAppointments(user?.id, providerClient);

  /**
   * Create styles dynamically based on text size scaling
   * Uses useMemo for performance optimization
   */
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  // Opportunistically prune stale sessions on screen mount
  useEffect(() => {
    (async () => {
      try {
        await pruneStale({});
      } catch (e) {
        // best-effort cleanup; ignore failures
      }
    })();
  }, [pruneStale]);

  // Navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Handles navigation tab presses
   * @param tabId - The ID of the tab to navigate to
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  // Process appointments to find next upcoming video appointment
  useEffect(() => {
    if (!convexAppointments || convexAppointments.length === 0) {
      setUpcoming(null);
      return;
    }

    try {
      // Helper to rewrite any persisted auto-assigned label to current org
      const normalizeAutoAssigned = (name: string | undefined) => {
        if (!name) return name;
        return name.startsWith('Auto-assigned by ') ? `Auto-assigned by ${isSAIT ? 'SAIT' : 'CMHA'}` : name;
      };

      // Transform appointments - use backend status directly
      const transformed: Appointment[] = convexAppointments
        .filter((apt: any) => {
          // Only include scheduled/confirmed appointments (backend query already filtered these)
          return apt.status === 'scheduled' || apt.status === 'confirmed';
        })
        .map((apt: any) => {
          try {
            // Parse date as YYYY-MM-DD (no timezone conversion)
            const [year, month, day] = (apt.date || '').split('-').map(Number);
            
            if (!year || !month || !day) {
              console.warn('Invalid date format for appointment:', apt.id, apt.date);
              return null;
            }

            // Create date in local time (not UTC) for display formatting
            const appointmentDate = new Date(year, month - 1, day);

            // Format readable date
            const formattedDate = appointmentDate.toLocaleDateString('en-US', {
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            });

            // Calculate numeric timestamp for sorting (no UTC)
            const timeStr: string = apt.time || '00:00:00';
            const [hStr, mStr] = timeStr.split(':');
            const aptHour = parseInt(hStr || '0', 10);
            const aptMinute = parseInt(mStr || '0', 10);
            const aptNumeric = year * 100000000 + month * 1000000 + day * 10000 + aptHour * 100 + aptMinute;

            // ISO date for comparisons
            const isoDate = `${String(year).padStart(4,'0')}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

            return {
              id: apt.id,
              supportWorker: normalizeAutoAssigned(apt.supportWorker) || roleLabel,
              date: formattedDate,
              isoDate,
              time: apt.time || '',
              type: apt.type || 'Video',
              status: 'upcoming', // Backend already filtered to upcoming only
              mstNumeric: aptNumeric,
              meetingLink: (apt as any).meetingLink,
            } as Appointment;
          } catch (dateError) {
            console.error('Error processing appointment date:', apt.id, dateError);
            return null;
          }
        })
        .filter((apt: Appointment | null): apt is Appointment => apt !== null);

      // Filter out appointments already in the past (Mountain Time), then sort and take first
      const nowParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Denver',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(new Date());
      const getPart = (type: string) => {
        const p = nowParts.find((x) => x.type === type)?.value;
        return p ? parseInt(p, 10) : 0;
      };
      const ny = getPart('year');
      const nm = getPart('month');
      const nd = getPart('day');
      const nh = getPart('hour');
      const nmin = getPart('minute');

      const isFutureOrNowMST = (iso: string | undefined, time: string | undefined) => {
        if (!iso) return false;
        const parts = iso.split('-').map((n) => parseInt(n, 10));
        const y = parts[0] || 0;
        const m = parts[1] || 0;
        const d = parts[2] || 0;
        const timeParts = (time || '00:00').split(':').map((n) => parseInt(n, 10));
        const hh = timeParts[0] || 0;
        const mm = timeParts[1] || 0;
        if (y > ny) return true; if (y < ny) return false;
        if (m > nm) return true; if (m < nm) return false;
        if (d > nd) return true; if (d < nd) return false;
        if (hh > nh) return true; if (hh < nh) return false;
        return mm >= nmin;
      };

      const futureOnly = transformed.filter((t) => isFutureOrNowMST(t.isoDate, t.time));
      if (futureOnly.length > 0) {
        const sorted = [...futureOnly].sort((a, b) => (a.mstNumeric || 0) - (b.mstNumeric || 0));
        setUpcoming(sorted[0] ?? null);
      } else {
        setUpcoming(null);
      }
    } catch (e) {
      console.error('Error processing appointments for video screen:', e);
      setUpcoming(null);
    }
  }, [convexAppointments, isSAIT, roleLabel]);  

  // Check if appointment can be joined (scheduled/confirmed and within time window)
  const canJoinAppointment = useCallback((appointment: Appointment | null): boolean => {
    if (!appointment || !appointment.date || !appointment.time) return false;
    if (!["scheduled", "confirmed"].includes(appointment.status)) return false;
    try {
      // Parse date components (YYYY-MM-DD) from isoDate and time (HH:MM)
      const dateParts = (appointment.isoDate || '').split('-').map(Number);
      const year = dateParts[0] || 0;
      const month = dateParts[1] || 0;
      const day = dateParts[2] || 0;
      const timeParts = appointment.time.split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      
      // Get current time in Mountain Time using formatToParts
      const nowParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Denver',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(new Date());
      
      const getPart = (type: string) => {
        const part = nowParts.find(p => p.type === type);
        return part ? parseInt(part.value, 10) : 0;
      };
      
      const nowYear = getPart('year');
      const nowMonth = getPart('month');
      const nowDay = getPart('day');
      const nowHour = getPart('hour');
      const nowMinute = getPart('minute');
      
      // Create timestamp for appointment and now (in minutes)
      const aptMinutes = year * 525600 + month * 43800 + day * 1440 + hours * 60 + minutes;
      const nowMinutes = nowYear * 525600 + nowMonth * 43800 + nowDay * 1440 + nowHour * 60 + nowMinute;
      
      const minutesUntilAppointment = aptMinutes - nowMinutes;
      return minutesUntilAppointment >= -60 && minutesUntilAppointment <= 10;
    } catch {
      return false;
    }
  }, []);

  // State for join restriction message
  const [joinRestrictionMsg, setJoinRestrictionMsg] = useState<string | null>(null);

  // Handler for join button
  const handleJoinMeetingWithRestriction = () => {
    if (!upcoming || !upcoming.date || !upcoming.time) return;
    // Compute minutes until appointment in Mountain Time using isoDate/time
    const dateParts = (upcoming.isoDate || '').split('-').map((n) => parseInt(n, 10));
    const y = dateParts[0] || 0;
    const m = dateParts[1] || 0;
    const d = dateParts[2] || 0;
    const timeParts = (upcoming.time || '00:00').split(':').map((n) => parseInt(n, 10));
    const hh = timeParts[0] || 0;
    const mm = timeParts[1] || 0;
    if (!y || !m || !d) return;

    const nowParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const getPart = (type: string) => {
      const p = nowParts.find((x) => x.type === type)?.value;
      return p ? parseInt(p, 10) : 0;
    };
    const ny = getPart('year');
    const nm = getPart('month');
    const nd = getPart('day');
    const nh = getPart('hour');
    const nmin = getPart('minute');
    const aptMinutes = y * 525600 + m * 43800 + d * 1440 + hh * 60 + mm;
    const nowMinutes = ny * 525600 + nm * 43800 + nd * 1440 + nh * 60 + nmin;
    const minutesUntilAppointment = aptMinutes - nowMinutes;
    if (minutesUntilAppointment > 10) {
      setJoinRestrictionMsg(`The session is scheduled. You can join 10 mins before the appointment time.`);
      return;
    }
    setJoinRestrictionMsg(null);
    handleJoinMeeting();
  };

  // Join meeting: route to pre-join with real params
  const handleJoinMeeting = () => {
    if (!upcoming) return;
    (async () => {
      try {
        // If Convex identity not ready, skip mutation to avoid Unauthenticated
        if (!whoami) {
          console.warn('Convex identity not ready yet; joining without session tracking.');
        }
        const result = whoami
          ? await startSession({ supportWorkerName: upcoming.supportWorker, audioOption: 'internet' } as any)
          : null;
        const sessionId = (result as any)?.sessionId || '';
        router.push({
          pathname: "/(app)/video-consultations/video-call",
          params: {
            sessionId: String(sessionId),
            appointmentId: String(upcoming.id),
            supportWorkerName: upcoming.supportWorker,
            date: upcoming.date,
            time: upcoming.time,
            meetingLink: upcoming.meetingLink || '',
          },
        });
      } catch (e) {
        console.error('Failed to start video session', e);
        router.push({
          pathname: "/(app)/video-consultations/video-call",
          params: {
            appointmentId: String(upcoming.id),
            supportWorkerName: upcoming.supportWorker,
            date: upcoming.date,
            time: upcoming.time,
            meetingLink: upcoming.meetingLink || '',
          },
        });
      }
    })();
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <CurvedBackground>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, marginTop: 16 }]}>Loading appointments...</Text>
          </View>
        </CurvedBackground>
      </SafeAreaView>
    );
  }

  // Show error state if there's an error from the hook
  if (error && !loading) {
    return (
      <CurvedBackground>
        <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
          <AppHeader title="Video Consultations" showBack={true} />
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error || '#FF5252'} />
            <Text style={[styles.title, { color: theme.colors.text, marginTop: 16 }]}>Connection Error</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 20, marginTop: 8 }]}>
              {error}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 20, marginTop: 12, fontSize: scaledFontSize(12) }]}>
              This usually means the backend server is not running. Make sure the server is started and try again.
            </Text>
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: theme.colors.primary, marginTop: 24 }]}
              onPress={() => {
                router.replace('/(app)/(tabs)/appointments');
              }}
            >
              <Text style={styles.joinButtonText}>Go to Appointments</Text>
            </TouchableOpacity>
          </View>
          <BottomNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <AppHeader title="Video Consultations" showBack={true} />

        {/* Main Content */}
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={[styles.appointmentCard, { backgroundColor: theme.colors.surface }]}>
              {/* Upcoming Meeting */}
              {upcoming ? (
                <>
                  <View style={styles.profileContainer}>
                    <Ionicons name="person-circle" size={48} color={theme.colors.primary} style={{ marginRight: 12 }} />
                    <View style={styles.nameContainer}>
                      <Text style={[styles.name, { color: theme.colors.text }]}>
                        {upcoming.supportWorker}
                      </Text>
                      <Text style={[styles.date, { color: theme.colors.textSecondary }]}>
                        {upcoming.date}
                      </Text>
                      <Text style={[styles.time, { color: theme.colors.textSecondary }]}>
                        {upcoming.time}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: theme.isDark ? '#FFB74D' : '#FFECB3' }]}>
                      <Text style={[styles.statusText, { color: theme.isDark ? '#FFF' : '#5D4037' }]}>Upcoming</Text>
                    </View>
                  </View>

                  {/* Join Meeting */}
                  <TouchableOpacity
                    style={[
                      styles.joinButton,
                      canJoinAppointment(upcoming)
                        ? { backgroundColor: theme.colors.primary }
                        : { backgroundColor: theme.colors.iconDisabled, opacity: 0.5 }
                    ]}
                    onPress={handleJoinMeetingWithRestriction}
                    disabled={!canJoinAppointment(upcoming)}
                  >
                    <Ionicons name="videocam" size={20} color="#FFFFFF" />
                    <Text style={styles.joinButtonText}>
                      {canJoinAppointment(upcoming) ? 'Join Meeting' : 'Available 10 min before'}
                    </Text>
                  </TouchableOpacity>

                  {/* Show restriction message if trying to join too early */}
                  {joinRestrictionMsg && (
                    <View style={{ marginTop: 12, padding: 10, backgroundColor: theme.colors.surface, borderRadius: 8 }}>
                      <Text style={{ color: theme.colors.error || '#FF5252', textAlign: 'center' }}>{joinRestrictionMsg}</Text>
                    </View>
                  )}

                  <View style={[styles.divider, { backgroundColor: theme.colors.border, marginTop: 16 }]} />
                </>
              ) : (
                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                  <Ionicons name="calendar-outline" size={32} color={theme.colors.iconDisabled} />
                  <Text style={{ marginTop: 8, color: theme.colors.textSecondary }}>No upcoming video consultations</Text>
                </View>
              )}

              {/* Technical Requirements Section */}
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                Technical Requirements
              </Text>

              <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                System Requirements
              </Text>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  Stable internet connection (min 1 Mbps)
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  Speakers or headphones
                </Text>
              </View>

              <Text style={[styles.subsectionTitle, { color: theme.colors.text }]}>
                Privacy & Security
              </Text>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  End to end encrypted video calls
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  HIPAA/PIPEDA compliant platform
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  No recordings without consent
                </Text>
              </View>
              <View style={styles.requirementItem}>
                <View style={[styles.bulletPoint, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.requirementText, { color: theme.colors.text }]}>
                  Secure data transmission
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

/**
 * Stylesheet for VideoScreen component
 * Now includes dynamic font scaling via scaledFontSize parameter
 */
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: scaledFontSize(22),
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: scaledFontSize(16),
    textAlign: "center",
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    flexDirection: "row",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sideMenu: {
    width: "75%",
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  menuProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  profileName: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: scaledFontSize(14),
  },
  sideMenuContent: {
    padding: 10,
  },
  sideMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  sideMenuItemText: {
    fontSize: scaledFontSize(16),
    marginLeft: 15,
  },
  scrollContent: {
    flex: 1,
  },
  appointmentCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    width: width - 40,
    marginVertical: 20,
  },
  name: {
    fontSize: scaledFontSize(15),
    fontWeight: "600",
  },
  date: {
    fontSize: scaledFontSize(13),
  },
  time: {
    fontSize: scaledFontSize(13),
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-end",
    marginTop: 10,
  },
  upcomingBadge: {
    // backgroundColor applied via inline style
  },
  completedBadge: {
    // backgroundColor applied via inline style
  },
  canceledBadge: {
    // backgroundColor applied via inline style
  },
  statusText: {
    fontWeight: "600",
    fontSize: scaledFontSize(14),
  },
  joinButton: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  nameContainer: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  requirementText: {
    fontSize: scaledFontSize(16),
    flex: 1,
    lineHeight: 24,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 8,
    gap: 6,
  },
  statChipText: {
    fontSize: scaledFontSize(12),
  },
  scrollContentContainer: {
    paddingBottom: 20,
    minHeight: '100%',
  },
});