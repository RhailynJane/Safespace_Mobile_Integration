// utils/activityApi.ts
import { getApiBaseUrl } from './apiBaseUrl';
const API_BASE_URL = getApiBaseUrl();

export type UserStatus = {
  online: boolean;
  last_active_at: string | null;
  last_login_at: string | null;
  last_logout_at: string | null;
};

async function postJson<T>(endpoint: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json();
}

export const activityApi = {
  async recordLogin(clerkUserId: string) {
    return postJson<{ success: boolean; data: any }>(
      '/api/users/login-activity',
      { clerkUserId }
    );
  },

  async recordLogout(clerkUserId: string) {
    return postJson<{ success: boolean; data: any }>(
      '/api/users/logout-activity',
      { clerkUserId }
    );
  },

  async heartbeat(clerkUserId: string) {
    return postJson<{ success: boolean; data: any }>(
      '/api/users/heartbeat',
      { clerkUserId }
    );
  },

  async status(clerkUserId: string): Promise<UserStatus | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/status/${clerkUserId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data as UserStatus;
    } catch (e) {
      return null;
    }
  },

  async statusBatch(clerkUserIds: string[]): Promise<Record<string, UserStatus>> {
    const result = await postJson<{ success: boolean; data: Record<string, UserStatus> }>(
      '/api/users/status-batch',
      { clerkUserIds }
    );
    return result.data;
  },
};

export default activityApi;
