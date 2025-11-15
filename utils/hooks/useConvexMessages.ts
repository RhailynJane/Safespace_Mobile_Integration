import { useState, useEffect, useCallback } from 'react';
import { ConvexReactClient, useQuery } from 'convex/react';
// @ts-ignore - generated at runtime by `npx convex dev`
import { api } from '../../convex/_generated/api';

/**
 * Hook for real-time messaging with Convex integration
 * Falls back to REST API if Convex is not available
 */
export function useConvexMessages(userId: string | undefined, convexClient: ConvexReactClient | null) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Convex is enabled
  const isConvexEnabled = Boolean(convexClient && userId);

  /**
   * Load all conversations for the user
   */
  const loadConversations = useCallback(async () => {
    if (!userId) return [];

    try {
      setLoading(true);
      setError(null);

      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore - generated at runtime by `npx convex dev`
          const { api } = await import('../../convex/_generated/api');
          
          // Get all conversations for this user
          const convexConversations = await convexClient.query(api.conversations.listForUser, {});

          // Transform to UI format
          const formatted = convexConversations.map((conv: any) => ({
            id: conv._id,
            title: conv.title || 'Conversation',
            channel_url: conv.channelUrl,
            last_message: '', // Would need to fetch latest message
            unread_count: 0, // Would need to calculate from lastReadAt
            participants: [],
            created_at: new Date(conv.createdAt).toISOString(),
            updated_at: new Date(conv.updatedAt).toISOString(),
          }));

          setConversations(formatted);
          return formatted;
        } catch (convexError) {
          console.warn('Convex conversations query failed, falling back to REST:', convexError);
          // Fall through to REST API
        }
      }

      // Fallback to REST API
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${userId}?t=${Date.now()}`
      );

      if (response.ok) {
        const result = await response.json();
        setConversations(result.data || []);
        return result.data || [];
      }

      return [];
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, isConvexEnabled, convexClient]);

  /**
   * Load messages for a conversation (Convex-first with REST fallback)
   * Returns messages in the REST/UI shape to avoid downstream breakage
   */
  const loadMessages = useCallback(async (conversationId: string, limit?: number): Promise<any[]> => {
    if (!userId || !conversationId) return [];

    try {
      // Convex-first
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore - generated at runtime by `npx convex dev`
          const { api } = await import('../../convex/_generated/api');

          // Query messages; API shape may differ, so map defensively
          const convexMessages: any[] = await convexClient.query(
            api.conversations.listMessages,
            { conversationId: conversationId as any, limit: limit ?? 200 }
          );

          const formatted = (convexMessages || []).map((m: any) => ({
            id: String(m._id ?? m.id ?? `${Date.now()}_${Math.random()}`),
            message_type: m.messageType ?? (m.attachmentUrl ? 'file' : 'text'),
            message_text: m.body ?? m.text ?? m.content ?? '',
            attachment_url: m.attachmentUrl ?? m.fileUrl ?? null,
            file_name: m.fileName ?? m.filename ?? undefined,
            file_size: m.fileSize ?? undefined,
            created_at: (() => {
              const d = m.createdAt ?? m.created_at ?? m.timestamp;
              try { return new Date(d).toISOString(); } catch { return new Date().toISOString(); }
            })(),
            sender: {
              clerk_user_id: m.senderId ?? m.sender?.clerkUserId ?? m.sender?.id ?? '',
              first_name: m.sender?.firstName ?? m.sender?.first_name ?? '',
              last_name: m.sender?.lastName ?? m.sender?.last_name ?? '',
              profile_image_url: m.sender?.imageUrl ?? m.sender?.profileImageUrl ?? m.sender?.profile_image_url ?? undefined,
            },
          }));

          return formatted;
        } catch (convexError) {
          console.warn('Convex loadMessages failed, falling back to REST:', convexError);
        }
      }

      // REST fallback
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}/messages?clerkUserId=${userId}&t=${Date.now()}`
      );
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
      return [];
    } catch (err) {
      console.error('Error loading messages:', err);
      return [];
    }
  }, [userId, isConvexEnabled, convexClient]);

  /**
   * Send a message in a conversation
   */
  const sendMessage = useCallback(async (conversationId: string, body: string) => {
    if (!userId) throw new Error('User ID required');

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await convexClient.mutation(api.conversations.sendMessage, {
            conversationId: conversationId as any, // ConvexId type
            body,
          });

          // Refresh conversations after sending
          await loadConversations();
          return { success: true };
        } catch (convexError) {
          console.warn('Convex send message failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          senderId: userId,
          body,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Refresh conversations after sending
      await loadConversations();
      return { success: true };
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    }
  }, [userId, isConvexEnabled, convexClient, loadConversations]);

  /**
   * Mark conversation as read
   */
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!userId) throw new Error('User ID required');

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await convexClient.mutation(api.conversations.markRead, {
            conversationId: conversationId as any, // ConvexId type
          });

          // Update local state optimistically
          setConversations(prev => 
            prev.map(conv => 
              conv.id === conversationId 
                ? { ...conv, unread_count: 0 }
                : conv
            )
          );
          return { success: true };
        } catch (convexError) {
          console.warn('Convex mark as read failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}/mark-read`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clerkUserId: userId }),
        }
      );

      if (!response.ok) throw new Error('Failed to mark as read');

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
      return { success: true };
    } catch (err) {
      console.error('Error marking as read:', err);
      throw err;
    }
  }, [userId, isConvexEnabled, convexClient]);

  /**
   * Create a new conversation
   */
  const createConversation = useCallback(async (participantIds: string[], title?: string) => {
    if (!userId) throw new Error('User ID required');

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          const result = await convexClient.mutation(api.conversations.create, {
            participantIds: [...participantIds], // Don't include self, API does it
            title,
          });

          // Refresh conversations after creating
          await loadConversations();
          return { success: true, conversationId: result.conversationId };
        } catch (convexError) {
          console.warn('Convex create conversation failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE_URL}/api/messages/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createdBy: userId,
          participants: [...participantIds, userId],
          title,
        }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');

      const result = await response.json();
      
      // Refresh conversations after creating
      await loadConversations();
      return { success: true, conversationId: result.conversationId };
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  }, [userId, isConvexEnabled, convexClient, loadConversations]);

  /**
   * Delete a conversation (remove for current user)
   */
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!userId) throw new Error('User ID required');

    try {
      // Note: Convex API doesn't have a remove function yet
      // Fall back to REST API for deletion
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_BASE_URL}/api/messages/conversations/${conversationId}?clerkUserId=${userId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete conversation');

      // Update local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting conversation:', err);
      throw err;
    }
  }, [userId]);

  // Load initial data
  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId, loadConversations]);

  return {
    conversations,
    loading,
    error,
    loadConversations,
    loadMessages,
    sendMessage,
    markAsRead,
    createConversation,
    deleteConversation,
    isUsingConvex: isConvexEnabled,
  };
}

