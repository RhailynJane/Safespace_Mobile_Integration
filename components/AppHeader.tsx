// File: components/AppHeader.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

export interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  rightActions?: React.ReactNode;
  onMenuPress?: () => void;
}

export const AppHeader = ({
  title,
  showBack = false,
  showMenu = true,
}: AppHeaderProps) => {
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { logout, user, profile } = useAuth();

  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem(`profileImage_${user?.uid}`);
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.log('Error loading profile image:', error);
    }
  };

  const getInitials = () => {
    const firstName = profile?.firstName || "";
    const lastName = profile?.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  useEffect(() => {
    loadProfileImage();
  }, [user?.uid]);

  const sideMenuItems = [
    {
      icon: "home",
      title: "Dashboard",
      onPress: () => {
        setSideMenuVisible(false);
        router.push("/(app)/(tabs)/home");
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
        router.push("/journaling");
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
        router.push("/community-forum");
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
      onPress: async () => {
        try {
          setSideMenuVisible(false);
          await logout();
        } catch (error) {
          console.error("Sign out error:", error);
        }
      },
    },
  ];

  return (
    <>
      <View style={styles.header}>
        {/* Profile Image/Back Button */}
        <TouchableOpacity 
          onPress={showBack ? () => router.back() : () => router.push("/(app)/(tabs)/profile/edit")}
          style={styles.profileImageContainer}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <Text style={styles.initialsText}>{getInitials()}</Text>
          )}
        </TouchableOpacity>

        {/* Right Actions */}
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={24} color="#666" />
          </TouchableOpacity>
          {showMenu ? (
            <TouchableOpacity onPress={() => setSideMenuVisible(true)}>
              <Ionicons name="grid" size={24} color="#666" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity>
              <Ionicons name="grid" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
          <View style={styles.sideMenu}>
            <View style={styles.sideMenuHeader}>
              <Text style={styles.sideMenuTitle}>Menu</Text>
              <TouchableOpacity
                onPress={() => setSideMenuVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sideMenuContent}>
              {sideMenuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.sideMenuItem}
                  onPress={item.onPress}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={Colors.primary}
                  />
                  <Text style={styles.sideMenuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: "#7BB8A8",
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  initialsText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
    backgroundColor: Colors.surface,
    height: "100%",
  },
  sideMenuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceSecondary,
  },
  sideMenuTitle: {
    ...Typography.title,
    fontSize: 18,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  sideMenuContent: {
    padding: Spacing.md,
  },
  sideMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceSecondary,
  },
  sideMenuItemText: {
    ...Typography.body,
    marginLeft: Spacing.md,
  },
});