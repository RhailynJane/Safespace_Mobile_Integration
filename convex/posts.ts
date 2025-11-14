import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * List community posts with optional category filtering
 */
export const list = query({
  args: { 
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  handler: async (ctx: any, args: { limit?: number; category?: string }) => {
    const limit = args.limit ?? 20;
    
    let q = ctx.db.query("communityPosts");
    
    // Filter by category if provided
    if (args.category) {
      q = q.withIndex("by_category", (qb: any) => qb.eq("category", args.category));
    } else {
      q = q.withIndex("by_createdAt");
    }
    
    const rows = await q.order("desc").take(limit);
    const publicRows = rows.filter((p: any) => !p.isDraft);

    const identity = await ctx.auth.getUserIdentity();
    const currentUserId = identity?.subject as string | undefined;

    // Enrich with reaction counts, author info, and current user's reaction
    const enriched = await Promise.all(publicRows.map(async (p: any) => {
      const reactions = await ctx.db
        .query("postReactions")
        .withIndex("by_post", (qb: any) => qb.eq("postId", p._id))
        .collect();

      const countsMap = reactions.reduce((acc: Record<string, number>, r: any) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const reactionCounts = Object.entries(countsMap).map(([emoji, count]) => ({ e: emoji, c: count }));

      let userReaction: string | null = null;
      if (currentUserId) {
        const ur = reactions.find((r: any) => r.userId === currentUserId);
        userReaction = ur ? ur.emoji : null;
      }

      const author = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (qb: any) => qb.eq("clerkId", p.authorId))
        .first();
      
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_clerkId", (qb: any) => qb.eq("clerkId", p.authorId))
        .first();

      return {
        ...p,
        reactionCounts, // array of { e, c }
        userReaction,   // emoji or null
        authorName: author?.firstName || "Community Member",
        authorImage: profile?.profileImageUrl || null,
      };
    }));
    return enriched;
  },
});

/**
 * Get user's personal posts (published and drafts)
 */
export const myPosts = query({
  args: { 
    includeDrafts: v.optional(v.boolean()), 
    limit: v.optional(v.number()) 
  },
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
    const enriched = await Promise.all(rows.map(async (p: any) => {
      const reactions = await ctx.db
        .query("postReactions")
        .withIndex("by_post", (qb: any) => qb.eq("postId", p._id))
        .collect();
      const countsMap = reactions.reduce((acc: Record<string, number>, r: any) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const reactionCounts = Object.entries(countsMap).map(([emoji, count]) => ({ e: emoji, c: count }));
      const author = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (qb: any) => qb.eq("clerkId", p.authorId))
        .first();
      
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_clerkId", (qb: any) => qb.eq("clerkId", p.authorId))
        .first();
      
      return {
        ...p,
        reactionCounts,
        userReaction: reactions.find((r: any) => r.userId === authorId)?.emoji || null,
        authorName: author?.firstName || "You",
        authorImage: profile?.profileImageUrl || null,
      };
    }));
    return enriched;
  },
});

/**
 * Get user's bookmarked posts
 */
export const bookmarkedPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: any, args: { limit?: number }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;
    const limit = args.limit ?? 50;

    // Get user's bookmarks
    const bookmarks = await ctx.db
      .query("postBookmarks")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    // Fetch the actual posts
    const posts = await Promise.all(
      bookmarks.map(async (bookmark: any) => {
        return await ctx.db.get(bookmark.postId);
      })
    );

    // Filter out null posts (in case post was deleted)
    const validPosts = posts.filter((p: any) => p !== null);
    const currentUserId = userId;
    const enriched = await Promise.all(validPosts.map(async (p: any) => {
      const reactions = await ctx.db
        .query("postReactions")
        .withIndex("by_post", (qb: any) => qb.eq("postId", p._id))
        .collect();
      const countsMap = reactions.reduce((acc: Record<string, number>, r: any) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const reactionCounts = Object.entries(countsMap).map(([emoji, count]) => ({ e: emoji, c: count }));
      let userReaction: string | null = null;
      if (currentUserId) {
        const ur = reactions.find((r: any) => r.userId === currentUserId);
        userReaction = ur ? ur.emoji : null;
      }
      const author = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (qb: any) => qb.eq("clerkId", p.authorId))
        .first();
      
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_clerkId", (qb: any) => qb.eq("clerkId", p.authorId))
        .first();
      
      return {
        ...p,
        reactionCounts,
        userReaction,
        authorName: author?.firstName || "Community Member",
        authorImage: profile?.profileImageUrl || null,
      };
    }));
    return enriched;
  },
});

/**
 * Check if a post is bookmarked by current user
 */
export const isBookmarked = query({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx: any, args: { postId: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const userId = identity.subject as string;

    const bookmark = await ctx.db
      .query("postBookmarks")
      .withIndex("by_user_and_post", (q: any) => 
        q.eq("userId", userId).eq("postId", args.postId)
      )
      .first();

    return bookmark !== null;
  },
});

/**
 * Create a new post
 */
