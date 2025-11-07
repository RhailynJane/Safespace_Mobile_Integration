/**
 * Appointments API - Convex-First with REST Fallback
 * 
 * Uses Convex for real-time appointment management with automatic fallback to REST API
 */

import { ConvexHttpClient } from 'convex/browser';

// TypeScript Interfaces
export interface Appointment {
  id: string | number;
  userId: string;
  supportWorker: string;
  supportWorkerId?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number;
  type: 'video' | 'phone' | 'in_person';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  meetingLink?: string;
  notes?: string;
  specialization?: string;
  avatarUrl?: string;
  cancellationReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentData {
  userId: string;
  supportWorker: string;
  supportWorkerId?: number;
  date: string;
  time: string;
  duration?: number;
  type: 'video' | 'phone' | 'in_person';
  notes?: string;
  meetingLink?: string;
  specialization?: string;
  avatarUrl?: string;
}

export interface RescheduleAppointmentData {
  appointmentId: string;
  newDate: string;
  newTime: string;
  reason?: string;
}

export interface CancelAppointmentData {
  appointmentId: string;
  cancellationReason?: string;
}

// Convex client instance (lazy loaded)
let convexClient: ConvexHttpClient | null = null;
let convexApi: any = null;

/**
 * Initialize Convex client and API
 */
async function initConvex() {
  if (convexClient && convexApi) return { convexClient, convexApi };
  
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.EXPO_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      console.warn('[AppointmentsAPI] Convex URL not configured');
      return { convexClient: null, convexApi: null };
    }
    
    convexClient = new ConvexHttpClient(convexUrl);
    convexApi = await import('../convex/_generated/api');
    
    console.log('[AppointmentsAPI] Convex initialized');
    return { convexClient, convexApi };
  } catch (error) {
    console.warn('[AppointmentsAPI] Convex initialization failed:', error);
    return { convexClient: null, convexApi: null };
  }
}

// REST API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get all appointments for a user
 * Tries Convex first, falls back to REST API
 */
export async function getAppointments(userId: string): Promise<Appointment[]> {
  try {
    const { convexClient, convexApi } = await initConvex();
    
    if (convexClient && convexApi) {
      const appointments = await convexClient.query(
        convexApi.appointments.getUserAppointments,
        { userId }
      );
      console.log('[AppointmentsAPI] Fetched from Convex:', appointments.length);
      return appointments;
    }
  } catch (error) {
    console.warn('[AppointmentsAPI] Convex query failed, falling back to REST:', error);
  }
  
  // Fallback to REST API
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/appointments?clerkUserId=${userId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    console.log('[AppointmentsAPI] Fetched from REST:', data.appointments?.length || 0);
    return data.appointments || [];
  } catch (error) {
    console.error('[AppointmentsAPI] REST fallback failed:', error);
    return [];
  }
}

/**
 * Get upcoming appointments
 * Tries Convex first, falls back to REST API
 */
export async function getUpcomingAppointments(userId: string): Promise<Appointment[]> {
  try {
    const { convexClient, convexApi } = await initConvex();
    
    if (convexClient && convexApi) {
      const appointments = await convexClient.query(
        convexApi.appointments.getUpcomingAppointments,
        { userId }
      );
      console.log('[AppointmentsAPI] Upcoming from Convex:', appointments.length);
      return appointments;
    }
  } catch (error) {
    console.warn('[AppointmentsAPI] Convex query failed, falling back to REST:', error);
  }
  
  // Fallback to REST - fetch all and filter
  try {
    const allAppointments = await getAppointments(userId);
    const today = new Date().toISOString().split('T')[0]!;
    
    const upcoming = allAppointments.filter(apt => 
      apt.date >= today && 
      ['scheduled', 'confirmed'].includes(apt.status)
    ).sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
    
    console.log('[AppointmentsAPI] Upcoming from REST:', upcoming.length);
    return upcoming;
  } catch (error) {
    console.error('[AppointmentsAPI] REST fallback failed:', error);
    return [];
  }
}

/**
 * Get past appointments
 * Tries Convex first, falls back to REST API
 */
export async function getPastAppointments(userId: string): Promise<Appointment[]> {
  try {
    const { convexClient, convexApi } = await initConvex();
    
    if (convexClient && convexApi) {
      const appointments = await convexClient.query(
        convexApi.appointments.getPastAppointments,
        { userId }
      );
      console.log('[AppointmentsAPI] Past from Convex:', appointments.length);
      return appointments;
    }
  } catch (error) {
    console.warn('[AppointmentsAPI] Convex query failed, falling back to REST:', error);
  }
  
  // Fallback to REST - fetch all and filter
  try {
    const allAppointments = await getAppointments(userId);
    const today = new Date().toISOString().split('T')[0]!;
    
    const past = allAppointments.filter(apt => 
      apt.date < today || 
      ['completed', 'cancelled', 'no_show'].includes(apt.status)
    ).sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.time.localeCompare(a.time);
    });
    
    console.log('[AppointmentsAPI] Past from REST:', past.length);
    return past;
  } catch (error) {
    console.error('[AppointmentsAPI] REST fallback failed:', error);
    return [];
  }
}

/**
 * Get appointment statistics
 * Tries Convex first, falls back to local calculation
 */
