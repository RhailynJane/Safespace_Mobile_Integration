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
  useColorScheme,
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

  // Settings state
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

  // Apply settings when they change
  useEffect(() => {
    applySettings();
  }, [darkMode, textSize, autoLockTimer]);

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
      console.log('Settings saved successfully');
      
    } catch (error) {
      console.log('Error saving settings:', error);
      Alert.alert("Error", "Failed to save settings");
    }
  };

  /**
   * Applies all settings globally
   */
  const applySettings = async () => {
    try {
      // Apply dark mode globally
      await applyDarkMode(darkMode);
      
      // Apply text size globally
      await applyTextSize(textSize);
      
      // Apply auto-lock timer
      await applyAutoLockTimer(autoLockTimer);
      
    } catch (error) {
      console.log('Error applying settings:', error);
    }
  };

  /**
   * Applies dark mode globally across the app
   */
  const applyDarkMode = async (isDark: boolean) => {
    try {
      // Save to local storage for immediate access
      await AsyncStorage.setItem('appDarkMode', JSON.stringify(isDark));
      
      // Apply to entire app - you might need to modify this based on your app structure
      // This would typically involve a context or global state management
      console.log('Dark mode applied globally:', isDark);
      
      // Force re-render of all components to apply theme
      // You might need to implement a theme context for this
      
    } catch (error) {
      console.log('Error applying dark mode:', error);
    }
  };

  /**
   * Applies text size globally
   */
  const applyTextSize = async (size: string) => {
    try {
      await AsyncStorage.setItem('appTextSize', size);
      
      // Calculate font scale based on text size
      let fontScale = 1.0;
      switch (size) {
        case "Small":
          fontScale = 0.9;
          break;
        case "Medium":
          fontScale = 1.5;
          break;
        case "Large":
          fontScale = 2;
          break;
    
      }
      
      await AsyncStorage.setItem('appFontScale', JSON.stringify(fontScale));
      console.log('Text size applied:', size, 'Scale:', fontScale);
      
    } catch (error) {
      console.log('Error applying text size:', error);
    }
  };

  /**
   * Applies auto-lock timer
   */
  const applyAutoLockTimer = async (timer: string) => {
    try {
      await AsyncStorage.setItem('appAutoLockTimer', timer);
      
      // Convert timer to milliseconds
      let lockTimeMs = 0;
      switch (timer) {
        case "Immediate":
          lockTimeMs = 0;
          break;
        case "1 minute":
          lockTimeMs = 60 * 1000;
          break;
        case "5 minutes":
          lockTimeMs = 5 * 60 * 1000;
          break;
        case "15 minutes":
          lockTimeMs = 15 * 60 * 1000;
          break;
        case "Never":
          lockTimeMs = -1;
          break;
      }
      
      await AsyncStorage.setItem('appAutoLockTimeMs', JSON.stringify(lockTimeMs));
      console.log('Auto-lock timer applied:', timer, 'MS:', lockTimeMs);
      
    } catch (error) {
      console.log('Error applying auto-lock timer:', error);
    }
  };

  /**
   * Handles dark mode toggle with immediate feedback
   */
  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    // Apply immediately
    applyDarkMode(value);
  };

  /**
   * Handles text size change with immediate feedback
   */
  const handleTextSizeChange = (size: string) => {
    setTextSize(size);
    // Apply immediately
    applyTextSize(size);
  };

  /**
   * Handles auto-lock timer change with immediate feedback
   */
  const handleAutoLockTimerChange = (timer: string) => {
    setAutoLockTimer(timer);
    // Apply immediately
    applyAutoLockTimer(timer);
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

  // Define theme colors based on dark mode
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Profile Settings" showBack={true} />

        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer, 
            { backgroundColor: theme.colors.background }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Display & Accessibility */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Display & Accessibility</Text>
            
            {renderToggleRow(
              "Dark Mode",
              "Switch between light and dark themes for the entire app",
              darkMode,
              handleDarkModeToggle,
              "moon"
            )}

            {renderPickerRow(
              "Text Size",
              "Adjust text size for better readability",
              textSize,
              textSizeOptions,
              handleTextSizeChange,
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
              handleAutoLockTimerChange,
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

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={saveSettings}
          >
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  section: {
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
    fontSize: 18,
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
    fontSize: 16,
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: 14,
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
    paddingVertical: 6,
    fontSize: 14,
    width: 70,
    textAlign: "center",
  },
  timeSeparator: {
    fontSize: 14,
    marginHorizontal: 8,
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
  saveButton: {
    margin: 20,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});