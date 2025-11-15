/**
 * Convex Auth Sync Utility
 * 
 * Provides unified authentication synchronization between Clerk and Convex.
 * Handles user creation, updates, and session management across both systems.
 */

import { ConvexReactClient } from "convex/react";

interface ConvexAuthSyncOptions {
  clerkUserId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  orgId?: string; // optional organization to set for the user
}

/**
 * Check if Convex is enabled and configured
 */
export function isConvexEnabled(): boolean {
  const url = process.env.EXPO_PUBLIC_CONVEX_URL;
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Create a Convex client with Clerk auth token
 */
export function createConvexClient(getToken: () => Promise<string | null | undefined>): ConvexReactClient | null {
  const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
  if (!isConvexEnabled() || !convexUrl) {
    console.log('⚠️ Convex not enabled or invalid URL');
    return null;
  }

  try {
    const client = new ConvexReactClient(convexUrl);
    client.setAuth(async () => {
      try {
        const token = await getToken();
        return token ?? undefined;
      } catch {
        return undefined;
      }
    });
    return client;
  } catch (e) {
    console.warn('Failed to create Convex client:', e);
    return null;
  }
}

/**
 * Sync user data to Convex after authentication
 * This ensures the user exists in Convex with up-to-date profile information
 */
export async function syncUserToConvex(
  client: ConvexReactClient | null,
  options: ConvexAuthSyncOptions
): Promise<boolean> {
  if (!client) {
    console.log('⚠️ Convex client not available, skipping sync');
    return false;
  }

  try {
    // Dynamic import to avoid compile-time errors before convex dev runs
    const { api } = await import("../convex/_generated/api");
    
    await client.mutation(api.auth.syncUser, {
      email: options.email,
      firstName: options.firstName,
      lastName: options.lastName,
      imageUrl: options.imageUrl,
    });

    console.log('✅ User synced to Convex successfully');
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to sync user to Convex (non-blocking):', error);
    return false;
  }
}

/**
 * Send presence heartbeat to Convex to mark user as online
 */
export async function sendConvexHeartbeat(
  client: ConvexReactClient | null,
  status: 'online' | 'away' = 'online'
): Promise<boolean> {
  if (!client) {
    return false;
  }

  try {
    const { api } = await import("../convex/_generated/api");
    await client.mutation(api.presence.heartbeat, { status });
    console.log('✅ Convex heartbeat sent');
    return true;
  } catch (error) {
    console.log('⚠️ Failed to send Convex heartbeat:', error);
    return false;
  }
}

/**
 * Complete auth flow: sync user to Convex and send initial heartbeat
 */
export async function completeConvexAuthFlow(
  getToken: () => Promise<string | null | undefined>,
  options: ConvexAuthSyncOptions
): Promise<void> {
  if (!isConvexEnabled()) {
    console.log('ℹ️ Convex disabled, skipping auth flow');
    return;
  }

  const client = createConvexClient(getToken);
  if (!client) {
    console.log('⚠️ Could not create Convex client');
    return;
  }

  // Give Clerk a moment to fully initialize the session
  await new Promise(resolve => setTimeout(resolve, 500));

  // Sync user data
  await syncUserToConvex(client, options);

  // Optionally sync the organization to Convex users table
  if (options.orgId) {
    try {
      const { api } = await import("../convex/_generated/api");
      await client.mutation(api.users.syncCurrentUserOrg, { orgId: options.orgId });
      console.log('✅ User org synced to Convex:', options.orgId);
    } catch (e) {
      console.warn('⚠️ Failed to sync org to Convex (non-blocking):', e);
    }
  }

  // Send initial presence heartbeat
  await sendConvexHeartbeat(client, 'online');

  console.log('✅ Convex auth flow completed');
}
