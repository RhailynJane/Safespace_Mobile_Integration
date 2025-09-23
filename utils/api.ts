// utils/api.ts
import { Platform } from 'react-native';

// Configure your API base URL
const getBaseURL = () => {
  if (__DEV__) {
    // Development URLs
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001'; // Android emulator
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:3001'; // iOS simulator
    } else {
      return 'http://localhost:3001'; // Web/Expo Go
    }
  } else {
    // Production URL - replace with your deployed backend URL
    return 'https://your-production-api.com';
  }
};

const API_BASE_URL = getBaseURL();

export interface SyncUserData {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface CreateClientData {
  userId: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  primaryDiagnosis?: string;
  secondaryDiagnoses?: string;
  allergies?: string;
  currentMedications?: string;
  carePlan?: string;
}

class ApiService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making API request to: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(`API Response:`, data);
      return data;
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async syncUser(userData: SyncUserData) {
    return this.makeRequest('/api/sync-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async createClient(clientData: CreateClientData) {
    return this.makeRequest('/api/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async getUsers() {
    return this.makeRequest('/api/users');
  }

  async getClient(userId: number) {
    return this.makeRequest(`/api/clients/${userId}`);
  }
}

export const apiService = new ApiService();