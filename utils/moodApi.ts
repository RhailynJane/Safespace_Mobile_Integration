import axios from 'axios';
import { getApiBaseUrl } from './apiBaseUrl';
import { convexEnabled, getConvexApi, createConvexClientNoAuth, safeQuery, safeMutation } from './convexClient';

// Centralized API base URL resolution
const API_BASE_URL = getApiBaseUrl();

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

axios.defaults.timeout = 50000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const moodApi = {
  createMood: async (data: CreateMoodData) => {
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.moods?.recordMood) {
          const res = await safeMutation(client, api.moods.recordMood, {
            userId: data.clerkUserId,
            moodType: data.moodType,
            intensity: data.intensity,
            factors: data.factors,
            notes: data.notes,
          });
          if (res && res.success) return res;
        }
      }
    } catch (err) {
      // fall through to REST
    }

    // REST fallback
    try {
      const response = await axios.post(`${API_BASE_URL}/api/moods`, data);
      return response.data;
    } catch (error: any) {
      console.error('Create mood error:', error.message);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to create mood');
      }
      throw new Error('Network error - cannot reach server');
    }
  },

  getRecentMoods: async (clerkUserId: string, limit: number = 10) => {
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.moods?.getRecentMoods) {
          const res = await safeQuery(client, api.moods.getRecentMoods, { userId: clerkUserId, limit });
          if (Array.isArray(res)) return { moods: res };
        }
      }
    } catch (err) {
      console.debug('Convex getRecentMoods failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.get(`${API_BASE_URL}/api/moods/recent/${clerkUserId}`, {
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

  getMoodHistory: async (clerkUserId: string, filters?: MoodFilters) => {
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.moods?.getMoodHistory) {
          const res = await safeQuery(client, api.moods.getMoodHistory, {
            userId: clerkUserId,
            limit: filters?.limit,
            offset: filters?.offset,
            moodType: filters?.moodType,
            startDate: filters?.startDate,
            endDate: filters?.endDate,
            factors: filters?.factors ? filters.factors.split(',').filter(Boolean) : undefined,
          });
          if (res && Array.isArray(res.moods)) return res;
        }
      }
    } catch (err) {
      console.debug('Convex getMoodHistory failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.get(`${API_BASE_URL}/api/moods/history/${clerkUserId}`, {
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

  getMoodStats: async (clerkUserId: string, days: number = 30) => {
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.moods?.getMoodStats) {
          const res = await safeQuery(client, api.moods.getMoodStats, { userId: clerkUserId, days });
          if (res) return res;
        }
      }
    } catch (err) {
      console.debug('Convex getMoodStats failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.get(`${API_BASE_URL}/api/moods/stats/${clerkUserId}`, {
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

  getFactors: async (clerkUserId: string) => {
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.moods?.getFactors) {
          const res = await safeQuery(client, api.moods.getFactors, { userId: clerkUserId });
          if (res && Array.isArray(res.factors)) return res;
        }
      }
    } catch (err) {
      console.debug('Convex getFactors failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.get(`${API_BASE_URL}/api/moods/factors/${clerkUserId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get factors error:', error.message);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to fetch factors');
      }
      throw new Error('Network error - cannot reach server');
    }
  },

  updateMood: async (moodId: string, data: Partial<CreateMoodData>) => {
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.moods?.updateMood) {
          const res = await safeMutation(client, api.moods.updateMood, {
            id: moodId as any,
            moodType: data.moodType,
            intensity: data.intensity,
            factors: data.factors,
            notes: data.notes,
          });
          if (res && res.success) return res;
        }
      }
    } catch (err) {
      console.debug('Convex updateMood failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.put(`${API_BASE_URL}/api/moods/${moodId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update mood error:', error.message);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to update mood');
      }
      throw new Error('Network error - cannot reach server');
    }
  },

  deleteMood: async (moodId: string) => {
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.moods?.deleteMood) {
          const res = await safeMutation(client, api.moods.deleteMood, { id: moodId as any });
          if (res && res.success) return res;
        }
      }
    } catch (err) {
      console.debug('Convex deleteMood failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/moods/${moodId}`);
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