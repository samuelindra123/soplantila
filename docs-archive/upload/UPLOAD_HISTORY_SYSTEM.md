# Upload History System - YouTube Studio Style ✅

## Overview

Sistem upload history yang professional seperti YouTube Studio dengan:
- ✅ History tersimpan di **database** (bukan localStorage)
- ✅ **Timestamp lengkap** (jam, tanggal, durasi processing)
- ✅ **Preview media** (thumbnail image/video)
- ✅ **Status tracking** yang detail per media
- ✅ **Per-user history** dengan pagination

---

## Database Schema

### UploadHistory Table

Menyimpan history setiap post creation attempt.

```prisma
model UploadHistory {
  id                  String              @id @default(cuid())
  userId              String              // Owner
  postId              String?             // Null if failed
  content             String              // Post content
  status              UploadHistoryStatus // PENDING, UPLOADING, PROCESSING, COMPLETED, FAILED
  errorMessage        String?             // Error details if failed
  
  // Timestamps
  startedAt           DateTime            // When upload started
  completedAt         DateTime?           // When finished (success/fail)
  processingTimeMs    Int?                // Total duration in milliseconds
  
  // Media tracking
  totalMediaCount     Int                 // Total media files
  completedMediaCount Int                 // Successfully uploaded
  
  createdAt           DateTime
  updatedAt           DateTime
  
  user                User
  mediaItems          UploadHistoryMedia[]
}
```

**Status Flow**:
```
PENDING → UPLOADING → PROCESSING → COMPLETED
                                 ↘ FAILED
```

---

### UploadHistoryMedia Table

Menyimpan detail setiap media file dalam upload.

```prisma
model UploadHistoryMedia {
  id              String            @id @default(cuid())
  historyId       String            // Parent history
  mediaType       MediaType         // IMAGE or VIDEO
  fileName        String            // Original filename
  fileSize        Int               // Size in bytes
  mimeType        String            // e.g., image/jpeg
  
  // Preview/thumbnail
  thumbnailUrl    String?           // Thumbnail URL
  publicUrl       String?           // Final public URL
  
  // Status
  status          MediaUploadStatus // PENDING, UPLOADING, COMPLETED, FAILED
  progress        Int               // 0-100
  errorMessage    String?           // Error details
  
  // Timestamps
  startedAt       DateTime          // When upload started
  completedAt     DateTime?         // When finished
  uploadTimeMs    Int?              // Upload duration in milliseconds
  
  sortOrder       Int               // Display order
  createdAt       DateTime
  updatedAt       DateTime
  
  history         UploadHistory
}
```

**Status Flow**:
```
PENDING → UPLOADING → COMPLETED
                    ↘ FAILED
```

---

## Backend API

### UploadHistoryService

**Methods**:

1. **createHistory(dto)**
   - Create new upload history entry
   - Auto-create media items
   - Returns history with media items

2. **updateHistory(historyId, dto)**
   - Update history status
   - Auto-calculate processing time
   - Set completedAt timestamp

3. **updateMediaItem(mediaItemId, dto)**
   - Update media item status/progress
   - Auto-calculate upload time
   - Set completedAt timestamp

4. **getUserHistory(userId, page, limit)**
   - Get user's upload history with pagination
   - Includes all media items
   - Ordered by createdAt DESC

5. **getHistory(historyId)**
   - Get single history entry
   - Includes all media items

6. **deleteHistory(historyId, userId)**
   - Delete history entry
   - Verify ownership
   - Cascade delete media items

7. **clearOldCompleted(userId)**
   - Delete completed uploads older than 7 days
   - Keep recent history

---

### API Endpoints

**Base URL**: `/api/upload-history`

