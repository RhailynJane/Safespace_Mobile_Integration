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
  date: string;
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
      // Transform appointments - use backend status directly
      const transformed: Appointment[] = convexAppointments
        .filter((apt: any) => {
          // Only include scheduled/confirmed appointments (backend query already filtered these)
          return apt.status === 'scheduled' || apt.status === 'confirmed';
        })
        .map((apt: any) => {
          try {
            // Validate and parse date
            let appointmentDate: Date;
            if (typeof apt.date === 'string') {
              appointmentDate = new Date(apt.date);
            } else if (apt.date instanceof Date) {
              appointmentDate = apt.date;
            } else {
              console.warn('Invalid date format for appointment:', apt.id);
              return null;
            }

            if (isNaN(appointmentDate.getTime())) {
              console.warn('Invalid date value for appointment:', apt.id, apt.date);
              return null;
            }

            // Format readable date
            const formattedDate = appointmentDate.toLocaleDateString('en-US', {
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric'
            });

            // Calculate numeric timestamp for sorting
            const year = appointmentDate.getUTCFullYear();
            const month = appointmentDate.getUTCMonth() + 1;
            const day = appointmentDate.getUTCDate();

            const timeStr: string = apt.time || '00:00:00';
            const [hStr, mStr] = timeStr.split(':');
            const aptHour = parseInt(hStr || '0', 10);
            const aptMinute = parseInt(mStr || '0', 10);
            const aptNumeric = year * 100000000 + month * 1000000 + day * 10000 + aptHour * 100 + aptMinute;

            return {
              id: apt.id,
              supportWorker: apt.supportWorker || 'Support Worker',
              date: formattedDate,
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

      // Sort by numeric timestamp and get first one
      if (transformed.length > 0) {
        const sorted = [...transformed].sort((a, b) => (a.mstNumeric || 0) - (b.mstNumeric || 0));
        setUpcoming(sorted[0] ?? null);
      } else {
        setUpcoming(null);
      }
    } catch (e) {
      console.error('Error processing appointments for video screen:', e);
      setUpcoming(null);
    }
  }, [convexAppointments]);  

  // Check if appointment can be joined (scheduled/confirmed and within time window)
  // Check if appointment can be joined (scheduled/confirmed and within time window)
  const canJoinAppointment = useCallback((appointment: Appointment | null): boolean => {
    if (!appointment || !appointment.date || !appointment.time) return false;
    if (!["scheduled", "confirmed"].includes(appointment.status)) return false;
    try {
      const aptDateTime = new Date(`${appointment.date}T${appointment.time}`);
      if (isNaN(aptDateTime.getTime())) return false;
      const now = new Date();
      const minutesUntilAppointment = (aptDateTime.getTime() - now.getTime()) / (1000 * 60);
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
    const aptDateTime = new Date(`${upcoming.date}T${upcoming.time}`);
    if (isNaN(aptDateTime.getTime())) return;
    const now = new Date();
    const minutesUntilAppointment = (aptDateTime.getTime() - now.getTime()) / (1000 * 60);
    if (minutesUntilAppointment > 10) {
      // Format date/time as MM-DD-YYYY HH:SS
      const formatted = `${String(aptDateTime.getMonth()+1).padStart(2,'0')}-${String(aptDateTime.getDate()).padStart(2,'0')}-${aptDateTime.getFullYear()} ${String(aptDateTime.getHours()).padStart(2,'0')}:${String(aptDateTime.getMinutes()).padStart(2,'0')}`;
      setJoinRestrictionMsg(`The date is in ${formatted}. You can join 10 mins before the scheduled appt.`);
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