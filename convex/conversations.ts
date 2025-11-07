import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listForUser = query({
  args: {},
  handler: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const memberships = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    const convIds = memberships.map((m: any) => m.conversationId);
    const conversations = await Promise.all(
      convIds.map((id: string) => ctx.db.get(id))
    );
    return conversations.filter(Boolean);
  },
});

export const create = mutation({
  args: { title: v.optional(v.string()), participantIds: v.array(v.string()) },
  handler: async (ctx: any, args: { title?: string; participantIds: string[] }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const creator = identity.subject as string;
    const now = Date.now();

    const conversationId = await ctx.db.insert("conversations", {
      title: args.title,
      createdBy: creator,
      createdAt: now,
      updatedAt: now,
    });

    // Add participants including creator
    const all = Array.from(new Set([creator, ...args.participantIds]));
    await Promise.all(
      all.map((userId) =>
        ctx.db.insert("conversationParticipants", {
          conversationId,
          userId,
          role: userId === creator ? "owner" : "member",
          joinedAt: now,
          lastReadAt: now,
        })
      )
    );

    return { conversationId } as const;
  },
});

export const listMessages = query({
  args: { conversationId: v.id("conversations"), limit: v.optional(v.number()) },
  handler: async (ctx: any, args: { conversationId: string; limit?: number }) => {
    const limit = args.limit ?? 50;
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(limit);

    // Resolve storage URLs if present
    const resolved = await Promise.all(rows.map(async (m: any) => {
      if (m.storageId && !m.attachmentUrl) {
        try {
          const url = await ctx.storage.getUrl(m.storageId);
          return { ...m, attachmentUrl: url };
        } catch {
          return m;
        }
      }
      return m;
    }));

    return resolved.reverse();
  },
});

export const sendMessage = mutation({
  args: { conversationId: v.id("conversations"), body: v.string(), messageType: v.optional(v.string()) },
  handler: async (ctx: any, args: { conversationId: string; body: string; messageType?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const sender = identity.subject as string;
    const now = Date.now();

    const msgId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: sender,
      body: args.body,
      messageType: args.messageType ?? 'text',
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(args.conversationId, { updatedAt: now });
    return { messageId: msgId } as const;
  },
});

export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx: any, args: { conversationId: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;
    const now = Date.now();

    const membership = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .filter((q: any) => q.eq(q.field("userId"), userId))
      .first();

    if (membership) {
      await ctx.db.patch(membership._id, { lastReadAt: now });
    }
    return { ok: true } as const;
  },
});

// Optional: create an attachment message record in Convex (metadata only)
export const sendAttachmentMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    attachmentUrl: v.string(),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    messageType: v.optional(v.string()), // default 'file' or 'image'
  },
  handler: async (ctx: any, args: { conversationId: string; attachmentUrl: string; fileName?: string; fileSize?: number; messageType?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const sender = identity.subject as string;
    const now = Date.now();

    const msgId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: sender,
      body: '',
      messageType: args.messageType ?? 'file',
      attachmentUrl: args.attachmentUrl,
      fileName: args.fileName,
      fileSize: args.fileSize,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(args.conversationId, { updatedAt: now });
    return { messageId: msgId } as const;
  }
});

// Send attachment message from Convex Storage
export const sendAttachmentFromStorage = mutation({
  args: {
    conversationId: v.id("conversations"),
    storageId: v.id("_storage"),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    messageType: v.optional(v.string()),
  },
  handler: async (ctx: any, args: { conversationId: string; storageId: string; fileName?: string; fileSize?: number; messageType?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const sender = identity.subject as string;
    const now = Date.now();

    const msgId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: sender,
      body: '',
      messageType: args.messageType ?? 'file',
      storageId: args.storageId as any,
      fileName: args.fileName,
      fileSize: args.fileSize,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.patch(args.conversationId, { updatedAt: now });
    return { messageId: msgId } as const;
  }
});
