import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// List crisis resources, optionally filtered by region/country
export const listResources = query({
  args: {
    region: v.optional(v.string()), // e.g., 'CA-AB'
    country: v.optional(v.string()), // e.g., 'CA'
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args: { region?: string; country?: string; activeOnly?: boolean }) => {
    const activeOnly = args.activeOnly ?? true;

    let results: Array<any> = [];

    // Prefer region match, then country, then global
    if (args.region) {
      const regionMatches = await ctx.db
        .query("crisisResources")
        .withIndex("by_region", (q: any) => q.eq("region", args.region!))
        .collect();
      results.push(...regionMatches);
    }

    if (args.country) {
      const countryMatches = await ctx.db
        .query("crisisResources")
        .withIndex("by_country", (q: any) => q.eq("country", args.country!))
        .collect();
      results.push(...countryMatches);
    }

    // Fallback to global (no region/country)
    if (!args.region && !args.country) {
      const globalMatches = await ctx.db.query("crisisResources").collect();
      results.push(...globalMatches);
    }

    // De-duplicate by id
    const seen = new Set<string>();
    results = results.filter((r) => {
      if (seen.has(r._id.id)) return false;
      seen.add(r._id.id);
      return true;
    });

    // Filter active if requested
    if (activeOnly) {
      results = results.filter((r) => r.active);
    }

    // Sort by sort_order then priority then title
    const prioRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
    results.sort((a, b) => {
      const soA = a.sort_order ?? 9999;
      const soB = b.sort_order ?? 9999;
      if (soA !== soB) return soA - soB;
      const pA = prioRank[a.priority ?? "medium"] ?? 1;
      const pB = prioRank[b.priority ?? "medium"] ?? 1;
      if (pA !== pB) return pA - pB;
      return (a.title || "").localeCompare(b.title || "");
    });

    return results.map((r) => ({
      id: String(r._id),
      slug: r.slug,
      title: r.title,
      subtitle: r.subtitle,
      type: r.type,
      value: r.value,
      icon: r.icon,
      color: r.color,
      region: r.region,
      country: r.country,
      priority: r.priority,
      sort_order: r.sort_order,
      active: r.active,
    }));
  },
});

// Upsert a crisis resource using slug as unique key
export const upsertResource = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    subtitle: v.optional(v.string()),
    type: v.string(),
    value: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    region: v.optional(v.string()),
    country: v.optional(v.string()),
    priority: v.optional(v.string()),
    sort_order: v.optional(v.number()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args: {
    slug: string; title: string; subtitle?: string; type: string; value: string;
    icon?: string; color?: string; region?: string; country?: string; priority?: string;
    sort_order?: number; active?: boolean;
  }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("crisisResources")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .first();

    const doc = {
      slug: args.slug,
      title: args.title,
      subtitle: args.subtitle,
      type: args.type,
      value: args.value,
      icon: args.icon,
      color: args.color,
      region: args.region,
      country: args.country,
      priority: args.priority,
      sort_order: args.sort_order,
      active: args.active ?? true,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
    } as any;

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    } else {
      const id = await ctx.db.insert("crisisResources", doc);
      return id;
    }
  },
});

// Track a user action on a crisis resource
export const trackAction = mutation({
  args: {
    resourceId: v.id("crisisResources"),
    action: v.string(), // 'view' | 'call' | 'visit'
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args: { resourceId: Id<"crisisResources">; action: string; userId?: string }) => {
    const now = Date.now();
    await ctx.db.insert("crisisEvents", {
      resourceId: args.resourceId,
      userId: args.userId,
      action: args.action,
      createdAt: now,
    });
    return true;
  },
});

// Seed a minimal default dataset
export const seedDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const defaults = [
      {
        slug: "call-911",
        title: "Call 911",
        subtitle: "Emergency Services",
        type: "phone",
        value: "911",
        icon: "call",
        color: "#E53935",
        region: undefined,
        country: "CA",
        priority: "high",
        sort_order: 1,
      },
      {
        slug: "hotline-988",
        title: "Crisis Hotline",
        subtitle: "Call 988",
        type: "phone",
        value: "988",
        icon: "heart",
        color: "#4CAF50",
        region: undefined,
        country: "CA",
        priority: "high",
        sort_order: 2,
      },
      {
        slug: "distress-centre-calgary",
        title: "Distress Center",
        subtitle: "403-266-4357",
        type: "phone",
        value: "403-266-4357",
        icon: "people",
        color: "#2196F3",
        region: "CA-AB",
        country: "CA",
        priority: "medium",
        sort_order: 3,
      },
      {
        slug: "distress-centre-website",
        title: "Visit Website",
        subtitle: "distresscentre.com",
        type: "website",
        value: "https://distresscentre.com",
        icon: "globe",
        color: "#2196F3",
        region: undefined,
        country: "CA",
        priority: "low",
        sort_order: 10,
      },
    ];

    for (const item of defaults) {
      const existing = await ctx.db
        .query("crisisResources")
        .withIndex("by_slug", (q: any) => q.eq("slug", item.slug))
        .first();
      const doc = {
        ...item,
        active: true,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      } as any;
      if (existing) {
        await ctx.db.patch(existing._id, doc);
      } else {
        await ctx.db.insert("crisisResources", doc);
      }
    }

    return true;
  },
});
