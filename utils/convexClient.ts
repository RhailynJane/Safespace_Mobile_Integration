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
    // Try explicit .js (generated file) first for Node ESM resolution
    const mod = await import("../convex/_generated/api.js");
    return (mod as any).api;
  } catch (e) {
    try {
      // Fallback legacy path without extension (in case loader permits)
      const mod2 = await import("../convex/_generated/api");
      return (mod2 as any).api;
    } catch (_) {
      return null; // Not generated yet or resolution failed
    }
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
    // Prefer generic ConvexClient (works outside React environment)
    const { ConvexClient } = require("convex/browser");
    const url = process.env.EXPO_PUBLIC_CONVEX_URL;
    if (!url) return null;
    const client = new ConvexClient(url);
    return client;
  } catch (_) {
    return null;
  }
}
