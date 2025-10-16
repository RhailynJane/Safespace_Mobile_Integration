/* eslint-disable react-hooks/exhaustive-deps */
// app/(app)/(tabs)/profile/settings.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import CurvedBackground from "../../../../components/CurvedBackground";
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import settingsAPI, { UserSettings } from "../../../../utils/settingsApi";

/**
 * SettingsScreen Component
 * 
 * Comprehensive settings screen with backend integration for
 * display, privacy, and notification settings.
 */
export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);

  // Settings state - simplified based on requirements
  const [darkMode, setDarkMode] = useState(false);
  const [textSize, setTextSize] = useState("Medium");
  const [autoLockTimer, setAutoLockTimer] = useState("5 minutes");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStartTime, setQuietStartTime] = useState("22:00");
  const [quietEndTime, setQuietEndTime] = useState("08:00");
  const [reminderFrequency, setReminderFrequency] = useState("Daily");

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community-forum", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Load settings from backend on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Save settings to backend whenever they change (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveSettings();
    }, 500); // Debounce to avoid too many API calls

    return () => clearTimeout(timeoutId);
  }, [
    darkMode, textSize, autoLockTimer,
    notificationsEnabled, quietHoursEnabled, quietStartTime, 
    quietEndTime, reminderFrequency
  ]);

  /**
   * Loads settings from backend API
   */
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await settingsAPI.fetchSettings();
      
      // Apply all saved settings
      setDarkMode(settings.darkMode);
      setTextSize(settings.textSize);
      setAutoLockTimer(settings.autoLockTimer);
      setNotificationsEnabled(settings.notificationsEnabled);
      setQuietHoursEnabled(settings.quietHoursEnabled);
      setQuietStartTime(settings.quietStartTime);
      setQuietEndTime(settings.quietEndTime);
      setReminderFrequency(settings.reminderFrequency);

      // Apply dark mode globally immediately
      applyDarkMode(settings.darkMode);
      
    } catch (error) {
      console.log('Error loading settings:', error);
      Alert.alert("Error", "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Saves settings to backend API
   */
  const saveSettings = async () => {
    try {
      const settings: UserSettings = {
        darkMode,
        textSize,
        autoLockTimer,
        notificationsEnabled,
        quietHoursEnabled,
        quietStartTime,
        quietEndTime,
        reminderFrequency,
      };

      await settingsAPI.saveSettings(settings);
      
      // Apply dark mode globally when it changes
      applyDarkMode(darkMode);
      
    } catch (error) {
      console.log('Error saving settings:', error);
      // Don't show alert for every auto-save to avoid annoying the user
    }
  };

  /**
   * Applies dark mode globally across the app
   */
  const applyDarkMode = async (isDark: boolean) => {
    try {
      // Save to local storage for immediate access
      await AsyncStorage.setItem('appDarkMode', JSON.stringify(isDark));
      
      // You can also trigger a global theme update here
      // This would depend on your app's theme system
      console.log('Dark mode applied:', isDark);
      
    } catch (error) {
      console.log('Error applying dark mode:', error);
    }
  };

  /**
   * Handles tab navigation
   */
  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else if (tabId === "profile") {
      router.back();
    } else if (tabId === "messages") {
      router.push("/(app)/(tabs)/messages");
    } else if (tabId === "appointments") {
      router.push("/(app)/(tabs)/appointments");
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const textSizeOptions = ["Small", "Medium", "Large", "Extra Large"];
  const autoLockOptions = ["Immediate", "1 minute", "5 minutes", "15 minutes", "Never"];
  const reminderFrequencyOptions = ["Never", "Daily", "Twice daily", "Weekly"];

  // Define theme colors - now applied globally
  const theme = {
    colors: {
      background: darkMode ? "#121212" : "#F5F5F5",
      surface: darkMode ? "#1E1E1E" : "#FFFFFF",
      text: darkMode ? "#FFFFFF" : "#333",
      textSecondary: darkMode ? "#B3B3B3" : "#666",
      textDisabled: darkMode ? "#666" : "#999",
      border: darkMode ? "#333" : "#E0E0E0",
      borderLight: darkMode ? "#2A2A2A" : "#F0F0F0",
      icon: darkMode ? "#B3B3B3" : "#666",
      iconDisabled: darkMode ? "#666" : "#999",
      primary: "#4CAF50",
      accent: "#7FDBDA",
      error: "#FF6B6B",
    }
  };

  /**
   * Renders a toggle switch row
   */
  const renderToggleRow = (
    title: string, 
    subtitle: string, 
    value: boolean, 
    onToggle: (value: boolean) => void, 
    icon: keyof typeof Ionicons.glyphMap, 
    disabled = false
  ) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.colors.borderLight }, disabled && styles.disabledRow]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color={disabled ? theme.colors.iconDisabled : theme.colors.icon} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: disabled ? theme.colors.textDisabled : theme.colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.settingSubtitle, { color: disabled ? theme.colors.textDisabled : theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor="#FFFFFF"
        disabled={disabled}
      />
    </View>
  );

  /**
   * Renders a picker row with options
   */
  const renderPickerRow = (
    title: string, 
    subtitle: string, 
    value: string, 
    options: string[], 
    onSelect: (value: string) => void, 
    icon: keyof typeof Ionicons.glyphMap, 
    disabled = false
  ) => (
    <TouchableOpacity 
      style={[styles.settingRow, { borderBottomColor: theme.colors.borderLight }, disabled && styles.disabledRow]}
      onPress={() => {
        if (disabled) return;
        Alert.alert(
          title,
          "Select an option:",
          [
            ...options.map(option => ({
              text: option,
              onPress: () => onSelect(option),
            })),
            { text: "Cancel", style: "cancel" as const }
          ]
        );
      }}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color={disabled ? theme.colors.iconDisabled : theme.colors.icon} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: disabled ? theme.colors.textDisabled : theme.colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.settingSubtitle, { color: disabled ? theme.colors.textDisabled : theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        </View>
      </View>
      <View style={styles.settingRight}>
        <Text style={[styles.settingValue, { color: disabled ? theme.colors.textDisabled : theme.colors.textSecondary }]}>
          {value}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={disabled ? theme.colors.iconDisabled : theme.colors.icon} />
      </View>
    </TouchableOpacity>
  );

  /**
   * Renders time input row for quiet hours
   */
  const renderTimeInputRow = (
    title: string,
    subtitle: string,
    startValue: string,
    endValue: string,
    onStartChange: (text: string) => void,
    onEndChange: (text: string) => void,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.colors.borderLight }]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color={theme.colors.icon} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.timeInputContainer}>
        <TextInput
          style={[styles.timeInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text }]}
          value={startValue}
          onChangeText={onStartChange}
          placeholder="22:00"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Text style={[styles.timeSeparator, { color: theme.colors.text }]}>to</Text>
        <TextInput
          style={[styles.timeInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text }]}
          value={endValue}
          onChangeText={onEndChange}
          placeholder="08:00"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>
    </View>
  );

  return (
    <CurvedBackground>
      <SafeAreaView style={styles.container}>
        <AppHeader title="Profile Settings" showBack={true} />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Display & Accessibility */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Display & Accessibility</Text>
            
            {renderToggleRow(
              "Dark Mode",
              "Switch between light and dark themes for the entire app",
              darkMode,
              setDarkMode,
              "moon"
            )}

            {renderPickerRow(
              "Text Size",
              "Adjust text size for better readability",
              textSize,
              textSizeOptions,
              setTextSize,
              "text"
            )}
          </View>

          {/* Privacy & Security */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Privacy & Security</Text>

            {renderPickerRow(
              "Auto-Lock Timer",
              "Automatically lock app after inactivity",
              autoLockTimer,
              autoLockOptions,
              setAutoLockTimer,
              "time"
            )}
          </View>

          {/* Notifications */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Notifications</Text>

            {renderToggleRow(
              "Enable Notifications",
              "Receive reminders and check-ins",
              notificationsEnabled,
              setNotificationsEnabled,
              "notifications"
            )}

            {renderToggleRow(
              "Quiet Hours",
              "No notifications during specified times",
              quietHoursEnabled,
              setQuietHoursEnabled,
              "moon"
            )}

            {quietHoursEnabled && (
              <View style={styles.nestedSettings}>
                {renderTimeInputRow(
                  "Quiet Hours Time",
                  "Set start and end time for quiet hours",
                  quietStartTime,
                  quietEndTime,
                  setQuietStartTime,
                  setQuietEndTime,
                  "time"
                )}
              </View>
            )}

            {renderPickerRow(
              "Reminder Frequency",
              "How often to receive wellness reminders",
              reminderFrequency,
              reminderFrequencyOptions,
              setReminderFrequency,
              "repeat"
            )}
          </View>

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                Loading settings...
              </Text>
            </View>
          )}
        </ScrollView>

        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </SafeAreaView>
    </CurvedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  section: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  disabledRow: {
    opacity: 0.5,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: 14,
    marginRight: 8,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    width: 60,
    textAlign: "center" as const,
  },
  timeSeparator: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  enabledIndicator: {
    backgroundColor: "#E8F5E8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enabledText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  nestedSettings: {
    marginLeft: 32,
    paddingTop: 8,
  },
  loadingContainer: {
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    fontStyle: "italic",
  },
});

const bottomNavStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 16,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    alignItems: "center",
    padding: 8,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
  },
});