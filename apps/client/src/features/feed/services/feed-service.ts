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
  status?: 'DRAFT' | 'PUBLISHED' | 'FAILED';
  processingStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  processingError?: string;
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

export interface CreateDraftPostPayload {
  content: string;
  uploadIds?: string[];
}

export interface DraftPostResponse {
  postId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'FAILED';
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
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

export async function createDraftPost(payload: CreateDraftPostPayload): Promise<DraftPostResponse> {
  console.log('[FeedService] Creating draft post:', { contentLength: payload.content.length, uploadIdsCount: payload.uploadIds?.length || 0 });
  
  try {
    const response = await apiClient.post<DraftPostResponse>('/posts/draft', payload);
    console.log('[FeedService] Draft post created:', { postId: response.postId, status: response.status });
    return response;
  } catch (error) {
    console.error('[FeedService] Create draft post failed:', error);
    throw error;
  }
}

/**
 * INSTANT POST - Upload file langsung dan buat post PUBLISHED
 * 
 * Menggunakan XMLHttpRequest untuk support progress callback
 * Mengirim files + poster files untuk video thumbnail
 */
export interface InstantPostMedia {
  file: File;
  posterFile?: File; // Thumbnail/poster untuk video
}

export async function createInstantPost(
  content: string,
  mediaItems: InstantPostMedia[],
  onProgress?: (percent: number) => void,
): Promise<Post> {
  console.log('[FeedService] Creating instant post:', { 
    contentLength: content.length, 
    mediaCount: mediaItems.length,
    postersCount: mediaItems.filter(m => m.posterFile).length
  });

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('content', content);
    
    for (const item of mediaItems) {
      formData.append('media', item.file);
    }
    
    // Append poster files for videos (in same order as media)
    for (const item of mediaItems) {
      if (item.posterFile) {
        formData.append('posters', item.posterFile);
      }
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/backend/posts/instant', true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          console.log('[FeedService] Instant post created:', { postId: response.data?.id });
          resolve(response.data);
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error?.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload'));
    };

    xhr.send(formData);
  });
}

export async function deletePost(postId: string): Promise<void> {
  await apiClient.delete(`/posts/${postId}`);
}
