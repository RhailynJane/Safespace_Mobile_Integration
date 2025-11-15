import { getApiBaseUrl } from './apiBaseUrl';
import { convexEnabled, getConvexApi, createConvexClientNoAuth, safeQuery, safeMutation } from './convexClient';

export type CrisisType = 'phone' | 'website';

export interface CrisisResource {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  type: CrisisType;
  value: string; // phone number or URL
  icon?: string;
  color?: string;
  region?: string;
  country?: string;
  priority?: 'high' | 'medium' | 'low';
  sort_order?: number;
  active?: boolean;
}

const API_BASE_URL = getApiBaseUrl();

// Fetch crisis resources (Convex-first) with graceful fallback to static defaults
export async function fetchCrisisResources(params?: { region?: string; country?: string }): Promise<CrisisResource[]> {
  try {
    if (convexEnabled()) {
      const api = await getConvexApi();
      const client = createConvexClientNoAuth();
      if (api && client && api.crisis?.listResources) {
        const res = await safeQuery(client, api.crisis.listResources, {
          region: params?.region,
          country: params?.country,
          activeOnly: true,
        });
        if (Array.isArray(res)) return res as CrisisResource[];
      }
    }
  } catch (_) {
    // fall through to fallback
  }

  // Optional: REST fallback if your backend exposes it; otherwise return static
  try {
    const url = `${API_BASE_URL}/api/crisis/resources`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data)) return data as CrisisResource[];
    }
  } catch (_) {
    // ignore and fall back to REST/static
  }

  return getStaticDefaultCrisisResources();
}

export async function trackCrisisAction(params: { resourceId?: string; slug?: string; action: 'view' | 'call' | 'visit'; userId?: string }) {
  // Convex-first best-effort tracking
  try {
    if (convexEnabled()) {
      const api = await getConvexApi();
      const client = createConvexClientNoAuth();
      if (api && client && api.crisis?.trackAction && params.resourceId) {
        await safeMutation(client, api.crisis.trackAction, {
          resourceId: params.resourceId as any,
          action: params.action,
          userId: params.userId,
        });
        return;
      }
    }
  } catch (_) {
    // ignore REST fallback failures
  }

  // REST best-effort (optional)
  try {
    if (params.slug) {
      await fetch(`${API_BASE_URL}/api/crisis/${encodeURIComponent(params.slug)}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: params.action, userId: params.userId }),
      });
    }
  } catch (_) {
    // best-effort tracking; ignore failures
  }
}

function getStaticDefaultCrisisResources(): CrisisResource[] {
  return [
    {
      slug: 'call-911',
      title: 'Call 911',
      subtitle: 'Emergency Services',
      type: 'phone',
      value: '911',
      icon: 'call',
      color: '#E53935',
      priority: 'high',
      sort_order: 1,
      active: true,
    },
    {
      slug: 'hotline-988',
      title: 'Crisis Hotline',
      subtitle: 'Call 988',
      type: 'phone',
      value: '988',
      icon: 'heart',
      color: '#4CAF50',
      priority: 'high',
      sort_order: 2,
      active: true,
    },
    {
      slug: 'distress-centre-calgary',
      title: 'Distress Center',
      subtitle: '403-266-4357',
      type: 'phone',
      value: '403-266-4357',
      icon: 'people',
      color: '#2196F3',
      priority: 'medium',
      sort_order: 3,
      active: true,
    },
    {
      slug: 'distress-centre-website',
      title: 'Visit Website',
      subtitle: 'distresscentre.com',
      type: 'website',
      value: 'https://distresscentre.com',
      icon: 'globe',
      color: '#2196F3',
      priority: 'low',
      sort_order: 10,
      active: true,
    },
  ];
}
