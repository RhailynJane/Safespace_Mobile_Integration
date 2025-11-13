/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
// Note: No longer using FileSystem.uploadAsync; using fetch + FormData
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, useUser } from "@clerk/clerk-expo";
import CurvedBackground from "../../../../components/CurvedBackground";
import BottomNavigation from "../../../../components/BottomNavigation";
import { useTheme } from "../../../../contexts/ThemeContext";
import activityApi from "../../../../utils/activityApi";
import OptimizedImage from "../../../../components/OptimizedImage";
import StatusModal from "../../../../components/StatusModal";
import { useConvex, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

const IS_TEST_ENV = process.env.NODE_ENV === 'test';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  location?: string;
  profileImageUrl?: string;
}

export default function ProfileScreen() {
  const IS_TEST_ENV =
    typeof process !== 'undefined' &&
    process.env &&
    (process.env.JEST_WORKER_ID != null || process.env.NODE_ENV === 'test');
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    location: "",
  });
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    message: '',
  });

  const { signOut, getToken } = useAuth();
  const { user } = useUser();
  const { theme, scaledFontSize } = useTheme();

  // Convex client
  const convex = useConvex();
  const convexProfile = useQuery(
    api.profiles.getFullProfile as any,
    user?.id ? { clerkId: user.id } : (undefined as any)
  ) as any;

  // Week range for activity summary
  const { weekStartISO, weekEndISO } = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day; // Monday as start
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() + diffToMonday);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { weekStartISO: start.toISOString(), weekEndISO: end.toISOString() };
  }, []);

  // Live metrics
  const journalHistory = useQuery(
    api.journal.getHistory as any,
    user?.id
      ? { clerkUserId: user.id, startDate: weekStartISO, endDate: weekEndISO }
      : (undefined as any)
  ) as any;

  const upcomingAppointments = useQuery(
    api.appointments.getUpcomingAppointments as any,
    user?.id ? { userId: user.id, limit: 20 } : (undefined as any)
  ) as any;

  const myPosts = useQuery(
    api.posts.myPosts as any,
    user?.id ? { includeDrafts: false, limit: 100 } : (undefined as any)
  ) as any;

  const moodStats = useQuery(
    api.moods.getMoodStats as any,
    user?.id ? { userId: user.id, days: 7 } : (undefined as any)
  ) as any;

  const activitySummary = useMemo(() => {
    const journals = journalHistory?.entries?.length ?? 0;
    const appointments = Array.isArray(upcomingAppointments) ? upcomingAppointments.length : 0;
    const myPostsCount = Array.isArray(myPosts) ? myPosts.length : 0;
    const moodCheckIns = moodStats?.totalEntries ?? 0;
    return { journals, appointments, myPostsCount, moodCheckIns };
  }, [journalHistory, upcomingAppointments, myPosts, moodStats]);

  const profileCompleteness = useMemo(() => {
    const checks = [
      !!(profileData.profileImageUrl || convexProfile?.profileImageUrl || user?.imageUrl),
      !!(profileData.location || convexProfile?.location),
      !!(profileData.phoneNumber || convexProfile?.phoneNumber || user?.phoneNumbers?.[0]?.phoneNumber),
    ];
    const completed = checks.filter(Boolean).length;
    const percent = Math.round((completed / checks.length) * 100);
    return { completed, total: checks.length, percent };
  }, [profileData, convexProfile, user]);

  // Create styles dynamically based on text size
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const showModal = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    setModalConfig({ type, title, message });
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
  };

  // Sync profile data when component mounts or user changes
  useEffect(() => {
    // In tests, avoid async network/storage work and hydrate from Clerk mock
    if (IS_TEST_ENV) {
      if (user) {
        setProfileData(prev => ({
          ...prev,
          firstName: user.firstName || prev.firstName || 'User',
          lastName: user.lastName || prev.lastName || '',
          email: user.emailAddresses[0]?.emailAddress || prev.email || '',
          profileImageUrl: user.imageUrl || prev.profileImageUrl,
        }));
      }
      setLoading(false);
      return;
    }
    
    // ✅ Primary: Use Convex profile with real-time updates
    if (convexProfile && user) {
      console.log('✅ Using Convex profile data (real-time)');
      setProfileData({
        firstName: user.firstName || convexProfile.firstName || 'User',
        lastName: user.lastName || convexProfile.lastName || '',
        email: user.emailAddresses?.[0]?.emailAddress || convexProfile.email || '',
        phoneNumber: convexProfile.phoneNumber || '',
        location: convexProfile.location || '',
        profileImageUrl: convexProfile.profileImageUrl || user.imageUrl || '',
      });
      setLoading(false);
      return;
    }
    
    // ✅ Final fallback: Load from AsyncStorage and sync with Convex
    const loadProfileData = async () => {
      if (!user?.id) {
        console.log("❌ No user available");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("📋 Loading profile data...");

        // Try to upsert base user row in Convex users table
        if (user?.id) {
          try {
            await convex.mutation(api.auth.syncUser, {
              email: user.emailAddresses?.[0]?.emailAddress,
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
              imageUrl: user.imageUrl || undefined,
            });
          } catch (syncError) {
            console.error("⚠️ Convex sync failed, using local data:", syncError);
          }
        }

        // Load from AsyncStorage as fallback
        try {
          const savedProfileData = await AsyncStorage.getItem("profileData");
          const savedImage = await AsyncStorage.getItem("profileImage");
          
          if (savedProfileData) {
            const parsedData = JSON.parse(savedProfileData);
            setProfileData({
              firstName: user.firstName || parsedData.firstName || "User",
              lastName: user.lastName || parsedData.lastName || "",
              email: user.emailAddresses[0]?.emailAddress || parsedData.email || "",
              phoneNumber: parsedData.phoneNumber || "",
              location: parsedData.location || "",
              profileImageUrl: savedImage || parsedData.profileImageUrl || user.imageUrl || "",
            });
          } else {
            // No local data, use Clerk data
            setProfileData({
              firstName: user.firstName || "User",
              lastName: user.lastName || "",
              email: user.emailAddresses[0]?.emailAddress || "",
              phoneNumber: user.phoneNumbers?.[0]?.phoneNumber || "",
              location: "",
              profileImageUrl: user.imageUrl || "",
            });
          }
        } catch (storageError) {
          console.error("Error loading from AsyncStorage:", storageError);
          // Final fallback: Clerk data only
          setProfileData({
            firstName: user.firstName || "User",
            lastName: user.lastName || "",
            email: user.emailAddresses[0]?.emailAddress || "",
            phoneNumber: user.phoneNumbers?.[0]?.phoneNumber || "",
            location: "",
            profileImageUrl: user.imageUrl || "",
          });
        }
      } catch (error) {
        console.error("❌ Error loading profile:", error);
        showModal('error', 'Load Failed', 'Unable to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [IS_TEST_ENV, user, convexProfile, convex]);

  const handleChangePhoto = useCallback(async () => {
    try {
      if (!user?.id) return;
      setIsUploadingPhoto(true);

      // Request permission (iOS/Android) and pick image
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showModal('error', 'Permission Required', 'We need access to your photos to change your profile picture.\n\nOn iOS: Settings > App > Photos.\nOn Android: Settings > Apps > Permissions.');
        setIsUploadingPhoto(false);
        return;
      }

      const pick = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaType?.image ?? ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (pick.canceled) {
        setIsUploadingPhoto(false);
        return;
      }

      const asset = pick.assets?.[0];
      if (!asset?.uri) {
        setIsUploadingPhoto(false);
        return;
      }

      // Optional: compress/resize to 512x512
      const manip = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Get Convex upload URL
      const { uploadUrl } = await convex.action(api.storage.generateUploadUrl as any);

      // Upload via fetch + blob (same as edit screen)
      const response = await fetch(manip.uri);
      const blob = await response.blob();
      const uploadResp = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });
      if (!uploadResp.ok) {
        throw new Error(`Upload failed (${uploadResp.status})`);
      }
      const uploadJson: any = await uploadResp.json();
      const storageId: string | undefined = uploadJson?.storageId;

      if (!storageId) {
        throw new Error('Upload failed: missing storageId');
      }

      // Update profile image from storage id
      await convex.mutation(api.profiles.updateProfileImageFromStorage as any, {
        clerkId: user.id,
        storageId,
      });

      // Refresh full profile to get the public URL and persist offline
      try {
        const updated = await (convex as any).query(api.profiles.getFullProfile as any, { clerkId: user.id });
        const url = updated?.profileImageUrl || updated?.imageUrl;
        if (url) {
          await AsyncStorage.setItem('profileImage', url);
          setProfileData((prev) => ({ ...prev, profileImageUrl: url }));
        }
      } catch (e) {
        // non-blocking
      }

      showModal('success', 'Photo Updated', 'Your profile photo has been updated.');
    } catch (err) {
      console.error('Change photo error:', err);
      showModal('error', 'Update Failed', 'Could not update your photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  }, [user, convex]);

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const handleLogout = async () => {
    if (!user) {
      router.navigate("/(auth)/login");
      return;
    }

    try {
      setIsLoggingOut(true);
      console.log('Signout initiated...');
      
      // Get current user info before signing out
      const clerkUserId = user.id;
    
      // Record logout activity
      if (clerkUserId) {
        try {
          await activityApi.recordLogout(clerkUserId);
          console.log('Logout activity recorded');
        } catch (dbError) {
          console.error('Failed to record logout activity:', dbError);
          // Continue with logout even if tracking fails
        }
      }
    
      await AsyncStorage.clear();
      console.log('AsyncStorage cleared');
    
      if (signOut) {
        await signOut();
        console.log('Clerk signout successful');
      }
    
      showModal('success', 'Signed Out', 'You have been successfully signed out.');
      
      // Navigate after a brief delay to show success message
      setTimeout(() => {
        router.navigate("/(auth)/login");
      }, 1500);
    
    } catch (error) {
      console.error("Signout error:", error);
      showModal('error', 'Sign Out Failed', 'There was a problem signing out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const getFullName = () => {
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`.trim();
    }
    return profileData.firstName || "User";
  };

  const getInitials = () => {
    const firstName = profileData.firstName || "";
    const lastName = profileData.lastName || "";

    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }

    return "U";
  };

  if (loading) {
    return (
      <CurvedBackground>
        <SafeAreaView testID="profile-screen" style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </CurvedBackground>
    );
  }

  return (
    <CurvedBackground>
      <SafeAreaView testID="profile-screen" style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView testID="profile-scroll-view" contentContainerStyle={[styles.scrollContainer, { paddingBottom: 120 }]}>
          {/* Profile Information Section */}
          <View style={[styles.profileSection, { backgroundColor: theme.colors.surface }]}> 
            <View style={styles.avatarWrapper}>
              {profileData.profileImageUrl ? (
                <OptimizedImage
                  source={{ uri: profileData.profileImageUrl }}
                  style={styles.profileImageLarge}
                  cache="force-cache"
                  loaderSize="large"
                  loaderColor={theme.colors.primary}
                  showErrorIcon={false}
                  testID="user-avatar"
                />
              ) : (
                <View testID="user-avatar" style={[styles.profileInitialsLarge, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.initialsTextLarge}>{getInitials()}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.changePhotoBtn, { backgroundColor: theme.colors.primary, opacity: isUploadingPhoto ? 0.7 : 1 }]}
                onPress={handleChangePhoto}
                accessibilityLabel="Change photo"
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="camera" size={16} color="#fff" />
                    <Text style={styles.changePhotoText}>Change</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.name, { color: theme.colors.text }]}>{getFullName()}</Text>
            <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{profileData.email}</Text>
            {profileData.location && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={14} color={theme.colors.icon} />
                <Text style={[styles.location, { color: theme.colors.textSecondary }]}>{profileData.location}</Text>
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={[styles.quickAction, { backgroundColor: "#EEF4FF" }]} onPress={() => router.push("/profile/edit")}>
                <Ionicons name="create-outline" size={18} color="#3B82F6" />
                <Text style={styles.quickActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: "#ECFDF5" }]}
                onPress={async () => {
                  try {
                    await Share.share({
                      message: `My SafeSpace profile: ${getFullName()}`,
                      title: "Share Profile",
                    });
                  } catch (e) { /* ignore share errors */ }
                }}
              >
                <Ionicons name="share-social-outline" size={18} color="#10B981" />
                <Text style={styles.quickActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Activity Summary */}
          <View style={[styles.summarySection, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Activity Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={[styles.kpiCard, { backgroundColor: "#EEF2FF" }]}>
                <Text style={styles.kpiValue}>{activitySummary.journals}</Text>
                <Text style={styles.kpiLabel}>Journals this week</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: "#ECFDF5" }]}>
                <Text style={styles.kpiValue}>{activitySummary.appointments}</Text>
                <Text style={styles.kpiLabel}>Upcoming appointments</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: "#FFF7ED" }]}>
                <Text style={styles.kpiValue}>{activitySummary.myPostsCount}</Text>
                <Text style={styles.kpiLabel}>My posts</Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: "#F3F4F6" }]}>
                <Text style={styles.kpiValue}>{activitySummary.moodCheckIns}</Text>
                <Text style={styles.kpiLabel}>Mood check-ins</Text>
              </View>
            </View>
          </View>

          {/* Profile Completeness */}
          <View style={[styles.completenessSection, { backgroundColor: theme.colors.surface }]}> 
            <View style={styles.completenessHeader}> 
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Profile Completeness</Text>
              <Text style={[styles.completenessPercent, { color: theme.colors.text }]}>{profileCompleteness.percent}%</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: '#E5E7EB' }]}> 
              <View style={[styles.progressFill, { width: `${profileCompleteness.percent}%`, backgroundColor: theme.colors.primary }]} />
            </View>
            <Text style={[styles.completenessHelp, { color: theme.colors.textSecondary }]}>Add a photo, location and phone to complete your profile.</Text>
          </View>

          {/* Menu Items Section */}
          <View style={[styles.menuSection, { backgroundColor: theme.colors.surface }]}> 
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.colors.borderLight }]}
              onPress={() => router.push("/profile/edit")}
              testID="edit-profile-button"
            >
              <View style={[styles.iconBadge, { backgroundColor: '#EEF4FF' }]}> 
                <Ionicons name="person-outline" size={20} color="#3B82F6" />
              </View>
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.colors.borderLight }]}
              onPress={() => router.push("/profile/settings")}
              testID="settings-option"
            >
              <View style={[styles.iconBadge, { backgroundColor: '#ECFDF5' }]}> 
                <Ionicons name="settings-outline" size={20} color="#10B981" />
              </View>
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.icon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.colors.borderLight }]}
              onPress={() => router.push("/profile/help-support")}
              testID="help-support-option"
            >
              <View style={[styles.iconBadge, { backgroundColor: '#FEF3C7' }]}> 
                <Ionicons name="help-circle-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleLogout}
            disabled={isLoggingOut}
            testID="logout-button"
          >
            {isLoggingOut ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <Text style={styles.signOutText}>Sign Out</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />

        <StatusModal
          visible={modalVisible}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          onClose={hideModal}
          buttonText="OK"
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

// Styles function that accepts scaledFontSize for dynamic text sizing
const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: scaledFontSize(16), // Base size 16px
    color: "#666",
  },
  profileSection: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 24,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 50,
  },
  avatarWrapper: {
    position: 'relative',
    width: 110,
    height: 110,
    marginBottom: 12,
  },
  profileImageLarge: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  profileInitialsLarge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsTextLarge: {
    fontSize: scaledFontSize(40),
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: -10,
    right: 4,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: scaledFontSize(12),
    marginLeft: 4,
  },
  name: {
    fontSize: scaledFontSize(20), // Base size 20px
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  email: {
    fontSize: scaledFontSize(14), // Base size 14px
    color: "#666",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  location: {
    fontSize: scaledFontSize(14), // Base size 14px
    color: "#666",
    marginLeft: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  quickAction: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickActionText: {
    fontSize: scaledFontSize(14),
    color: '#111827',
  },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: scaledFontSize(16),
    fontWeight: '600',
    marginBottom: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  kpiValue: {
    fontSize: scaledFontSize(20),
    fontWeight: '700',
    color: '#111827',
  },
  kpiLabel: {
    marginTop: 2,
    fontSize: scaledFontSize(12),
    color: '#4B5563',
  },
  completenessSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  completenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completenessPercent: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  completenessHelp: {
    marginTop: 8,
    fontSize: scaledFontSize(12),
  },
  menuSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: scaledFontSize(16), // Base size 16px
    color: "#333",
    marginLeft: 15,
  },
  signOutButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutText: {
    fontSize: scaledFontSize(16),
    fontWeight: "600",
    color: "#FF6B6B",
  },
});