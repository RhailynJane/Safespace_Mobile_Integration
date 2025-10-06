import { Platform } from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001";

class CommunityForumApi {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers as Record<string, string>),
        },
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

    return this.fetchWithAuth(`/api/community/posts?${params.toString()}`);
  }

  async getPostById(id: number) {
    return this.fetchWithAuth(`/api/community/posts/${id}`);
  }

  async createPost(postData: {
    clerkUserId: string;
    title: string;
    content: string;
    category: string;
    isPrivate?: boolean;
    isDraft?: boolean;
  }) {
    return this.fetchWithAuth("/api/community/posts", {
      method: "POST",
      body: JSON.stringify(postData),
    });
  }

  // Reactions
  async reactToPost(postId: number, clerkUserId: string, emoji: string) {
    return this.fetchWithAuth(`/api/community/posts/${postId}/reactions`, {
      method: "POST",
      body: JSON.stringify({ clerkUserId, emoji }),
    });
  }

  async getUserReaction(postId: number, clerkUserId: string) {
    return this.fetchWithAuth(`/api/community/posts/${postId}/user-reaction/${clerkUserId}`);
  }

  // Bookmarks
  async toggleBookmark(postId: number, clerkUserId: string) {
    return this.fetchWithAuth(`/api/community/posts/${postId}/bookmark`, {
      method: "POST",
      body: JSON.stringify({ clerkUserId }),
    });
  }

  async getBookmarkedPosts(clerkUserId: string) {
    return this.fetchWithAuth(`/api/community/bookmarks/${clerkUserId}`);
  }

  // User posts
  async getUserPosts(clerkUserId: string, includeDrafts = false) {
    const params = new URLSearchParams();
    if (includeDrafts) params.append("includeDrafts", "true");

    return this.fetchWithAuth(
      `/api/community/my-posts/${clerkUserId}?${params.toString()}`
    );
  }

  // Categories
  async getCategories() {
    return this.fetchWithAuth("/api/community/categories");
  }
}

export const communityApi = new CommunityForumApi();