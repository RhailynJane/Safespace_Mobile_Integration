import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

function toClient(entry: any) {
  return {
    id: String(entry._id),
    title: entry.title,
    content: entry.content,
    emotion_type: entry.emotionType ?? undefined,
    emoji: entry.emoji ?? undefined,
    template_id: entry.templateId ?? undefined,
    share_with_support_worker: entry.shareWithSupportWorker ?? false,
    tags: entry.tags ?? [],
    created_at: new Date(entry.createdAt).toISOString(),
    updated_at: new Date(entry.updatedAt).toISOString(),
  };
}

function resolveUserId(argsUserId: string | undefined, identity: any) {
  // Prefer authenticated user if available; else fallback to provided
  if (identity?.subject) return identity.subject as string;
  return argsUserId as string;
}

export const listRecent = query({
  args: { clerkUserId: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = resolveUserId(args.clerkUserId, identity);
    if (!userId) return [] as any[];

    let q = ctx.db.query("journalEntries").withIndex("by_user", (qq: any) => qq.eq("clerkId", userId));
    // Collect and sort desc by createdAt
    const all = await q.collect();
    all.sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    const limited = all.slice(0, Math.max(0, Math.min(args.limit ?? 10, 50)));
    return limited.map(toClient);
  },
});

export const getEntry = query({
  args: { id: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.id);
    if (!entry) return null;
    // Optional auth check: only owner can read
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.subject && identity.subject !== entry.clerkId) {
      // Hide if not owner
      return null;
    }
    return { entry: toClient(entry) } as const;
  },
});

export const createEntry = mutation({
  args: {
    clerkUserId: v.optional(v.string()),
    title: v.string(),
    content: v.string(),
    emotionType: v.optional(v.string()),
    emoji: v.optional(v.string()),
    templateId: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    shareWithSupportWorker: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = resolveUserId(args.clerkUserId, identity);
    if (!userId) throw new Error("Missing userId");

    const now = Date.now();
    const id = await ctx.db.insert("journalEntries", {
      clerkId: userId,
      title: args.title,
      content: args.content,
      emotionType: args.emotionType,
      emoji: args.emoji,
      templateId: args.templateId,
      tags: args.tags ?? [],
      shareWithSupportWorker: args.shareWithSupportWorker ?? false,
      createdAt: now,
      updatedAt: now,
    });
    const created = await ctx.db.get(id);
    return { success: true as const, entry: toClient(created) };
  },
});

export const updateEntry = mutation({
  args: {
    id: v.id("journalEntries"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    emotionType: v.optional(v.string()),
    emoji: v.optional(v.string()),
    templateId: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    shareWithSupportWorker: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Entry not found");

    const identity = await ctx.auth.getUserIdentity();
    if (identity?.subject && identity.subject !== existing.clerkId) {
      throw new Error("Not authorized to edit this entry");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      ...(args.title !== undefined ? { title: args.title } : {}),
      ...(args.content !== undefined ? { content: args.content } : {}),
      ...(args.emotionType !== undefined ? { emotionType: args.emotionType } : {}),
      ...(args.emoji !== undefined ? { emoji: args.emoji } : {}),
      ...(args.templateId !== undefined ? { templateId: args.templateId } : {}),
      ...(args.tags !== undefined ? { tags: args.tags } : {}),
      ...(args.shareWithSupportWorker !== undefined ? { shareWithSupportWorker: args.shareWithSupportWorker } : {}),
      updatedAt: now,
    });

    const updated = await ctx.db.get(args.id);
    return { success: true as const, entry: toClient(updated) };
  },
});

export const deleteEntry = mutation({
  args: { id: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Entry not found");

    const identity = await ctx.auth.getUserIdentity();
    if (identity?.subject && identity.subject !== existing.clerkId) {
      throw new Error("Not authorized to delete this entry");
    }

    await ctx.db.delete(args.id);
    return { success: true as const };
  },
});

export const getHistory = query({
  args: {
    clerkUserId: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = resolveUserId(args.clerkUserId, identity);
    if (!userId) return { entries: [] as any[] } as const;

    let entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q: any) => q.eq("clerkId", userId))
      .collect();

    // Filter by date range if provided (using createdAt numeric timestamps)
    const startTs = args.startDate ? Date.parse(args.startDate) : undefined;
    const endTs = args.endDate ? Date.parse(args.endDate) : undefined;
    if (startTs || endTs) {
      entries = entries.filter((e: any) => {
        const t = e.createdAt ?? 0;
        if (startTs && t < startTs) return false;
        if (endTs && t > endTs) return false;
        return true;
      });
    }

    // Sort by createdAt desc
    entries.sort((a: any, b: any) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

    return { entries: entries.map(toClient) } as const;
  },
});

// Templates
export const listTemplates = query({
  args: {},
  handler: async (ctx) => {
    // Return only active templates, sorted by sort_order asc then name
    const all = await ctx.db
      .query("journalTemplates")
      .withIndex("by_active", (q: any) => q.eq("active", true))
      .collect();

    all.sort((a: any, b: any) => {
      const sa = a.sort_order ?? 0;
      const sb = b.sort_order ?? 0;
      if (sa !== sb) return sa - sb;
      return (a.name ?? "").localeCompare(b.name ?? "");
    });

    return all.map((t: any) => ({
      id: t.tplId as number,
      name: t.name as string,
      description: (t.description ?? "") as string,
      prompts: (t.prompts ?? []) as string[],
      icon: (t.icon ?? "document-text-outline") as string,
    }));
  },
});

export const seedTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    // Idempotent seed by tplId
    const defaults = [
      {
        tplId: 1,
        name: "Gratitude Journal",
        description: "Reflect on what you're grateful for today",
        prompts: [
          "List three things you're grateful for today.",
          "Why do these matter to you?",
          "How did they make you feel?",
        ],
        icon: "heart-outline",
        sort_order: 1,
      },
      {
        tplId: 2,
        name: "Mood Check-In",
        description: "Capture your current mood and context",
        prompts: [
          "Describe your current mood.",
          "What events influenced this mood?",
          "What would help you feel better or maintain it?",
        ],
        icon: "happy-outline",
        sort_order: 2,
      },
      {
        tplId: 3,
        name: "Free Write",
        description: "Unstructured writing to clear your mind",
        prompts: [
          "Write freely about what's on your mind for 5-10 minutes.",
        ],
        icon: "pencil-outline",
        sort_order: 3,
      },
    ];

    let created = 0;
    for (const d of defaults) {
      const existing = await ctx.db
        .query("journalTemplates")
        .withIndex("by_tplId", (q: any) => q.eq("tplId", d.tplId))
        .unique();
      if (!existing) {
        await ctx.db.insert("journalTemplates", {
          tplId: d.tplId,
          name: d.name,
          description: d.description,
          prompts: d.prompts,
          icon: d.icon,
          active: true,
          sort_order: d.sort_order,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        created++;
      }
    }
    return { success: true as const, created };
  },
});
