// utils/settingsAPI.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface SettingsAPIResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface UserSettings {
  // Display & Accessibility
  darkMode: boolean;
  textSize: string;
  
  // Privacy & Security
  autoLockTimer: string;

  // Notifications
  notificationsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietStartTime: string;
  quietEndTime: string;
  reminderFrequency: string;
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
        return parsed.clerkUserId;
      }
      // For testing, return a default Clerk ID
      return 'clerk_test_user_id';
    } catch (error) {
      console.error('Error getting Clerk user ID:', error);
      throw new Error('User not authenticated');
    }
  }

  async fetchSettings(): Promise<UserSettings> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
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
      
      if (result.success && result.settings) {
        return this.mapServerToClient(result.settings);
      } else {
        // Return default settings if none exist
        return this.getDefaultSettings();
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Return default settings on error
      return this.getDefaultSettings();
    }
  }

  async saveSettings(settings: UserSettings): Promise<SettingsAPIResponse> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
      const mappedSettings = this.mapClientToServer(settings);

      const response = await fetch(`${this.baseURL}/settings/${clerkUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: mappedSettings })
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

  async updateSettingsCategory(category: string, updates: Partial<UserSettings>): Promise<SettingsAPIResponse> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
      const response = await fetch(`${this.baseURL}/settings/${clerkUserId}/category/${category}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating settings category:', error);
      throw error;
    }
  }

  async resetSettings(): Promise<SettingsAPIResponse> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
      const response = await fetch(`${this.baseURL}/settings/${clerkUserId}/reset`, {
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
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  private mapServerToClient(serverData: any): UserSettings {
    return {
      // Display & Accessibility
      darkMode: serverData.dark_mode || false,
      textSize: serverData.text_size || 'Medium',
      
      // Privacy & Security
      autoLockTimer: serverData.auto_lock_timer || '5 minutes',

      // Notifications
      notificationsEnabled: serverData.notifications_enabled !== false,
      quietHoursEnabled: serverData.quiet_hours_enabled || false,
      quietStartTime: serverData.quiet_start_time || '22:00',
      quietEndTime: serverData.quiet_end_time || '08:00',
      reminderFrequency: serverData.reminder_frequency || 'Daily',
    };
  }

  private mapClientToServer(clientSettings: UserSettings): any {
    return {
      // Display & Accessibility
      darkMode: clientSettings.darkMode,
      textSize: clientSettings.textSize,
      
      // Privacy & Security
      autoLockTimer: clientSettings.autoLockTimer,

      // Notifications
      notificationsEnabled: clientSettings.notificationsEnabled,
      quietHoursEnabled: clientSettings.quietHoursEnabled,
      quietStartTime: clientSettings.quietStartTime,
      quietEndTime: clientSettings.quietEndTime,
      reminderFrequency: clientSettings.reminderFrequency,
    };
  }

  private getDefaultSettings(): UserSettings {
    return {
      darkMode: false,
      textSize: 'Medium',
      autoLockTimer: '5 minutes',
      notificationsEnabled: true,
      quietHoursEnabled: false,
      quietStartTime: '22:00',
      quietEndTime: '08:00',
      reminderFrequency: 'Daily',
    };
  }
}

export default new SettingsAPI();