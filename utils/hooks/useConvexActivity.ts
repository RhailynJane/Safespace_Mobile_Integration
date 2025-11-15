// utils/hooks/useConvexActivity.ts
import { useCallback } from 'react';
import { ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useConvexActivity(convexClient: ConvexReactClient | null) {
  // Record login
  const recordLogin = useCallback(async (userId: string) => {
    if (!convexClient) {
      console.log('📊 No Convex client available for activity tracking');
      return null;
    }

    try {
      const result = await convexClient.mutation(api.activities.recordLogin, { userId });
      console.log('✅ Login activity recorded in Convex');
      return result;
    } catch (err) {
      console.error('❌ Error recording login:', err);
      return null;
    }
  }, [convexClient]);

  // Record logout
  const recordLogout = useCallback(async (userId: string) => {
    if (!convexClient) {
      console.log('📊 No Convex client available for activity tracking');
      return null;
    }

    try {
      const result = await convexClient.mutation(api.activities.recordLogout, { userId });
      console.log('✅ Logout activity recorded in Convex');
      return result;
    } catch (err) {
      console.error('❌ Error recording logout:', err);
      return null;
    }
  }, [convexClient]);

  // Send heartbeat
  const heartbeat = useCallback(async (userId: string) => {
    if (!convexClient) {
      return null;
    }

    try {
      const result = await convexClient.mutation(api.activities.heartbeat, { userId });
      return result;
    } catch (err) {
      console.error('❌ Error sending heartbeat:', err);
      return null;
    }
  }, [convexClient]);

  // Get presence status
  const getPresenceStatus = useCallback(async (userId: string) => {
    if (!convexClient) {
      return null;
    }

    try {
      const result = await convexClient.query(api.activities.getPresenceStatus, { userId });
      return result;
    } catch (err) {
      console.error('❌ Error getting presence status:', err);
      return null;
    }
  }, [convexClient]);

  // Get presence status for multiple users
  const getPresenceStatusBatch = useCallback(async (userIds: string[]) => {
    if (!convexClient) {
      return {};
    }

    try {
      const result = await convexClient.query(api.activities.getPresenceStatusBatch, { userIds });
      return result;
    } catch (err) {
      console.error('❌ Error getting batch presence status:', err);
      return {};
    }
  }, [convexClient]);

  return {
    recordLogin,
    recordLogout,
    heartbeat,
    getPresenceStatus,
    getPresenceStatusBatch,
  };
}
