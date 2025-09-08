import React, { useState } from "react";
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
import { useAuth } from "../../../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BottomNavigation from "../../../../components/BottomNavigation";

export default function SettingsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Display & Accessibility Settings
  const [darkMode, setDarkMode] = useState(false);
  const [textSize, setTextSize] = useState("Medium");
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Privacy & Security Settings
  const [biometricLock, setBiometricLock] = useState(false); // UI only
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
  const [offlineMode, setOfflineMode] = useState(false); // UI only

  const tabs = [
    { id: "home", name: "Home", icon: "home" },
    { id: "community", name: "Community", icon: "people" },
    { id: "appointments", name: "Appointments", icon: "calendar" },
    { id: "messages", name: "Messages", icon: "chatbubbles" },
    { id: "profile", name: "Profile", icon: "person" },
  ];

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      router.replace("/(app)/(tabs)/home");
    } else if (tabId === "profile") {
      router.back();
    } else {
      router.push(`/(app)/(tabs)/${tabId}`);
    }
  };

  const textSizeOptions = ["Small", "Medium", "Large", "Extra Large"];
  const autoLockOptions = ["Immediate", "1 minute", "5 minutes", "15 minutes", "Never"];
  const reminderFrequencyOptions = ["Never", "Daily", "Twice daily", "Weekly"];
  const breathingDurationOptions = ["2 minutes", "5 minutes", "10 minutes", "15 minutes"];
  const breathingStyleOptions = ["4-7-8 Technique", "Box Breathing", "Equal Breathing", "Deep Belly"];

  const renderToggleRow = (title: string, subtitle: string, value: boolean, onToggle: (value: boolean) => void, icon: keyof typeof Ionicons.glyphMap, disabled = false) => (
    <View style={[styles.settingRow, disabled && styles.disabledRow]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color={disabled ? "#999" : "#666"} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, disabled && styles.disabledText]}>{title}</Text>
          <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
        thumbColor="#FFFFFF"
        disabled={disabled}
      />
    </View>
  );

  const renderPickerRow = (title: string, subtitle: string, value: string, options: string[], onSelect: (value: string) => void, icon: keyof typeof Ionicons.glyphMap, disabled = false) => (
    <TouchableOpacity 
      style={[styles.settingRow, disabled && styles.disabledRow]}
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
        <Ionicons name={icon} size={20} color={disabled ? "#999" : "#666"} />
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, disabled && styles.disabledText]}>{title}</Text>
          <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.settingRight}>
        <Text style={[styles.settingValue, disabled && styles.disabledText]}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color={disabled ? "#999" : "#666"} />
      </View>
    </TouchableOpacity>
  );

  const renderInputRow = (title: string, subtitle: string, value: string, onChangeText: (text: string) => void, icon: keyof typeof Ionicons.glyphMap, placeholder: string) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={20} color="#666" />
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <TextInput
        style={styles.settingInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Display & Accessibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display & Accessibility</Text>
          
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="eye-off" size={20} color="#666" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Hide App Content</Text>
                <Text style={styles.settingSubtitle}>Automatically blur app in recent apps</Text>
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
            "finger-print",
            true // Disabled for now
          )}

          {renderPickerRow(
            "Auto-Lock Timer",
            "Automatically lock app after inactivity",
            autoLockTimer,
            autoLockOptions,
            setAutoLockTimer,
            "time",
            true // Disabled for now
          )}
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

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
                <Text style={styles.timeLabel}>From:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={quietStartTime}
                  onChangeText={setQuietStartTime}
                  placeholder="22:00"
                />
                <Text style={styles.timeLabel}>To:</Text>
                <TextInput
                  style={styles.timeInput}
                  value={quietEndTime}
                  onChangeText={setQuietEndTime}
                  placeholder="08:00"
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>

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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wellbeing Features</Text>

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
            "cloud-offline",
            true // Disabled for now
          )}
        </View>
      </ScrollView>

      <BottomNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
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

  disabledText: {
  color: "#999",
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