#### 1. Get Upload History
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
      "id": "cm...",
      "userId": "cm...",
      "postId": "cm...",
      "content": "Check this out!",
      "status": "COMPLETED",
      "errorMessage": null,
      "startedAt": "2026-04-05T06:10:00.000Z",
      "completedAt": "2026-04-05T06:10:05.234Z",
      "processingTimeMs": 5234,
      "totalMediaCount": 2,
      "completedMediaCount": 2,
      "createdAt": "2026-04-05T06:10:00.000Z",
      "updatedAt": "2026-04-05T06:10:05.234Z",
      "mediaItems": [
        {
          "id": "cm...",
          "historyId": "cm...",
          "mediaType": "IMAGE",
          "fileName": "photo.jpg",
          "fileSize": 2048576,
          "mimeType": "image/jpeg",
          "thumbnailUrl": "https://cdn.../thumb.jpg",
          "publicUrl": "https://cdn.../photo.jpg",
          "status": "COMPLETED",
          "progress": 100,
          "errorMessage": null,
          "startedAt": "2026-04-05T06:10:00.500Z",
          "completedAt": "2026-04-05T06:10:03.200Z",
          "uploadTimeMs": 2700,
          "sortOrder": 0,
          "createdAt": "2026-04-05T06:10:00.000Z",
          "updatedAt": "2026-04-05T06:10:03.200Z"
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

#### 2. Get Single History
```
GET /api/upload-history/:id
Authorization: Bearer <token>
```

#### 3. Delete History
```
DELETE /api/upload-history/:id
Authorization: Bearer <token>
```

#### 4. Clear Old Completed
```
DELETE /api/upload-history
Authorization: Bearer <token>
```

**Response**:
```json
{
  "message": "Cleared 12 old completed uploads.",
  "data": {
    "deletedCount": 12
  }
}
```

---

## Integration Flow

### 1. Create Post with Media

**Frontend** → **Backend**:
```typescript
// 1. Create upload history entry
const history = await uploadHistoryService.createHistory({
  userId: user.id,
  content: "Check this out!",
  mediaItems: [
    {
      mediaType: 'IMAGE',
      fileName: 'photo.jpg',
      fileSize: 2048576,
      mimeType: 'image/jpeg',
      thumbnailUrl: 'blob:...' // Local preview
    }
  ]
});

// 2. Update status to UPLOADING
await uploadHistoryService.updateHistory(history.id, {
  status: 'UPLOADING'
});

// 3. Upload each media and update progress
for (const mediaItem of history.mediaItems) {
  await uploadHistoryService.updateMediaItem(mediaItem.id, {
    status: 'UPLOADING',
    progress: 0
  });
  
  // ... upload with progress updates ...
  
  await uploadHistoryService.updateMediaItem(mediaItem.id, {
    status: 'COMPLETED',
    progress: 100,
    publicUrl: 'https://cdn.../photo.jpg'
  });
}

// 4. Create draft post
await uploadHistoryService.updateHistory(history.id, {
  status: 'PROCESSING'
});

const post = await postsService.createDraftPost(...);

// 5. Mark as completed
await uploadHistoryService.updateHistory(history.id, {
  status: 'COMPLETED',
  postId: post.id
});
```

---

## Frontend Implementation

### Upload History Page

**Route**: `/uploads`

**Features**:
1. ✅ List all upload history (from database)
2. ✅ Show timestamp (jam, tanggal)
3. ✅ Show duration (berapa lama processing)
4. ✅ Show media thumbnails
5. ✅ Show progress per media
6. ✅ Show status (pending, uploading, completed, failed)
7. ✅ Pagination
8. ✅ Delete individual history
9. ✅ Clear old completed

**UI Design** (YouTube Studio Style):

```
┌─────────────────────────────────────────────────────────┐
│  Upload History                    [Clear old completed] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ "Check this out!"                             [×]  │ │
│  │ ✅ Completed • 5.2s                                │ │
│  │ Apr 5, 2026 at 1:10 PM                            │ │
│  │                                                    │ │
│  │ ┌──────────┐ ┌──────────┐                        │ │
│  │ │ [Image]  │ │ [Image]  │                        │ │
│  │ │ photo.jpg│ │ video.mp4│                        │ │
│  │ │ 2.0 MB   │ │ 15.3 MB  │                        │ │
│  │ │ ✅ 2.7s  │ │ ✅ 4.1s  │                        │ │
│  │ └──────────┘ └──────────┘                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ "Hello world!"                                [×]  │ │
│  │ ✅ Completed • 0.3s                                │ │
│  │ Apr 5, 2026 at 1:05 PM                            │ │
│  │ (No media)                                         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ "Failed upload"                               [×]  │ │
│  │ ❌ Failed • Network error                          │ │
│  │ Apr 5, 2026 at 12:58 PM                           │ │
│  │                                                    │ │
│  │ ┌──────────┐                                      │ │
│  │ │ [Image]  │                                      │ │
│  │ │ large.jpg│                                      │ │
│  │ │ 25.0 MB  │                                      │ │
│  │ │ ❌ 45%   │ Upload failed: Network timeout       │ │
│  │ └──────────┘                                      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Load more...]                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Data Display Format

### Timestamp Display

```typescript
// Format: "Apr 5, 2026 at 1:10 PM"
function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}
```

### Duration Display

```typescript
// Format: "5.2s" or "1m 23s" or "2h 15m"
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}
```

### File Size Display

```typescript
// Format: "2.0 MB" or "15.3 MB" or "1.2 GB"
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
}
```

---

## Status Icons & Colors

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
| UPLOADING | 🔵 | Blue | Uploading (with progress) |
| COMPLETED | ✅ | Green | Upload complete |
| FAILED | ❌ | Red | Upload failed |

---

## Benefits vs localStorage

### Before (localStorage):
- ❌ Data hilang saat clear browser data
- ❌ Tidak bisa akses dari device lain
- ❌ Tidak ada timestamp server-side
- ❌ Tidak ada durasi processing yang akurat
- ❌ File preview hilang setelah refresh
- ❌ Limited storage (5-10MB)
- ❌ Tidak bisa query/filter

### After (Database):
- ✅ Data persistent dan aman
- ✅ Bisa akses dari device manapun
- ✅ Timestamp server-side yang akurat
- ✅ Durasi processing yang presisi
- ✅ Thumbnail tersimpan di CDN
- ✅ Unlimited storage
- ✅ Bisa query, filter, pagination
- ✅ Bisa analytics (berapa upload per hari, success rate, dll)

---

## Performance Considerations

### Database Indexes

```prisma
@@index([userId, createdAt(sort: Desc)])  // Fast user history query
@@index([status])                          // Fast status filtering
@@index([historyId])                       // Fast media lookup
```

### Pagination

- Default: 20 items per page
- Max: 100 items per page
- Efficient with skip/take

### Auto-cleanup

- Completed uploads older than 7 days auto-deleted
- Keeps database size manageable
- User can manually delete anytime

---

## Migration from localStorage

**Strategy**: Dual system during transition

1. Keep localStorage for backward compatibility
2. New uploads go to database
3. Show both sources in UI
4. Gradually phase out localStorage

**Implementation**:
```typescript
// Fetch from both sources
const [dbHistory, localHistory] = await Promise.all([
  fetchDatabaseHistory(),
  fetchLocalStorageHistory()
]);

