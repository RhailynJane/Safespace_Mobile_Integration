// journalApi.ts
import axios from 'axios';
import { getApiBaseUrl } from './apiBaseUrl';
import { convexEnabled, getConvexApi, createConvexClientNoAuth, safeQuery, safeMutation } from './convexClient';

const API_BASE_URL = getApiBaseUrl();

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
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.journal?.listTemplates) {
          const res = await safeQuery(client, api.journal.listTemplates, {});
          if (Array.isArray(res)) {
            return { templates: res };
          }
        }
      }
    } catch (err) {
      console.debug('Convex getTemplates failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.get(`${API_BASE_URL}/api/journal/templates`);
      return response.data;
    } catch (error: any) {
      console.error('Get templates error:', error.message);
      throw new Error('Failed to fetch templates');
    }
  },

  // Create entry
  createEntry: async (data: CreateJournalData) => {
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.journal?.createEntry) {
          const res = await safeMutation(client, api.journal.createEntry, {
            clerkUserId: data.clerkUserId,
            title: data.title,
            content: data.content,
            emotionType: data.emotionType,
            emoji: data.emoji,
            templateId: data.templateId,
            tags: data.tags,
            shareWithSupportWorker: data.shareWithSupportWorker,
          });
          if (res && res.success) return res;
        }
      }
    } catch (error: any) {
      // fall through to REST
    }

    // REST fallback
    try {
      const response = await axios.post(`${API_BASE_URL}/api/journal`, data);
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
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.journal?.listRecent) {
          const res = await safeQuery(client, api.journal.listRecent, { clerkUserId, limit });
          if (Array.isArray(res)) return { entries: res };
        }
      }
    } catch (err) {
      console.debug('Convex getRecentEntries failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.get(`${API_BASE_URL}/api/journal/recent/${clerkUserId}`, {
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
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.journal?.getEntry) {
          const res = await safeQuery(client, api.journal.getEntry, { id: entryId as any });
          if (res && res.entry) return res;
        }
      }
    } catch (err) {
      console.debug('Convex getEntry failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.get(`${API_BASE_URL}/api/journal/${entryId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get entry error:', error.message);
      throw new Error('Failed to fetch journal entry');
    }
  },

  // Update entry
  updateEntry: async (entryId: string, data: Partial<CreateJournalData>) => {
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.journal?.updateEntry) {
          const res = await safeMutation(client, api.journal.updateEntry, {
            id: entryId as any,
            title: data.title,
            content: data.content,
            emotionType: data.emotionType,
            emoji: data.emoji,
            templateId: data.templateId as any,
            tags: data.tags,
            shareWithSupportWorker: data.shareWithSupportWorker,
          });
          if (res && res.success) return res;
        }
      }
    } catch (err) {
      console.debug('Convex updateEntry failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.put(`${API_BASE_URL}/api/journal/${entryId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Update entry error:', error.message);
      throw new Error('Failed to update journal entry');
    }
  },

  // Delete entry
  deleteEntry: async (entryId: string) => {
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.journal?.deleteEntry) {
          const res = await safeMutation(client, api.journal.deleteEntry, { id: entryId as any });
          if (res && res.success) return res;
        }
      }
    } catch (err) {
      console.debug('Convex deleteEntry failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/journal/${entryId}`);
      return response.data;
    } catch (error: any) {
      console.error('Delete entry error:', error.message);
      throw new Error('Failed to delete journal entry');
    }
  },

  // Get history with filters
  getHistory: async (clerkUserId: string, filters?: any) => {
    // Convex-first
    try {
      if (convexEnabled()) {
        const api = await getConvexApi();
        const client = createConvexClientNoAuth();
        if (api && client && api.journal?.getHistory) {
          const res = await safeQuery(client, api.journal.getHistory, {
            clerkUserId,
            startDate: filters?.startDate,
            endDate: filters?.endDate,
          });
          if (res && Array.isArray(res.entries)) return res;
        }
      }
    } catch (err) {
      console.debug('Convex getHistory failed, falling back to REST', err);
    }

    // REST fallback
    try {
      const response = await axios.get(`${API_BASE_URL}/api/journal/history/${clerkUserId}`, {
        params: filters
      });
      return response.data;
    } catch (error: any) {
      console.error('Get history error:', error.message);
      throw new Error('Failed to fetch journal history');
    }
  },
};