import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

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

export const moodApi = {
  // Create a new mood entry
  createMood: async (data: CreateMoodData) => {
    const response = await axios.post(`${API_URL}/moods`, data);
    return response.data;
  },

  // Get recent moods
  getRecentMoods: async (clerkUserId: string, limit: number = 10) => {
    const response = await axios.get(`${API_URL}/moods/recent/${clerkUserId}`, {
      params: { limit }
    });
    return response.data;
  },

  // Get mood history with filters
  getMoodHistory: async (clerkUserId: string, filters?: MoodFilters) => {
    const response = await axios.get(`${API_URL}/moods/history/${clerkUserId}`, {
      params: filters
    });
    return response.data;
  },

  // Get mood statistics
  getMoodStats: async (clerkUserId: string, days: number = 30) => {
    const response = await axios.get(`${API_URL}/moods/stats/${clerkUserId}`, {
      params: { days }
    });
    return response.data;
  },

  // Get all factors
  getFactors: async (clerkUserId: string) => {
    const response = await axios.get(`${API_URL}/moods/factors/${clerkUserId}`);
    return response.data;
  },

  // Update mood entry
  updateMood: async (moodId: string, data: Partial<CreateMoodData>) => {
    const response = await axios.put(`${API_URL}/moods/${moodId}`, data);
    return response.data;
  },

  // Delete mood entry
  deleteMood: async (moodId: string) => {
    const response = await axios.delete(`${API_URL}/moods/${moodId}`);
    return response.data;
  },
};