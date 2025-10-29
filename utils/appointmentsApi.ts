/**
 * Appointments API Service - TypeScript Safe Version
 * Handles all appointment-related API calls for the SafeSpace mobile app
 * All TypeScript errors resolved
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL - update this based on your environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// TypeScript Interfaces
export interface SupportWorker {
  id: number;
  firstName: string;
  lastName: string;
  name?: string; // Combined name
  email: string;
  specialization: string;
  avatarUrl?: string;
  hourlyRate?: number;
  isAvailable: boolean;
  bio?: string;
  qualifications?: string;
}

export interface Appointment {
  id: number;
  supportWorker: string;
  supportWorkerId: number;
  date: string; // Format: YYYY-MM-DD
  time: string; // Format: HH:MM:SS
  duration: number;
  type: 'video' | 'phone' | 'in_person';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  meetingLink?: string;
  notes?: string;
  specialization?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  cancellationReason?: string;
}

export interface CreateAppointmentData {
  clerkUserId: string;
  supportWorkerId: number;
  appointmentDate: string;
  appointmentTime: string;
  sessionType: string; // 'Video Call', 'Phone Call', 'In Person'
  notes?: string;
  duration?: number;
}

export interface RescheduleAppointmentData {
  newDate: string;
  newTime: string;
  reason?: string;
}

export interface CancelAppointmentData {
  cancellationReason?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: string;
}

// Error handling utility
class ApiError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new ApiError(
      error.error || `HTTP error! status: ${response.status}`,
      response.status,
      error.details
    );
  }
  return response.json();
};

// Helper function to format session type for backend
const formatSessionType = (type: string): string => {
  // Convert frontend format to backend format
  const typeMap: { [key: string]: string } = {
    'Video Call': 'video',
    'Phone Call': 'phone',
    'In Person': 'in_person',
    'video call': 'video',
    'phone call': 'phone',
    'in person': 'in_person',
  };
  return typeMap[type] || type.toLowerCase().replace(' ', '_');
};

// Helper function to get today's date string (TypeScript-safe)
const getTodayDateString = (): string => {
  const isoString = new Date().toISOString();
  const datePart = isoString.split('T')[0];
  if (!datePart) {
    // Fallback in case something goes wrong (though this should never happen)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return datePart;
};

/**
 * Appointments API Service
 */
class AppointmentsApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get all appointments for a user
   * @param clerkUserId - The user's Clerk ID
   * @returns Promise with array of appointments
   */
  async getAppointments(clerkUserId: string): Promise<Appointment[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/appointments?clerkUserId=${clerkUserId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await handleResponse(response);
      return data.appointments || [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments for a user
   * @param clerkUserId - The user's Clerk ID
   * @returns Promise with array of upcoming appointments
   */
  async getUpcomingAppointments(clerkUserId: string): Promise<Appointment[]> {
    try {
      const appointments = await this.getAppointments(clerkUserId);
      const today = getTodayDateString();
      
      return appointments.filter(apt => 
        apt.date >= today && 
        ['scheduled', 'confirmed'].includes(apt.status)
      ).sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  }

  /**
   * Get past appointments for a user
   * @param clerkUserId - The user's Clerk ID
   * @returns Promise with array of past appointments
   */
  async getPastAppointments(clerkUserId: string): Promise<Appointment[]> {
    try {
      const appointments = await this.getAppointments(clerkUserId);
      const today = getTodayDateString();
      
      return appointments.filter(apt => 
        apt.date < today || 
        ['completed', 'cancelled', 'no_show'].includes(apt.status)
      ).sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.time.localeCompare(a.time);
      });
    } catch (error) {
      console.error('Error fetching past appointments:', error);
      throw error;
    }
  }

  /**
   * Get a single appointment by ID
   * @param appointmentId - The appointment ID
   * @param clerkUserId - The user's Clerk ID
   * @returns Promise with appointment details
   */
  async getAppointmentById(appointmentId: number, clerkUserId: string): Promise<Appointment | null> {
    try {
      const appointments = await this.getAppointments(clerkUserId);
      return appointments.find(apt => apt.id === appointmentId) || null;
    } catch (error) {
      console.error('Error fetching appointment by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new appointment
   * @param data - Appointment creation data
   * @returns Promise with created appointment
   */
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    try {
      const formattedData = {
        ...data,
        sessionType: formatSessionType(data.sessionType),
      };

      const response = await fetch(`${this.baseUrl}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });

      const result = await handleResponse(response);
      
      if (result.success && result.appointment) {
        return result.appointment;
      }
      
      throw new Error(result.error || 'Failed to create appointment');
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Reschedule an appointment
   * @param appointmentId - The appointment ID to reschedule
   * @param data - New date and time information
   * @returns Promise with updated appointment
   */
  async rescheduleAppointment(
    appointmentId: number,
    data: RescheduleAppointmentData
  ): Promise<Appointment> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/appointments/${appointmentId}/reschedule`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      const result = await handleResponse(response);
      
      if (result.success && result.appointment) {
        return result.appointment;
      }
      
      throw new Error(result.error || 'Failed to reschedule appointment');
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  /**
   * Cancel an appointment
   * @param appointmentId - The appointment ID to cancel
   * @param data - Cancellation reason
   * @returns Promise with cancelled appointment info
   */
  async cancelAppointment(
    appointmentId: number,
    data?: CancelAppointmentData
  ): Promise<{ id: number; status: string; cancellationReason?: string; cancelledAt?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/appointments/${appointmentId}/cancel`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data || {}),
        }
      );

      const result = await handleResponse(response);
      
      if (result.success && result.appointment) {
        return result.appointment;
      }
      
      throw new Error(result.error || 'Failed to cancel appointment');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Check if a time slot is available
   * @param supportWorkerId - Support worker ID
   * @param date - Date to check
   * @param time - Time to check
   * @returns Promise with availability status
   */
  async checkTimeSlotAvailability(
    supportWorkerId: number,
    date: string,
    time: string
  ): Promise<boolean> {
    try {
      // This would ideally be a dedicated endpoint
      // For now, we'll fetch all appointments and check locally
      const response = await fetch(
        `${this.baseUrl}/api/appointments?supportWorkerId=${supportWorkerId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await handleResponse(response);
      const appointments = data.appointments || [];
      
      // Check if the slot is already booked
      const isBooked = appointments.some((apt: Appointment) => 
        apt.date === date && 
        apt.time === time && 
        ['scheduled', 'confirmed'].includes(apt.status)
      );
      
      return !isBooked;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return false;
    }
  }

  /**
   * Get available time slots for a support worker on a specific date
   * @param supportWorkerId - Support worker ID
   * @param date - Date to check
   * @returns Promise with array of available time slots
   */
  async getAvailableTimeSlots(
    supportWorkerId: number,
    date: string
  ): Promise<string[]> {
    // Mock implementation - replace with actual endpoint when available
    const allTimeSlots = [
      '09:00:00',
      '10:00:00',
      '10:30:00',
      '11:00:00',
      '14:00:00',
      '14:30:00',
      '15:00:00',
      '15:30:00',
      '16:00:00',
      '17:00:00',
    ];

    try {
      // In a real implementation, this would call a dedicated endpoint
      // For now, return mock available slots
      return allTimeSlots;
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      return [];
    }
  }

  /**
   * Format appointment data for display
   * @param appointment - Raw appointment data
   * @returns Formatted appointment object
   */
  formatAppointmentForDisplay(appointment: Appointment) {
    const formatTime = (time: string) => {
      const timeParts = time.split(':');
      const hours = timeParts[0] || '00';
      const minutes = timeParts[1] || '00';
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDate = (date: string) => {
      const dateObj = new Date(date + 'T00:00:00');
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const formatSessionType = (type: string) => {
      const typeMap: { [key: string]: string } = {
        'video': 'Video Call',
        'phone': 'Phone Call',
        'in_person': 'In Person',
      };
      return typeMap[type] || type;
    };

    return {
      ...appointment,
      displayTime: formatTime(appointment.time),
      displayDate: formatDate(appointment.date),
      displayType: formatSessionType(appointment.type),
    };
  }
}

// Export singleton instance
export const appointmentsApi = new AppointmentsApi();

// Export default for convenience
export default appointmentsApi;

// Export mock data for development/testing
export const mockSupportWorkers: SupportWorker[] = [
  {
    id: 1,
    firstName: 'Eric',
    lastName: 'Young',
    name: 'Eric Young',
    email: 'eric.young@safespace.com',
    specialization: 'Anxiety, Depression, Trauma',
    avatarUrl: 'https://randomuser.me/api/portraits/men/1.jpg',
    hourlyRate: 75,
    isAvailable: true,
  },
  {
    id: 2,
    firstName: 'Michael',
    lastName: 'Chen',
    name: 'Michael Chen',
    email: 'michael.chen@safespace.com',
    specialization: 'Anxiety, Depression, Trauma',
    avatarUrl: 'https://randomuser.me/api/portraits/men/2.jpg',
    hourlyRate: 80,
    isAvailable: true,
  },
];

// Export helper functions with TypeScript-safe date handling
export const appointmentHelpers = {
  isUpcoming: (appointment: Appointment): boolean => {
    const today = getTodayDateString();
    return appointment.date >= today && 
           ['scheduled', 'confirmed'].includes(appointment.status);
  },
  
  isPast: (appointment: Appointment): boolean => {
    const today = getTodayDateString();
    return appointment.date < today || 
           ['completed', 'cancelled', 'no_show'].includes(appointment.status);
  },
  
  canReschedule: (appointment: Appointment): boolean => {
    return ['scheduled', 'confirmed'].includes(appointment.status);
  },
  
  canCancel: (appointment: Appointment): boolean => {
    return ['scheduled', 'confirmed'].includes(appointment.status);
  },
  
  canJoinSession: (appointment: Appointment): boolean => {
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const minutesUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);
    
    // Allow joining 15 minutes before the appointment
    return appointment.type === 'video' && 
           appointment.status === 'confirmed' &&
           minutesUntilAppointment <= 15 && 
           minutesUntilAppointment >= -60; // Up to 1 hour after start
  },
};