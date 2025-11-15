import { useState, useEffect, useCallback } from 'react';
import { ConvexReactClient } from 'convex/react';

// Helper function to check if a date value is valid
function isValidDate(value: any): boolean {
  const d = new Date(value);
  return d instanceof Date && !isNaN(d.getTime());
}

interface AppointmentData {
  supportWorker: string;
  date: string;
  time: string;
  type: string;
  notes?: string;
}

interface Appointment {
  id: string;
  supportWorker: string;
  date: string;
  time: string;
  type: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for appointment management with Convex integration only
 * No REST API fallback - uses Convex exclusively
 */
export function useConvexAppointments(userId: string | undefined, convexClient: ConvexReactClient | null) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convex is required
  const isConvexEnabled = Boolean(convexClient && userId);

  /**
   * Load all appointments for the user
   */
  const loadAppointments = useCallback(async () => {
    if (!userId || !convexClient) return [];
    
    try {
      setLoading(true);
      setError(null);
      
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
        created_at: isValidDate(apt.createdAt) ? new Date(apt.createdAt).toISOString() : '',
        updated_at: isValidDate(apt.updatedAt) ? new Date(apt.updatedAt).toISOString() : '',
      }));

      setAppointments(formatted);
      return formatted;
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, convexClient]);

  /**
   * Load appointment statistics
   */
  const loadAppointmentStats = useCallback(async () => {
    if (!userId || !convexClient) return null;

    try {
      // @ts-ignore
      const { api } = await import('../../convex/_generated/api');
      const stats = await convexClient.query(api.appointments.getAppointmentStats, {
        userId,
      });

      setUpcomingCount(stats.upcomingCount);
      setCompletedCount(stats.completedCount);
      
      // Transform next appointment to match our interface
      if (stats.nextAppointment) {
        const nextApt = {
          id: stats.nextAppointment.id,
          supportWorker: stats.nextAppointment.supportWorker,
          date: stats.nextAppointment.date,
          time: stats.nextAppointment.time,
          type: stats.nextAppointment.type,
          status: stats.nextAppointment.status,
          notes: stats.nextAppointment.notes,
          created_at: isValidDate(stats.nextAppointment.createdAt) ? new Date(stats.nextAppointment.createdAt).toISOString() : '',
          updated_at: isValidDate(stats.nextAppointment.updatedAt) ? new Date(stats.nextAppointment.updatedAt).toISOString() : '',
        };
        setNextAppointment(nextApt);
      } else {
        setNextAppointment(null);
      }
      
      return stats;
    } catch (err) {
      console.error('Error loading appointment stats:', err);
      return null;
    }
  }, [userId, convexClient]);

  /**
   * Create a new appointment
   */
  const createAppointment = useCallback(async (appointmentData: AppointmentData) => {
    if (!userId || !convexClient) throw new Error('User ID and Convex client required');

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
    } catch (err) {
      console.error('Error creating appointment:', err);
      throw err;
    }
  }, [userId, convexClient, loadAppointments, loadAppointmentStats]);

  /**
   * Update appointment status
   */
  const updateAppointmentStatus = useCallback(async (appointmentId: string, status: string) => {
    if (!userId || !convexClient) throw new Error('User ID and Convex client required');

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
    } catch (err) {
      console.error('Error updating appointment:', err);
      throw err;
    }
  }, [userId, convexClient, loadAppointments, loadAppointmentStats]);

  /**
   * Delete an appointment
   */
  const deleteAppointment = useCallback(async (appointmentId: string) => {
    if (!userId || !convexClient) throw new Error('User ID and Convex client required');

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
    } catch (err) {
      console.error('Error deleting appointment:', err);
      throw err;
    }
  }, [userId, convexClient, loadAppointments, loadAppointmentStats]);

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
