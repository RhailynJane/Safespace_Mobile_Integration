// Centralized appointment status mapping utility
// Raw backend statuses: scheduled | confirmed | completed | cancelled | no_show
// Derived UI buckets: Upcoming | Past | Cancelled

export type RawAppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type UiAppointmentStatus = 'Upcoming' | 'Past' | 'Cancelled';

export function mapAppointmentStatus(raw: RawAppointmentStatus, date: string, time?: string): UiAppointmentStatus {
  if (raw === 'cancelled') return 'Cancelled';
  const isUpcomingRaw = raw === 'scheduled' || raw === 'confirmed';
  // If completed or no_show always Past
  if (raw === 'completed' || raw === 'no_show') return 'Past';
  // For scheduled/confirmed decide by date/time relative to now (Mountain Time used client-side)
  if (!date) return 'Past';
  try {
    const dateObj = new Date(date + 'T' + (time || '00:00')); // naive local parse
    const now = new Date();
    if (isUpcomingRaw && dateObj >= now) return 'Upcoming';
    return 'Past';
  } catch {
    return isUpcomingRaw ? 'Upcoming' : 'Past';
  }
}

export function isUpcoming(raw: RawAppointmentStatus, date: string, time?: string): boolean {
  return mapAppointmentStatus(raw, date, time) === 'Upcoming';
}

export function isPast(raw: RawAppointmentStatus, date: string, time?: string): boolean {
  return mapAppointmentStatus(raw, date, time) === 'Past';
}

export function isCancelled(raw: RawAppointmentStatus): boolean {
  return raw === 'cancelled';
}
