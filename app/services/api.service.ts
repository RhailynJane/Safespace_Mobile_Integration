// services/api.service.ts (for your React Native app)

import AsyncStorage from '@react-native-async-storage/async-storage';

// Point to your existing backend on port 3001
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface SettingsAPIResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class SettingsAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getClerkUserId(): Promise<string> {
    try {
      // Get the Clerk user ID from your auth storage
      const authData = await AsyncStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.clerkUserId; // Use clerkUserId to match your backend
      }
      // For testing, return a default Clerk ID
      // In production, this should throw an error or redirect to login
      return 'clerk_test_user_id';
    } catch (error) {
      console.error('Error getting Clerk user ID:', error);
      throw new Error('User not authenticated');
    }
  }

  async fetchSettings(): Promise<any> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
      // Use your existing GET endpoint
      const response = await fetch(`${this.baseURL}/settings/${clerkUserId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Your backend returns the data in result.data
      if (result.success && result.data) {
        return this.mapServerToClient(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  async saveSettings(settings: any): Promise<SettingsAPIResponse> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
      // Map client settings to match your backend structure
      const mappedSettings = this.mapClientToServer(settings);

      // Use your existing PUT endpoint
      const response = await fetch(`${this.baseURL}/settings/${clerkUserId}`, {
        method: 'PUT', // Your backend uses PUT
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappedSettings)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async initializeSettings(): Promise<SettingsAPIResponse> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
      // Use your initialize endpoint
      const response = await fetch(`${this.baseURL}/settings/${clerkUserId}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error initializing settings:', error);
      throw error;
    }
  }

  private mapServerToClient(serverData: any): any {
    // Map your backend's snake_case to frontend's camelCase
    return {
      darkMode: serverData.dark_mode || false,
      textSize: serverData.text_size || 'Medium',
      highContrast: serverData.high_contrast || false,
      reduceMotion: serverData.reduce_motion || false,
      biometricLock: serverData.biometric_lock || false,
      autoLockTimer: serverData.auto_lock_timer || '5 minutes',
      notificationsEnabled: serverData.notifications_enabled !== false,
      quietHoursEnabled: serverData.quiet_hours_enabled || false,
      quietStartTime: serverData.quiet_start_time || '22:00',
      quietEndTime: serverData.quiet_end_time || '08:00',
      reminderFrequency: serverData.reminder_frequency || 'Daily',
      crisisContact: serverData.crisis_contact || '',
      therapistContact: serverData.therapist_contact || '',
      safeMode: serverData.safe_mode || false,
      breakReminders: serverData.break_reminders !== false,
      breathingDuration: serverData.breathing_duration || '5 minutes',
      breathingStyle: serverData.breathing_style || '4-7-8 Technique',
      offlineMode: serverData.offline_mode || false,
    };
  }

  private mapClientToServer(clientSettings: any): any {
    // Map frontend's camelCase to your backend's structure
    return {
      darkMode: clientSettings.darkMode,
      textSize: clientSettings.textSize,
      highContrast: clientSettings.highContrast,
      reduceMotion: clientSettings.reduceMotion,
      biometricLock: clientSettings.biometricLock,
      autoLockTimer: clientSettings.autoLockTimer,
      notificationsEnabled: clientSettings.notificationsEnabled,
      quietHoursEnabled: clientSettings.quietHoursEnabled,
      quietStartTime: clientSettings.quietStartTime,
      quietEndTime: clientSettings.quietEndTime,
      reminderFrequency: clientSettings.reminderFrequency,
      crisisContact: clientSettings.crisisContact,
      therapistContact: clientSettings.therapistContact,
      safeMode: clientSettings.safeMode,
      breakReminders: clientSettings.breakReminders,
      breathingDuration: clientSettings.breathingDuration,
      breathingStyle: clientSettings.breathingStyle,
      offlineMode: clientSettings.offlineMode,
    };
  }
}

export default new SettingsAPI();