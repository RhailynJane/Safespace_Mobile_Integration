/**
 * Assessments API with Convex-first pattern
 * Try Convex → Fallback to REST API → Fallback to local storage
 */

import { api } from '../convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './api';

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || '';
const convexClient = new ConvexHttpClient(CONVEX_URL);

export interface AssessmentResponse {
  question: string;
  answer: number;
}

export interface Assessment {
  id: string;
  userId: string;
  assessmentType: string;
  responses: AssessmentResponse[];
  totalScore: number;
  completedAt: string;
  nextDueDate: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentStats {
  totalAssessments: number;
  averageScore: number | null;
  latestScore: number | null;
  trend: 'improving' | 'stable' | 'declining' | null;
  scores?: Array<{ score: number; date: string }>;
}

/**
 * Check if assessment is due for a user
 */
export const isAssessmentDue = async (userId: string): Promise<{ isDue: boolean; daysUntilDue: number }> => {
  try {
    // Try Convex first
    const result = await convexClient.query(api.assessments.isAssessmentDue, { userId });
    return result;
  } catch (convexError) {
    console.warn('Convex isAssessmentDue failed, falling back to REST:', convexError);
    
    try {
      // Fallback to REST API
      const response = await apiService.isAssessmentDue(userId);
      return response;
    } catch (restError) {
      console.warn('REST isAssessmentDue failed, using local fallback:', restError);
      
      // Fallback to local storage
      try {
        const storedData = await AsyncStorage.getItem(`assessment_due_${userId}`);
        if (storedData) {
          return JSON.parse(storedData);
        }
      } catch (localError) {
        console.error('Local storage read failed:', localError);
      }
      
      // Default: assume due
      return { isDue: true, daysUntilDue: 0 };
    }
  }
};

/**
 * Get the latest assessment for a user
 */
export const getLatestAssessment = async (userId: string): Promise<Assessment | null> => {
  try {
    // Try Convex first
    const result = await convexClient.query(api.assessments.getLatestAssessment, { userId });
    return result;
  } catch (convexError) {
    console.warn('Convex getLatestAssessment failed, falling back to REST:', convexError);
    
    try {
      // Fallback to REST API
      const response = await apiService.getLatestAssessment(userId);
      return response;
    } catch (restError) {
      console.warn('REST getLatestAssessment failed, using local fallback:', restError);
      
      // Fallback to local storage
      try {
        const storedData = await AsyncStorage.getItem(`latest_assessment_${userId}`);
        if (storedData) {
          return JSON.parse(storedData);
        }
      } catch (localError) {
        console.error('Local storage read failed:', localError);
      }
      
      return null;
    }
  }
};

/**
 * Get assessment history for a user (paginated)
 */
export const getAssessmentHistory = async (
  userId: string,
  limit: number = 10
): Promise<Assessment[]> => {
  try {
    // Try Convex first
    const result = await convexClient.query(api.assessments.getAssessmentHistory, {
      userId,
      limit,
    });
    return result;
  } catch (convexError) {
    console.warn('Convex getAssessmentHistory failed, falling back to REST:', convexError);
    
    try {
      // Fallback to REST API
      const response = await apiService.getAssessmentHistory(userId);
      return response;
    } catch (restError) {
      console.warn('REST getAssessmentHistory failed, using local fallback:', restError);
      
      // Fallback to local storage
      try {
        const storedData = await AsyncStorage.getItem(`assessment_history_${userId}`);
        if (storedData) {
          const history = JSON.parse(storedData) as Assessment[];
          return history.slice(0, limit);
        }
      } catch (localError) {
        console.error('Local storage read failed:', localError);
      }
      
      return [];
    }
  }
};

/**
 * Get assessment statistics for a user
 */
export const getAssessmentStats = async (userId: string): Promise<AssessmentStats> => {
  try {
    // Try Convex first
    const result = await convexClient.query(api.assessments.getAssessmentStats, { userId });
    return result;
  } catch (convexError) {
    console.warn('Convex getAssessmentStats failed, using fallback:', convexError);
    
    // Return default stats if all methods fail
    return {
      totalAssessments: 0,
      averageScore: null,
      latestScore: null,
      trend: null,
      scores: [],
    };
  }
};

/**
 * Submit a new assessment
 */
export const submitAssessment = async (
  userId: string,
  assessmentType: string,
  responses: AssessmentResponse[],
  totalScore: number,
  notes?: string
): Promise<Assessment> => {
  try {
    // Try Convex first
    const assessmentId = await convexClient.mutation(api.assessments.submitAssessment, {
      userId,
      assessmentType,
      responses,
      totalScore,
      notes,
    });
    
    // Fetch the created assessment
    const assessment = await getLatestAssessment(userId);
    
    // Clear local cache
    await AsyncStorage.removeItem(`assessment_due_${userId}`);
    await AsyncStorage.removeItem(`latest_assessment_${userId}`);
    await AsyncStorage.removeItem(`assessment_history_${userId}`);
    
    return assessment!;
  } catch (convexError) {
    console.error('Convex submitAssessment failed:', convexError);
    
    // Store locally for later sync
    const localAssessment: Assessment = {
      id: `local_${Date.now()}`,
      userId,
      assessmentType,
      responses,
      totalScore,
      completedAt: new Date().toISOString(),
      nextDueDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // ~6 months
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(`latest_assessment_${userId}`, JSON.stringify(localAssessment));
    
    // Store in pending sync queue
    try {
      const pending = await AsyncStorage.getItem('pending_assessments');
      const queue = pending ? JSON.parse(pending) : [];
      queue.push(localAssessment);
      await AsyncStorage.setItem('pending_assessments', JSON.stringify(queue));
    } catch (queueError) {
      console.error('Failed to queue assessment for sync:', queueError);
    }
    
    return localAssessment;
  }
};

/**
 * Update notes on an existing assessment
 */
export const updateAssessmentNotes = async (
  assessmentId: string,
  notes: string
): Promise<void> => {
  try {
    // Try Convex first - cast string to Id type
    await convexClient.mutation(api.assessments.updateAssessmentNotes, {
      assessmentId: assessmentId as any, // Convex Id type
      notes,
    });
  } catch (convexError) {
    console.error('Convex updateAssessmentNotes failed:', convexError);
    throw convexError;
  }
};

/**
 * Get upcoming due assessments (for reminders) - requires userId
 */
export const getUpcomingDueAssessments = async (
  userId: string,
  daysAhead: number = 7
): Promise<Assessment[]> => {
  try {
    // Try Convex first
    const result = await convexClient.query(api.assessments.getUpcomingDueAssessments, {
      userId,
      daysAhead,
    });
    return result;
  } catch (convexError) {
    console.warn('Convex getUpcomingDueAssessments failed:', convexError);
    return [];
  }
};

export default {
  isAssessmentDue,
  getLatestAssessment,
  getAssessmentHistory,
  getAssessmentStats,
  submitAssessment,
  updateAssessmentNotes,
  getUpcomingDueAssessments,
};
