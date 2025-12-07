/**
 * Organization queries for mobile app
 * Provides feature access control based on organization settings
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

// Map web admin feature keys to mobile app feature keys
const FEATURE_KEY_MAP: Record<string, string> = {
  'selfAssessment': 'assessments',
  'moodTracking': 'mood_tracking',
  'journaling': 'journaling', // Not part of feature control, but included for completeness
  'resources': 'resources',
  'announcements': 'announcements', // Not part of feature control
  'crisisSupport': 'crisis_support',
  'messages': 'messaging',
  'appointments': 'appointments',
  'communityForum': 'community',
  'videoConsultations': 'video_consultation',
};

/**
 * Get organization features for a user (mobile app access control)
 * Returns the list of enabled features for the user's organization
 * Reads from featurePermissions table (managed by web admin)
 */
export const getFeatures = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    console.log('[getFeatures] Called with clerkId:', clerkId);

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    console.log('[getFeatures] User found:', user ? `${user.firstName} ${user.lastName} (org: ${user.orgId})` : 'null');

    if (!user || !user.orgId) {
      console.log('[getFeatures] No user or orgId, returning empty array');
      return [];
    }

    const orgSlug = user.orgId as string;

    // Query featurePermissions table for this organization
    const permissions = await ctx.db
      .query("featurePermissions")
      .withIndex("by_org", (q) => q.eq("orgId", orgSlug))
      .collect();

    console.log('[getFeatures] Found', permissions.length, 'feature permissions for org:', orgSlug);
    console.log('[getFeatures] Raw permissions from DB:', JSON.stringify(permissions.map(p => ({ 
      key: p.featureKey, 
      enabled: p.enabled 
    }))));

    // If no permissions found, return all features (default allow)
    if (permissions.length === 0) {
      console.log('[getFeatures] No permissions found, returning all features (default allow)');
      return [
        'appointments',
        'video_consultation',
        'mood_tracking',
        'crisis_support',
        'resources',
        'community',
        'messaging',
        'assessments',
      ];
    }

    // Map enabled features from web keys to mobile keys
    const enabledFeatures = permissions
      .filter(p => p.enabled)
      .map(p => FEATURE_KEY_MAP[p.featureKey])
      .filter(Boolean); // Remove any undefined mappings

    console.log('[getFeatures] Enabled web features:', permissions.filter(p => p.enabled).map(p => p.featureKey));
    console.log('[getFeatures] Mapped mobile features:', enabledFeatures);

    return enabledFeatures;
  },
});
