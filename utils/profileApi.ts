//claude ai prompt: how can I create a backend API for my edit profile page?
// utils/profileApi.ts - Final version matching your exact backend structure

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Base API URL configuration
 */
const API_BASE_URL = Platform.select({
  ios: 'http://localhost:3001/api',
  android: 'http://10.0.2.2:3001/api',
  default: 'http://localhost:3001/api'
});

/**
 * Client profile data interface
 * Based on your actual database structure where:
 * - users table stores ALL users (admins, support workers, AND clients with role='client')
 * - clients table stores additional client info (emergency contacts)
 */
export interface ClientProfileData {
  // From users table (where role='client')
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  
  // From clients table (linked by user_id)
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  
  // Local storage only (not in current database)
  location?: string;
  profileImage?: string;
  notifications?: boolean;
}

class ProfileAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Gets the authenticated client's Clerk ID
   */
  async getClerkUserId(): Promise<string> {
    try {
      const authData = await AsyncStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.clerkUserId;
      }
      // For testing
      return 'test_user_123';
    } catch (error) {
      console.error('Error getting Clerk user ID:', error);
      throw new Error('Client not authenticated');
    }
  }

  /**
   * Fetches complete client profile
   * Gets data from users table (where role='client') and clients table
   */
  async getClientProfile(): Promise<ClientProfileData | null> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
      // Step 1: Get client from users table
      const usersResponse = await fetch(`${this.baseURL}/users`);
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const users = await usersResponse.json();
      // Find current client (role='client' in users table)
      const currentClient = users.find((u: any) => 
        u.clerk_user_id === clerkUserId && u.role === 'client'
      );
      
      if (!currentClient) {
        console.log('Client not found in users table');
        return null;
      }
      
      // Build profile data from users table
      const profileData: ClientProfileData = {
        firstName: currentClient.first_name || '',
        lastName: currentClient.last_name || '',
        email: currentClient.email || '',
        phoneNumber: currentClient.phone_number || '',
      };
      
      // Step 2: The clients table data would need a GET endpoint
      // Your backend has POST /api/clients but no GET
      // For now, we'll need to store emergency contacts locally or add a GET endpoint
      
      // Get emergency contacts from local storage (temporary solution)
      const savedEmergencyData = await AsyncStorage.getItem('emergencyContacts');
      if (savedEmergencyData) {
        const emergencyData = JSON.parse(savedEmergencyData);
        profileData.emergencyContactName = emergencyData.name;
        profileData.emergencyContactPhone = emergencyData.phone;
        profileData.emergencyContactRelationship = emergencyData.relationship;
      }
      
      // Get location from local storage (not in database)
      const savedLocation = await AsyncStorage.getItem('userLocation');
      if (savedLocation) {
        profileData.location = savedLocation;
      }
      
      // Get profile image from local storage
      const savedImage = await AsyncStorage.getItem('profileImage');
      if (savedImage) {
        profileData.profileImage = savedImage;
      }
      
      // Get notification preference from local storage
      const savedNotifications = await AsyncStorage.getItem('notificationsEnabled');
      if (savedNotifications) {
        profileData.notifications = JSON.parse(savedNotifications);
      }
      
      return profileData;
    } catch (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }
  }

  /**
   * Updates client profile across multiple tables
   */
  async updateClientProfile(profileData: Partial<ClientProfileData>): Promise<any> {
    try {
      const clerkUserId = await this.getClerkUserId();
      
      // Step 1: Sync client data with users table (creates or updates)
      const syncResponse = await fetch(`${this.baseURL}/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkUserId,
          email: profileData.email,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phoneNumber: profileData.phoneNumber,
        })
      });
      
      if (!syncResponse.ok) {
        throw new Error('Failed to sync client data');
      }
      
      const syncResult = await syncResponse.json();
      console.log('Sync result:', syncResult);
      
      // Step 2: Update emergency contacts in clients table
      if (syncResult.user && syncResult.user.id) {
        const userId = syncResult.user.id; // Internal user ID from database
        
        // Update clients table if emergency contact info provided
        if (profileData.emergencyContactName || 
            profileData.emergencyContactPhone || 
            profileData.emergencyContactRelationship) {
          
          const clientResponse = await fetch(`${this.baseURL}/clients`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userId, // Use the internal ID, not clerkUserId
              emergencyContactName: profileData.emergencyContactName || '',
              emergencyContactPhone: profileData.emergencyContactPhone || '',
              emergencyContactRelationship: profileData.emergencyContactRelationship || '',
            })
          });
          
          if (!clientResponse.ok) {
            console.error('Failed to update emergency contacts in clients table');
          } else {
            // Also save locally for offline access
            await AsyncStorage.setItem('emergencyContacts', JSON.stringify({
              name: profileData.emergencyContactName,
              phone: profileData.emergencyContactPhone,
              relationship: profileData.emergencyContactRelationship,
            }));
          }
        }
      }
      
      // Step 3: Save location locally (not in database schema)
      if (profileData.location !== undefined) {
        await AsyncStorage.setItem('userLocation', profileData.location);
      }
      
      // Step 4: Save profile image locally
      if (profileData.profileImage) {
        await AsyncStorage.setItem('profileImage', profileData.profileImage);
      }
      
      // Step 5: Save notification preference locally
      if (profileData.notifications !== undefined) {
        await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(profileData.notifications));
      }
      
      return { success: true, message: 'Client profile updated successfully' };
    } catch (error) {
      console.error('Error updating client profile:', error);
      throw error;
    }
  }

  /**
   * Gets stored profile image from local storage
   */
  async getProfileImage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('profileImage');
    } catch (error) {
      console.error('Error getting profile image:', error);
      return null;
    }
  }

  /**
   * Saves profile image locally
   */
  async uploadProfileImage(imageUri: string): Promise<string> {
    try {
      await AsyncStorage.setItem('profileImage', imageUri);
      return imageUri;
    } catch (error) {
      console.error('Error saving profile image:', error);
      throw error;
    }
  }
}

export default new ProfileAPI();

/**
 * DATABASE STRUCTURE:
 * 
 * users table:
 * - Stores ALL users (admins, support workers, AND clients)
 * - Has a 'role' field that can be 'admin', 'support_worker', or 'client'
 * - When you call /api/sync-user, it creates a user with role='client'
 * 
 * clients table:
 * - Stores additional client-specific info
 * - Links to users table via user_id (not clerk_user_id)
 * - Contains: emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
 * 
 * Your endpoints:
 * - POST /api/sync-user - Creates/updates a user with role='client'
 * - POST /api/clients - Creates/updates emergency contact info
 * - GET /api/users - Returns all users (including clients)
 * 
 * What's missing from your backend:
 * - GET /api/clients/:userId - To fetch emergency contact info
 * - Location field (not in any table)
 * - Profile image storage
 */