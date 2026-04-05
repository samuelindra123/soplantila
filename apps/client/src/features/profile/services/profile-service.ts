import { apiClient } from "@/lib/api-client";
import { FullProfile, Pagination, UpdateProfileResponse, UserProfile } from "@/types/api";
import { Post, MediaItem } from "@/types/social";

export type UserPostsResponse = {
  posts: Post[];
  pagination: Pagination;
};

export type UpdateProfileData = {
  firstName?: string;
  lastName?: string;
  username?: string;
  tanggalLahir?: string;
  tempatLahir?: string;
  gender?: UserProfile["gender"];
  pekerjaan?: string;
  bio?: string;
  coverImageAction?: "KEEP" | "REPLACE" | "REMOVE";
};

export const profileService = {
  async getMyProfile(): Promise<FullProfile> {
    return apiClient.get<FullProfile>("/profile/me");
  },

  async getProfileByUsername(username: string): Promise<FullProfile> {
    return apiClient.get<FullProfile>(`/profile/${username}`);
  },

  async getUserPosts(userId: string, page = 1, limit = 20): Promise<UserPostsResponse> {
    return apiClient.get<UserPostsResponse>(`/users/${userId}/posts?page=${page}&limit=${limit}`);
  },

  async getUserMedia(userId: string): Promise<MediaItem[]> {
    const response = await apiClient.get<UserPostsResponse>(`/users/${userId}/posts?page=1&limit=100`);
    
    // Extract all media from posts
    const allMedia: MediaItem[] = [];
    response.posts.forEach(post => {
      if (post.mediaItems && post.mediaItems.length > 0) {
        allMedia.push(...post.mediaItems);
      }
    });
    
    return allMedia;
  },

  async updateProfile(
    data: UpdateProfileData,
    profileImage?: File,
    coverImage?: File,
  ): Promise<UpdateProfileResponse> {
    const formData = new FormData();
    
    // Append text fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });
    
    // Append profile image if provided
    if (profileImage) {
      formData.append("fotoProfil", profileImage);
    }

    if (coverImage) {
      formData.append("coverImage", coverImage);
    }
    
    return apiClient.patch<UpdateProfileResponse>("/onboarding/profile", formData);
  },

  async createPost(content: string, mediaUrl?: string): Promise<Post> {
    return apiClient.post<Post>("/posts", { content, mediaUrl });
  },

  async deletePost(postId: string): Promise<void> {
    return apiClient.delete(`/posts/${postId}`);
  },

  async getUserProfileById(userId: string): Promise<FullProfile> {
    return apiClient.get<FullProfile>(`/users/${userId}/profile`);
  },

  async getFollowers(userId: string): Promise<{ id: string; email: string; profile: UserProfile }[]> {
    return apiClient.get(`/users/${userId}/followers`);
  },

  async getFollowing(userId: string): Promise<{ id: string; email: string; profile: UserProfile }[]> {
    return apiClient.get(`/users/${userId}/following`);
  },

  async followUser(userId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/users/${userId}/follow`);
  },

  async unfollowUser(userId: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/users/${userId}/follow`);
  },
};
