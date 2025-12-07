/**
 * Organization queries for mobile app
 * Provides feature access control based on organization settings
 */

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get organization features for a user (mobile app access control)
 * Returns the list of enabled features for the user's organization
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

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", user.orgId as string))
      .first();

    console.log('[getFeatures] Organization found:', org ? `${org.name} (features: ${JSON.stringify(org.settings?.features)})` : 'null');

    if (!org) {
      console.log('[getFeatures] No organization found, returning empty array');
      return [];
    }

    // Return enabled features or all features by default (for backward compatibility)
    const features = org.settings?.features || [
      'appointments',
      'video_consultation',
      'mood_tracking',
      'crisis_support',
      'resources',
      'community',
      'messaging',
      'assessments',
    ];

    console.log('[getFeatures] Returning features:', features);
    return features;
  },
});
