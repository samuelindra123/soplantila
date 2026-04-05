import { apiClient } from '@/lib/api-client';

export enum UploadHistoryStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum MediaUploadStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface UploadHistoryMedia {
  id: string;
  historyId: string;
  mediaType: 'IMAGE' | 'VIDEO';
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
  publicUrl?: string;
  status: MediaUploadStatus;
  progress: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  uploadTimeMs?: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UploadHistory {
  id: string;
  userId: string;
  postId?: string;
  content: string;
  status: UploadHistoryStatus;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  processingTimeMs?: number;
  totalMediaCount: number;
  completedMediaCount: number;
  createdAt: string;
  updatedAt: string;
  mediaItems: UploadHistoryMedia[];
}

export interface UploadHistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface UploadHistoryResponse {
  message: string;
  data: UploadHistory[];
  pagination: UploadHistoryPagination;
}

export interface SingleHistoryResponse {
  message: string;
  data: UploadHistory | null;
}

export interface DeleteResponse {
  message: string;
  data?: {
    deletedCount: number;
  };
}

/**
 * Get user's upload history with pagination
 */
export async function getUploadHistory(page = 1, limit = 20): Promise<UploadHistoryResponse> {
  console.log('[UploadHistoryService] Fetching history:', { page, limit });
  
  try {
    const response = await apiClient.get<any>(
      `/upload-history?page=${page}&limit=${limit}`
    );
    
    console.log('[UploadHistoryService] Raw response:', response);
    
    // apiClient returns the response directly, check if it's an array or object
    let result: UploadHistoryResponse;
    
    if (Array.isArray(response)) {
      // Response is array directly (unexpected but handle it)
      console.log('[UploadHistoryService] Response is array, wrapping');
      result = {
        message: 'Success',
        data: response.map(item => ({
          ...item,
          mediaItems: item.mediaItems || item.media || [],
        })),
        pagination: {
          page: 1,
          limit: 20,
          total: response.length,
          totalPages: 1,
          hasMore: false,
        },
      };
    } else if (response.data && Array.isArray(response.data)) {
      // Response has data property with array
      result = {
        message: response.message || 'Success',
        data: response.data.map((item: any) => ({
          ...item,
          mediaItems: item.mediaItems || item.media || [],
        })),
        pagination: response.pagination || {
          page: 1,
          limit: 20,
          total: response.data.length,
          totalPages: 1,
          hasMore: false,
        },
      };
    } else {
      // Fallback
      result = {
        message: response.message || 'Success',
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }
    
    console.log('[UploadHistoryService] History fetched:', {
      count: result.data.length,
      total: result.pagination.total,
      firstItem: result.data[0],
    });
    
    return result;
  } catch (error) {
    console.error('[UploadHistoryService] Failed to fetch history:', error);
    throw error;
  }
}

/**
 * Get single history entry
 */
export async function getHistoryById(historyId: string): Promise<SingleHistoryResponse> {
  console.log('[UploadHistoryService] Fetching history by ID:', historyId);
  
  try {
    const response = await apiClient.get<SingleHistoryResponse>(`/upload-history/${historyId}`);
    
    console.log('[UploadHistoryService] History fetched:', {
      historyId,
      found: !!response.data,
    });
    
    return response;
  } catch (error) {
    console.error('[UploadHistoryService] Failed to fetch history:', error);
    throw error;
  }
}

/**
 * Delete history entry
 */
export async function deleteHistory(historyId: string): Promise<DeleteResponse> {
  console.log('[UploadHistoryService] Deleting history:', historyId);
  
  try {
    const response = await apiClient.delete<DeleteResponse>(`/upload-history/${historyId}`);
    
    console.log('[UploadHistoryService] History deleted:', historyId);
    
    return response;
  } catch (error) {
    console.error('[UploadHistoryService] Failed to delete history:', error);
    throw error;
  }
}

/**
 * Clear old completed uploads (>7 days)
 */
export async function clearOldCompleted(): Promise<DeleteResponse> {
  console.log('[UploadHistoryService] Clearing old completed uploads');
  
  try {
    const response = await apiClient.delete<DeleteResponse>('/upload-history');
    
    console.log('[UploadHistoryService] Old completed cleared:', response.data?.deletedCount);
    
    return response;
  } catch (error) {
    console.error('[UploadHistoryService] Failed to clear old completed:', error);
    throw error;
  }
}

/**
 * Format timestamp for display
 * Example: "Apr 5, 2026 at 1:10 PM"
 */
export function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format duration for display
 * Examples: "5.2s", "1m 23s", "2h 15m"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/**
 * Format file size for display
 * Examples: "2.0 MB", "15.3 MB", "1.2 GB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

/**
 * Get relative time for display
 * Examples: "just now", "2 minutes ago", "1 hour ago", "yesterday"
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return formatTimestamp(dateString);
}
