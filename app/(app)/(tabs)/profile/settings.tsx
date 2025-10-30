/* eslint-disable react-hooks/exhaustive-deps */
// app/(app)/(tabs)/profile/settings.tsx
/**
 * LLM Prompt: Add concise comments to this React Native component. 
 * Reference: chat.deepseek.com
 */
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
import TimePickerModal from "../../../../components/TimePickerModal";

/**
 * SettingsScreen Component
 * 
 * Comprehensive settings screen with backend integration for
 * display, privacy, and notification settings.
 */
export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const { theme, isDarkMode, setDarkMode: setGlobalDarkMode, textSize, setTextSize: setGlobalTextSize, scaledFontSize } = useTheme();

  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  // Granular notification toggles
  const [notifMoodTracking, setNotifMoodTracking] = useState(true);
  const [notifJournaling, setNotifJournaling] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifPostReactions, setNotifPostReactions] = useState(true);
  const [notifAppointments, setNotifAppointments] = useState(true);
  const [notifSelfAssessment, setNotifSelfAssessment] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState("Daily");
  // Per-category reminder settings
  const [moodReminderEnabled, setMoodReminderEnabled] = useState(false);
  const [moodReminderTime, setMoodReminderTime] = useState("09:00");
  const [moodReminderFrequency, setMoodReminderFrequency] = useState("Daily");
  const [moodReminderCustomSchedule, setMoodReminderCustomSchedule] = useState<Record<string, string>>({});
  const [journalReminderEnabled, setJournalReminderEnabled] = useState(false);
  const [journalReminderTime, setJournalReminderTime] = useState("20:00");
  const [journalReminderFrequency, setJournalReminderFrequency] = useState("Daily");
  const [journalReminderCustomSchedule, setJournalReminderCustomSchedule] = useState<Record<string, string>>({});
  // Appointment reminder settings
  const [appointmentReminderEnabled, setAppointmentReminderEnabled] = useState(true);
  const [appointmentReminderAdvanceMinutes, setAppointmentReminderAdvanceMinutes] = useState(60);
  
  const { user } = useUser();
  // Time picker modal visibility state
  const [moodTimePickerVisible, setMoodTimePickerVisible] = useState(false);
  const [journalTimePickerVisible, setJournalTimePickerVisible] = useState(false);
  // Custom schedule per-day picker visibility
  const [moodCustomDayPickers, setMoodCustomDayPickers] = useState<Record<string, boolean>>({});
  const [journalCustomDayPickers, setJournalCustomDayPickers] = useState<Record<string, boolean>>({});
  // Status modal state (replaces Alert.alert)
  const [statusModal, setStatusModal] = useState<{visible:boolean; type:'success'|'error'|'info'; title:string; message:string}>({visible:false, type:'info', title:'', message:''});

  // Generic selection modal state to replace Alert pickers
  const [selectionModal, setSelectionModal] = useState<{visible:boolean; title:string; options:string[]; onSelect:(v:string)=>void}>({visible:false, title:'', options:[], onSelect:()=>{}});

  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    moodReminder: false,
    journalReminder: false,
  });
  
  // Track which reminder frequency options to show (only Daily and Custom for reminders)
  const reminderFrequencyOptionsLimited = ["Daily", "Custom"];

  // Text size slider mapping
  const textSizeLabels = ["Extra Small", "Small", "Medium", "Large"] as const;
  type TextSizeLabel = typeof textSizeLabels[number];
  const textSizeToSlider = (size: string): number => Math.max(0, textSizeLabels.indexOf((size as TextSizeLabel)));
  const sliderToTextSize = (val: number): TextSizeLabel => textSizeLabels[Math.min(textSizeLabels.length-1, Math.max(0, Math.round(val)))] as TextSizeLabel;
  const [textSizeSlider, setTextSizeSlider] = useState<number>(textSizeToSlider(textSize));
  useEffect(() => {
    setTextSizeSlider(textSizeToSlider(textSize));
  }, [textSize]);

  // Create dynamic styles with text size scaling
  const styles = useMemo(() => createStyles(scaledFontSize), [scaledFontSize]);

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
  }, [isDarkMode, textSize]);

  // Auto-save notification settings when they change
  useEffect(() => {
    const saveNotificationChanges = async () => {
      try {
        const settings: UserSettings = {
          darkMode: isDarkMode,
          textSize,
          notificationsEnabled,
          notifMoodTracking,
          notifJournaling,
          notifMessages,
          notifPostReactions,
          notifAppointments,
          notifSelfAssessment,
          reminderFrequency,
          moodReminderEnabled,
          moodReminderTime,
          moodReminderFrequency,
          moodReminderCustomSchedule,
          journalReminderEnabled,
          journalReminderTime,
          journalReminderFrequency,
          journalReminderCustomSchedule,
          appointmentReminderEnabled,
          appointmentReminderAdvanceMinutes,
        };
        console.log('🔔 Auto-saving notification settings:', settings);
        await settingsAPI.saveSettings(settings, user?.id);
      } catch (error) {
        console.log('Auto-save notification settings failed:', error);
      }
    };

    // Debounce the save to avoid too many API calls (500ms delay)
    const timer = setTimeout(() => {
      saveNotificationChanges();
    }, 500);

    return () => clearTimeout(timer);
  }, [notificationsEnabled, notifMoodTracking, notifJournaling, notifMessages, notifPostReactions, notifAppointments, notifSelfAssessment, moodReminderEnabled, moodReminderTime, moodReminderFrequency, moodReminderCustomSchedule, journalReminderEnabled, journalReminderTime, journalReminderFrequency, journalReminderCustomSchedule, appointmentReminderEnabled, appointmentReminderAdvanceMinutes, user?.id]);

  /**
   * Loads settings from backend API
   */
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await settingsAPI.fetchSettings(user?.id);
      
      // Apply all saved settings EXCEPT dark mode and text size (managed by ThemeContext)
      // Do not override current theme/context values here to avoid reverting user changes
      setNotificationsEnabled(settings.notificationsEnabled);
      // granular notifications
      setNotifMoodTracking(settings.notifMoodTracking ?? true);
      setNotifJournaling(settings.notifJournaling ?? true);
      setNotifMessages(settings.notifMessages ?? true);
      setNotifPostReactions(settings.notifPostReactions ?? true);
      setNotifAppointments(settings.notifAppointments ?? true);
      setNotifSelfAssessment(settings.notifSelfAssessment ?? true);
      setReminderFrequency(settings.reminderFrequency);
      setMoodReminderEnabled(settings.moodReminderEnabled);
      setMoodReminderTime(settings.moodReminderTime);
      setMoodReminderFrequency(settings.moodReminderFrequency);
      setMoodReminderCustomSchedule(settings.moodReminderCustomSchedule ?? {});
      setJournalReminderEnabled(settings.journalReminderEnabled);
      setJournalReminderTime(settings.journalReminderTime);
      setJournalReminderFrequency(settings.journalReminderFrequency);
      setJournalReminderCustomSchedule(settings.journalReminderCustomSchedule ?? {});
      setAppointmentReminderEnabled(settings.appointmentReminderEnabled);
      setAppointmentReminderAdvanceMinutes(settings.appointmentReminderAdvanceMinutes);
      
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
        notificationsEnabled,
        notifMoodTracking,
        notifJournaling,
        notifMessages,
        notifPostReactions,
        notifAppointments,
        notifSelfAssessment,
        reminderFrequency,
        moodReminderEnabled,
        moodReminderTime,
        moodReminderFrequency,
        moodReminderCustomSchedule,
        journalReminderEnabled,
        journalReminderTime,
        journalReminderFrequency,
        journalReminderCustomSchedule,
        appointmentReminderEnabled,
        appointmentReminderAdvanceMinutes,
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
  const reminderFrequencyOptions = ["Never", "Hourly", "Daily", "Weekdays", "Weekends", "Weekly", "Custom"];
  const daysOfWeek = [
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
    { key: 'sun', label: 'Sunday' },
  ];

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
   * Renders time picker row with native time picker modal
   */
  const renderTimePickerRow = (
    title: string,
    subtitle: string,
    value: string,
    onSelect: (time: string) => void,
    visible: boolean,
    setVisible: (visible: boolean) => void,
    icon: keyof typeof Ionicons.glyphMap,
    disabled = false
  ) => (
    <>
      <TouchableOpacity
        style={[styles.settingRow, { borderBottomColor: theme.colors.borderLight }, disabled && styles.disabledRow]}
        onPress={() => !disabled && setVisible(true)}
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
          <Ionicons name="time" size={16} color={disabled ? theme.colors.iconDisabled : theme.colors.icon} />
        </View>
      </TouchableOpacity>
      <TimePickerModal
        visible={visible}
        value={value}
        onSelect={onSelect}
        onCancel={() => setVisible(false)}
      />
    </>
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

            {/* Quick notification categories with frequency */}
            {notificationsEnabled && (
              <View style={styles.nestedSettings}>
                <Text style={[styles.sectionSubtitle, { color: theme.colors.text }]}>Notification Categories</Text>
                
                {/* Mood Tracking */}
                <View style={[styles.categoryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <Ionicons name="happy" size={18} color={theme.colors.primary} />
                      <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>Mood Tracking</Text>
                    </View>
                    <Switch
                      value={notifMoodTracking}
                      onValueChange={(val) => {
                        setNotifMoodTracking(val);
                        setMoodReminderEnabled(val);
                      }}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  {notifMoodTracking && (
                    <View style={styles.categoryContent}>
                      {renderPickerRow(
                        "Frequency",
                        "How often",
                        moodReminderFrequency,
                        reminderFrequencyOptionsLimited,
                        setMoodReminderFrequency,
                        "repeat"
                      )}
                      
                      {(moodReminderFrequency === 'Daily' || moodReminderFrequency === 'Custom') && (
                        <View style={styles.nestedSettings}>
                          {moodReminderFrequency === 'Daily' && (
                            renderTimePickerRow(
                              "Reminder Time",
                              "Time of day for mood check-in",
                              moodReminderTime,
                              (time) => {
                                setMoodReminderTime(time);
                              },
                              moodTimePickerVisible,
                              setMoodTimePickerVisible,
                              "time"
                            )
                          )}
                          
                          {moodReminderFrequency === 'Custom' && (
                            <>
                              <Text style={[styles.customScheduleTitle, { color: theme.colors.text }]}>
                                Select days and times:
                              </Text>
                              {daysOfWeek.map((day) => {
                                const dayTime = moodReminderCustomSchedule[day.key] || '';
                                const isEnabled = !!dayTime;
                                return (
                                  <View key={day.key} style={[styles.customDayRow, { borderBottomColor: theme.colors.borderLight }]}>
                                    <View style={styles.customDayLeft}>
                                      <Switch
                                        value={isEnabled}
                                        onValueChange={(val) => {
                                          if (val) {
                                            setMoodReminderCustomSchedule(prev => ({ ...prev, [day.key]: moodReminderTime || '09:00' }));
                                          } else {
                                            const newSchedule = { ...moodReminderCustomSchedule };
                                            delete newSchedule[day.key];
                                            setMoodReminderCustomSchedule(newSchedule);
                                          }
                                        }}
                                        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                        thumbColor="#FFFFFF"
                                      />
                                      <Text style={[styles.customDayLabel, { color: theme.colors.text }]}>{day.label}</Text>
                                    </View>
                                    {isEnabled && (
                                      <TouchableOpacity
                                        style={[styles.customDayTime, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                        onPress={() => setMoodCustomDayPickers(prev => ({ ...prev, [day.key]: true }))}
                                      >
                                        <Text style={[styles.customDayTimeText, { color: theme.colors.text }]}>{dayTime}</Text>
                                        <Ionicons name="time" size={16} color={theme.colors.icon} />
                                      </TouchableOpacity>
                                    )}
                                    {isEnabled && (
                                      <TimePickerModal
                                        visible={moodCustomDayPickers[day.key] || false}
                                        value={dayTime}
                                        onSelect={(time) => {
                                          setMoodReminderCustomSchedule(prev => ({ ...prev, [day.key]: time }));
                                          setMoodCustomDayPickers(prev => ({ ...prev, [day.key]: false }));
                                        }}
                                        onCancel={() => setMoodCustomDayPickers(prev => ({ ...prev, [day.key]: false }))}
                                      />
                                    )}
                                  </View>
                                );
                              })}
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Journaling */}
                <View style={[styles.categoryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <Ionicons name="book" size={18} color={theme.colors.primary} />
                      <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>Journaling</Text>
                    </View>
                    <Switch
                      value={notifJournaling}
                      onValueChange={(val) => {
                        setNotifJournaling(val);
                        setJournalReminderEnabled(val);
                      }}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  {notifJournaling && (
                    <View style={styles.categoryContent}>
                      {renderPickerRow(
                        "Frequency",
                        "How often",
                        journalReminderFrequency,
                        reminderFrequencyOptionsLimited,
                        setJournalReminderFrequency,
                        "repeat"
                      )}
                      
                      {(journalReminderFrequency === 'Daily' || journalReminderFrequency === 'Custom') && (
                        <View style={styles.nestedSettings}>
                          {journalReminderFrequency === 'Daily' && (
                            renderTimePickerRow(
                              "Reminder Time",
                              "Time of day for journaling",
                              journalReminderTime,
                              (time) => {
                                setJournalReminderTime(time);
                              },
                              journalTimePickerVisible,
                              setJournalTimePickerVisible,
                              "time"
                            )
                          )}
                          
                          {journalReminderFrequency === 'Custom' && (
                            <>
                              <Text style={[styles.customScheduleTitle, { color: theme.colors.text }]}>
                                Select days and times:
                              </Text>
                              {daysOfWeek.map((day) => {
                                const dayTime = journalReminderCustomSchedule[day.key] || '';
                                const isEnabled = !!dayTime;
                                return (
                                  <View key={day.key} style={[styles.customDayRow, { borderBottomColor: theme.colors.borderLight }]}>
                                    <View style={styles.customDayLeft}>
                                      <Switch
                                        value={isEnabled}
                                        onValueChange={(val) => {
                                          if (val) {
                                            setJournalReminderCustomSchedule(prev => ({ ...prev, [day.key]: journalReminderTime || '09:00' }));
                                          } else {
                                            const newSchedule = { ...journalReminderCustomSchedule };
                                            delete newSchedule[day.key];
                                            setJournalReminderCustomSchedule(newSchedule);
                                          }
                                        }}
                                        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                        thumbColor="#FFFFFF"
                                      />
                                      <Text style={[styles.customDayLabel, { color: theme.colors.text }]}>{day.label}</Text>
                                    </View>
                                    {isEnabled && (
                                      <TouchableOpacity
                                        style={[styles.customDayTime, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                                        onPress={() => setJournalCustomDayPickers(prev => ({ ...prev, [day.key]: true }))}
                                      >
                                        <Text style={[styles.customDayTimeText, { color: theme.colors.text }]}>{dayTime}</Text>
                                        <Ionicons name="time" size={16} color={theme.colors.icon} />
                                      </TouchableOpacity>
                                    )}
                                    {isEnabled && (
                                      <TimePickerModal
                                        visible={journalCustomDayPickers[day.key] || false}
                                        value={dayTime}
                                        onSelect={(time) => {
                                          setJournalReminderCustomSchedule(prev => ({ ...prev, [day.key]: time }));
                                          setJournalCustomDayPickers(prev => ({ ...prev, [day.key]: false }));
                                        }}
                                        onCancel={() => setJournalCustomDayPickers(prev => ({ ...prev, [day.key]: false }))}
                                      />
                                    )}
                                  </View>
                                );
                              })}
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Messages */}
                <View style={[styles.categoryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <Ionicons name="chatbubbles" size={18} color={theme.colors.primary} />
                      <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>Messages</Text>
                    </View>
                    <Switch
                      value={notifMessages}
                      onValueChange={(val) => { setNotifMessages(val); }}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Post Reactions */}
                <View style={[styles.categoryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <Ionicons name="heart" size={18} color={theme.colors.primary} />
                      <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>Post Reactions</Text>
                    </View>
                    <Switch
                      value={notifPostReactions}
                      onValueChange={(val) => { setNotifPostReactions(val); }}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Appointments */}
                <View style={[styles.categoryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                      <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>Appointments</Text>
                    </View>
                    <Switch
                      value={notifAppointments}
                      onValueChange={(val) => { 
                        setNotifAppointments(val); 
                        setAppointmentReminderEnabled(val);
                      }}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  {notifAppointments && (
                    <View style={styles.categoryContent}>
                      {renderPickerRow(
                        "Reminder Time",
                        "How long before appointment",
                        appointmentReminderAdvanceMinutes === 15 ? "15 minutes" :
                        appointmentReminderAdvanceMinutes === 30 ? "30 minutes" :
                        appointmentReminderAdvanceMinutes === 120 ? "2 hours" : "1 hour",
                        ["15 minutes", "30 minutes", "1 hour", "2 hours"],
                        (val) => {
                          const minutes = val === "15 minutes" ? 15 :
                                         val === "30 minutes" ? 30 :
                                         val === "2 hours" ? 120 : 60;
                          setAppointmentReminderAdvanceMinutes(minutes);
                        },
                        "time"
                      )}
                    </View>
                  )}
                </View>

                {/* Self Assessment */}
                <View style={[styles.categoryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} />
                      <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>Self Assessment</Text>
                    </View>
                    <Switch
                      value={notifSelfAssessment}
                      onValueChange={(val) => { setNotifSelfAssessment(val); }}
                      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              </View>
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

const createStyles = (scaledFontSize: (size: number) => number) => StyleSheet.create({
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
    fontSize: scaledFontSize(18),
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
    fontSize: scaledFontSize(16),
    fontWeight: "500",
  },
  settingSubtitle: {
    fontSize: scaledFontSize(14),
    marginTop: 2,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: scaledFontSize(14),
    marginRight: 8,
  },
  timeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInputText: {
    fontSize: scaledFontSize(15),
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: scaledFontSize(14),
    marginHorizontal: 4,
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
    fontSize: scaledFontSize(14),
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
    fontSize: scaledFontSize(16),
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
    fontSize: scaledFontSize(14),
  },
  sliderValue: {
    fontSize: scaledFontSize(14),
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
    fontSize: scaledFontSize(12),
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
    fontSize: scaledFontSize(18),
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  selectionOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  selectionOptionText: {
    fontSize: scaledFontSize(16),
    textAlign: 'center',
  },
  selectionCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectionCancelText: {
    fontSize: scaledFontSize(14),
  },
  // Custom schedule styles
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
    marginBottom: 4,
  },
  warningText: {
    fontSize: scaledFontSize(13),
  },
  warningAction: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'center',
    marginLeft: 8,
  },
  warningActionText: {
    fontSize: scaledFontSize(13),
    fontWeight: '600',
  },
  customScheduleTitle: {
    fontSize: scaledFontSize(14),
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
    paddingLeft: 4,
  },
  customDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  customDayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customDayLabel: {
    fontSize: scaledFontSize(15),
    marginLeft: 12,
    flex: 1,
  },
  customDayTime: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    minWidth: 100,
  },
  customDayTimeText: {
    fontSize: scaledFontSize(15),
    fontWeight: '500',
  },
  // Quick notification badges
  quickNotificationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  notifBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  notifBadgeActive: {
    backgroundColor: 'rgba(178, 190, 156, 0.1)',
  },
  notifBadgeText: {
    fontSize: scaledFontSize(13),
    fontWeight: '500',
  },
  // Expandable header
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  expandableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  // Category card styles
  sectionSubtitle: {
    fontSize: scaledFontSize(14),
    fontWeight: '500',
    marginBottom: 12,
    marginLeft: 4,
  },
  categoryCard: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    minHeight: 50,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  categoryTitle: {
    fontSize: scaledFontSize(15),
    fontWeight: '600',
    flex: 1,
    flexWrap: 'wrap',
  },
  categoryContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});