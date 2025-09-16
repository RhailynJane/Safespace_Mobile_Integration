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

/**
 * SettingsScreen Component
 * 
 * Comprehensive settings screen with various customization options for
 * display, privacy, notifications, and wellbeing features. Features a
 * clean UI with dark/light mode support and curved background.
 * 
 * This is a frontend-only implementation with local storage for all settings.
 */
export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState("profile");

  // Display & Accessibility Settings
  const [darkMode, setDarkMode] = useState(false);
  const [textSize, setTextSize] = useState("Medium");
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Privacy & Security Settings
  const [biometricLock, setBiometricLock] = useState(false);
  const [autoLockTimer, setAutoLockTimer] = useState("5 minutes");

  // Notification Settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStartTime, setQuietStartTime] = useState("22:00");
  const [quietEndTime, setQuietEndTime] = useState("08:00");
  const [reminderFrequency, setReminderFrequency] = useState("Daily");

  // Contact Settings
  const [crisisContact, setCrisisContact] = useState("");
  const [therapistContact, setTherapistContact] = useState("");

  // Wellbeing Settings
  const [safeMode, setSafeMode] = useState(false);
  const [breakReminders, setBreakReminders] = useState(true);
  const [breathingDuration, setBreathingDuration] = useState("5 minutes");
  const [breathingStyle, setBreathingStyle] = useState("4-7-8 Technique");
  const [offlineMode, setOfflineMode] = useState(false);

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  // Load settings from local storage on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    saveSettings();
  }, [
    darkMode, textSize, highContrast, reduceMotion, biometricLock, autoLockTimer,
    notificationsEnabled, quietHoursEnabled, quietStartTime, quietEndTime, reminderFrequency,
    crisisContact, therapistContact, safeMode, breakReminders, breathingDuration, 
    breathingStyle, offlineMode
  ]);

  /**
   * Loads settings from local storage
   */
  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        
        // Apply all saved settings
        Object.keys(parsedSettings).forEach(key => {
          switch (key) {
            case 'darkMode': setDarkMode(parsedSettings[key]); break;
            case 'textSize': setTextSize(parsedSettings[key]); break;
            case 'highContrast': setHighContrast(parsedSettings[key]); break;
            case 'reduceMotion': setReduceMotion(parsedSettings[key]); break;
            case 'biometricLock': setBiometricLock(parsedSettings[key]); break;
            case 'autoLockTimer': setAutoLockTimer(parsedSettings[key]); break;
            case 'notificationsEnabled': setNotificationsEnabled(parsedSettings[key]); break;
            case 'quietHoursEnabled': setQuietHoursEnabled(parsedSettings[key]); break;
            case 'quietStartTime': setQuietStartTime(parsedSettings[key]); break;
            case 'quietEndTime': setQuietEndTime(parsedSettings[key]); break;
            case 'reminderFrequency': setReminderFrequency(parsedSettings[key]); break;
            case 'crisisContact': setCrisisContact(parsedSettings[key]); break;
            case 'therapistContact': setTherapistContact(parsedSettings[key]); break;
            case 'safeMode': setSafeMode(parsedSettings[key]); break;
            case 'breakReminders': setBreakReminders(parsedSettings[key]); break;
            case 'breathingDuration': setBreathingDuration(parsedSettings[key]); break;
            case 'breathingStyle': setBreathingStyle(parsedSettings[key]); break;
            case 'offlineMode': setOfflineMode(parsedSettings[key]); break;
          }
        });
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  /**
   * Saves settings to local storage
   */
  const saveSettings = async () => {
    try {
      const settings = {
        darkMode, textSize, highContrast, reduceMotion, biometricLock, autoLockTimer,
        notificationsEnabled, quietHoursEnabled, quietStartTime, quietEndTime, reminderFrequency,
        crisisContact, therapistContact, safeMode, breakReminders, breathingDuration, 
        breathingStyle, offlineMode
      };
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (error) {
      console.log('Error saving settings:', error);
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
  const breathingDurationOptions = ["2 minutes", "5 minutes", "10 minutes", "15 minutes"];
  const breathingStyleOptions = ["4-7-8 Technique", "Box Breathing", "Equal Breathing", "Deep Belly"];

  // Define theme colors
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
  const renderToggleRow = (title: string, subtitle: string, value: boolean, onToggle: (value: boolean) => void, icon: keyof typeof Ionicons.glyphMap, disabled = false) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.colors.borderLight }, disabled && styles.disabledRow]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color={disabled ? theme.colors.iconDisabled : theme.colors.icon} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: disabled ? theme.colors.textDisabled : theme.colors.text }]}>{title}</Text>
          <Text style={[styles.settingSubtitle, { color: disabled ? theme.colors.textDisabled : theme.colors.textSecondary }]}>{subtitle}</Text>
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
  const renderPickerRow = (title: string, subtitle: string, value: string, options: string[], onSelect: (value: string) => void, icon: keyof typeof Ionicons.glyphMap, disabled = false) => (
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
          <Text style={[styles.settingTitle, { color: disabled ? theme.colors.textDisabled : theme.colors.text }]}>{title}</Text>
          <Text style={[styles.settingSubtitle, { color: disabled ? theme.colors.textDisabled : theme.colors.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.settingRight}>
        <Text style={[styles.settingValue, { color: disabled ? theme.colors.textDisabled : theme.colors.textSecondary }]}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color={disabled ? theme.colors.iconDisabled : theme.colors.icon} />
      </View>
    </TouchableOpacity>
  );

  /**
   * Renders an input row for text entry
   */
  const renderInputRow = (title: string, subtitle: string, value: string, onChangeText: (text: string) => void, icon: keyof typeof Ionicons.glyphMap, placeholder: string) => (
    <View style={[styles.settingRow, { borderBottomColor: theme.colors.borderLight }]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color={theme.colors.icon} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>
      <TextInput
        style={[styles.settingInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
      />
    </View>
  );

  /**
   * Custom BottomNavigation component
   */
  const BottomNavigation = ({ tabs, activeTab, onTabPress }: {
    tabs: Array<{ id: string; name: string; icon: string }>;
    activeTab: string;
    onTabPress: (tabId: string) => void;
  }) => (
    <View style={[bottomNavStyles.container, { backgroundColor: theme.colors.surface }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={bottomNavStyles.tab}
          onPress={() => onTabPress(tab.id)}
        >
          <Ionicons
            name={tab.icon as any}
            size={24}
            color={activeTab === tab.id ? theme.colors.primary : theme.colors.icon}
          />
          <Text style={[
            bottomNavStyles.tabText,
            { color: activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            {tab.name}
          </Text>
        </TouchableOpacity>
      ))}
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
              "Switch between light and dark themes",
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

            {renderToggleRow(
              "High Contrast",
              "Increase contrast for better visibility",
              highContrast,
              setHighContrast,
              "color-filter"
            )}

            {renderToggleRow(
              "Reduce Motion",
              "Minimize animations and transitions",
              reduceMotion,
              setReduceMotion,
              "play-skip-back"
            )}
          </View>

          {/* Privacy & Security */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Privacy & Security</Text>

            <View style={[styles.settingRow, { borderBottomColor: theme.colors.borderLight }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="eye-off" size={20} color={theme.colors.icon} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Hide App Content</Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>Automatically blur app in recent apps</Text>
                </View>
              </View>
              <View style={styles.enabledIndicator}>
                <Text style={styles.enabledText}>Enabled</Text>
              </View>
            </View>

            {renderToggleRow(
              "Biometric Lock",
              "Use fingerprint or Face ID to unlock app",
              biometricLock,
              setBiometricLock,
              "finger-print"
            )}

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
                <View style={styles.timeRow}>
                  <Text style={[styles.timeLabel, { color: theme.colors.text }]}>From:</Text>
                  <TextInput
                    style={[styles.timeInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                    value={quietStartTime}
                    onChangeText={setQuietStartTime}
                    placeholder="22:00"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                  <Text style={[styles.timeLabel, { color: theme.colors.text }]}>To:</Text>
                  <TextInput
                    style={[styles.timeInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, color: theme.colors.text }]}
                    value={quietEndTime}
                    onChangeText={setQuietEndTime}
                    placeholder="08:00"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>
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

          {/* Emergency Contacts */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Emergency Contacts</Text>

            {renderInputRow(
              "Crisis Contact",
              "Emergency contact for crisis situations",
              crisisContact,
              setCrisisContact,
              "call",
              "Phone number or name"
            )}

            {renderInputRow(
              "Therapist/Provider",
              "Your therapist or healthcare provider contact",
              therapistContact,
              setTherapistContact,
              "medical",
              "Contact information"
            )}
          </View>

          {/* Wellbeing Features */}
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Wellbeing Features</Text>

            {renderToggleRow(
              "Safe Mode",
              "Hide potentially triggering content",
              safeMode,
              setSafeMode,
              "shield-checkmark"
            )}

            {renderToggleRow(
              "Break Reminders",
              "Remind you to take breaks during extended use",
              breakReminders,
              setBreakReminders,
              "pause"
            )}

            {renderPickerRow(
              "Breathing Exercise Duration",
              "Default length for breathing exercises",
              breathingDuration,
              breathingDurationOptions,
              setBreathingDuration,
              "fitness"
            )}

            {renderPickerRow(
              "Breathing Exercise Style",
              "Preferred breathing technique",
              breathingStyle,
              breathingStyleOptions,
              setBreathingStyle,
              "leaf"
            )}

            {renderToggleRow(
              "Offline Mode",
              "Use app without internet connection",
              offlineMode,
              setOfflineMode,
              "cloud-offline"
            )}
          </View>
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
  settingInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 150,
    textAlign: "right" as const,
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
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  timeLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    width: 60,
    textAlign: "center" as const,
    marginRight: 16,
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