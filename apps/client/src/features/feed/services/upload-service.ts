import { apiClient } from '@/lib/api-client';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export interface UploadRequestPayload {
  filename: string;
  mimeType: string;
  size: number;
  mediaType: 'image' | 'video';
}

export interface UploadRequestResponse {
  uploadId: string;
  uploadStrategy: 'single' | 'multipart';
  presignedUrl: string;
  partUrls?: Array<{
    partNumber: number;
    presignedUrl: string;
  }>;
  partSize?: number;
  tempKey: string;
  expiresAt: string;
}

export interface UploadConfirmResponse {
  mediaType: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  fileSize: number;
  originalName: string;
}

export interface CompletedUploadPart {
  partNumber: number;
  eTag: string;
}

export async function createVideoPoster(
  file: File,
  seekToSeconds = 0.1
): Promise<{ file: File; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(video.src);
    };

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? Math.max(0, video.duration) : 0;
      video.currentTime = Math.min(seekToSeconds, duration > 0 ? duration / 2 : seekToSeconds);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        cleanup();
        reject(new Error('Failed to get canvas context for video poster.'));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            cleanup();
            reject(new Error('Failed to generate video poster.'));
            return;
          }

          cleanup();
          resolve({
            file: new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-poster.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }),
            width: canvas.width,
            height: canvas.height,
          });
        },
        'image/jpeg',
        0.82
      );
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video for poster generation.'));
    };

    video.src = URL.createObjectURL(file);
  });
}

export function validateFile(file: File): {
  valid: boolean;
  mediaType?: 'image' | 'video';
  error?: string;
} {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: 'File type not supported. Use JPEG, PNG, WEBP, GIF, MP4, or WebM.',
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: 'Image must be smaller than 10MB.',
    };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: 'Video must be smaller than 100MB.',
    };
  }

  return {
    valid: true,
    mediaType: isImage ? 'image' : 'video',
  };
}

export async function requestUpload(
  payload: UploadRequestPayload
): Promise<UploadRequestResponse> {
  const response = await apiClient.post<UploadRequestResponse>(
    '/uploads/request',
    payload
  );
  return response;
}

export async function confirmUpload(
  uploadId: string,
  completedParts?: CompletedUploadPart[]
): Promise<UploadConfirmResponse> {
  const response = await apiClient.post<UploadConfirmResponse>(
    '/uploads/confirm',
    { uploadId, completedParts }
  );
  return response;
}

export async function uploadToSpaces(
  presignedUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', presignedUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    const abortUpload = () => {
      xhr.abort();
      reject(new DOMException('Upload aborted', 'AbortError'));
    };

    if (signal) {
      if (signal.aborted) {
        abortUpload();
        return;
      }
      signal.addEventListener('abort', abortUpload, { once: true });
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Upload failed due to network error'));
    };

    xhr.onabort = () => {
      reject(new DOMException('Upload aborted', 'AbortError'));
    };

    xhr.send(file);
  });
}

export async function uploadMultipartToSpaces(
  parts: Array<{ partNumber: number; presignedUrl: string }>,
  file: File,
  partSize: number,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
  initialCompletedParts: CompletedUploadPart[] = [],
  onCompletedPart?: (parts: CompletedUploadPart[]) => void
): Promise<CompletedUploadPart[]> {
  const totalBytes = file.size;
  const loadedByPart = new Map<number, number>();
  const results: CompletedUploadPart[] = [...initialCompletedParts];
  const concurrency = 3;
  const uploadedPartNumbers = new Set(initialCompletedParts.map((part) => part.partNumber));
  let cursor = 0;

  for (const completedPart of initialCompletedParts) {
    const start = (completedPart.partNumber - 1) * partSize;
    const end = Math.min(start + partSize, totalBytes);
    loadedByPart.set(completedPart.partNumber, end - start);
  }

  const updateOverallProgress = () => {
    if (!onProgress) return;
    const uploaded = Array.from(loadedByPart.values()).reduce((sum, value) => sum + value, 0);
    onProgress(Math.min(100, Math.round((uploaded / totalBytes) * 100)));
  };
  updateOverallProgress();

  const uploadPart = async (part: { partNumber: number; presignedUrl: string }) => {
    const start = (part.partNumber - 1) * partSize;
    const end = Math.min(start + partSize, totalBytes);
    const blob = file.slice(start, end);

    let attempts = 0;
    while (attempts < 3) {
      attempts += 1;
      try {
        const completedPart = await new Promise<CompletedUploadPart>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', part.presignedUrl, true);

          const abortUpload = () => {
            xhr.abort();
            reject(new DOMException('Upload aborted', 'AbortError'));
          };

          if (signal) {
            if (signal.aborted) {
              abortUpload();
              return;
            }
            signal.addEventListener('abort', abortUpload, { once: true });
          }

          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            loadedByPart.set(part.partNumber, event.loaded);
            updateOverallProgress();
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              loadedByPart.set(part.partNumber, blob.size);
              updateOverallProgress();
              const eTag = xhr.getResponseHeader('ETag')?.replaceAll('"', '');
              if (!eTag) {
                reject(new Error('Multipart upload failed to return ETag.'));
                return;
              }
              resolve({
                partNumber: part.partNumber,
                eTag,
              });
            } else {
              reject(new Error(`Multipart upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Multipart upload failed due to network error'));
          xhr.onabort = () => reject(new DOMException('Upload aborted', 'AbortError'));
          xhr.send(blob);
        });

        return completedPart;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error;
        }
        if (attempts >= 3) {
          throw error;
        }
      }
    }

    throw new Error('Multipart upload failed.');
  };

  const runWorker = async () => {
    while (cursor < parts.length) {
      const current = parts[cursor];
      cursor += 1;
      if (uploadedPartNumbers.has(current.partNumber)) {
        continue;
      }
      const result = await uploadPart(current);
      results.push(result);
      uploadedPartNumbers.add(result.partNumber);
      onCompletedPart?.([...results].sort((left, right) => left.partNumber - right.partNumber));
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, parts.length) }, () => runWorker())
  );

  return results.sort((left, right) => left.partNumber - right.partNumber);
}

export async function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.85
): Promise<File> {
  // If file is GIF, don't compress (preserve animation)
  if (file.type === 'image/gif') {
    return file;
  }

  // Skip compression for already-small images to avoid unnecessary client delay.
  if (file.size <= 2 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas and draw
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}

export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to get image dimensions'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function getVideoDimensions(
  file: File
): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Math.round(video.duration),
      });
      URL.revokeObjectURL(video.src);
    };
    video.onerror = () => {
      reject(new Error('Failed to get video dimensions'));
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  });
}
