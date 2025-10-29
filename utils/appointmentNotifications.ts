import { getApiBaseUrl } from './apiBaseUrl';

export async function notifyAppointmentNow(
  clerkUserId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const baseURL = getApiBaseUrl();
    const res = await fetch(`${baseURL}/api/appointments/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkUserId, title, message, data: data || {} })
    });
    if (!res.ok) return false;
    const json = await res.json();
    return !!json?.success;
  } catch {
    return false;
  }
}

export default { notifyAppointmentNow };
