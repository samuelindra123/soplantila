# Upload History System - COMPLETE ✅

## Sistem Upload History Seperti YouTube Studio

Sistem upload history yang professional dengan:
- ✅ History tersimpan di **database** (persistent)
- ✅ **Timestamp lengkap** (jam, tanggal, relative time)
- ✅ **Durasi processing** (berapa lama sampai selesai)
- ✅ **Preview media** (thumbnail image/video)
- ✅ **Status tracking** per media
- ✅ **Pagination** untuk performa
- ✅ **Per-user history** dengan ownership

---

## Yang Sudah Diimplementasikan

### Backend ✅

1. **Database Schema**
   - `upload_history` table
   - `upload_history_media` table
   - Auto-calculate duration (processingTimeMs, uploadTimeMs)
   - Status enums (PENDING, UPLOADING, PROCESSING, COMPLETED, FAILED)

2. **Service Layer**
   - `UploadHistoryService` dengan 7 methods
   - Auto-calculate processing time
   - Auto-calculate upload time per media
   - Pagination support
   - Auto-cleanup old data (>7 days)

3. **API Endpoints**
   - `GET /api/upload-history?page=1&limit=20` - List history
   - `GET /api/upload-history/:id` - Get single history
   - `DELETE /api/upload-history/:id` - Delete history
   - `DELETE /api/upload-history` - Clear old completed

### Frontend ✅

1. **API Client**
   - `upload-history-service.ts` dengan type-safe functions
   - Helper functions untuk formatting:
     - `formatTimestamp()` - "Apr 5, 2026 at 1:10 PM"
     - `formatDuration()` - "5.2s", "1m 23s", "2h 15m"
     - `formatFileSize()` - "2.0 MB", "15.3 MB"
     - `getRelativeTime()` - "just now", "2 minutes ago"

2. **Upload History Page**
   - `/uploads` page dengan data dari database
   - Real-time status display
   - Media thumbnails
   - Progress bars per media
   - Pagination (load more)
   - Delete individual history
   - Clear old completed button

---

## UI Features

### Page Header
```
┌─────────────────────────────────────────────┐
│ Upload History          [Clear old]         │
│ 3 uploads in history                        │
└─────────────────────────────────────────────┘
```

