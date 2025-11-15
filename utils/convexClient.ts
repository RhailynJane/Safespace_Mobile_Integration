/*
  Safe Convex client helpers for React Native app.
  - Dynamic imports avoid TS errors before `npx convex dev` generates types
  - Guards when Convex is disabled (no EXPO_PUBLIC_CONVEX_URL)
*/

export function convexEnabled(): boolean {
  return !!process.env.EXPO_PUBLIC_CONVEX_URL;
}

export async function getConvexApi(): Promise<any | null> {
  if (!convexEnabled()) return null;
  try {
    // Relative to app/ files usage "../convex/_generated/api". Here from utils, use root path
    const mod = await import("../convex/_generated/api");
    return mod.api;
  } catch (e) {
    return null; // Not generated yet
  }
}

export async function safeMutation(convex: any, fn: any, args: any): Promise<any | null> {
  if (!convexEnabled() || !convex || !fn) return null;
  try {
    return await convex.mutation(fn, args);
  } catch (_) {
    return null;
  }
}

export async function safeQuery(convex: any, fn: any, args: any): Promise<any | null> {
  if (!convexEnabled() || !convex || !fn) return null;
  try {
    return await convex.query(fn, args);
  } catch (_) {
    return null;
  }
}

// Lightweight client creator without auth; useful for public queries (e.g., Help content)
export function createConvexClientNoAuth(): any | null {
  if (!convexEnabled()) return null;
  try {
    // Import at runtime to avoid issues if convex isn't generated yet
    const { ConvexReactClient } = require("convex/react");
    const url = process.env.EXPO_PUBLIC_CONVEX_URL;
    if (!url) return null;
    const client = new ConvexReactClient(url);
    // No auth needed for public queries/mutations guarded server-side
    return client;
  } catch (_) {
    return null;
  }
}
