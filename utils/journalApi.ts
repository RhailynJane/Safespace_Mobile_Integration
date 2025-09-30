// journalApi.ts
import axios from 'axios';

const API_URL = 'http://192.168.1.100:3001/api';

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  emotion_type?: string;
  emoji?: string;
  template_id?: number;
  share_with_support_worker: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateJournalData {
  clerkUserId: string;
  title: string;
  content: string;
  emotionType?: string;
  emoji?: string;
  templateId?: number;
  tags?: string[];
  shareWithSupportWorker?: boolean;
}

export interface JournalTemplate {
  id: number;
  name: string;
  description: string;
  prompts: string[];
  icon: string;
}

export const journalApi = {
  // Get templates
  getTemplates: async () => {
    try {
      const response = await axios.get(`${API_URL}/journal/templates`);
      return response.data;
    } catch (error: any) {
      console.error('Get templates error:', error.message);
      throw new Error('Failed to fetch templates');
    }
  },

  // Create entry
  createEntry: async (data: CreateJournalData) => {
    try {
      const response = await axios.post(`${API_URL}/journal`, data);
      return response.data;
    } catch (error: any) {
      console.error('Create entry error:', error.message);
      if (error.response) {
        throw new Error(error.response.data.error || 'Failed to create journal entry');
      }
      throw new Error('Network error');
    }
  },

  // Get recent entries
  getRecentEntries: async (clerkUserId: string, limit: number = 10) => {
    try {
      const response = await axios.get(`${API_URL}/journal/recent/${clerkUserId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('Get recent entries error:', error.message);
      throw new Error('Failed to fetch recent entries');
    }
  },

  // Get entry by ID
  getEntry: async (entryId: string) => {
    try {
      const response = await axios.get(`${API_URL}/journal/${entryId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get entry error:', error.message);
      throw new Error('Failed to fetch journal entry');
    }
  },

  // Update entry
  updateEntry: async (entryId: string, data: Partial<CreateJournalData>) => {
    try {
      const response = await axios.put(`${API_URL}/journal/${entryId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update entry error:', error.message);
      throw new Error('Failed to update journal entry');
    }
  },

  // Delete entry
  deleteEntry: async (entryId: string) => {
    try {
      const response = await axios.delete(`${API_URL}/journal/${entryId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete entry error:', error.message);
      throw new Error('Failed to delete journal entry');
    }
  },

  // Get history with filters
  getHistory: async (clerkUserId: string, filters?: any) => {
    try {
      const response = await axios.get(`${API_URL}/journal/history/${clerkUserId}`, {
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Get history error:', error.message);
      throw new Error('Failed to fetch journal history');
    }
  },
};