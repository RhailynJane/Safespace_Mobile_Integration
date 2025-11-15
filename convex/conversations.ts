import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Utility: produce a deterministic participant key for a set of userIds.
 * Sorted unique ids joined by '|'. This lets us quickly compare participant sets
 * and prevents duplicate 1:1 or group conversations.
 */
function participantKey(ids: string[]) {
  const sorted = Array.from(new Set(ids.map(id => id.trim()).filter(Boolean))).sort();
  return sorted.join("|");
}

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

    // Normalized, unique full participant set (include creator)
    const fullSet = Array.from(new Set([creator, ...args.participantIds]));
    const key = participantKey(fullSet);

    // Attempt dedupe: find existing conversations that include ALL these participants and ONLY these participants.
    // Strategy: For each participant, gather their conversationIds; intersect sets; verify exact membership match.
    const candidateIdCounts: Record<string, number> = {};
    for (const userId of fullSet) {
      const memberships = await ctx.db
        .query("conversationParticipants")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .collect();
      for (const m of memberships) {
        candidateIdCounts[m.conversationId] = (candidateIdCounts[m.conversationId] || 0) + 1;
      }
    }

    const possibleIds = Object.entries(candidateIdCounts)
      .filter(([, count]) => count === fullSet.length) // appears in all participant membership lists
      .map(([cid]) => cid);

    for (const cid of possibleIds) {
      const participants = await ctx.db
        .query("conversationParticipants")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", cid))
        .collect();
      const participantIds = participants.map((p: any) => p.userId);
      const existingKey = participantKey(participantIds);
      if (existingKey === key && participantIds.length === fullSet.length) {
        // Exact match; reuse existing conversation
        return { conversationId: cid, deduped: true } as const;
      }
    }

    // No existing exact conversation; create new one.
    const conversationId = await ctx.db.insert("conversations", {
      title: args.title,
      createdBy: creator,
      createdAt: now,
      updatedAt: now,
      participantKey: key,
    });

    await Promise.all(
      fullSet.map((userId) =>
        ctx.db.insert("conversationParticipants", {
          conversationId,
          userId,
          role: userId === creator ? "owner" : "member",
          joinedAt: now,
          lastReadAt: now,
        })
      )
    );

    return { conversationId, deduped: false } as const;
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

/**
 * listMessagesWithProfiles
 * Returns the latest messages for a conversation enriched with sender profile metadata.
 * Adds: senderFirstName, senderLastName, senderProfileImageUrl for each message.
 * This avoids extra client round trips to fetch user/profile documents.
 */
export const listMessagesWithProfiles = query({
  args: { conversationId: v.id("conversations"), limit: v.optional(v.number()) },
  handler: async (ctx: any, args: { conversationId: string; limit?: number }) => {
    const limit = args.limit ?? 50;

    // Fetch messages (newest first) then reverse to chronological order
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(limit);

    // Collect distinct senderIds
    const distinctSenderIds = Array.from(new Set(messages.map((m: any) => m.senderId).filter(Boolean)));

    // Load user base rows (firstName/lastName/imageUrl) from `users` table
    const userRows = await Promise.all(
      distinctSenderIds.map(async (sid) => {
        const row = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q: any) => q.eq("clerkId", sid))
          .first();
        return row ? { clerkId: sid, firstName: row.firstName, lastName: row.lastName, imageUrl: row.imageUrl } : { clerkId: sid };
      })
    );
  const userMap: Record<string, { firstName?: string; lastName?: string; imageUrl?: string }> = {};
  userRows.forEach((u: any) => { userMap[String(u.clerkId)] = { firstName: u.firstName, lastName: u.lastName, imageUrl: u.imageUrl }; });

    // Load extended profile overrides (profileImageUrl, maybe updated naming) from `profiles` table
    const profileRows = await Promise.all(
      distinctSenderIds.map(async (sid) => {
        const row = await ctx.db
          .query("profiles")
          .withIndex("by_clerkId", (q: any) => q.eq("clerkId", sid))
          .first();
        return row ? { clerkId: sid, profileImageUrl: row.profileImageUrl } : null;
      })
    );
  const profileMap: Record<string, { profileImageUrl?: string }> = {};
  profileRows.filter(Boolean).forEach((p: any) => { profileMap[String(p.clerkId)] = { profileImageUrl: p.profileImageUrl }; });

    // Resolve storage URLs for any messages whose attachment URL isn't already set
    const enriched = await Promise.all(messages.map(async (m: any) => {
      let attachmentUrl = m.attachmentUrl;
      if (m.storageId && !attachmentUrl) {
        try {
          attachmentUrl = await ctx.storage.getUrl(m.storageId);
        } catch { /* ignore */ }
      }
      const base = userMap[m.senderId] || {};
      const prof = profileMap[m.senderId] || {};
      return {
        ...m,
        attachmentUrl,
        senderFirstName: base.firstName || '',
        senderLastName: base.lastName || '',
        senderProfileImageUrl: prof.profileImageUrl || base.imageUrl || undefined,
      };
    }));

    return enriched.reverse();
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

    // Create notifications for other participants if enabled in their settings
    try {
      const participants = await ctx.db
        .query("conversationParticipants")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
        .collect();

      // Load sender name for a nicer title if available
      const senderUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", sender))
        .first();
      const senderFirstName = senderUser?.firstName || "Someone";

      const recipients = participants.map((p: any) => p.userId).filter((uid: string) => uid !== sender);
      for (const uid of recipients) {
        // Check settings gate
        const settings = await ctx.db
          .query("settings")
          .withIndex("by_user", (q: any) => q.eq("userId", uid))
          .first();
        const enabled = settings?.notificationsEnabled !== false && settings?.notifMessages !== false;
        if (!enabled) continue;

        await ctx.db.insert("notifications", {
          userId: uid,
          type: "message",
          title: `New message from ${senderFirstName}`,
          message: args.body?.slice(0, 120) || "New message",
          isRead: false,
          createdAt: Date.now(),
        });
      }
    } catch (_e) {
      // non-blocking
    }
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

// Lightweight presence/activity upsert (stores lastSeen + status)
export const touchActivity = mutation({
  args: { status: v.optional(v.string()) },
  handler: async (ctx: any, args: { status?: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;
    const now = Date.now();

    // Find existing presence row
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: now,
        status: args.status ?? existing.status,
      });
    } else {
      await ctx.db.insert("presence", {
        userId,
        status: args.status ?? "online",
        lastSeen: now,
      });
    }
    return { ok: true } as const;
  },
});