### History Item - Completed
```
┌─────────────────────────────────────────────┐
│ "Check this out!"                      [×]  │
│ ✅ Completed • 5.2s                         │
│ 2 minutes ago • Apr 5, 2026 at 1:10 PM     │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ [Thumbnail] photo.jpg      2.0 MB    │   │
│ │ ████████████████████████████ 100%    │   │
│ │ ✅ 2.7s                               │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ [Thumbnail] video.mp4     15.3 MB    │   │
│ │ ████████████████████████████ 100%    │   │
│ │ ✅ 4.1s                               │   │
│ └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### History Item - Uploading
```
┌─────────────────────────────────────────────┐
│ "Amazing video!"                            │
│ 🔵 Uploading media...                       │
│ just now • Apr 5, 2026 at 1:15 PM          │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ [Thumbnail] large.mp4     45.2 MB    │   │
│ │ ████████████░░░░░░░░░░░░░░░ 45%      │   │
│ │ 45%                          [⟳]     │   │
│ └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### History Item - Failed
```
┌─────────────────────────────────────────────┐
│ "Failed upload"                        [×]  │
│ ❌ Network error                            │
│ 5 minutes ago • Apr 5, 2026 at 1:05 PM     │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ [Thumbnail] huge.jpg      25.0 MB    │   │
│ │ ████████░░░░░░░░░░░░░░░░░░░ 35%      │   │
│ │ ❌ Failed                    [❌]     │   │
│ │ Upload failed: Network timeout        │   │
│ └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### History Item - Text Only
```
┌─────────────────────────────────────────────┐
│ "Hello world!"                         [×]  │
│ ✅ Completed • 0.3s                         │
│ 1 hour ago • Apr 5, 2026 at 12:15 PM       │
│ (No media)                                  │
└─────────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────────┐
│              🕐                             │
│                                             │
│        No upload history                    │
│                                             │
│   Your upload history will appear here.    │
│   Create posts with media to see them      │
│   tracked.                                  │
└─────────────────────────────────────────────┘
```

---

## Status Display

### History Status

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| PENDING | ⏳ | Gray | Waiting to start |
| UPLOADING | 🔵 | Blue | Uploading media |
| PROCESSING | 🔵 | Blue | Creating post |
| COMPLETED | ✅ | Green | Successfully posted |
| FAILED | ❌ | Red | Failed with error |

### Media Status

| Status | Icon | Color | Description |
|--------|------|-------|-------------|
| PENDING | ⏳ | Gray | Waiting to upload |
| UPLOADING | [Spinner] | Blue | Uploading (with progress) |
| COMPLETED | ✅ | Green | Upload complete |
| FAILED | ❌ | Red | Upload failed |

---

## Data Flow

### 1. User Creates Post with Media

```typescript
// Frontend: post-composer.tsx
const handleSubmit = async () => {
  // 1. Create upload history entry (TO DO)
  const history = await createUploadHistory({
    content: "Check this out!",
    mediaItems: [
      {
        mediaType: 'IMAGE',
        fileName: 'photo.jpg',
        fileSize: 2048576,
        mimeType: 'image/jpeg',
        thumbnailUrl: 'blob:...'
      }
    ]
  });

  // 2. Upload media with progress updates
  for (const media of mediaItems) {
    // Update status to UPLOADING
    await updateMediaItem(media.id, {
      status: 'UPLOADING',
      progress: 0
    });

    // Upload with progress callback
    await uploadMedia(media, (progress) => {
      updateMediaItem(media.id, { progress });
    });

    // Mark as completed
    await updateMediaItem(media.id, {
      status: 'COMPLETED',
      progress: 100,
      publicUrl: 'https://cdn.../photo.jpg'
    });
  }

  // 3. Create draft post
  await updateHistory(history.id, {
    status: 'PROCESSING'
  });

  const post = await createDraftPost({
    content: "Check this out!",
    uploadIds: [...]
  });

  // 4. Mark as completed
  await updateHistory(history.id, {
    status: 'COMPLETED',
    postId: post.id
  });
};
```

### 2. User Views Upload History

```typescript
// Frontend: /uploads page
const UploadsPage = () => {
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    // Fetch from database
    const loadHistory = async () => {
      const response = await getUploadHistory(1, 20);
      setHistory(response.data);
    };
    loadHistory();
  }, []);

  return (
    <div>
      {history.map(item => (
        <HistoryItem
          key={item.id}
          content={item.content}
          status={item.status}
          timestamp={formatTimestamp(item.startedAt)}
          duration={formatDuration(item.processingTimeMs)}
          mediaItems={item.mediaItems}
        />
      ))}
    </div>
  );
};
```

---

## Format Examples

### Timestamp
```typescript
formatTimestamp("2026-04-05T13:10:00.000Z")
// Output: "Apr 5, 2026 at 1:10 PM"
```

### Relative Time
```typescript
getRelativeTime("2026-04-05T13:10:00.000Z")
// Output (if now is 13:12): "2 minutes ago"
// Output (if now is 14:10): "1 hour ago"
// Output (if now is next day): "yesterday"
// Output (if now is 8 days later): "Apr 5, 2026 at 1:10 PM"
```

### Duration
```typescript
formatDuration(5234)    // "5.2s"
formatDuration(83000)   // "1m 23s"
formatDuration(7500000) // "2h 5m"
```

### File Size
```typescript
formatFileSize(2048576)    // "2.0 MB"
formatFileSize(15728640)   // "15.0 MB"
formatFileSize(1073741824) // "1.00 GB"
```

---

## API Response Examples

### Get Upload History

**Request**:
```
GET /api/upload-history?page=1&limit=20
Authorization: Bearer <token>
```

**Response**:
```json
{
  "message": "Upload history fetched successfully.",
  "data": [
    {
      "id": "cm123",
      "userId": "cm456",
      "postId": "cm789",
      "content": "Check this out!",
      "status": "COMPLETED",
      "errorMessage": null,
      "startedAt": "2026-04-05T13:10:00.000Z",
      "completedAt": "2026-04-05T13:10:05.234Z",
      "processingTimeMs": 5234,
      "totalMediaCount": 2,
      "completedMediaCount": 2,
      "createdAt": "2026-04-05T13:10:00.000Z",
      "updatedAt": "2026-04-05T13:10:05.234Z",
      "mediaItems": [
        {
          "id": "cm111",
          "historyId": "cm123",
          "mediaType": "IMAGE",
          "fileName": "photo.jpg",
          "fileSize": 2048576,
          "mimeType": "image/jpeg",
          "thumbnailUrl": "https://cdn.../thumb.jpg",
          "publicUrl": "https://cdn.../photo.jpg",
          "status": "COMPLETED",
          "progress": 100,
          "errorMessage": null,
          "startedAt": "2026-04-05T13:10:00.500Z",
          "completedAt": "2026-04-05T13:10:03.200Z",
          "uploadTimeMs": 2700,
          "sortOrder": 0,
          "createdAt": "2026-04-05T13:10:00.000Z",
          "updatedAt": "2026-04-05T13:10:03.200Z"
        },
        {
          "id": "cm222",
          "historyId": "cm123",
          "mediaType": "VIDEO",
          "fileName": "video.mp4",
          "fileSize": 15728640,
          "mimeType": "video/mp4",
          "thumbnailUrl": "https://cdn.../thumb.jpg",
          "publicUrl": "https://cdn.../video.mp4",
          "status": "COMPLETED",
          "progress": 100,
          "errorMessage": null,
          "startedAt": "2026-04-05T13:10:01.000Z",
          "completedAt": "2026-04-05T13:10:05.100Z",
          "uploadTimeMs": 4100,
          "sortOrder": 1,
          "createdAt": "2026-04-05T13:10:00.000Z",
          "updatedAt": "2026-04-05T13:10:05.100Z"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasMore": true
  }
}
```

---

## Benefits

### vs localStorage:

| Feature | localStorage | Database |
|---------|-------------|----------|
| **Persistence** | ❌ Hilang saat clear data | ✅ Permanent |
| **Cross-device** | ❌ Per device | ✅ Semua device |
| **Timestamp** | ❌ Client-side | ✅ Server-side |
| **Duration** | ❌ Tidak akurat | ✅ Presisi |
| **Thumbnails** | ❌ Hilang setelah refresh | ✅ Tersimpan di CDN |
| **Storage** | ❌ Limited (5-10MB) | ✅ Unlimited |
| **Query** | ❌ Tidak bisa | ✅ Pagination, filter |
| **Analytics** | ❌ Tidak bisa | ✅ Bisa analytics |

---

## Next Steps (Integration)

### 1. Update Post Composer

Integrate upload history creation saat user create post:

```typescript
// apps/client/src/features/feed/components/post-composer.tsx

const handleBackgroundSubmit = async (content, media) => {
  // 1. Create upload history entry
  const history = await createUploadHistory({
    content,
    mediaItems: media.map(m => ({
      mediaType: m.mediaType,
      fileName: m.file.name,
      fileSize: m.file.size,
      mimeType: m.file.type,
      thumbnailUrl: m.previewUrl
    }))
  });

  // 2. Update status to UPLOADING
  await updateUploadHistory(history.id, {
    status: 'UPLOADING'
  });

  // 3. Upload each media with progress
  for (const mediaItem of media) {
    const historyMedia = history.mediaItems.find(
      m => m.fileName === mediaItem.file.name
    );

    await updateMediaItem(historyMedia.id, {
      status: 'UPLOADING',
      progress: 0
    });

    // Upload with progress callback
    const result = await uploadSingleMedia(mediaItem, (progress) => {
      updateMediaItem(historyMedia.id, { progress });
    });

    await updateMediaItem(historyMedia.id, {
      status: 'COMPLETED',
      progress: 100,
      publicUrl: result.publicUrl
    });
  }

  // 4. Create draft post
  await updateUploadHistory(history.id, {
    status: 'PROCESSING'
  });

  const post = await createDraftPost({
    content,
    uploadIds: media.map(m => m.uploadRequest.uploadId)
  });

  // 5. Mark as completed
  await updateUploadHistory(history.id, {
    status: 'COMPLETED',
    postId: post.id
  });
};
```

### 2. Update Media Upload Processor

Track upload history di backend processor:

```typescript
// apps/server/src/modules/posts/processors/media-upload.processor.ts

@Process('process-media-upload')
async handleMediaUpload(job: Job<MediaUploadJobData>) {
  const { postId, userId, uploadIds, historyId } = job.data;

  // Update history status
  await this.uploadHistoryService.updateHistory(historyId, {
    status: UploadHistoryStatus.PROCESSING
  });

  try {
    // Process uploads...
    
    // Mark as completed
    await this.uploadHistoryService.updateHistory(historyId, {
      status: UploadHistoryStatus.COMPLETED,
      postId
    });
  } catch (error) {
    // Mark as failed
    await this.uploadHistoryService.updateHistory(historyId, {
      status: UploadHistoryStatus.FAILED,
      errorMessage: error.message
    });
  }
}
```

---

## Testing

### Test 1: View Empty History
1. Go to `/uploads`
2. Should see empty state with icon and message

### Test 2: Create Text Post
1. Create text-only post
2. Go to `/uploads`
3. Should see history with:
   - Content
   - ✅ Completed status
   - Duration (e.g., "0.3s")
   - Timestamp
   - "(No media)" text

### Test 3: Create Post with Image
1. Create post with 1 image
2. Go to `/uploads`
3. Should see history with:
   - Content
   - ✅ Completed status
   - Duration (e.g., "3.5s")
   - Timestamp
   - Media item with:
     - Thumbnail
     - Filename
     - File size
     - Progress bar (100%)
     - Upload duration

### Test 4: Pagination
1. Create 25+ posts
2. Go to `/uploads`
3. Should see 20 items
4. Click "Load more"
5. Should load next 5 items

### Test 5: Delete History
1. Go to `/uploads`
2. Click [×] on completed item
3. Item should disappear

### Test 6: Clear Old Completed
1. Go to `/uploads`
2. Click "Clear old" button
3. Old completed items (>7 days) should be removed

---

## Summary

✅ **Backend Complete**:
- Database schema with timestamps
- Service layer with auto-calculate duration
- API endpoints with pagination
- Auto-cleanup old data

✅ **Frontend Complete**:
- API client with type-safe functions
- Upload history page with beautiful UI
- Format helpers (timestamp, duration, file size)
- Pagination support
- Delete functionality

⏳ **Integration Needed**:
- Connect post-composer to create history entries
- Update media upload processor to track history
- Add progress updates during upload

**Files Created**:
1. `apps/server/prisma/schema.prisma` (updated)
2. `apps/server/src/modules/posts/upload-history.service.ts`
3. `apps/server/src/modules/posts/upload-history.controller.ts`
4. `apps/client/src/features/feed/services/upload-history-service.ts`
5. `apps/client/src/app/(social)/uploads/page.tsx` (updated)

**Status**: Backend & Frontend UI COMPLETE! Integration next! 🚀

