// utils/profileApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.select({
  ios: 'http://localhost:3001/api',
  android: 'http://10.0.2.2:3001/api',
  default: 'http://localhost:3001/api'
});

export interface ClientProfileData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  
  // Address
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  
  // Emergency Contacts
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  emergencyContactEmail?: string;
  emergencyContactAddress?: string;
  
  // Local-only settings (not in database)
  location?: string;
  notifications?: boolean;
  shareWithSupportWorker?: boolean;
  profileImage?: string;
}

class ProfileAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getClerkUserId(): Promise<string> {
    try {
      const authData = await AsyncStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.clerkUserId;
      }
      throw new Error('User not authenticated');
    } catch (error) {
      console.error('Error getting Clerk user ID:', error);
      throw new Error('User not authenticated');
    }
  }

  async getClientProfile(): Promise<ClientProfileData | null> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
      const response = await fetch(`${this.baseURL}/client-profile/${clerkUserId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }
  }

  async updateClientProfile(profileData: Partial<ClientProfileData>): Promise<any> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
      const response = await fetch(`${this.baseURL}/client-profile/${clerkUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error updating client profile:', error);
      throw error;
    }
  }

  async updateProfileImage(imageUri: string): Promise<string> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
      const response = await fetch(`${this.baseURL}/client-profile/${clerkUserId}/profile-image`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileImageUrl: imageUri }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile image: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Also save locally for offline access
        await AsyncStorage.setItem('profileImage', imageUri);
        return result.data.profileImageUrl;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      throw error;
    }
  }

  async getProfileImage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('profileImage');
    } catch (error) {
      console.error('Error getting profile image:', error);
      return null;
    }
  }
}

export default new ProfileAPI();