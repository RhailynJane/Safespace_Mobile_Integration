/**
 * useConvexProfile Hook
 * 
 * Manages user profile data with Convex integration.
 * Implements dual-mode architecture: Convex-first with REST API fallback.
 * 
 * Features:
 * - Load user profile
 * - Sync profile (upsert)
 * - Update profile image
 * - Update preferences (theme, notifications)
 * - Graceful degradation to REST API
 * - Non-blocking error handling
 */

import { useState, useCallback, useEffect } from 'react';
import { ConvexReactClient } from 'convex/react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// REST API fallback functions
import profileApi from '../profileApi';

interface ProfileData {
  clerkId: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
  profileImageUrl?: string;
  preferences?: {
    theme?: string;
    notifications?: boolean;
  };
}

interface UseConvexProfileResult {
  profile: ProfileData | null;
  loading: boolean;
  error: string | null;
  loadProfile: () => Promise<ProfileData | null>;
  syncProfile: (profileData: Partial<ProfileData>) => Promise<void>;
  updateProfileImage: (imageUrl: string) => Promise<void>;
  updatePreferences: (preferences: ProfileData['preferences']) => Promise<void>;
  isUsingConvex: boolean;
}

/**
 * Hook for managing user profile with Convex integration
 */
export function useConvexProfile(
  clerkId: string | undefined,
  convexClient: ConvexReactClient | null
): UseConvexProfileResult {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Convex is enabled
  const isConvexEnabled = !!process.env.EXPO_PUBLIC_CONVEX_URL && !!convexClient;
  const isUsingConvex = isConvexEnabled && !!clerkId;

  /**
   * Load user profile from Convex or REST API
   */
  const loadProfile = useCallback(async (): Promise<ProfileData | null> => {
    if (!clerkId) return null;

    try {
      setLoading(true);
      setError(null);

      // Try Convex first if enabled
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore - generated at runtime by `npx convex dev`
          const { api } = await import('../../convex/_generated/api');
          
          const convexProfile = await convexClient.query(api.profiles.getProfile, {
            clerkId,
          });

          if (convexProfile) {
            const profileData: ProfileData = {
              clerkId: convexProfile.clerkId,
              phoneNumber: convexProfile.phoneNumber,
              location: convexProfile.location,
              bio: convexProfile.bio,
              profileImageUrl: convexProfile.profileImageUrl,
              preferences: convexProfile.preferences,
            };

            setProfile(profileData);
            
            // Also store in AsyncStorage for offline access
            await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
            
            return profileData;
          }
        } catch (convexError) {
          console.warn('Convex profile query failed, falling back to REST:', convexError);
          // Fall through to REST API
        }
      }

      // Fallback to REST API
      const restProfile = await profileApi.getClientProfile(clerkId);
      
      if (restProfile) {
        const profileData: ProfileData = {
          clerkId,
          phoneNumber: restProfile.phoneNumber,
          location: `${restProfile.city || ''}${restProfile.city && restProfile.state ? ', ' : ''}${restProfile.state || ''}`.trim() || undefined,
          bio: undefined, // Not in REST API
          profileImageUrl: restProfile.profileImage,
          preferences: {
            theme: 'system', // Default
            notifications: true, // Default
          },
        };

        setProfile(profileData);
        
        // Store in AsyncStorage
        await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
        
        return profileData;
      }
      
      return null;
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      
      // Try to load from AsyncStorage as last resort
      try {
        const cached = await AsyncStorage.getItem('userProfile');
        if (cached) {
          const cachedProfile = JSON.parse(cached);
          setProfile(cachedProfile);
          return cachedProfile;
        }
      } catch (cacheErr) {
        console.warn('Failed to load cached profile:', cacheErr);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [clerkId, isConvexEnabled, convexClient]);

  /**
   * Sync profile data (upsert - create if new, update if exists)
   */
  const syncProfile = useCallback(async (profileData: Partial<ProfileData>) => {
    if (!clerkId) throw new Error('Clerk ID required');

    try {
      setLoading(true);
      setError(null);

      // Try Convex first
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await convexClient.mutation(api.profiles.syncProfile, {
            clerkId,
            phoneNumber: profileData.phoneNumber,
            location: profileData.location,
            bio: profileData.bio,
            profileImageUrl: profileData.profileImageUrl,
            preferences: profileData.preferences,
          });

          // Refresh profile after syncing
          await loadProfile();
          return;
        } catch (convexError) {
          console.warn('Convex sync profile failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      // Note: REST API uses profileApi which has limited fields
      // For now, just update what we can through Convex or throw error
      if (!isConvexEnabled || !convexClient) {
        console.warn('Cannot sync profile without Convex - REST API has different schema');
        throw new Error('Profile sync requires Convex integration');
      }

      // Refresh profile
      await loadProfile();
    } catch (err) {
      console.error('Error syncing profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clerkId, isConvexEnabled, convexClient, loadProfile]);

  /**
   * Update profile image
   */
  const updateProfileImage = useCallback(async (imageUrl: string) => {
    if (!clerkId) throw new Error('Clerk ID required');

    try {
      setLoading(true);
      setError(null);

      // Try Convex first
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await convexClient.mutation(api.profiles.updateProfileImage, {
            clerkId,
            profileImageUrl: imageUrl,
          });

          // Update local state optimistically
          setProfile(prev => prev ? { ...prev, profileImageUrl: imageUrl } : null);
          return;
        } catch (convexError) {
          console.warn('Convex update image failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      // Note: Use profileApi.updateClientProfile for basic updates
      await profileApi.updateClientProfile(clerkId, {
        profileImage: imageUrl,
      });
      
      // Update local state
      setProfile(prev => prev ? { ...prev, profileImageUrl: imageUrl } : null);
    } catch (err) {
      console.error('Error updating profile image:', err);
      setError(err instanceof Error ? err.message : 'Failed to update image');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clerkId, isConvexEnabled, convexClient]);

  /**
   * Update user preferences
   */
  const updatePreferences = useCallback(async (preferences: ProfileData['preferences']) => {
    if (!clerkId) throw new Error('Clerk ID required');

    try {
      setLoading(true);
      setError(null);

      // Try Convex first
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await convexClient.mutation(api.profiles.updatePreferences, {
            clerkId,
            preferences: preferences || { theme: 'system', notifications: true },
          });

          // Update local state optimistically
          setProfile(prev => prev ? { ...prev, preferences } : null);
          return;
        } catch (convexError) {
          console.warn('Convex update preferences failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      // Note: REST API doesn't support preferences, store locally only
      console.warn('Preferences update via REST not supported, using local storage only');
      
      // Update local state and storage
      setProfile(prev => prev ? { ...prev, preferences } : null);
      
      if (profile) {
        const updated = { ...profile, preferences };
        await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clerkId, isConvexEnabled, convexClient, profile]);

  // Auto-load profile when clerkId changes
  useEffect(() => {
    if (clerkId && convexClient) {
      loadProfile();
    }
  }, [clerkId, convexClient, loadProfile]);

  return {
    profile,
    loading,
    error,
    loadProfile,
    syncProfile,
    updateProfileImage,
    updatePreferences,
    isUsingConvex,
  };
}