// Merge and deduplicate
const allHistory = [...dbHistory, ...localHistory]
  .sort((a, b) => b.createdAt - a.createdAt);
```

---

## Next Steps

### Backend (Done ✅):
1. ✅ Database schema created
2. ✅ Migration applied
3. ✅ Service implemented
4. ✅ Controller implemented
5. ✅ API endpoints ready

### Frontend (To Do):
1. ⏳ Create API client for upload history
2. ⏳ Update post-composer to create history entries
3. ⏳ Update uploads page to fetch from database
4. ⏳ Add timestamp and duration display
5. ⏳ Add thumbnail display
6. ⏳ Add pagination
7. ⏳ Add delete functionality
8. ⏳ Add clear old completed button

### Integration (To Do):
1. ⏳ Update MediaUploadProcessor to update history
2. ⏳ Update post creation flow to track history
3. ⏳ Add progress updates during upload
4. ⏳ Add error tracking

---

## Summary

Sistem upload history yang professional sudah siap di backend:

- ✅ **Database schema** dengan timestamp lengkap
- ✅ **Service layer** dengan auto-calculate duration
- ✅ **API endpoints** dengan pagination
- ✅ **Per-user history** dengan ownership verification
- ✅ **Auto-cleanup** untuk old completed uploads

Tinggal implement frontend untuk display data dengan style YouTube Studio! 🚀

**Files Created**:
1. `apps/server/prisma/schema.prisma` (updated with UploadHistory models)
2. `apps/server/src/modules/posts/upload-history.service.ts` (service layer)
3. `apps/server/src/modules/posts/upload-history.controller.ts` (API endpoints)
4. `apps/server/src/modules/posts/posts.module.ts` (updated with history)

**Database Tables**:
1. `upload_history` (main history table)
2. `upload_history_media` (media items table)

**Status**: Backend READY! Frontend implementation next! 🎉

