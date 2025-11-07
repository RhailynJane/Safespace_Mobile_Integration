import { useState, useEffect, useCallback } from 'react';
import { ConvexReactClient } from 'convex/react';

/**
 * Hook for mood tracking with Convex integration
 * Falls back to REST API if Convex is not available
 */
export function useConvexMoods(userId: string | undefined, convexClient: ConvexReactClient | null) {
  const [moods, setMoods] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Convex is enabled
  const isConvexEnabled = Boolean(convexClient && userId);

  /**
   * Load recent moods from Convex or REST API
   */
  const loadRecentMoods = useCallback(async (limit = 10) => {
    if (!userId) return [];

    try {
      setLoading(true);
      setError(null);

      if (isConvexEnabled && convexClient) {
        // Use Convex
        try {
          // @ts-ignore - generated at runtime by `npx convex dev`
          const { api } = await import('../../../convex/_generated/api');
          const convexMoods = await convexClient.query(api.moods.getRecentMoods, {
            userId,
            limit,
          });

          const formatted = convexMoods.map((mood: any) => ({
            id: mood._id,
            mood_type: mood.moodType,
            mood_emoji: mood.moodEmoji,
            mood_label: mood.moodLabel,
            created_at: new Date(mood.createdAt).toISOString(),
            notes: mood.notes,
          }));

          setMoods(formatted);
          return formatted;
        } catch (convexError) {
          console.warn('Convex mood query failed, falling back to REST:', convexError);
          // Fall through to REST API
        }
      }

      // Fallback to REST API
      const { moodApi } = await import('../moodApi');
      const data = await moodApi.getRecentMoods(userId, limit);
      setMoods(data.moods || []);
      return data.moods || [];
    } catch (err) {
      console.error('Error loading moods:', err);
      setError('Failed to load mood data');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, isConvexEnabled, convexClient]);

  /**
   * Load mood statistics
   */
  const loadMoodStats = useCallback(async (days = 7) => {
    if (!userId) return null;

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../../convex/_generated/api');
          const convexStats = await convexClient.query(api.moods.getMoodStats, {
            userId,
            days,
          });

          setStats(convexStats);
          return convexStats;
        } catch (convexError) {
          console.warn('Convex stats query failed, falling back to REST:', convexError);
        }
      }

      // Fallback: calculate stats from loaded moods
      const distribution: Record<string, number> = {};
      moods.forEach(mood => {
        distribution[mood.mood_type] = (distribution[mood.mood_type] || 0) + 1;
      });

      const calculatedStats = {
        totalEntries: moods.length,
        distribution,
        averageMood: 0,
      };

      setStats(calculatedStats);
      return calculatedStats;
    } catch (err) {
      console.error('Error loading mood stats:', err);
      return null;
    }
  }, [userId, moods, isConvexEnabled, convexClient]);

  /**
   * Record a new mood entry
   */
  const recordMood = useCallback(async (moodData: {
    moodType: string;
    moodEmoji?: string;
    moodLabel?: string;
    notes?: string;
  }) => {
    if (!userId) throw new Error('User ID required');

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../../convex/_generated/api');
          await convexClient.mutation(api.moods.recordMood, {
            userId,
            ...moodData,
          });

          // Refresh moods after recording
          await loadRecentMoods();
          return { success: true };
        } catch (convexError) {
          console.warn('Convex mood mutation failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      const { moodApi } = await import('../moodApi');
      const response = await moodApi.createMood({
        clerkUserId: userId,
        moodType: moodData.moodType,
        intensity: 5, // Default intensity
        notes: moodData.notes,
      });

      // Refresh moods after recording
      await loadRecentMoods();
      return response;
    } catch (err) {
      console.error('Error recording mood:', err);
      throw err;
    }
  }, [userId, isConvexEnabled, convexClient, loadRecentMoods]);

  // Load initial data
  useEffect(() => {
    if (userId) {
      loadRecentMoods();
    }
  }, [userId, loadRecentMoods]);

  return {
    moods,
    stats,
    loading,
    error,
    loadRecentMoods,
    loadMoodStats,
    recordMood,
    isUsingConvex: isConvexEnabled,
  };
}
