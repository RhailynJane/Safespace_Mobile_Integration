import { Platform } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

const API_BASE_URL = "http://192.168.1.100:3001/api";

class CommunityForumApi {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
    return this.fetchWithAuth(
      `/community/my-posts/${clerkUserId}?includeDrafts=${includeDrafts}`
    );
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
