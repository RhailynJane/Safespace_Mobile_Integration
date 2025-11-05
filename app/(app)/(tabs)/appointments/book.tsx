/**
 * LLM Prompt: Add concise comments to this React Native component.
 * Reference: chat.deepseek.com
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Modal,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTheme } from "../../../../contexts/ThemeContext";
import activityApi from "../../../../utils/activityApi";
import StatusModal from "../../../../components/StatusModal";

/**
 * BookAppointment Component
 *
 * Initial screen for booking appointments that allows users to:
 * - Browse available support workers
 * - Search for specific support workers
 * - View support worker specialties and profiles
 * - Select a support worker to proceed with booking
 * Features an elegant curved background and intuitive interface.
 */

interface SupportWorker {
  id: number;
  name: string;
  title: string;
  avatar: string;
  specialties: string[];
  bio?: string;
  yearsOfExperience?: number;
  hourlyRate?: number;
  languagesSpoken?: string[];
}

export default function BookAppointment() {
  const { theme, scaledFontSize } = useTheme();
  // State management
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  // State for support workers
  const [supportWorkers, setSupportWorkers] = useState<SupportWorker[]>([]);

  // StatusModal states
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'success' | 'error' | 'info'>('info');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [statusModalMessage, setStatusModalMessage] = useState('');

  // Clerk authentication hooks
  const { signOut, isSignedIn } = useAuth();
  const { user } = useUser();

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  /**
   * Show status modal with given parameters
   */
  const showStatusModal = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    setStatusModalType(type);
    setStatusModalTitle(title);
    setStatusModalMessage(message);
    setStatusModalVisible(true);
  }, []);

  /**
   * Handles navigation to support worker details screen
   * @param supportWorkerId - ID of the selected support worker
   */
  const handleSelectSupportWorker = (supportWorkerId: number) => {
    router.push(`/appointments/details?supportWorkerId=${supportWorkerId}`);
  };

  // Fetch support workers on mount
// Fetch support workers on mount
// (moved below fetchSupportWorkers declaration)

/**
 * Fetch support workers from the API
 */
