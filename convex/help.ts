import { query, mutation, action } from "./_generated/server";
// Import internal API references for use in actions
import { internal } from "./_generated/api";
import { v } from "convex/values";

// DB-backed Help content and utilities

export const allSections = query({
  args: {},
  handler: async (ctx) => {
    // Fetch sections ordered by sort_order then title
    const sections = await ctx.db
      .query("helpSections")
      .withIndex("by_sort")
      .collect();

    const result = [] as any[];
    for (const s of sections) {
      const items = await ctx.db
        .query("helpItems")
        .withIndex("by_section", (q: any) => q.eq("sectionId", s._id))
        .order("asc")
        .collect();

      result.push({
        id: s.slug,
        title: s.title,
        icon: s.icon ?? "",
        description: s.description ?? undefined,
        category: s.category ?? undefined,
        priority: s.priority ?? undefined,
        sort_order: s.sort_order ?? undefined,
        content: items
          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((it: any) => ({
            id: String(it._id),
            title: it.title,
            content: it.content,
            type: it.type ?? undefined,
            sort_order: it.sort_order ?? undefined,
            related_features: it.related_features ?? undefined,
            estimated_read_time: it.estimated_read_time ?? undefined,
            last_updated: it.last_updated ?? undefined,
          })),
      });
    }
    return result;
  },
});

export const upsertSection = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    priority: v.optional(v.string()),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("helpSections")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.slug))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return { id: existing._id } as const;
    }
    const id = await ctx.db.insert("helpSections", { ...args, createdAt: now, updatedAt: now });
    return { id } as const;
  },
});

export const upsertItem = mutation({
  args: {
    sectionSlug: v.string(),
    title: v.string(),
    content: v.string(),
    type: v.optional(v.string()),
    sort_order: v.optional(v.number()),
    related_features: v.optional(v.array(v.string())),
    estimated_read_time: v.optional(v.number()),
    last_updated: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const section = await ctx.db
      .query("helpSections")
      .withIndex("by_slug", (q: any) => q.eq("slug", args.sectionSlug))
      .first();
    if (!section) throw new Error(`Section not found: ${args.sectionSlug}`);

    const id = await ctx.db.insert("helpItems", {
      sectionId: section._id,
      title: args.title,
      content: args.content,
      title_lc: args.title.toLowerCase(),
      content_lc: args.content.toLowerCase(),
      type: args.type,
      sort_order: args.sort_order,
      related_features: args.related_features,
      estimated_read_time: args.estimated_read_time,
      last_updated: args.last_updated,
      createdAt: now,
      updatedAt: now,
    });
    return { id } as const;
  },
});

