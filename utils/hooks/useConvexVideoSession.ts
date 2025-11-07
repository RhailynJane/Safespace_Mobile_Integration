import { useState, useCallback } from 'react';
import { ConvexReactClient } from 'convex/react';

/**
 * Hook for video call session management with Convex integration
 */
export function useConvexVideoSession(convexClient: ConvexReactClient | null) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if Convex is enabled
  const isConvexEnabled = Boolean(convexClient);

  /**
   * Start a new video call session
   */
  const startSession = useCallback(async (params: {
    appointmentId?: string;
    supportWorkerName: string;
    supportWorkerId?: string;
    audioOption?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          const result = await convexClient.mutation(api.videoCallSessions.startSession, {
            appointmentId: params.appointmentId as any,
            supportWorkerName: params.supportWorkerName,
            supportWorkerId: params.supportWorkerId,
            audioOption: params.audioOption,
          });

          setSessionId(result.sessionId);
          console.log('✅ Video session started in Convex:', result.sessionId);
          return result.sessionId;
        } catch (convexError) {
          console.warn('Convex session start failed, continuing without tracking:', convexError);
        }
      }

      // Session tracking is optional - return null if Convex unavailable
      return null;
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start session tracking');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isConvexEnabled, convexClient]);

  /**
   * Mark session as connected
   */
  const markConnected = useCallback(async (sessionIdToUpdate?: string) => {
    const targetSessionId = sessionIdToUpdate || sessionId;
    if (!targetSessionId) return;

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await convexClient.mutation(api.videoCallSessions.markConnected, {
            sessionId: targetSessionId as any,
          });

          console.log('✅ Session marked as connected');
        } catch (convexError) {
          console.warn('Failed to mark session connected:', convexError);
        }
      }
    } catch (err) {
      console.error('Error marking session connected:', err);
    }
  }, [sessionId, isConvexEnabled, convexClient]);

  /**
   * End the current session
   */
  const endSession = useCallback(async (params?: {
    sessionIdToEnd?: string;
    endReason?: string;
  }) => {
    const targetSessionId = params?.sessionIdToEnd || sessionId;
    if (!targetSessionId) return;

    try {
      setLoading(true);

      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          const result = await convexClient.mutation(api.videoCallSessions.endSession, {
            sessionId: targetSessionId as any,
            endReason: params?.endReason,
          });

          console.log('✅ Session ended. Duration:', result.duration, 'seconds');
          setSessionId(null);
          return result;
        } catch (convexError) {
          console.warn('Failed to end session in Convex:', convexError);
        }
      }

      setSessionId(null);
      return null;
    } catch (err) {
      console.error('Error ending session:', err);
      setError('Failed to end session');
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId, isConvexEnabled, convexClient]);

  /**
   * Update session settings
   */
  const updateSettings = useCallback(async (settings: {
    cameraEnabled?: boolean;
    micEnabled?: boolean;
    audioOption?: string;
  }) => {
    if (!sessionId) return;

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await convexClient.mutation(api.videoCallSessions.updateSessionSettings, {
            sessionId: sessionId as any,
            ...settings,
          });

          console.log('✅ Session settings updated');
        } catch (convexError) {
          console.warn('Failed to update session settings:', convexError);
        }
      }
    } catch (err) {
      console.error('Error updating session settings:', err);
    }
  }, [sessionId, isConvexEnabled, convexClient]);

  /**
   * Report a quality issue
   */
  const reportQualityIssue = useCallback(async (issue: string) => {
    if (!sessionId) return;

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await convexClient.mutation(api.videoCallSessions.reportQualityIssue, {
            sessionId: sessionId as any,
            issue,
          });

          console.log('✅ Quality issue reported');
        } catch (convexError) {
          console.warn('Failed to report quality issue:', convexError);
        }
      }
    } catch (err) {
      console.error('Error reporting quality issue:', err);
    }
  }, [sessionId, isConvexEnabled, convexClient]);

  return {
    sessionId,
    loading,
    error,
    startSession,
    markConnected,
    endSession,
    updateSettings,
    reportQualityIssue,
    isUsingConvex: isConvexEnabled,
  };
}
