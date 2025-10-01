import { Platform } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

class CommunityForumApi {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    try {
      // Get the auth token if available
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Posts
  async getPosts(filters?: {
    category?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.category) params.append("category", filters.category);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    return this.fetchWithAuth(`/community/posts?${params.toString()}`);
  }

  async getPostById(id: number) {
    return this.fetchWithAuth(`/community/posts/${id}`);
  }

  async createPost(postData: {
    clerkUserId: string;
    title: string;
    content: string;
    category: string;
    isPrivate?: boolean;
    isDraft?: boolean;
  }) {
    return this.fetchWithAuth("/community/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  // Reactions
  async reactToPost(postId: number, clerkUserId: string, emoji: string) {
    return this.fetchWithAuth(`/community/posts/${postId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ clerkUserId, emoji }),
    });
  }

  async removeReaction(postId: number, clerkUserId: string, emoji: string) {
    return this.fetchWithAuth(`/community/posts/${postId}/reactions/${emoji}`, {
      method: "DELETE",
      body: JSON.stringify({ clerkUserId }),
    });
  }

  // Bookmarks
  async toggleBookmark(postId: number, clerkUserId: string) {
    return this.fetchWithAuth(`/community/posts/${postId}/bookmark`, {
      method: "POST",
      body: JSON.stringify({ clerkUserId }),
    });
  }

  async getBookmarkedPosts(clerkUserId: string) {
    return this.fetchWithAuth(`/community/bookmarks/${clerkUserId}`);
  }

  // User posts
  async getUserPosts(clerkUserId: string, includeDrafts = false) {
    const params = new URLSearchParams();
    if (includeDrafts) params.append("includeDrafts", "true");

    return this.fetchWithAuth(
      `/community/my-posts/${clerkUserId}?${params.toString()}`
    );
  }

  async updatePost(
    postId: number,
    updates: {
      title?: string;
      content?: string;
      category?: string;
      isDraft?: boolean;
    }
  ) {
    return this.fetchWithAuth(`/community/posts/${postId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  // Delete post
  async deletePost(postId: number) {
    return this.fetchWithAuth(`/community/posts/${postId}`, {
      method: "DELETE",
    });
  }

  // Categories
  async getCategories() {
    return this.fetchWithAuth("/community/categories");
  }

  async getUserReaction(postId: number, clerkUserId: string) {
    return this.fetchWithAuth(
      `/community/posts/${postId}/user-reaction/${clerkUserId}`
    );
  }
}

export const communityApi = new CommunityForumApi();