export const seedDefault = mutation({
  args: {},
  handler: async (ctx) => {
    const exists = await ctx.db.query("helpSections").first();
    if (exists) return { ok: true as const, skipped: true };

    // Minimal default seed. Expand as needed.
    const sections = [
      { slug: "getting_started", title: "🌟 Getting Started", sort_order: 1, icon: "🌟", category: "getting_started", priority: "high" },
      { slug: "features", title: "📱 Features Help", sort_order: 2, icon: "📱", category: "features", priority: "high" },
      { slug: "contact", title: "💬 Contact Support", sort_order: 6, icon: "💬", category: "support", priority: "low" },
    ];

    // Inline upsert logic since we cannot call a mutation from a mutation
    const now = Date.now();
    for (const s of sections) {
      const existing = await ctx.db
        .query("helpSections")
        .withIndex("by_slug", (q: any) => q.eq("slug", s.slug))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { ...s, updatedAt: now });
      } else {
        await ctx.db.insert("helpSections", { ...s, createdAt: now, updatedAt: now });
      }
    }

    const gettingStarted = await ctx.db
      .query("helpSections")
      .withIndex("by_slug", (q: any) => q.eq("slug", "getting_started"))
      .first();
    const contact = await ctx.db
      .query("helpSections")
      .withIndex("by_slug", (q: any) => q.eq("slug", "contact"))
      .first();

    if (gettingStarted?._id) {
      await ctx.db.insert("helpItems", {
        sectionId: gettingStarted._id,
        title: "How to Create Your Profile",
        content: "Go to Profile → Edit Profile to update your info.",
        type: "guide",
        sort_order: 1,
        related_features: ["profile", "settings"],
        estimated_read_time: 2,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (contact?._id) {
      await ctx.db.insert("helpItems", {
        sectionId: contact._id,
        title: "Email Support",
        content: "Email safespace.dev.app@gmail.com for non-urgent issues.",
        type: "contact",
        sort_order: 1,
        related_features: ["support", "contact", "email"],
        estimated_read_time: 2,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { ok: true as const, skipped: false };
  },
});

export const searchHelp = query({
  args: { q: v.string() },
  handler: async (ctx, args: { q: string }) => {
    const q = args.q.trim().toLowerCase();
    if (!q) return [] as any[];
    const results: any[] = [];
    const seen = new Set<string>();

    // 1) Prefix search on title_lc using index range (fast path)
    const upper = q + "\uffff"; // range end for prefix
    const titleMatches = await ctx.db
      .query("helpItems")
      .withIndex("by_title_lc", (qq: any) => qq.gte(q).lt(upper))
      .take(200);
    for (const it of titleMatches) {
      if (!seen.has(it._id)) {
        seen.add(it._id);
        results.push({
          id: String(it._id),
          title: it.title,
          content: it.content,
          type: it.type ?? undefined,
          sort_order: it.sort_order ?? undefined,
          related_features: it.related_features ?? undefined,
          estimated_read_time: it.estimated_read_time ?? undefined,
          last_updated: it.last_updated ?? undefined,
        });
      }
    }

    // 2) Fallback contains match on content_lc (limited scan)
    const contentScan = await ctx.db.query("helpItems").take(400);
    for (const it of contentScan) {
      const hayTitle = it.title_lc || it.title?.toLowerCase?.() || "";
      const hayContent = it.content_lc || it.content?.toLowerCase?.() || "";
      if ((hayTitle.includes(q) || hayContent.includes(q)) && !seen.has(it._id)) {
        seen.add(it._id);
        results.push({
          id: String(it._id),
          title: it.title,
          content: it.content,
          type: it.type ?? undefined,
          sort_order: it.sort_order ?? undefined,
          related_features: it.related_features ?? undefined,
          estimated_read_time: it.estimated_read_time ?? undefined,
          last_updated: it.last_updated ?? undefined,
        });
      }
    }

    return results;
  },
});

// Action: seed from a REST endpoint (e.g., your backend) to avoid duplicating fallback data.
// Usage: call with baseUrl like "http://localhost:3001" or your dev ngrok URL.
export const seedFromUrl = action({
  args: { baseUrl: v.string() },
  handler: async (ctx, args) => {
    const url = `${args.baseUrl.replace(/\/$/, '')}/api/help-sections?include=items`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch help data: ${res.status}`);
    const sections = await res.json();
    const now = Date.now();

    for (const s of sections as any[]) {
      // Upsert section
  const existing = await ctx.runQuery(internal.help._getSectionBySlug, { slug: s.id });
      let sectionId = existing?._id as any;
      if (sectionId) {
  await ctx.runMutation(internal.help._patchSection, { _id: sectionId, update: {
          title: s.title,
          icon: s.icon,
          description: s.description,
          category: s.category,
          priority: s.priority,
          sort_order: s.sort_order,
          updatedAt: now,
        }});
      } else {
  sectionId = (await ctx.runMutation(internal.help._insertSection, {
          slug: s.id,
          title: s.title,
          icon: s.icon,
          description: s.description,
          category: s.category,
          priority: s.priority,
          sort_order: s.sort_order,
          createdAt: now,
          updatedAt: now,
        } as any)).id;
      }

      // Insert items (simple append; optional: clear old first)
      for (const it of (s.content || [])) {
  await ctx.runMutation(internal.help._insertItem, {
          sectionId,
          title: it.title,
          content: it.content,
          title_lc: it.title?.toLowerCase?.() || '',
          content_lc: it.content?.toLowerCase?.() || '',
          type: it.type,
          sort_order: it.sort_order,
          related_features: it.related_features,
          estimated_read_time: it.estimated_read_time,
          last_updated: it.last_updated,
          createdAt: now,
          updatedAt: now,
        } as any);
      }
    }
    return { ok: true as const };
  }
});

// Internal helpers for action above
import { internalMutation, internalQuery } from "./_generated/server";
export const _getSectionBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query("helpSections").withIndex("by_slug", (q: any) => q.eq("slug", args.slug)).first();
  }
});
export const _patchSection = internalMutation({
  args: { _id: v.id("helpSections"), update: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args._id, args.update);
  }
});
export const _insertSection = internalMutation({
  args: {
    slug: v.string(), title: v.string(), icon: v.optional(v.string()), description: v.optional(v.string()),
    category: v.optional(v.string()), priority: v.optional(v.string()), sort_order: v.optional(v.number()),
    createdAt: v.number(), updatedAt: v.number()
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("helpSections", args as any);
    return { id } as const;
  }
});
export const _insertItem = internalMutation({
  args: {
    sectionId: v.id("helpSections"),
    title: v.string(), content: v.string(), title_lc: v.optional(v.string()), content_lc: v.optional(v.string()),
    type: v.optional(v.string()), sort_order: v.optional(v.number()), related_features: v.optional(v.array(v.string())),
    estimated_read_time: v.optional(v.number()), last_updated: v.optional(v.string()), createdAt: v.number(), updatedAt: v.number()
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("helpItems", args as any);
    return { id } as const;
  }
});

// Track a Help section view by recording an activity (no-op if unauthenticated)
export const trackSectionView = mutation({
  args: { sectionId: v.string() },
  handler: async (ctx, args: { sectionId: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject ?? "anonymous";
    const now = Date.now();
    try {
      await ctx.db.insert("activities", {
        userId,
        activityType: "help_section_view",
        metadata: { sectionId: args.sectionId },
        createdAt: now,
      });
      return { ok: true as const };
    } catch {
      return { ok: false as const };
    }
  },
});
