const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

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
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('Profile not found, might be new user');
          return null;
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const result = await response.json();
      console.log('Profile API result:', result);
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error fetching client profile:', error);
      return null;
    }
  },

  async updateClientProfile(clerkUserId: string, profileData: Partial<ClientProfileData>): Promise<any> {
    try {
      console.log('🔄 Updating profile for user:', clerkUserId);
      console.log('📦 Full profile data being sent:', JSON.stringify(profileData, null, 2));
      
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