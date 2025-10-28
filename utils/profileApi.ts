import { getApiBaseUrl } from './apiBaseUrl';
const API_BASE_URL = getApiBaseUrl();

// utils/profileApi.ts
export interface ClientProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  
  // CMHA Demographics fields
  pronouns?: string;
  isLGBTQ?: string;
  primaryLanguage?: string;
  mentalHealthConcerns?: string;
  supportNeeded?: string;
  ethnoculturalBackground?: string;
  canadaStatus?: string;
  dateCameToCanada?: string;
  
  profileImage?: string;
}

export const profileApi = {
  async getClientProfile(clerkUserId: string): Promise<ClientProfileData | null> {
    try {
      console.log('📋 Fetching profile for user:', clerkUserId);
      const response = await fetch(`${API_BASE_URL}/api/client-profile/${clerkUserId}`);

      console.log('Profile response status:', response.status);
      
<<<<<<< HEAD
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Profile not found, might be new user');
          return null;
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
=======
      // Step 1: Get specific user by Clerk ID
      const userResponse = await fetch(`${this.baseURL}/users/${clerkUserId}`);  // gets only one user
      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          console.log('User not found');
          return null;
        }
        throw new Error('Failed to fetch user');
>>>>>>> backend/appointments
      }

      const result = await response.json();
      
<<<<<<< HEAD
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
=======
      const currentClient = await userResponse.json();
        // Build profile data from users table
        const profileData: ClientProfileData = {
          firstName: currentClient.first_name || '',
          lastName: currentClient.last_name || '',
          email: currentClient.email || '',
          phoneNumber: currentClient.phone_number || '',
          location: '',
          notifications: false,
          shareWithSupportWorker: false,
          profileImage: ''
        };
      
      // Step 2: Get client emergency contact info from database
      const clientResponse = await fetch(`${this.baseURL}/clients/by-clerk/${clerkUserId}`);
      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        if (clientData && clientData !== null) {
          profileData.emergencyContactName = clientData.emergency_contact_name;
          profileData.emergencyContactPhone = clientData.emergency_contact_phone;
          profileData.emergencyContactRelationship = clientData.emergency_contact_relationship;
        }
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
      
      // Get shareWithSupportWorker preference from local storage
      const savedSharePreference = await AsyncStorage.getItem('shareWithSupportWorker');
      if (savedSharePreference) {
        profileData.shareWithSupportWorker = JSON.parse(savedSharePreference);
      }
      
      return profileData;
>>>>>>> backend/appointments
    } catch (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }
  },

  async uploadProfileImage(clerkUserId: string, imageUri: string): Promise<string> {
    try {
      console.log('📸 Uploading profile image (multipart) for user:', clerkUserId);

      // Build multipart/form-data payload
      const formData = new FormData();
      // Infer a filename and mime type
      const fileName = imageUri.split('/').pop() || `profile-${Date.now()}.jpg`;
      const mimeType = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

      // React Native/Expo file object
  // @ts-ignore - React Native file payload shape for FormData in Expo/React Native
      formData.append('profileImage', { uri: imageUri, name: fileName, type: mimeType });

      const apiResponse = await fetch(`${API_BASE_URL}/api/upload/profile-image/${encodeURIComponent(clerkUserId)}`, {
        method: 'POST',
        // Let fetch set the correct Content-Type boundary for multipart
        body: formData as any,
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('❌ Upload error:', errorText);
        throw new Error(`Failed to upload image: ${apiResponse.status}`);
      }

      const result = await apiResponse.json();
      if (result.success && result.data?.imageUrl) {
        return result.data.imageUrl as string;
      }
      throw new Error(result.message || 'Failed to upload image');
    } catch (error) {
      console.error('❌ Error uploading profile image:', error);
      throw error;
    }
  },

  async updateClientProfile(clerkUserId: string, profileData: Partial<ClientProfileData>): Promise<any> {
    try {
      console.log('🔄 Updating profile for user:', clerkUserId);
      
      const API_URL = `${API_BASE_URL}/api/client-profile/${clerkUserId}`;
      console.log('🌐 Making request to:', API_URL);
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Full error response:', errorText);
        throw new Error(`Failed to update profile: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Update successful:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Error updating client profile:', error);
      throw error;
    }
  }
};

export default profileApi;