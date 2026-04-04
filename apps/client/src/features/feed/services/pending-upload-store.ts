import type {
  CompletedUploadPart,
  UploadRequestResponse,
} from './upload-service';
import type { CreatePostMedia } from './feed-service';

const DB_NAME = 'soplantila-feed';
const DB_VERSION = 1;
const STORE_NAME = 'composer-media';
const DRAFT_KEY = 'feed-composer-draft';

export type StoredComposerMedia = {
  id: string;
  file: File;
  mediaType: 'image' | 'video';
  uploadProgress: number;
  uploading: boolean;
  error?: string;
  confirmed?: CreatePostMedia;
  uploadRequest?: UploadRequestResponse;
  completedParts?: CompletedUploadPart[];
};

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function replaceStoredComposerMedia(items: StoredComposerMedia[]): Promise<void> {
  if (typeof window === 'undefined') return;
  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadStoredComposerMedia(): Promise<StoredComposerMedia[]> {
  if (typeof window === 'undefined') return [];
  const db = await openDatabase();

  return new Promise<StoredComposerMedia[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as StoredComposerMedia[]);
    request.onerror = () => reject(request.error);
  });
}

export async function clearStoredComposerMedia(): Promise<void> {
  await replaceStoredComposerMedia([]);
}

export function saveDraftContent(value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DRAFT_KEY, value);
}

export function loadDraftContent(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(DRAFT_KEY) ?? '';
}

export function clearDraftContent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_KEY);
}