// Query presence for a specific user (for status in chat header)
export const presenceForUser = query({
  args: { userId: v.string() },
  handler: async (ctx: any, args: { userId: string }) => {
    const row = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q: any) => q.eq("userId", args.userId))
      .first();
    return row ?? null;
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

// Update a message text if the current user is the sender
export const updateMessage = mutation({
  args: { 
    messageId: v.id("messages"),
    newText: v.string()
  },
  handler: async (ctx: any, args: { messageId: string; newText: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");

    // Only the sender can edit their message
    if (msg.senderId !== userId) {
      throw new Error("Unauthorized - only the sender can edit this message");
    }

    await ctx.db.patch(args.messageId, {
      body: args.newText,
      updatedAt: Date.now(),
    });
    
    return { ok: true } as const;
  },
});

// Delete a message if the current user is the sender or a participant of the conversation
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx: any, args: { messageId: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const msg = await ctx.db.get(args.messageId);
    if (!msg) throw new Error("Message not found");

    // Verify membership in the conversation
    const membership = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", msg.conversationId))
      .filter((q: any) => q.eq(q.field("userId"), userId))
      .first();

    if (!membership && msg.senderId !== userId) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.messageId);
    return { ok: true } as const;
  },
});

// Delete a whole conversation with cascading deletes (messages, participants) if authorized
export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx: any, args: { conversationId: string }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = identity.subject as string;

    const convo = await ctx.db.get(args.conversationId);
    if (!convo) throw new Error("Conversation not found");

    // Ensure user is a participant
    const membership = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q: any) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q: any) => q.eq(q.field("userId"), userId))
      .first();

    if (!membership && convo.createdBy !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete messages
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .collect();
    for (const m of msgs) {
      await ctx.db.delete(m._id);
    }

    // Delete participants
    const parts = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .collect();
    for (const p of parts) {
      await ctx.db.delete(p._id);
    }

    // Delete conversation itself
    await ctx.db.delete(args.conversationId);

    return { ok: true } as const;
  },
});

/**
 * participantsForConversation
 * Returns the participant list for a conversation with basic user and profile metadata
 */
export const participantsForConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx: any, args: { conversationId: string }) => {
    const parts = await ctx.db
      .query("conversationParticipants")
      .withIndex("by_conversation", (q: any) => q.eq("conversationId", args.conversationId))
      .collect();

    const users = await Promise.all(parts.map(async (p: any) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", p.userId))
        .first();
      const prof = await ctx.db
        .query("profiles")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", p.userId))
        .first();
      return {
        userId: p.userId,
        role: p.role,
        joinedAt: p.joinedAt,
        lastReadAt: p.lastReadAt,
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        imageUrl: prof?.profileImageUrl || user?.imageUrl,
      };
    }));

    return users;
  },
});

/**
 * listForUserEnriched
 * List conversations for the current user, including participants metadata,
 * lastMessage preview, and unreadCount based on lastReadAt.
 */
export const listForUserEnriched = query({
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
    const conversations = (await Promise.all(convIds.map((id: string) => ctx.db.get(id)))).filter(Boolean);

    const results = await Promise.all(conversations.map(async (c: any) => {
      // participants (excluding current user)
      const participants = await ctx.db
        .query("conversationParticipants")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", c._id))
        .collect();

      const others = participants.filter((p: any) => p.userId !== userId);
      const enrichedOthers = await Promise.all(others.map(async (p: any) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerkId", (q: any) => q.eq("clerkId", p.userId))
          .first();
        const prof = await ctx.db
          .query("profiles")
          .withIndex("by_clerkId", (q: any) => q.eq("clerkId", p.userId))
          .first();
        return {
          userId: p.userId,
          role: p.role,
          lastReadAt: p.lastReadAt,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          imageUrl: prof?.profileImageUrl || user?.imageUrl,
        };
      }));

      // last message
      const lastMsg = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", c._id))
        .order("desc")
        .first();

      // unread count based on my lastReadAt (only count messages from OTHER users)
      const mine = participants.find((p: any) => p.userId === userId);
      const lastReadAt = mine?.lastReadAt || 0;
      const unread = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q: any) => q.eq("conversationId", c._id))
        .filter((q: any) => q.gt(q.field("createdAt"), lastReadAt))
        .collect();
      // Filter out messages sent by current user (only count messages from others)
      const unreadFromOthers = unread.filter((msg: any) => msg.senderId !== userId);

      return {
        ...c,
        participants: enrichedOthers,
        lastMessage: lastMsg ? {
          _id: lastMsg._id,
          body: lastMsg.body,
          messageType: lastMsg.messageType,
          attachmentUrl: lastMsg.attachmentUrl,
          createdAt: lastMsg.createdAt,
          senderId: lastMsg.senderId,
        } : null,
        unreadCount: unreadFromOthers.length,
      };
    }));

    // Sort by updatedAt desc
    results.sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return results;
  },
});
