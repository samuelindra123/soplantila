import { apiClient } from '@/lib/api-client';

export interface PostMedia {
  id: string;
  mediaType: 'image' | 'video';
  url: string;
  previewImageUrl?: string;
  mimeType: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface PostAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  content: string;
  mediaUrl?: string;
  mediaItems: PostMedia[];
  author: PostAuthor;
  isOwner: boolean;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  createdAt: string;
  updatedAt: string;
  clientStatus?: 'posting';
}

export interface FeedResponse {
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface CreatePostMedia {
  mediaType: 'image' | 'video';
  storageKey: string;
  publicUrl: string;
  previewImageUrl?: string;
  mimeType: string;
  fileSize: number;
  originalName?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface CreatePostPayload {
  content: string;
  media?: CreatePostMedia[];
}

export async function getFeed(page = 1, limit = 20): Promise<FeedResponse> {
  try {
    // apiClient already extracts .data from response, so this returns FeedResponse directly
    const response = await apiClient.get<FeedResponse>(`/feed?page=${page}&limit=${limit}`);
    
    // Safety check and provide fallback
    if (!response || typeof response !== 'object') {
      console.warn('Invalid feed response:', response);
      return {
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }
    
    return response;
  } catch (error) {
    console.error('Feed fetch error:', error);
    throw error; // Throw error to be caught by component
  }
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  console.log('[FeedService] Creating post:', { contentLength: payload.content.length, mediaCount: payload.media?.length || 0 });
  
  try {
    // apiClient already extracts .data from response, so this returns Post directly
    const response = await apiClient.post<Post>('/posts', payload);
    console.log('[FeedService] Post created successfully:', { postId: response.id, createdAt: response.createdAt });
    return response;
  } catch (error) {
    console.error('[FeedService] Create post failed:', error);
    throw error;
  }
}

export async function deletePost(postId: string): Promise<void> {
  await apiClient.delete(`/posts/${postId}`);
}
