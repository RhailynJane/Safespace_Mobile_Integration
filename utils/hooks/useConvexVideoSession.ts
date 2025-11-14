import { useState, useCallback } from 'react';
import { ConvexReactClient, useConvex } from 'convex/react';

/**
 * Hook for video call session management with Convex integration
 */
export function useConvexVideoSession(convexClient: ConvexReactClient | null) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const providerClient = useConvex();
  const effectiveClient: ConvexReactClient | null = convexClient ?? (providerClient as unknown as ConvexReactClient);

  // Check if Convex is enabled
  const isConvexEnabled = Boolean(effectiveClient);

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

      if (isConvexEnabled && effectiveClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          const args: any = {
            supportWorkerName: params.supportWorkerName,
            supportWorkerId: params.supportWorkerId,
            audioOption: params.audioOption,
          };
          if (params.appointmentId) {
            args.appointmentId = params.appointmentId as any;
          }
          const result = await effectiveClient.mutation(api.videoCallSessions.startSession, args);

          setSessionId(result.sessionId);
          console.log('✅ Video session started in Convex:', result.sessionId);
          return result.sessionId;
        } catch (convexError: any) {
          // Session tracking is optional - gracefully handle auth errors
          const errorMsg = convexError?.message || convexError?.toString() || 'Unknown error';
          if (errorMsg.includes('Unauthenticated')) {
            console.warn('⚠️ Convex session tracking unavailable (auth required). Call will proceed without tracking.');
          } else {
            console.warn('Convex session start failed, continuing without tracking:', convexError);
          }
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
  }, [isConvexEnabled, effectiveClient]);

  /**
   * Mark session as connected
   */
  const markConnected = useCallback(async (sessionIdToUpdate?: string) => {
    const targetSessionId = sessionIdToUpdate || sessionId;
    if (!targetSessionId) return;

    try {
      if (isConvexEnabled && effectiveClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await effectiveClient.mutation(api.videoCallSessions.markConnected, {
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
  }, [sessionId, isConvexEnabled, effectiveClient]);

  /**
   * Attach an existing session ID (e.g., received via navigation params)
   * Useful when the session was started on a previous screen.
   */
  const attachExistingSession = useCallback((existingSessionId: string | null | undefined) => {
    if (existingSessionId) {
      setSessionId(existingSessionId);
    }
  }, []);

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

      if (isConvexEnabled && effectiveClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          const result = await effectiveClient.mutation(api.videoCallSessions.endSession, {
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
  }, [sessionId, isConvexEnabled, effectiveClient]);

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
      if (isConvexEnabled && effectiveClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await effectiveClient.mutation(api.videoCallSessions.updateSessionSettings, {
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
  }, [sessionId, isConvexEnabled, effectiveClient]);

  /**
   * Report a quality issue
   */
  const reportQualityIssue = useCallback(async (issue: string) => {
    if (!sessionId) return;

    try {
      if (isConvexEnabled && effectiveClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await effectiveClient.mutation(api.videoCallSessions.reportQualityIssue, {
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
  }, [sessionId, isConvexEnabled, effectiveClient]);

  return {
    sessionId,
    loading,
    error,
    startSession,
    markConnected,
    endSession,
    updateSettings,
    reportQualityIssue,
    attachExistingSession,
    isUsingConvex: isConvexEnabled,
  };
}
