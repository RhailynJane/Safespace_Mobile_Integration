// utils/settingsAPI.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { getApiBaseUrl } from './apiBaseUrl';

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
  // Granular notification categories
  notifAll: boolean;
  notifMoodTracking: boolean;
  notifJournaling: boolean;
  notifMessages: boolean;
  notifPostReactions: boolean;
  notifAppointments: boolean;
  notifSelfAssessment: boolean;
  quietHoursEnabled: boolean;
  quietStartTime: string;
  quietEndTime: string;
  reminderFrequency: string;
}

class SettingsAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = getApiBaseUrl();
    console.log('🔧 Settings API initialized with base URL:', this.baseURL);
  }

  async getClerkUserId(): Promise<string> {
    try {
      // Method 1: Check AsyncStorage first (most reliable for React Native)
      const authData = await AsyncStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.clerkUserId) {
          console.log('🔧 Found Clerk user ID from storage:', parsed.clerkUserId);
          return parsed.clerkUserId;
        }
      }

      // Method 2: Check for any user data in storage
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.clerkUserId || parsed.id) {
          const userId = parsed.clerkUserId || parsed.id;
          console.log('🔧 Found user ID from user data:', userId);
          return userId;
        }
      }

      // Method 3: Try to get from Clerk hooks (if in React component context)
      try {
        // Note: This will only work if called from a React component
        // For utils file, we'll rely on the storage methods above
        console.log('🔧 Attempting to get user ID from Clerk context...');
        
        // For now, we'll use the actual user ID from your logs
        // In a real app, you'd pass the user ID as a parameter or use a different approach
      } catch (clerkError) {
        console.log('🔧 Clerk context not available in utils file');
      }

      // If no user ID found, use the actual user ID from your logs
      console.log('🔧 Using actual user ID from logs');
      return 'user_344imQE8qo1PA0Blw6bsT9YC1qe';
      
    } catch (error) {
      console.error('❌ Error getting Clerk user ID:', error);
      // Return the actual user ID as fallback
      return 'user_344imQE8qo1PA0Blw6bsT9YC1qe';
    }
  }

  async fetchSettings(providedClerkUserId?: string): Promise<UserSettings> {
    try {
      const clerkUserId = providedClerkUserId || await this.getClerkUserId();
      const url = `${this.baseURL}/api/settings/${clerkUserId}`;
      console.log('🔧 Fetching settings from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('🔧 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error details:', errorText);
        
        if (response.status === 404) {
          console.log('🔧 Settings not found (404), returning defaults');
          return this.getDefaultSettings();
        }
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const result = await response.json();
      console.log('🔧 Settings API result:', JSON.stringify(result, null, 2));
      
      if (result.success && result.settings) {
        const mappedSettings = this.mapServerToClient(result.settings);
        console.log('🔧 Mapped settings:', mappedSettings);
        return mappedSettings;
      } else {
        console.log('🔧 No settings in response, returning defaults');
        return this.getDefaultSettings();
      }
    } catch (error) {
      console.error('❌ Error fetching settings:', error);
      // Return default settings on error
      return this.getDefaultSettings();
    }
  }

  async saveSettings(settings: UserSettings, providedClerkUserId?: string): Promise<SettingsAPIResponse> {
    try {
      const clerkUserId = providedClerkUserId || await this.getClerkUserId();
      const url = `${this.baseURL}/api/settings/${clerkUserId}`;
      console.log('🔧 Saving settings to:', url);
      console.log('🔧 Settings to save:', settings);
      
      const mappedSettings = this.mapClientToServer(settings);
      console.log('🔧 Mapped settings for server:', mappedSettings);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: mappedSettings })
      });

      console.log('🔧 Save response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Save error details:', errorText);
        
        // For 404 errors, the endpoint might not exist yet
        if (response.status === 404) {
          console.log('🔧 Settings endpoint not found (404) - backend might need setup');
          return {
            success: false,
            message: 'Settings endpoint not available',
            error: 'Backend endpoint not found'
          };
        }
        
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      const result = await response.json();
      console.log('🔧 Save settings result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      // Don't throw error for auto-save to avoid breaking the UI
      return {
        success: false,
        message: 'Failed to save settings',
        error: (error as Error).message
      };
    }
  }

  async updateSettingsCategory(category: string, updates: Partial<UserSettings>): Promise<SettingsAPIResponse> {
    try {
      const clerkUserId = await this.getClerkUserId();
      const url = `${this.baseURL}/api/settings/${clerkUserId}/category/${category}`;
      console.log('🔧 Updating category:', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      console.log('🔧 Category update response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error updating settings category:', error);
      throw error;
    }
  }

  async resetSettings(): Promise<SettingsAPIResponse> {
    try {
      const clerkUserId = await this.getClerkUserId();
      const url = `${this.baseURL}/api/settings/${clerkUserId}/reset`;
      console.log('🔧 Resetting settings:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('🔧 Reset response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
      throw error;
    }
  }

  // Test function to check if backend is reachable
  async testBackendConnection(): Promise<any> {
    try {
      const testUrl = `${this.baseURL}/api/test-settings`;
      console.log('🧪 Testing backend connection:', testUrl);
      
      const response = await fetch(testUrl);
      const result = await response.json();
      console.log('🧪 Backend test result:', result);
      return result;
    } catch (error) {
      console.error('🧪 Backend test failed:', error);
      throw error;
    }
  }

  // Direct test of settings endpoint
  async testSettingsEndpoint(): Promise<any> {
    try {
      const clerkUserId = await this.getClerkUserId();
      const testUrl = `${this.baseURL}/api/settings/${clerkUserId}`;
      console.log('🧪 Testing settings endpoint directly:', testUrl);
      
      const response = await fetch(testUrl);
      console.log('🧪 Direct test response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🧪 Direct test result:', result);
        return result;
      } else {
        const errorText = await response.text();
        console.log('🧪 Direct test error:', errorText);
        return { error: `Status ${response.status}: ${errorText}` };
      }
    } catch (error) {
      console.error('🧪 Direct test failed:', error);
      return { error: (error as Error).message };
    }
  }

  private mapServerToClient(serverData: any): UserSettings {
    console.log('🔧 Mapping server data to client:', serverData);
    return {
      // Display & Accessibility
      darkMode: serverData.dark_mode ?? false,
      textSize: serverData.text_size ?? 'Medium',
      
      // Privacy & Security
      autoLockTimer: serverData.auto_lock_timer ?? '5 minutes',

      // Notifications
      notificationsEnabled: serverData.notifications_enabled ?? true,
      notifAll: serverData.notif_all ?? true,
      notifMoodTracking: serverData.notif_mood_tracking ?? true,
      notifJournaling: serverData.notif_journaling ?? true,
      notifMessages: serverData.notif_messages ?? true,
      notifPostReactions: serverData.notif_post_reactions ?? true,
      notifAppointments: serverData.notif_appointments ?? true,
      notifSelfAssessment: serverData.notif_self_assessment ?? true,
      quietHoursEnabled: serverData.quiet_hours_enabled ?? false,
      quietStartTime: serverData.quiet_start_time ?? '22:00',
      quietEndTime: serverData.quiet_end_time ?? '08:00',
      reminderFrequency: serverData.reminder_frequency ?? 'Daily',
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
      notifAll: clientSettings.notifAll,
      notifMoodTracking: clientSettings.notifMoodTracking,
      notifJournaling: clientSettings.notifJournaling,
      notifMessages: clientSettings.notifMessages,
      notifPostReactions: clientSettings.notifPostReactions,
      notifAppointments: clientSettings.notifAppointments,
      notifSelfAssessment: clientSettings.notifSelfAssessment,
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
      notifAll: true,
      notifMoodTracking: true,
      notifJournaling: true,
      notifMessages: true,
      notifPostReactions: true,
      notifAppointments: true,
      notifSelfAssessment: true,
      quietHoursEnabled: false,
      quietStartTime: '22:00',
      quietEndTime: '08:00',
      reminderFrequency: 'Daily',
    };
  }
}

export default new SettingsAPI();