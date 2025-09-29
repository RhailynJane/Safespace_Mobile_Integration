import axios from 'axios';
import { Platform } from 'react-native';

// Determine the correct API URL based on the platform
const getApiUrl = () => {
  if (__DEV__) {
    // Development mode
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      return 'http://10.0.2.2:3001/api';
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost
      return 'http://localhost:3001/api';
    } else {
      // Web or other platforms
      return 'http://localhost:3001/api';
    }
  }
  // Production mode - replace with your production API URL
  return 'https://your-production-api.com/api';
};

const API_URL = getApiUrl();

export interface MoodEntry {
  id: string;
  mood_type: 'very-happy' | 'happy' | 'neutral' | 'sad' | 'very-sad';
  intensity: number;
  notes?: string;
  created_at: string;
  mood_emoji: string;
  mood_label: string;
  mood_factors?: { factor: string }[];
}

export interface CreateMoodData {
  clerkUserId: string;
  moodType: string;
  intensity: number;
  notes?: string;
  factors?: string[];
}

export interface MoodFilters {
  moodType?: string;
  startDate?: string;
  endDate?: string;
  factors?: string;
  limit?: number;
  offset?: number;
}

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 second timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const moodApi = {
  // Create a new mood entry
  createMood: async (data: CreateMoodData) => {
    try {
      const response = await axios.post(`${API_URL}/moods`, data);
      return response.data;
    } catch (error: any) {
      console.error('Create mood error:', error.message);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to create mood');
      }
      throw new Error('Network error - cannot reach server');
    }
  },

  // Get recent moods
  getRecentMoods: async (clerkUserId: string, limit: number = 10) => {
    try {
      const response = await axios.get(`${API_URL}/moods/recent/${clerkUserId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get recent moods error:', error.message);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to fetch recent moods');
      }
      throw new Error('Network error - cannot reach server');
    }
  },

  // Get mood history with filters
  getMoodHistory: async (clerkUserId: string, filters?: MoodFilters) => {
    try {
      const response = await axios.get(`${API_URL}/moods/history/${clerkUserId}`, {
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Get mood history error:', error.message);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to fetch mood history');
      }
      throw new Error('Network error - cannot reach server');
    }
  },

  // Get mood statistics
  getMoodStats: async (clerkUserId: string, days: number = 30) => {
    try {
      const response = await axios.get(`${API_URL}/moods/stats/${clerkUserId}`, {
        params: { days }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get mood stats error:', error.message);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to fetch mood statistics');
      }
      throw new Error('Network error - cannot reach server');
    }
  },

  // Get all factors
  getFactors: async (clerkUserId: string) => {
    try {
      const response = await axios.get(`${API_URL}/moods/factors/${clerkUserId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get factors error:', error.message);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to fetch factors');
      }
      throw new Error('Network error - cannot reach server');
    }
  },

  // Update mood entry
  updateMood: async (moodId: string, data: Partial<CreateMoodData>) => {
    try {
      const response = await axios.put(`${API_URL}/moods/${moodId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update mood error:', error.message);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to update mood');
      }
      throw new Error('Network error - cannot reach server');
    }
  },

  // Delete mood entry
  deleteMood: async (moodId: string) => {
    try {
      const response = await axios.delete(`${API_URL}/moods/${moodId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete mood error:', error.message);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to delete mood');
      }
      throw new Error('Network error - cannot reach server');
    }
  },
};