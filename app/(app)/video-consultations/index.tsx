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

const { width } = Dimensions.get("window");

type Appointment = {
  id: number;
  supportWorker: string;
  date: string; // formatted
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("video");
  const [upcoming, setUpcoming] = useState<Appointment | null>(null);

  /**
   * Create styles dynamically based on text size scaling
   * Uses useMemo for performance optimization
   */
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

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

  // Fetch next upcoming appointment (MST-aware) and show it on this screen
  const fetchUpcoming = useCallback(async () => {
    try {
      setLoading(true);
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/appointments?clerkUserId=${user?.id}`);
      const result = await response.json();

      if (result.success && Array.isArray(result.appointments)) {
        const transformed: Appointment[] = result.appointments.map((apt: any) => {
          // Format readable date (keeps user-friendly display)
          const appointmentDate = new Date(apt.date);
          const formattedDate = appointmentDate.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          });

          // Build MST numeric for ordering
          const utcDate = new Date(apt.date);
          const year = utcDate.getUTCFullYear();
          const month = utcDate.getUTCMonth();
          const day = utcDate.getUTCDate();

          const mstFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false,
          });
          const nowParts = mstFormatter.formatToParts(new Date());
          const nowYear = parseInt(nowParts.find(p => p.type === 'year')?.value || '0');
          const nowMonth = (parseInt(nowParts.find(p => p.type === 'month')?.value || '0')) - 1;
          const nowDay = parseInt(nowParts.find(p => p.type === 'day')?.value || '0');
          const nowHour = parseInt(nowParts.find(p => p.type === 'hour')?.value || '0');
          const nowMinute = parseInt(nowParts.find(p => p.type === 'minute')?.value || '0');
          const nowNumeric = nowYear * 100000000 + (nowMonth + 1) * 1000000 + nowDay * 10000 + nowHour * 100 + nowMinute;

          const timeStr: string = apt.time || '00:00:00';
          const [hStr, mStr] = timeStr.split(':');
          const aptHour = parseInt(hStr || '0', 10);
          const aptMinute = parseInt(mStr || '0', 10);
          const aptNumeric = year * 100000000 + (month + 1) * 1000000 + day * 10000 + aptHour * 100 + aptMinute;

          const isUpcoming = aptNumeric > nowNumeric;

          return {
            id: apt.id,
            supportWorker: apt.supportWorker || 'Support Worker',
            date: formattedDate,
            time: apt.time || '',
            type: apt.type || 'Video',
            status: apt.status === 'cancelled' ? 'cancelled' : (isUpcoming ? 'upcoming' : 'past'),
            mstNumeric: aptNumeric,
            meetingLink: apt.meetingLink || apt.meeting_link,
          } as Appointment;
        });

        // Choose next upcoming by smallest mstNumeric
        const upcomingList = transformed.filter(a => a.status === 'upcoming');
        if (upcomingList.length > 0) {
          const sorted = [...upcomingList].sort((a, b) => (a.mstNumeric || 0) - (b.mstNumeric || 0));
          const first = sorted[0];
          setUpcoming(first ?? null);
        } else {
          setUpcoming(null);
        }
      } else {
        setUpcoming(null);
      }
    } catch (e) {
      console.error('Error fetching upcoming appointment for video screen:', e);
      setUpcoming(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) fetchUpcoming();
  }, [user?.id, fetchUpcoming]);

  // Join meeting: route to pre-join with real params
  const handleJoinMeeting = () => {
    if (!upcoming) return;
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
  };

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <CurvedBackground>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </CurvedBackground>
      </SafeAreaView>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]}>
        <AppHeader title="Video Consultations" showBack={true} />

        {/* Main Content */}
        <ScrollView style={styles.scrollContent}>
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
                    style={[styles.joinButton, { backgroundColor: theme.colors.primary }]}
                    onPress={handleJoinMeeting}
                  >
                    <Ionicons name="videocam" size={20} color="#FFFFFF" />
                    <Text style={styles.joinButtonText}>Join Meeting</Text>
                  </TouchableOpacity>

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
    flex: 1,
    justifyContent: "center",
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
});