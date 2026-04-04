'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import {
  validateFile,
  requestUpload,
  uploadToSpaces,
  uploadMultipartToSpaces,
  confirmUpload,
  compressImage,
  getImageDimensions,
  getVideoDimensions,
  createVideoPoster,
  type CompletedUploadPart,
  type UploadRequestResponse,
} from '../services/upload-service';
import { createPost, CreatePostMedia, Post } from '../services/feed-service';
import {
  clearDraftContent,
  clearStoredComposerMedia,
  loadDraftContent,
  loadStoredComposerMedia,
  replaceStoredComposerMedia,
  saveDraftContent,
  type StoredComposerMedia,
} from '../services/pending-upload-store';
import { XIcon, CameraIcon } from '@/components/ui/icons';

interface PostComposerProps {
  onPostCreated?: (post?: Post) => void;
  onPostQueued?: (post: Post) => void;
  onPostSettled?: (temporaryId: string, post?: Post) => void;
}

interface MediaPreview {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: 'image' | 'video';
  uploading: boolean;
  uploadProgress: number;
  confirmed?: CreatePostMedia;
  error?: string;
  uploadRequest?: UploadRequestResponse;
  completedParts?: CompletedUploadPart[];
}

export default function PostComposer({
  onPostCreated,
  onPostQueued,
  onPostSettled,
}: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRef = useRef<MediaPreview[]>([]);
  const uploadTasksRef = useRef<Record<string, Promise<CreatePostMedia | null>>>({});
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  const userAvatar = user?.profile?.fotoProfilUrl;
  const userInitials = user
    ? `${user.profile?.firstName?.[0] || ''}${user.profile?.lastName?.[0] || ''}`.toUpperCase() ||
      user.email?.[0]?.toUpperCase()
    : '?';

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  useEffect(() => {
    return () => {
      mediaRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const updateMediaItem = useCallback(
    (id: string, updater: (item: MediaPreview) => MediaPreview) => {
      setMedia((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
    },
    []
  );

  const persistMediaSnapshot = useCallback(async (items: MediaPreview[]) => {
    const itemsToPersist: StoredComposerMedia[] = items.map((item) => ({
      id: item.id,
      file: item.file,
      mediaType: item.mediaType,
      uploadProgress: item.uploadProgress,
      uploading: item.uploading,
      error: item.error,
      confirmed: item.confirmed,
      uploadRequest: item.uploadRequest,
      completedParts: item.completedParts,
    }));

    try {
      await replaceStoredComposerMedia(itemsToPersist);
    } catch (persistError) {
      console.error('Failed to persist composer media', persistError);
    }
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const uploadSingleMedia = useCallback(
    async (item: MediaPreview): Promise<CreatePostMedia | null> => {
      try {
        updateMediaItem(item.id, (current) => ({
          ...current,
          uploading: true,
          uploadProgress: 0,
          error: undefined,
        }));

        let fileToUpload = item.file;
        if (item.mediaType === 'image' && item.file.type !== 'image/gif') {
          fileToUpload = await compressImage(item.file);
        }

        const existingUploadRequest =
          item.uploadRequest && new Date(item.uploadRequest.expiresAt).getTime() > Date.now()
            ? item.uploadRequest
            : undefined;
        const uploadRequest =
          existingUploadRequest ??
          (await requestUpload({
            filename: fileToUpload.name,
            mimeType: fileToUpload.type,
            size: fileToUpload.size,
            mediaType: item.mediaType,
          }));

        updateMediaItem(item.id, (current) => ({
          ...current,
          uploadRequest,
        }));

        const abortController = new AbortController();
        abortControllersRef.current[item.id] = abortController;

        let completedParts:
          | Array<{
              partNumber: number;
              eTag: string;
            }>
          | undefined;

        if (uploadRequest.uploadStrategy === 'multipart') {
          completedParts = await uploadMultipartToSpaces(
            uploadRequest.partUrls ?? [],
            fileToUpload,
            uploadRequest.partSize ?? 6 * 1024 * 1024,
            (progress) => {
              updateMediaItem(item.id, (current) => ({
                ...current,
                uploadProgress: progress,
              }));
            },
            abortController.signal,
            item.completedParts ?? [],
            (parts) => {
              updateMediaItem(item.id, (current) => ({
                ...current,
                completedParts: parts,
              }));
            }
          );
        } else {
          await uploadToSpaces(uploadRequest.presignedUrl, fileToUpload, (progress) => {
            updateMediaItem(item.id, (current) => ({
              ...current,
              uploadProgress: progress,
            }));
          }, abortController.signal);
        }

        const confirmed = await confirmUpload(uploadRequest.uploadId, completedParts);

        let width: number | undefined;
        let height: number | undefined;
        let duration: number | undefined;

        if (item.mediaType === 'image') {
          const dimensions = await getImageDimensions(item.file);
          width = dimensions.width;
          height = dimensions.height;
        } else {
          const dimensions = await getVideoDimensions(item.file);
          width = dimensions.width;
          height = dimensions.height;
          duration = dimensions.duration;
        }

        let previewImageUrl: string | undefined;
        if (item.mediaType === 'video') {
          const poster = await createVideoPoster(item.file);
          const posterUpload = await requestUpload({
            filename: poster.file.name,
            mimeType: poster.file.type,
            size: poster.file.size,
            mediaType: 'image',
          });

          await uploadToSpaces(
            posterUpload.presignedUrl,
            poster.file,
            undefined,
            abortController.signal
          );
          const confirmedPoster = await confirmUpload(posterUpload.uploadId);
          previewImageUrl = confirmedPoster.publicUrl;
        }

        const result: CreatePostMedia = {
          mediaType: item.mediaType,
          storageKey: confirmed.storageKey,
          publicUrl: confirmed.publicUrl,
          previewImageUrl,
          mimeType: confirmed.mimeType,
          fileSize: confirmed.fileSize,
          originalName: confirmed.originalName,
          width,
          height,
          duration,
        };

        updateMediaItem(item.id, (current) => ({
          ...current,
          uploading: false,
          uploadProgress: 100,
          confirmed: result,
          completedParts,
          uploadRequest,
        }));
        delete abortControllersRef.current[item.id];

        return result;
      } catch (err) {
        delete abortControllersRef.current[item.id];
        if (err instanceof DOMException && err.name === 'AbortError') {
          return null;
        }
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        updateMediaItem(item.id, (current) => ({
          ...current,
          uploading: false,
          error: errorMessage,
        }));
        return null;
      }
    },
    [updateMediaItem]
  );

  const startUpload = useCallback(
    (item: MediaPreview) => {
      if (item.confirmed) {
        return Promise.resolve(item.confirmed);
      }

      const existingTask = uploadTasksRef.current[item.id];
      if (existingTask) {
        return existingTask;
      }

      const task = uploadSingleMedia(item).finally(() => {
        delete uploadTasksRef.current[item.id];
      });

      uploadTasksRef.current[item.id] = task;
      return task;
    },
    [uploadSingleMedia]
  );

  useEffect(() => {
    let isMounted = true;

    const restoreDraft = async () => {
      const storedContent = loadDraftContent();
      setContent(storedContent);

      try {
        const storedItems = await loadStoredComposerMedia();
        if (!isMounted) {
          return;
        }

        const hasStoredDraft = storedItems.length > 0 || storedContent.trim().length > 0;
        setRestoredDraft(hasStoredDraft);

        if (storedItems.length === 0) {
          return;
        }

        const restoredItems: MediaPreview[] = storedItems.map((item) => ({
          ...item,
          previewUrl: URL.createObjectURL(item.file),
        }));

        setMedia(restoredItems);

        restoredItems.forEach((item) => {
          if (!item.confirmed) {
            void startUpload(item);
          }
        });
      } catch (restoreError) {
        console.error('Failed to restore composer draft', restoreError);
      }
    };

    void restoreDraft();

    return () => {
      isMounted = false;
    };
  }, [startUpload]);

  useEffect(() => {
    saveDraftContent(content);
  }, [content]);

  useEffect(() => {
    void persistMediaSnapshot(media);
  }, [media, persistMediaSnapshot]);

  useEffect(() => {
    const persistDraftState = () => {
      saveDraftContent(content);
      void persistMediaSnapshot(mediaRef.current);
    };

    window.addEventListener('pagehide', persistDraftState);
    document.addEventListener('visibilitychange', persistDraftState);

    return () => {
      window.removeEventListener('pagehide', persistDraftState);
      document.removeEventListener('visibilitychange', persistDraftState);
    };
  }, [content, persistMediaSnapshot]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remainingSlots = 4 - mediaRef.current.length;
      if (remainingSlots <= 0) {
        setError('Maximum 4 media files allowed per post.');
        return;
      }

      const newFiles = Array.from(files).slice(0, remainingSlots);
      const newMedia: MediaPreview[] = [];

      for (const file of newFiles) {
        const validation = validateFile(file);
        if (!validation.valid) {
          setError(validation.error || 'Invalid file');
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        newMedia.push({
          id: crypto.randomUUID(),
          file,
          previewUrl,
          mediaType: validation.mediaType!,
          uploading: true,
          uploadProgress: 0,
        });
      }

      if (newMedia.length > 0) {
        const nextMedia = [...mediaRef.current, ...newMedia];
        setMedia(nextMedia);
        setError(null);
        setRestoredDraft(false);
        void persistMediaSnapshot(nextMedia);
        newMedia.forEach((item) => {
          void startUpload(item);
        });
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [startUpload]
  );

  const removeMedia = useCallback((id: string) => {
    abortControllersRef.current[id]?.abort();
    delete abortControllersRef.current[id];
    setMedia((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      delete uploadTasksRef.current[id];
      const nextMedia = prev.filter((entry) => entry.id !== id);
      void persistMediaSnapshot(nextMedia);
      return nextMedia;
    });
  }, [persistMediaSnapshot]);

  const handleSubmit = async () => {
    console.log('[PostComposer] handleSubmit called:', { 
      contentLength: content.trim().length, 
      mediaCount: mediaRef.current.length
    });
    
    if (!content.trim() && mediaRef.current.length === 0) {
      setError('Please write something or add media.');
      return;
    }

    const draftContent = content.trim();
    const draftMedia = [...mediaRef.current];
    
    // Clear composer immediately
    setContent('');
    setMedia([]);
    mediaRef.current = [];
    setRestoredDraft(false);
    clearDraftContent();
    void clearStoredComposerMedia();
    setError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Start background upload and post creation
    void handleBackgroundSubmit(draftContent, draftMedia);
  };

  const handleBackgroundSubmit = async (draftContent: string, draftMedia: MediaPreview[]) => {
    const { useUploadQueue } = await import('../services/upload-queue-store');
    const { addPost, updatePost, updateMedia } = useUploadQueue.getState();
    
    const postId = `post-${crypto.randomUUID()}`;
    
    // Add to upload queue with timestamp
    const queueItem = {
      id: postId,
      content: draftContent,
      media: draftMedia.map((m) => ({
        id: m.id,
        postId,
        file: m.file,
        mediaType: m.mediaType,
        previewUrl: m.previewUrl,
        status: m.confirmed ? ('completed' as const) : ('pending' as const),
        progress: m.confirmed ? 100 : 0,
        confirmed: m.confirmed,
      })),
      status: 'uploading' as const,
      createdAt: Date.now(),
    };
    
    addPost(queueItem);
    
    // Show warning if user tries to leave
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Upload is in progress. Are you sure you want to leave?';
      return e.returnValue;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    try {
      // Upload media if needed
      const confirmedMedia: CreatePostMedia[] = [];
      
      for (const mediaItem of draftMedia) {
        if (mediaItem.confirmed) {
          confirmedMedia.push(mediaItem.confirmed);
          continue;
        }
        
        try {
          updateMedia(postId, mediaItem.id, { status: 'uploading', progress: 0 });
          
          // Upload media
          const result = await uploadSingleMedia(mediaItem);
          
          if (result) {
            confirmedMedia.push(result);
            updateMedia(postId, mediaItem.id, { 
              status: 'completed', 
              progress: 100,
              confirmed: result 
            });
          } else {
            updateMedia(postId, mediaItem.id, { 
              status: 'failed', 
              error: 'Upload failed' 
            });
          }
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Upload failed';
          updateMedia(postId, mediaItem.id, { 
            status: 'failed', 
            error: errorMsg 
          });
        }
      }
      
      // Create post
      updatePost(postId, { status: 'creating' });
      
      const createdPost = await createPost({
        content: draftContent,
        media: confirmedMedia.length > 0 ? confirmedMedia : undefined,
      });
      
      console.log('[PostComposer] Post created successfully:', { 
        postId: createdPost.id
      });
      
      // Mark as completed
      updatePost(postId, { 
        status: 'completed',
        createdPostId: createdPost.id 
      });
      
      // Notify feed to refresh
      onPostCreated?.(createdPost);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        const { removePost } = useUploadQueue.getState();
        removePost(postId);
      }, 3000);
      
    } catch (err) {
      console.error('[PostComposer] Background submit error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      updatePost(postId, { 
        status: 'failed',
        error: errorMessage 
      });
    } finally {
      // Remove beforeunload listener
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Cleanup
      draftMedia.forEach((item) => {
        delete uploadTasksRef.current[item.id];
        delete abortControllersRef.current[item.id];
        URL.revokeObjectURL(item.previewUrl);
      });
    }
  };

  const canSubmit = (content.trim() || media.length > 0) && !isSubmitting;

  return (
    <article className="bg-surface border border-border-soft rounded-[2.5rem] overflow-hidden glass-strong transition-all duration-500 hover:border-accent/20">
      <div className="p-6 pb-4">
        <div className="flex gap-4">
          <div className="h-12 w-12 shrink-0 rounded-[1.25rem] bg-surface-dark overflow-hidden border border-border-soft/50 shadow-sm">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="Your profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-accent/10 text-[13px] font-bold text-accent">
                {userInitials}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextChange}
              placeholder="What's on your mind?"
              className="w-full resize-none border-none bg-transparent text-foreground/95 placeholder:text-muted/60 focus:placeholder:text-muted/40 focus:outline-none text-[15px] leading-relaxed min-h-[44px] font-normal"
              rows={1}
              disabled={isSubmitting}
            />

            {restoredDraft && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-accent/20 bg-accent/8 px-3 py-1 text-[11px] font-semibold text-accent">
                  Draft restored. Pending uploads will resume automatically.
                </div>
              </div>
            )}

            {media.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {media.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative rounded-[1.5rem] overflow-hidden bg-surface-dark border border-border-soft/50 group/media"
                  >
                    {item.mediaType === 'image' ? (
                      <img
                        src={item.previewUrl}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <video
                        src={item.previewUrl}
                        className="w-full h-32 object-cover"
                        controls={false}
                        muted
                        playsInline
                      />
                    )}

                    {item.confirmed && !item.uploading && !item.error && (
                      <div className="absolute left-3 top-3 rounded-full bg-success/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm">
                        Ready
                      </div>
                    )}

                    {item.error && (
                      <div className="absolute inset-0 bg-danger/20 backdrop-blur-sm flex items-center justify-center p-3">
                        <span className="text-danger text-[11px] text-center font-medium">
                          {item.error}
                        </span>
                      </div>
                    )}

                    {!isSubmitting && (
                      <button
                        type="button"
                        onClick={() => removeMedia(item.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted hover:text-foreground hover:bg-background transition-all active:scale-95"
                        aria-label="Remove media"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}

                    {item.mediaType === 'video' && !item.uploading && (
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-[11px] font-bold text-foreground tracking-wide">
                        VIDEO
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-3 px-4 py-2.5 rounded-xl bg-danger/10 border border-danger/20">
                <p className="text-[13px] text-danger font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-border-soft/30 flex items-center justify-between bg-surface-dark/30 gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            disabled={isSubmitting || media.length >= 4}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting || media.length >= 4}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full text-muted hover:text-accent hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 group/btn"
          >
            <CameraIcon className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
            <span className="text-[13px] font-bold tracking-tight hidden sm:inline">
              Photo/Video
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-6 py-2.5 rounded-full text-[13px] font-bold tracking-wider text-white bg-accent hover:bg-accent-strong disabled:bg-muted/30 disabled:text-muted disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm hover:shadow-md"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Posting...
              </span>
            ) : (
              'Post'
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