const fetchSupportWorkers = useCallback(async () => {
  try {
    setLoading(true);
    
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_URL}/api/support-workers`);
    const result = await response.json();

    if (result.success) {
      // Transform the data to match the component's expected format
      const transformedData = result.data.map((worker: any) => ({
        id: worker.id,
        name: `${worker.first_name} ${worker.last_name}`,
        title: "Support Worker",
        avatar: worker.avatar_url || "https://via.placeholder.com/150",
        specialties: worker.specialization 
          ? worker.specialization.split(',').map((s: string) => s.trim())
          : [],
        bio: worker.bio,
        yearsOfExperience: worker.years_of_experience,
        hourlyRate: worker.hourly_rate,
        languagesSpoken: worker.languages_spoken,
      }));

      setSupportWorkers(transformedData);
    } else {
      showStatusModal('error', 'Error', 'Failed to load support workers');
    }
  } catch (error) {
    console.error('Error fetching support workers:', error);
    showStatusModal('error', 'Error', 'Unable to fetch support workers. Please try again.');
  } finally {
    setLoading(false);
  }
}, [showStatusModal]);

// Fetch support workers on mount
useEffect(() => {
  fetchSupportWorkers();
}, [fetchSupportWorkers]);

  // Filter support workers based on search query
  const filteredSupportWorkers = supportWorkers.filter((sw) =>
    sw.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Bottom navigation tabs configuration
  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  /**
   * Handles bottom tab navigation
   * @param tabId - ID of the tab to navigate to
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  /**
   * Enhanced logout function with Clerk integration
   */
  const handleLogout = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      setSideMenuVisible(false);

      // Record logout activity
      if (user?.id) {
        try {
          await activityApi.recordLogout(user.id);
        } catch (_e) {
          // Continue with logout even if tracking fails
        }
      }

      await AsyncStorage.clear();
      if (signOut) {
        await signOut();
      }

      router.replace("/(auth)/login");
    } catch (error) {
      showStatusModal('error', 'Logout Failed', 'Unable to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  /**
   * Confirmation dialog for sign out
   */
  const confirmSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => { handleLogout(); } },
    ]);
  };

  // Side menu navigation items
  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        setSideMenuVisible(false);
        router.replace("/(app)/(tabs)/home");
      },
    },
    {
      icon: "person",
      title: "Profile",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/profile");
      },
    },
    {
      icon: "bar-chart",
      title: "Self-Assessment",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/self-assessment");
      },
    },
    {
      icon: "happy",
      title: "Mood Tracking",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/mood-tracking");
      },
    },
    {
      icon: "journal",
      title: "Journaling",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/journal");
      },
    },
    {
      icon: "library",
      title: "Resources",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/resources");
      },
    },
    {
      icon: "help-circle",
      title: "Crisis Support",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/crisis-support");
      },
    },
    {
      icon: "chatbubble",
      title: "Messages",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/messages");
      },
    },
    {
      icon: "calendar",
      title: "Appointments",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/appointments");
      },
    },
    {
      icon: "people",
      title: "Community Forum",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/community-forum");
      },
    },
    {
      icon: "videocam",
      title: "Video Consultations",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/video-consultations");
      },
    },
    {
      icon: "log-out",
      title: "Sign Out",
      onPress: confirmSignOut,
      disabled: isSigningOut,
    },
  ];

  /**
   * Gets display name from available user data
   * @returns String with user's display name or fallback
   */
  const getDisplayName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.fullName) return user.fullName.split(" ")[0];
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress.split("@")[0];
    }
    return "User";
  };

  const getUserEmail = () => {
    return (
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "No email available"
    );
  };

  // Show loading indicator if data is being fetched
  if (loading) {
    return (
      <CurvedBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <AppHeader title="Book Appointment" showBack={true} />

        <ScrollView 
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Schedule a session with a support worker
          </Text>

    {/* Step Indicator - Shows progress through booking process */}
    <View style={styles.stepsContainer}>
      <View style={styles.stepRow}>
        {/* Step 1 - Active (Current Step) */}
        <View style={[
          styles.stepCircle, 
          styles.stepCircleActive,
          { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
        ]}>
          <Text style={[styles.stepNumber, styles.stepNumberActive]}>
            1
          </Text>
        </View>
        <View style={[styles.stepConnector, { backgroundColor: theme.colors.border }]} />

        {/* Step 2 - Inactive */}
        <View style={[
          styles.stepCircle,
          { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }
        ]}>
          <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>2</Text>
        </View>
        <View style={[styles.stepConnector, { backgroundColor: theme.colors.border }]} />

        {/* Step 3 - Inactive */}
        <View style={[
          styles.stepCircle,
          { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }
        ]}>
          <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>3</Text>
        </View>
        <View style={[styles.stepConnector, { backgroundColor: theme.colors.border }]} />

        {/* Step 4 - Inactive */}
        <View style={[
          styles.stepCircle,
          { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }
        ]}>
          <Text style={[styles.stepNumber, { color: theme.colors.primary }]}>4</Text>
        </View>
      </View>
    </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.icon}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder="Search support worker..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Support Workers List */}
          {filteredSupportWorkers.map((supportWorker) => (
            <TouchableOpacity
              key={supportWorker.id}
              style={[styles.supportWorkerCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => handleSelectSupportWorker(supportWorker.id)}
            >
              {/* Support Worker Avatar and Info */}
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: supportWorker.avatar }}
                  style={styles.avatar}
                />
                <View style={styles.supportWorkerInfo}>
                  <Text style={[styles.supportWorkerName, { color: theme.colors.text }]}>
                    {supportWorker.name}
                  </Text>
                  <Text style={[styles.supportWorkerTitle, { color: theme.colors.textSecondary }]}>
                    {supportWorker.title}
                  </Text>
                </View>
              </View>

              {/* Support Worker Specialties */}
              <View style={styles.specialtiesContainer}>
              {supportWorker.specialties.map((specialty: string) => (
                <Text key={specialty} style={styles.specialtyText}>
                  {specialty}
                </Text>
              ))}
              </View>

              {/* Selection Prompt */}
              <Text style={[styles.selectText, { color: theme.colors.text }]}>Select Support Worker</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Side Menu Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={sideMenuVisible}
          onRequestClose={() => setSideMenuVisible(false)}
        >
          <View style={styles.modalContainer}>
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setSideMenuVisible(false)}
            />
            <View style={[styles.sideMenu, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.sideMenuHeader, { borderBottomColor: theme.colors.borderLight }]}>
                <Text style={[styles.profileName, { color: theme.colors.text }]}>{getDisplayName()}</Text>
                <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>{getUserEmail()}</Text>
              </View>
              <ScrollView style={styles.sideMenuContent}>
                {sideMenuItems.map((item, index) => (
                  <TouchableOpacity
                    key={item.title}
                    style={[
                      styles.sideMenuItem,
                      { borderBottomColor: theme.colors.borderLight },
                      item.disabled && styles.sideMenuItemDisabled,
                    ]}
                    onPress={item.onPress}
                    disabled={item.disabled}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.disabled ? theme.colors.iconDisabled : (item.title === "Sign Out" ? theme.colors.error : theme.colors.icon)}
                    />
                    <Text
                      style={[
                        styles.sideMenuItemText,
                        { color: theme.colors.text },
                        item.disabled && styles.sideMenuItemTextDisabled,
                        item.title === "Sign Out" && { color: theme.colors.error },
                      ]}
                    >
                      {item.title}
                      {item.title === "Sign Out" && isSigningOut && "..."}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Status Modal */}
        <StatusModal
          visible={statusModalVisible}
          type={statusModalType}
          title={statusModalTitle}
          message={statusModalMessage}
          onClose={() => setStatusModalVisible(false)}
        />

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

const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  sideMenuItemDisabled: {
    opacity: 0.5,
  },
  sideMenuItemTextDisabled: {
    // color handled by iconDisabled in inline override
  },
  signOutText: {
    // color handled by theme.colors.error in inline override
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  supportWorkerCard: {
    // backgroundColor moved to theme.colors.surface via inline override
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
    color: "#2E7D32",
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
    // backgroundColor moved to theme.colors.surface via inline override
    height: "100%",
  },
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    // borderBottomColor moved to theme.colors.borderLight via inline override
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
    // color moved to theme.colors.text via inline override
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: scaledFontSize(14),
    // color moved to theme.colors.textSecondary via inline override
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
    // borderBottomColor moved to theme.colors.borderLight via inline override
  },
  sideMenuItemText: {
    fontSize: scaledFontSize(16),
    // color moved to theme.colors.text via inline override
    marginLeft: 15,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    width: "100%",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#4CAF50",
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  title: {
    fontSize: scaledFontSize(15),
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
    textAlign: "center",
    marginTop: 16,
  },
  stepsContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 16,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
  },
  stepNumber: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
  },
  stepNumberActive: {
    color: "white", 
  },
  stepConnector: {
    width: 40,
    height: 2,

    marginHorizontal: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor moved to theme via inline override
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: scaledFontSize(16),
    // color moved to theme via inline override
  },
  supportWorkerName: {
    fontSize: scaledFontSize(18),
    fontWeight: "600",
    // color moved to theme via inline override
    marginBottom: 4,
  },
  supportWorkerNameHeading: {
    fontSize: scaledFontSize(20),
    fontWeight: "600",
    color: "#333",
    marginBottom: 24,
    textAlign: "center",
  },
  supportWorkerTitle: {
    fontSize: scaledFontSize(14),
    // color moved to theme via inline override
    marginBottom: 0,
  },
  specialtiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 8,
  },
  specialtyText: {
    backgroundColor: "#d0cad8ff",
    color: "#333333",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    fontSize: scaledFontSize(12),
    fontWeight: "500",
  },
  selectText: {
    // color moved to theme via inline override
    fontWeight: "600",
    textAlign: "center",
    fontSize: scaledFontSize(14),
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  supportWorkerInfo: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
});