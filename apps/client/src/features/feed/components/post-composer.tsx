'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { createInstantPost, Post, InstantPostMedia } from '../services/feed-service';
import { XIcon, CameraIcon } from '@/components/ui/icons';

interface PostComposerProps {
  onPostCreated?: (post?: Post) => void;
}

interface MediaPreview {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: 'image' | 'video';
  posterFile?: File; // Generated poster for videos
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

function validateFile(file: File): { valid: boolean; mediaType?: 'image' | 'video'; error?: string } {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'File type not supported. Use JPEG, PNG, WEBP, GIF, MP4, or WebM.',
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Image must be smaller than 10MB.' };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: 'Video must be smaller than 100MB.' };
  }

  return { valid: true, mediaType: isImage ? 'image' : 'video' };
}

/**
 * Generate video poster/thumbnail dari frame video
 * Dijalankan di frontend untuk instant preview
 */
async function generateVideoPoster(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
    };

    video.onloadedmetadata = () => {
      // Seek to 1 second or 10% of duration, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        cleanup();
        resolve(null);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          cleanup();
          if (!blob) {
            resolve(null);
            return;
          }
          const posterFile = new File(
            [blob],
            `${file.name.replace(/\.[^.]+$/, '')}-poster.jpg`,
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          resolve(posterFile);
        },
        'image/jpeg',
        0.85
      );
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * PostComposer dengan sistem INSTANT UPLOAD + VIDEO POSTER
 * 
 * Flow:
 * 1. User pilih media → preview langsung tampil
 * 2. Untuk video → auto-generate poster thumbnail
 * 3. User klik Post → upload media + poster ke server
 * 4. Progress bar muncul saat upload
 * 5. Setelah selesai → post langsung muncul di feed dengan thumbnail!
 */
export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const userAvatar = user?.profile?.fotoProfilUrl;
  const userInitials = user
    ? `${user.profile?.firstName?.[0] || ''}${user.profile?.lastName?.[0] || ''}`.toUpperCase() ||
      user.email?.[0]?.toUpperCase()
    : '?';

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      media.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 4 - media.length;
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

      const mediaItem: MediaPreview = {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        mediaType: validation.mediaType!,
      };

      // Generate poster untuk video
      if (validation.mediaType === 'video') {
        const poster = await generateVideoPoster(file);
        if (poster) {
          mediaItem.posterFile = poster;
        }
      }

      newMedia.push(mediaItem);
    }

    if (newMedia.length > 0) {
      setMedia((prev) => [...prev, ...newMedia]);
      setError(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [media.length]);

  const removeMedia = useCallback((id: string) => {
    setMedia((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((entry) => entry.id !== id);
    });
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) {
      setError('Please write something or add media.');
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Prepare media items with poster files
      const mediaItems: InstantPostMedia[] = media.map((m) => ({
        file: m.file,
        posterFile: m.posterFile,
      }));
      
      // Upload semua media (termasuk text-only) via instant endpoint
      await createInstantPost(content.trim(), mediaItems, (percent) => {
        setUploadProgress(percent);
      });

      // Clear form
      setContent('');
      media.forEach((m) => URL.revokeObjectURL(m.previewUrl));
      setMedia([]);
      setUploadProgress(0);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Notify parent to refresh feed
      onPostCreated?.();
    } catch (err) {
      console.error('[PostComposer] Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
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

            {/* Media Preview Grid */}
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

                    {/* Remove button */}
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

                    {/* Video badge */}
                    {item.mediaType === 'video' && (
                      <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-[11px] font-bold text-foreground tracking-wide">
                        VIDEO
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Progress */}
            {isSubmitting && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-muted font-medium">Uploading...</span>
                  <span className="text-[13px] text-accent font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-surface-dark rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full transition-all duration-200 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-3 px-4 py-2.5 rounded-xl bg-danger/10 border border-danger/20">
                <p className="text-[13px] text-danger font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
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
                {uploadProgress > 0 ? `${uploadProgress}%` : 'Posting...'}
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