export async function getAppointmentStats(userId: string) {
  try {
    const { convexClient, convexApi } = await initConvex();
    
    if (convexClient && convexApi) {
      const stats = await convexClient.query(
        convexApi.appointments.getAppointmentStats,
        { userId }
      );
      console.log('[AppointmentsAPI] Stats from Convex');
      return stats;
    }
  } catch (error) {
    console.warn('[AppointmentsAPI] Convex query failed, calculating locally:', error);
  }
  
  // Fallback - calculate from all appointments
  try {
    const appointments = await getAppointments(userId);
    const today = new Date().toISOString().split('T')[0]!;
    
    const upcoming = appointments.filter(apt => 
      (apt.status === 'scheduled' || apt.status === 'confirmed') && 
      apt.date >= today
    );
    const completed = appointments.filter(apt => apt.status === 'completed');
    const cancelled = appointments.filter(apt => apt.status === 'cancelled');
    
    const sortedUpcoming = upcoming.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
    
    return {
      upcomingCount: upcoming.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      nextAppointment: sortedUpcoming[0] || null,
    };
  } catch (error) {
    console.error('[AppointmentsAPI] Local calculation failed:', error);
    return {
      upcomingCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      nextAppointment: null,
    };
  }
}

/**
 * Create a new appointment
 * Tries Convex first, falls back to REST API
 */
export async function createAppointment(data: CreateAppointmentData): Promise<Appointment | null> {
  try {
    const { convexClient, convexApi } = await initConvex();
    
    if (convexClient && convexApi) {
      const result = await convexClient.mutation(
        convexApi.appointments.createAppointment,
        {
          userId: data.userId,
          supportWorker: data.supportWorker,
          supportWorkerId: data.supportWorkerId,
          date: data.date,
          time: data.time,
          duration: data.duration || 60,
          type: data.type,
          notes: data.notes,
          meetingLink: data.meetingLink,
          specialization: data.specialization,
          avatarUrl: data.avatarUrl,
        }
      );
      console.log('[AppointmentsAPI] Created via Convex:', result.id);
      
      // Fetch the created appointment
      const created = await convexClient.query(
        convexApi.appointments.getAppointment,
        { appointmentId: result.id }
      );
      return created;
    }
  } catch (error) {
    console.warn('[AppointmentsAPI] Convex mutation failed, falling back to REST:', error);
  }
  
  // Fallback to REST API
  try {
    const response = await fetch(`${API_BASE_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clerkUserId: data.userId,
        supportWorkerId: data.supportWorkerId,
        appointmentDate: data.date,
        appointmentTime: data.time,
        sessionType: data.type,
        notes: data.notes,
        duration: data.duration,
      }),
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    console.log('[AppointmentsAPI] Created via REST');
    return result.appointment;
  } catch (error) {
    console.error('[AppointmentsAPI] REST fallback failed:', error);
    return null;
  }
}

/**
 * Reschedule an appointment
 * Tries Convex first, falls back to REST API
 */
export async function rescheduleAppointment(data: RescheduleAppointmentData): Promise<boolean> {
  try {
    const { convexClient, convexApi } = await initConvex();
    
    if (convexClient && convexApi) {
      await convexClient.mutation(
        convexApi.appointments.rescheduleAppointment,
        {
          appointmentId: data.appointmentId,
          newDate: data.newDate,
          newTime: data.newTime,
          reason: data.reason,
        }
      );
      console.log('[AppointmentsAPI] Rescheduled via Convex');
      return true;
    }
  } catch (error) {
    console.warn('[AppointmentsAPI] Convex mutation failed, falling back to REST:', error);
  }
  
  // Fallback to REST API
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/appointments/${data.appointmentId}/reschedule`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: data.newDate,
          newTime: data.newTime,
          reason: data.reason,
        }),
      }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    console.log('[AppointmentsAPI] Rescheduled via REST');
    return true;
  } catch (error) {
    console.error('[AppointmentsAPI] REST fallback failed:', error);
    return false;
  }
}

/**
 * Cancel an appointment
 * Tries Convex first, falls back to REST API
 */
export async function cancelAppointment(data: CancelAppointmentData): Promise<boolean> {
  try {
    const { convexClient, convexApi } = await initConvex();
    
    if (convexClient && convexApi) {
      await convexClient.mutation(
        convexApi.appointments.cancelAppointment,
        {
          appointmentId: data.appointmentId,
          cancellationReason: data.cancellationReason,
        }
      );
      console.log('[AppointmentsAPI] Cancelled via Convex');
      return true;
    }
  } catch (error) {
    console.warn('[AppointmentsAPI] Convex mutation failed, falling back to REST:', error);
  }
  
  // Fallback to REST API
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/appointments/${data.appointmentId}/cancel`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancellationReason: data.cancellationReason,
        }),
      }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    console.log('[AppointmentsAPI] Cancelled via REST');
    return true;
  } catch (error) {
    console.error('[AppointmentsAPI] REST fallback failed:', error);
    return false;
  }
}

/**
 * Update appointment status
 * Convex-only (no REST fallback for now)
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
): Promise<boolean> {
  try {
    const { convexClient, convexApi } = await initConvex();
    
    if (convexClient && convexApi) {
      await convexClient.mutation(
        convexApi.appointments.updateAppointmentStatus,
        { appointmentId, status }
      );
      console.log('[AppointmentsAPI] Status updated via Convex');
      return true;
    }
    
    console.warn('[AppointmentsAPI] Convex not available for status update');
    return false;
  } catch (error) {
    console.error('[AppointmentsAPI] Status update failed:', error);
    return false;
  }
}

/**
 * Delete an appointment (soft delete)
 * Convex-only (no REST fallback for now)
 */
export async function deleteAppointment(appointmentId: string): Promise<boolean> {
  try {
    const { convexClient, convexApi } = await initConvex();
    
    if (convexClient && convexApi) {
      await convexClient.mutation(
        convexApi.appointments.deleteAppointment,
        { appointmentId }
      );
      console.log('[AppointmentsAPI] Deleted via Convex');
      return true;
    }
    
    console.warn('[AppointmentsAPI] Convex not available for deletion');
    return false;
  } catch (error) {
    console.error('[AppointmentsAPI] Deletion failed:', error);
    return false;
  }
}
