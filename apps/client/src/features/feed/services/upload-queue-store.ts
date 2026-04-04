import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CreatePostMedia } from './feed-service';

export interface UploadQueueItem {
  id: string;
  postId: string;
  file: File | null; // Nullable because File objects can't be serialized
  mediaType: 'image' | 'video';
  previewUrl: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  progress: number;
  error?: string;
  confirmed?: CreatePostMedia;
}

export interface PostQueueItem {
  id: string;
  content: string;
  media: UploadQueueItem[];
  status: 'uploading' | 'creating' | 'completed' | 'failed';
  error?: string;
  createdPostId?: string;
  createdAt: number; // timestamp
}

interface UploadQueueStore {
  queue: PostQueueItem[];
  addPost: (post: PostQueueItem) => void;
  updatePost: (id: string, updates: Partial<PostQueueItem>) => void;
  updateMedia: (postId: string, mediaId: string, updates: Partial<UploadQueueItem>) => void;
  removePost: (id: string) => void;
  clearCompleted: () => void;
  clearOldCompleted: () => void;
}

// Custom storage that handles File objects
const customStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: any) => {
    // Filter out File objects and blob URLs before saving
    const sanitized = {
      ...value,
      state: {
        ...value.state,
        queue: value.state.queue.map((post: PostQueueItem) => ({
          ...post,
          media: post.media.map((m: UploadQueueItem) => ({
            ...m,
            file: null, // Don't persist File objects
            previewUrl: '', // Don't persist blob URLs
          })),
        })),
      },
    };
    localStorage.setItem(name, JSON.stringify(sanitized));
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};

export const useUploadQueue = create<UploadQueueStore>()(
  persist(
    (set) => ({
      queue: [],
      
      addPost: (post) => set((state) => ({
        queue: [post, ...state.queue]
      })),
      
      updatePost: (id, updates) => set((state) => ({
        queue: state.queue.map((post) =>
          post.id === id ? { ...post, ...updates } : post
        )
      })),
      
      updateMedia: (postId, mediaId, updates) => set((state) => ({
        queue: state.queue.map((post) =>
          post.id === postId
            ? {
                ...post,
                media: post.media.map((m) =>
                  m.id === mediaId ? { ...m, ...updates } : m
                )
              }
            : post
        )
      })),
      
      removePost: (id) => set((state) => ({
        queue: state.queue.filter((post) => post.id !== id)
      })),
      
      clearCompleted: () => set((state) => ({
        queue: state.queue.filter((post) => post.status !== 'completed')
      })),
      
      clearOldCompleted: () => set((state) => {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        return {
          queue: state.queue.filter((post) => 
            post.status !== 'completed' || post.createdAt > oneHourAgo
          )
        };
      }),
    }),
    {
      name: 'upload-queue-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);
