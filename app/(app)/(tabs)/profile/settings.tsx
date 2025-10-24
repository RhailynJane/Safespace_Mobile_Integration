/* eslint-disable react-hooks/exhaustive-deps */
// app/(app)/(tabs)/profile/settings.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Modal,
} from "react-native";
import Slider from '@react-native-community/slider';
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader } from "../../../../components/AppHeader";
import BottomNavigation from "../../../../components/BottomNavigation";
import settingsAPI, { UserSettings } from "../../../../utils/settingsApi";
import { useTheme } from "../../../../contexts/ThemeContext";
import StatusModal from "../../../../components/StatusModal";
import { useUser } from '@clerk/clerk-expo';

/**
 * SettingsScreen Component
 * 
 * Comprehensive settings screen with backend integration for
 * display, privacy, and notification settings.
 */
export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const { theme, isDarkMode, setDarkMode: setGlobalDarkMode, textSize, setTextSize: setGlobalTextSize } = useTheme();

  // Settings state
  const [autoLockTimer, setAutoLockTimer] = useState("5 minutes");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStartTime, setQuietStartTime] = useState("22:00");
  const [quietEndTime, setQuietEndTime] = useState("08:00");
  const [reminderFrequency, setReminderFrequency] = useState("Daily");
  const { user } = useUser();
  // Status modal state (replaces Alert.alert)
  const [statusModal, setStatusModal] = useState<{visible:boolean; type:'success'|'error'|'info'; title:string; message:string}>({visible:false, type:'info', title:'', message:''});

  // Generic selection modal state to replace Alert pickers
  const [selectionModal, setSelectionModal] = useState<{visible:boolean; title:string; options:string[]; onSelect:(v:string)=>void}>({visible:false, title:'', options:[], onSelect:()=>{}});

  // Text size slider mapping
  const textSizeLabels = ["Extra Small", "Small", "Medium", "Large"] as const;
  type TextSizeLabel = typeof textSizeLabels[number];
  const textSizeToSlider = (size: string): number => Math.max(0, textSizeLabels.indexOf((size as TextSizeLabel)));
  const sliderToTextSize = (val: number): TextSizeLabel => textSizeLabels[Math.min(textSizeLabels.length-1, Math.max(0, Math.round(val)))] as TextSizeLabel;
  const [textSizeSlider, setTextSizeSlider] = useState<number>(textSizeToSlider(textSize));
  useEffect(() => {
    setTextSizeSlider(textSizeToSlider(textSize));
  }, [textSize]);

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
  }, [isDarkMode, textSize, autoLockTimer]);

  /**
   * Loads settings from backend API
   */
  const loadSettings = async () => {
    try {
      setIsLoading(true);
  const settings = await settingsAPI.fetchSettings(user?.id);
      
  // Apply all saved settings EXCEPT dark mode and text size (managed by ThemeContext)
  // Do not override current theme/context values here to avoid reverting user changes
      setAutoLockTimer(settings.autoLockTimer);
      setNotificationsEnabled(settings.notificationsEnabled);
      setQuietHoursEnabled(settings.quietHoursEnabled);
      setQuietStartTime(settings.quietStartTime);
      setQuietEndTime(settings.quietEndTime);
      setReminderFrequency(settings.reminderFrequency);
      
    } catch (error) {
  console.log('Error loading settings:', error);
  setStatusModal({visible:true, type:'error', title:'Error', message:'Failed to load settings'});
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
        darkMode: isDarkMode,
        textSize,
        autoLockTimer,
        notificationsEnabled,
        quietHoursEnabled,
        quietStartTime,
        quietEndTime,
        reminderFrequency,
      };

      const result = await settingsAPI.saveSettings(settings, user?.id);
      if (!result.success) {
        setStatusModal({visible:true, type:'error', title:'Save Failed', message: result.message || 'Failed to save settings'});
      } else {
        setStatusModal({visible:true, type:'success', title:'Saved', message:'Settings saved successfully'});
      }
      
    } catch (error) {
  console.log('Error saving settings:', error);
  setStatusModal({visible:true, type:'error', title:'Error', message:'Failed to save settings'});
    }
  };

  /**
   * Applies all settings globally
   */
  const applySettings = async () => {
    try {
      // Apply dark mode globally
      await applyDarkMode(isDarkMode);
      
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
        case "Extra Small":
          fontScale = 0.85;
          break;
        case "Small":
          fontScale = 0.95;
          break;
        case "Medium":
          fontScale = 1.0;
          break;
        case "Large":
          fontScale = 1.15;
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
      let lockTimeMs;
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
        default:
          lockTimeMs = 0;
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
    setGlobalDarkMode(value);
    // Apply immediately
    applyDarkMode(value);
  };

  /**
   * Handles text size change with immediate feedback
   */
  const handleTextSizeChange = (size: string) => {
    setGlobalTextSize(size);
    setTextSizeSlider(textSizeToSlider(size));
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

  const textSizeOptions = ["Extra Small", "Small", "Medium", "Large"];
  const autoLockOptions = ["Immediate", "1 minute", "5 minutes", "15 minutes", "Never"];
  const reminderFrequencyOptions = ["Never", "Daily", "Twice daily", "Weekly"];

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
        setSelectionModal({
          visible: true,
          title,
          options,
          onSelect: (val: string) => {
            onSelect(val);
            setSelectionModal(s => ({...s, visible:false}));
          }
        });
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
              isDarkMode,
              handleDarkModeToggle,
              "moon"
            )}

            {/* Text Size Slider */}
            <View style={[styles.settingRow, { borderBottomColor: theme.colors.borderLight }]}> 
              <View style={styles.settingLeft}>
                <Ionicons name="text" size={20} color={theme.colors.icon} />
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Text Size</Text>
                  <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>Adjust text size for better readability</Text>
                </View>
              </View>
            </View>
            <View style={styles.sliderBlock}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>Size</Text>
                <Text style={[styles.sliderValue, { color: theme.colors.text }]}>{textSizeLabels[textSizeSlider]}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={3}
                step={1}
                value={textSizeSlider}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
                onValueChange={(val) => setTextSizeSlider(val)}
                onSlidingComplete={(val) => handleTextSizeChange(sliderToTextSize(val))}
              />
              <View style={styles.sliderLabelsRow}>
                {textSizeLabels.map((lbl, idx) => (
                  <Text key={lbl} style={[styles.sliderTickLabel, { color: idx === textSizeSlider ? theme.colors.text : theme.colors.textSecondary }]}>
                    {lbl}
                  </Text>
                ))}
              </View>
            </View>
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

        {/* Selection Modal for pickers */}
        <Modal
          visible={selectionModal.visible}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectionModal(s => ({...s, visible:false}))}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.selectionModalContent, { backgroundColor: theme.colors.surface }]}> 
              <Text style={[styles.selectionModalTitle, { color: theme.colors.text }]}>{selectionModal.title}</Text>
              {selectionModal.options.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.selectionOption, { borderBottomColor: theme.colors.borderLight }]}
                  onPress={() => selectionModal.onSelect(opt)}
                >
                  <Text style={[styles.selectionOptionText, { color: theme.colors.text }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setSelectionModal(s => ({...s, visible:false}))} style={styles.selectionCancelBtn}>
                <Text style={[styles.selectionCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Status Modal */}
        <StatusModal
          visible={statusModal.visible}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          onClose={() => setStatusModal(s => ({...s, visible:false}))}
        />

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
  // Slider styles
  sliderBlock: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderTickLabel: {
    fontSize: 12,
  },
  // Selection modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  selectionModalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 16,
  },
  selectionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectionOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  selectionOptionText: {
    fontSize: 16,
  },
  selectionCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectionCancelText: {
    fontSize: 14,
  },
});