export const create = mutation({
  args: { 
    title: v.string(), 
    content: v.string(), 
    category: v.optional(v.string()),
    isDraft: v.optional(v.boolean()) 
  },
  handler: async (ctx: any, args: { 
    title: string; 
    content: string; 
    category?: string;
    isDraft?: boolean 
  }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const authorId = identity.subject as string;
    const now = Date.now();
    const id = await ctx.db.insert("communityPosts", {
      authorId,
      title: args.title,
      content: args.content,
      category: args.category,
      isDraft: !!args.isDraft,
      createdAt: now,
      updatedAt: now,
    });
    return { postId: id } as const;
  },
});

/**
 * Update a post (for publishing drafts or editing)
 */
export const update = mutation({
  args: {
    postId: v.id("communityPosts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    isDraft: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    // Verify ownership
    const post = await ctx.db.get(args.postId);
    if (!post || post.authorId !== userId) {
      throw new Error("Unauthorized");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.category !== undefined) updates.category = args.category;
    if (args.isDraft !== undefined) updates.isDraft = args.isDraft;

    await ctx.db.patch(args.postId, updates);
    return { ok: true } as const;
  },
});

/**
 * Delete a post
 */
export const deletePost = mutation({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx: any, args: { postId: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    // Verify ownership
    const post = await ctx.db.get(args.postId);
    if (!post || post.authorId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete the post
    await ctx.db.delete(args.postId);

    // Clean up associated reactions
    const reactions = await ctx.db
      .query("postReactions")
      .withIndex("by_post", (q: any) => q.eq("postId", args.postId))
      .collect();
    await Promise.all(reactions.map((r: any) => ctx.db.delete(r._id)));

    // Clean up associated bookmarks
    const bookmarks = await ctx.db
      .query("postBookmarks")
      .withIndex("by_post", (q: any) => q.eq("postId", args.postId))
      .collect();
    await Promise.all(bookmarks.map((b: any) => ctx.db.delete(b._id)));

    return { ok: true } as const;
  },
});

/**
 * React to a post with an emoji
 */
export const react = mutation({
  args: { postId: v.id("communityPosts"), emoji: v.string() },
  handler: async (ctx: any, args: { postId: string; emoji: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;
    const now = Date.now();

    // Check if user already reacted to this post
    const existing = await ctx.db
      .query("postReactions")
      .withIndex("by_user_and_post", (q: any) => 
        q.eq("userId", userId).eq("postId", args.postId)
      )
      .first();

    if (existing) {
      // Update existing reaction
      await ctx.db.patch(existing._id, {
        emoji: args.emoji,
        createdAt: now,
      });
    } else {
      // Create new reaction
      await ctx.db.insert("postReactions", {
        postId: args.postId,
        userId,
        emoji: args.emoji,
        createdAt: now,
      });
    }

    // Notify the post author (not the reactor) if their settings allow
    try {
      const post = await ctx.db.get(args.postId);
      const authorId = post?.authorId as string | undefined;
      if (authorId && authorId !== userId) {
        const settings = await ctx.db
          .query("settings")
          .withIndex("by_user", (q: any) => q.eq("userId", authorId))
          .first();
        const enabled = settings?.notificationsEnabled !== false && settings?.notifPostReactions !== false;
        if (enabled) {
          // Load reactor name for nicer title if available
          const reactor = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q: any) => q.eq("clerkId", userId))
            .first();
          const name = reactor?.firstName || "Someone";
          await ctx.db.insert("notifications", {
            userId: authorId,
            type: "post_reactions",
            title: `New reaction on your post`,
            message: `${name} reacted ${args.emoji}`,
            isRead: false,
            createdAt: Date.now(),
          });
        }
      }
    } catch (_e) {
      // non-blocking
    }

    return { ok: true } as const;
  },
});

/**
 * Get all reactions for a post
 */
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

/**
 * Get user's reaction for a specific post
 */
export const getUserReaction = query({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx: any, args: { postId: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const userId = identity.subject as string;

    const reaction = await ctx.db
      .query("postReactions")
      .withIndex("by_user_and_post", (q: any) => 
        q.eq("userId", userId).eq("postId", args.postId)
      )
      .first();

    return reaction ? reaction.emoji : null;
  },
});

/**
 * Toggle bookmark on a post
 */
export const toggleBookmark = mutation({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx: any, args: { postId: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    // Check if bookmark exists
    const existing = await ctx.db
      .query("postBookmarks")
      .withIndex("by_user_and_post", (q: any) => 
        q.eq("userId", userId).eq("postId", args.postId)
      )
      .first();

    if (existing) {
      // Remove bookmark
      await ctx.db.delete(existing._id);
      return { bookmarked: false } as const;
    } else {
      // Add bookmark
      await ctx.db.insert("postBookmarks", {
        postId: args.postId,
        userId,
        createdAt: Date.now(),
      });
      return { bookmarked: true } as const;
    }
  },
});

/**
 * Get a single post by ID
 */
export const getPost = query({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, { postId }) => {
    const post = await ctx.db.get(postId);
    if (!post) return null;
    // Optionally enrich with author/profile info
    const author = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (qb: any) => qb.eq("clerkId", post.authorId))
      .first();
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_clerkId", (qb: any) => qb.eq("clerkId", post.authorId))
      .first();
    return {
      ...post,
      authorName: author?.firstName || "Community Member",
      authorImage: profile?.profileImageUrl || null,
    };
  },
});
