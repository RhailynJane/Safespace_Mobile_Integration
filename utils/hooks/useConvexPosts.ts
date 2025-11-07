import { useState, useEffect, useCallback } from 'react';
import { ConvexReactClient } from 'convex/react';

/**
 * Hook for community posts management with Convex integration
 * Falls back to REST API if Convex is not available
 */
export function useConvexPosts(userId: string | undefined, convexClient: ConvexReactClient | null) {
  const [posts, setPosts] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if Convex is enabled
  const isConvexEnabled = Boolean(convexClient && userId);

  /**
   * Load all community posts
   */
  const loadPosts = useCallback(async (limit: number = 20) => {
    try {
      setLoading(true);
      setError(null);

      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore - generated at runtime by `npx convex dev`
          const { api } = await import('../../convex/_generated/api');
          const convexPosts = await convexClient.query(api.posts.list, { limit });

          // Transform Convex data to UI format
          const formatted = convexPosts.map((post: any) => ({
            id: post._id,
            title: post.title,
            content: post.content,
            authorId: post.authorId,
            isDraft: post.isDraft,
            category: post.category,
            reactions: post.reactions || {},
            createdAt: new Date(post.createdAt).toISOString(),
            updatedAt: new Date(post.updatedAt).toISOString(),
          }));

          setPosts(formatted);
          return formatted;
        } catch (convexError) {
          console.warn('Convex posts query failed, falling back to REST:', convexError);
          // Fall through to REST API
        }
      }

      // Fallback to REST API
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/community/posts?limit=${limit}`);
      const result = await response.json();

      if (result.success && result.posts) {
        setPosts(result.posts);
        return result.posts;
      }

      return [];
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load posts');
      return [];
    } finally {
      setLoading(false);
    }
  }, [isConvexEnabled, convexClient]);

  /**
   * Load user's posts (published and drafts)
   */
  const loadMyPosts = useCallback(async (includeDrafts: boolean = true) => {
    if (!userId) return [];

    try {
      setLoading(true);
      setError(null);

      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          const convexMyPosts = await convexClient.query(api.posts.myPosts, { includeDrafts });

          // Transform Convex data to UI format
          const formatted = convexMyPosts.map((post: any) => ({
            id: post._id,
            title: post.title,
            content: post.content,
            authorId: post.authorId,
            isDraft: post.isDraft,
            category: post.category,
            reactions: post.reactions || {},
            createdAt: new Date(post.createdAt).toISOString(),
            updatedAt: new Date(post.updatedAt).toISOString(),
          }));

          setMyPosts(formatted);
          return formatted;
        } catch (convexError) {
          console.warn('Convex myPosts query failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const draftParam = includeDrafts ? 'true' : 'false';
      const response = await fetch(`${API_URL}/api/community/my-posts?clerkUserId=${userId}&includeDrafts=${draftParam}`);
      const result = await response.json();

      if (result.success && result.posts) {
        setMyPosts(result.posts);
        return result.posts;
      }

      return [];
    } catch (err) {
      console.error('Error loading my posts:', err);
      setError('Failed to load your posts');
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, isConvexEnabled, convexClient]);

  /**
   * Create a new post
   */
  const createPost = useCallback(async (postData: {
    title: string;
    content: string;
    category?: string;
    isDraft?: boolean;
  }) => {
    if (!userId) throw new Error('User ID required');

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          const result = await convexClient.mutation(api.posts.create, {
            title: postData.title,
            content: postData.content,
            isDraft: postData.isDraft || false,
          });

          console.log('✅ Convex post created:', result);

          // Refresh posts after creating
          await loadPosts();
          await loadMyPosts();
          return { success: true, postId: result.postId };
        } catch (convexError) {
          console.warn('Convex create mutation failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: userId,
          ...postData,
        }),
      });

      if (!response.ok) throw new Error('Failed to create post');

      const result = await response.json();

      // Refresh posts after creating
      await loadPosts();
      await loadMyPosts();
      return { success: true, postId: result.post?.id };
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    }
  }, [userId, isConvexEnabled, convexClient, loadPosts, loadMyPosts]);

  /**
   * React to a post with an emoji
   */
  const reactToPost = useCallback(async (postId: string, emoji: string) => {
    if (!userId) throw new Error('User ID required');

    try {
      if (isConvexEnabled && convexClient) {
        try {
          // @ts-ignore
          const { api } = await import('../../convex/_generated/api');
          await convexClient.mutation(api.posts.react, {
            postId: postId as any,
            emoji,
          });

          console.log('✅ Convex reaction added');
          return { success: true };
        } catch (convexError) {
          console.warn('Convex react mutation failed, falling back to REST:', convexError);
        }
      }

      // Fallback to REST API
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/community/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkUserId: userId, emoji }),
      });

      if (!response.ok) throw new Error('Failed to add reaction');
      return { success: true };
    } catch (err) {
      console.error('Error adding reaction:', err);
      throw err;
    }
  }, [userId, isConvexEnabled, convexClient]);

  /**
   * Delete a post
   */
  const deletePost = useCallback(async (postId: string) => {
    if (!userId) throw new Error('User ID required');

    try {
      // Note: Convex delete function not in posts.ts yet, will use REST
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/community/posts/${postId}?clerkUserId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete post');

      // Refresh posts after deleting
      await loadPosts();
      await loadMyPosts();
      return { success: true };
    } catch (err) {
      console.error('Error deleting post:', err);
      throw err;
    }
  }, [userId, loadPosts, loadMyPosts]);

  /**
   * Update a post
   */
  const updatePost = useCallback(async (postId: string, postData: {
    title?: string;
    content?: string;
    category?: string;
    isDraft?: boolean;
  }) => {
    if (!userId) throw new Error('User ID required');

    try {
      // Note: Convex update function not in posts.ts yet, will use REST
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/community/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: userId,
          ...postData,
        }),
      });

      if (!response.ok) throw new Error('Failed to update post');

      // Refresh posts after updating
      await loadPosts();
      await loadMyPosts();
      return { success: true };
    } catch (err) {
      console.error('Error updating post:', err);
      throw err;
    }
  }, [userId, loadPosts, loadMyPosts]);

  // Load initial data
  useEffect(() => {
    if (userId) {
      loadPosts();
    }
  }, [userId, loadPosts]);

  return {
    posts,
    myPosts,
    loading,
    error,
    loadPosts,
    loadMyPosts,
    createPost,
    reactToPost,
    deletePost,
    updatePost,
    isUsingConvex: isConvexEnabled,
  };
}