/**
 * Live messages subscription using Convex useQuery.
 * Returns messages in UI/REST shape. If Convex is disabled or args missing, returns undefined.
 */
export function useConvexLiveMessages(conversationId?: string, limit: number = 200) {
  // When conversationId is undefined, pass undefined to pause the query
  const raw = useQuery(
    // @ts-ignore
    api.conversations?.listMessages,
    conversationId ? ({ conversationId: conversationId as any, limit } as any) : undefined
  ) as any[] | undefined;

  const formatted = (raw || []).map((m: any) => ({
    id: String(m._id ?? m.id ?? `${Date.now()}_${Math.random()}`),
    message_type: m.messageType ?? (m.attachmentUrl ? 'file' : 'text'),
    message_text: m.body ?? m.text ?? m.content ?? '',
    attachment_url: m.attachmentUrl ?? m.fileUrl ?? null,
    file_name: m.fileName ?? m.filename ?? undefined,
    file_size: m.fileSize ?? undefined,
    created_at: (() => {
      const d = m.createdAt ?? m.created_at ?? m.timestamp;
      try { return new Date(d).toISOString(); } catch { return new Date().toISOString(); }
    })(),
    sender: {
      clerk_user_id: m.senderId ?? m.sender?.clerkUserId ?? m.sender?.id ?? '',
      first_name: m.sender?.firstName ?? m.sender?.first_name ?? '',
      last_name: m.sender?.lastName ?? m.sender?.last_name ?? '',
      profile_image_url: m.sender?.imageUrl ?? m.sender?.profileImageUrl ?? m.sender?.profile_image_url ?? undefined,
    },
  }));

  return {
    messages: formatted,
    isLiveReady: Array.isArray(raw),
  };
}
