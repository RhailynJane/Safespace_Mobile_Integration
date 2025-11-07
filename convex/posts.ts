import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: any, args: { limit?: number }) => {
    const limit = args.limit ?? 20;
    const rows = await ctx.db
      .query("communityPosts")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
    return rows;
  },
});

export const myPosts = query({
  args: { includeDrafts: v.optional(v.boolean()), limit: v.optional(v.number()) },
  handler: async (ctx: any, args: { includeDrafts?: boolean; limit?: number }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const authorId = identity.subject as string;
    const limit = args.limit ?? 50;

    let q = ctx.db
      .query("communityPosts")
      .withIndex("by_author", (q: any) => q.eq("authorId", authorId))
      .order("desc");

    let rows = await q.take(limit);
    if (!args.includeDrafts) {
      rows = rows.filter((p: any) => !p.isDraft);
    }
    return rows;
  },
});

export const create = mutation({
  args: { title: v.string(), content: v.string(), isDraft: v.optional(v.boolean()) },
  handler: async (ctx: any, args: { title: string; content: string; isDraft?: boolean }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const authorId = identity.subject as string;
    const now = Date.now();
    const id = await ctx.db.insert("communityPosts", {
      authorId,
      title: args.title,
      content: args.content,
      isDraft: !!args.isDraft,
      createdAt: now,
      updatedAt: now,
    });
    return { postId: id } as const;
  },
});

export const react = mutation({
  args: { postId: v.id("communityPosts"), emoji: v.string() },
  handler: async (ctx: any, args: { postId: string; emoji: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;
    const now = Date.now();

    await ctx.db.insert("postReactions", {
      postId: args.postId,
      userId,
      emoji: args.emoji,
      createdAt: now,
    });
    return { ok: true } as const;
  },
});

export const listReactions = query({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx: any, args: { postId: string }) => {
    const reactions = await ctx.db
      .query("postReactions")
      .withIndex("by_post", (q: any) => q.eq("postId", args.postId))
      .collect();
    return reactions;
  },
});
