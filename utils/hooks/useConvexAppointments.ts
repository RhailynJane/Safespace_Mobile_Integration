import { useState, useEffect, useCallback } from 'react';
import { ConvexReactClient } from 'convex/react';

/**
 * Hook for appointment management with Convex integration
 * Falls back to REST API if Convex is not available
 */
export function useConvexAppointments(userId: string | undefined, convexClient: ConvexReactClient | null) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [nextAppointment, setNextAppointment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Convex is enabled
  const isConvexEnabled = Boolean(convexClient && userId);

  /**
   * Load all appointments for the user
   */
  const loadAppointments = useCallback(async () => {
    if (!userId) return [];

    try {
      setLoading(true);
      setError(null);

      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore - generated at runtime by `npx convex dev`
          const { api } = await import('../../convex/_generated/api');
          const convexAppointments = await convexClient.query(api.appointments.getUserAppointments, {
            userId,
          });

          // Transform Convex data to UI format
          const formatted = convexAppointments.map((apt: any) => ({
            id: apt._id,
            supportWorker: apt.supportWorker,
            date: apt.date,
            time: apt.time,
            type: apt.type,
            status: apt.status,
            notes: apt.notes,
            created_at: new Date(apt.createdAt).toISOString(),
            updated_at: new Date(apt.updatedAt).toISOString(),
          }));

          setAppointments(formatted);
          return formatted;
        } catch (convexError) {
          console.warn('Convex appointments query failed, falling back to REST:', convexError);
          // Fall through to REST API
        }
      }

      // Fallback to REST API
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/appointments?clerkUserId=${userId}`);
      const result = await response.json();

      if (result.success && result.appointments) {
        setAppointments(result.appointments);
        return result.appointments;
      }

      return [];
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, isConvexEnabled, convexClient]);

  /**
   * Load appointment statistics
   */
  const loadAppointmentStats = useCallback(async () => {
    if (!userId) return null;

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          const stats = await convexClient.query(api.appointments.getAppointmentStats, {
            userId,
          });

          setUpcomingCount(stats.upcomingCount);
          setCompletedCount(stats.completedCount);
          setNextAppointment(stats.nextAppointment);
          return stats;
        } catch (convexError) {
          console.warn('Convex stats query failed, falling back to local calculation:', convexError);
        }
      }

      // Fallback: calculate stats from loaded appointments
      const upcoming = appointments.filter(apt => apt.status === 'upcoming');
      const completed = appointments.filter(apt => apt.status === 'past');
      
      setUpcomingCount(upcoming.length);
      setCompletedCount(completed.length);
      
      // Find next appointment
      const sortedUpcoming = [...upcoming].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
      setNextAppointment(sortedUpcoming[0] || null);

      return {
        upcomingCount: upcoming.length,
        completedCount: completed.length,
        nextAppointment: sortedUpcoming[0] || null,
      };
    } catch (err) {
      console.error('Error loading appointment stats:', err);
      return null;
    }
  }, [userId, appointments, isConvexEnabled, convexClient]);

  /**
   * Create a new appointment
   */
  const createAppointment = useCallback(async (appointmentData: {
    supportWorker: string;
    date: string;
    time: string;
    type: string;
    notes?: string;
  }) => {
    if (!userId) throw new Error('User ID required');

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await convexClient.mutation(api.appointments.createAppointment, {
            userId,
            ...appointmentData,
            // status is automatically set to 'scheduled' in the mutation
          });

          // Refresh appointments after creating
          await loadAppointments();
          await loadAppointmentStats();
          return { success: true };
        } catch (convexError) {
          console.warn('Convex create mutation failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: userId,
          ...appointmentData,
        }),
      });

      if (!response.ok) throw new Error('Failed to create appointment');

      // Refresh appointments after creating
      await loadAppointments();
      await loadAppointmentStats();
      return { success: true };
    } catch (err) {
      console.error('Error creating appointment:', err);
      throw err;
    }
  }, [userId, isConvexEnabled, convexClient, loadAppointments, loadAppointmentStats]);

  /**
   * Update appointment status
   */
  const updateAppointmentStatus = useCallback(async (appointmentId: string, status: string) => {
    if (!userId) throw new Error('User ID required');

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          // @ts-ignore - Convert string ID to Convex Id type
          await convexClient.mutation(api.appointments.updateAppointmentStatus, {
            appointmentId: appointmentId as any,
            status,
          });

          // Refresh appointments after updating
          await loadAppointments();
          await loadAppointmentStats();
          return { success: true };
        } catch (convexError) {
          console.warn('Convex update mutation failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update appointment');

      // Refresh appointments after updating
      await loadAppointments();
      await loadAppointmentStats();
      return { success: true };
    } catch (err) {
      console.error('Error updating appointment:', err);
      throw err;
    }
  }, [userId, isConvexEnabled, convexClient, loadAppointments, loadAppointmentStats]);

  /**
   * Delete an appointment
   */
  const deleteAppointment = useCallback(async (appointmentId: string) => {
    if (!userId) throw new Error('User ID required');

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          // @ts-ignore - Convert string ID to Convex Id type
          await convexClient.mutation(api.appointments.deleteAppointment, {
            appointmentId: appointmentId as any,
          });

          // Refresh appointments after deleting
          await loadAppointments();
          await loadAppointmentStats();
          return { success: true };
        } catch (convexError) {
          console.warn('Convex delete mutation failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/appointments/${appointmentId}?clerkUserId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete appointment');

      // Refresh appointments after deleting
      await loadAppointments();
      await loadAppointmentStats();
      return { success: true };
    } catch (err) {
      console.error('Error deleting appointment:', err);
      throw err;
    }
  }, [userId, isConvexEnabled, convexClient, loadAppointments, loadAppointmentStats]);

  // Load initial data
  useEffect(() => {
    if (userId) {
      loadAppointments().then(() => {
        loadAppointmentStats();
      });
    }
  }, [userId, loadAppointments, loadAppointmentStats]);

  return {
    appointments,
    upcomingCount,
    completedCount,
    nextAppointment,
    loading,
    error,
    loadAppointments,
    loadAppointmentStats,
    createAppointment,
    updateAppointmentStatus,
    deleteAppointment,
    isUsingConvex: isConvexEnabled,
  };
}
