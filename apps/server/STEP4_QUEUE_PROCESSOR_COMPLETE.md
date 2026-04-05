# Step 4: Queue Processor - COMPLETE ✅

## What Was Done

### 1. Created Media Upload Processor
**File**: `apps/server/src/modules/posts/processors/media-upload.processor.ts`

**Responsibilities**:
- Process `process-media-upload` jobs from Bull queue
- Confirm temp uploads and move to permanent storage
- Attach media to post
- Update post status from DRAFT → PUBLISHED
- Handle errors and update status to FAILED

### 2. Processor Flow

```
Job Received
    ↓
Update status: PROCESSING
    ↓
No media? → Publish immediately
    ↓
Has media? → Confirm each upload
    ↓
Create PostMedia records
    ↓
Update post: PUBLISHED + attach media
    ↓
Success ✅
```

### 3. Error Handling

**On Error**:
- Update post status to `FAILED`
- Set `processingError` with error message
- Re-throw error to trigger Bull retry (3 attempts with exponential backoff)

**Retry Strategy** (configured in controller):
- Attempts: 3
- Backoff: Exponential (2s, 4s, 8s)
- Remove on complete: true
- Remove on fail: false (keep for debugging)

### 4. Registered Processor in Module
**File**: `apps/server/src/modules/posts/posts.module.ts`
- Added `MediaUploadProcessor` to providers

## How It Works

### Job Data Structure
```typescript
{
  postId: "cm...",
  userId: "cm...",
  uploadIds: ["upload-id-1", "upload-id-2"]
}
```

### Processing Steps

1. **Update to PROCESSING**
   ```sql
   UPDATE Post 
   SET processingStatus = 'PROCESSING' 
   WHERE id = postId;
   ```

2. **Confirm Each Upload**
   - Calls `mediaUploadService.confirmUpload(userId, { uploadId })`
   - Moves file from temp to permanent storage
   - Returns media metadata (storageKey, publicUrl, mimeType, etc.)

3. **Create PostMedia Records**
   ```sql
   INSERT INTO PostMedia (postId, mediaType, storageKey, publicUrl, ...)
   VALUES (...);
   ```

4. **Publish Post**
   ```sql
   UPDATE Post 
   SET status = 'PUBLISHED',
       processingStatus = 'COMPLETED',
       mediaUrl = firstMediaUrl
   WHERE id = postId;
   ```

### Error Scenario
```sql
UPDATE Post 
SET status = 'FAILED',
    processingStatus = 'FAILED',
    processingError = 'Error message'
WHERE id = postId;
```

## Logging

Processor logs every step:
```
[Job 123] Processing media upload for post: cm...
[Job 123] Upload IDs: 2
[Job 123] Confirming upload 1/2: upload-id-1
[Job 123] Upload confirmed: upload-id-1
[Job 123] Confirming upload 2/2: upload-id-2
[Job 123] Upload confirmed: upload-id-2
[Job 123] Post published successfully with 2 media items
```

## Database State After Processing

**Success**:
```sql
SELECT id, status, processingStatus, mediaUrl 
FROM Post 
WHERE id = 'postId';

-- Result:
-- id: cm...
-- status: PUBLISHED
-- processingStatus: COMPLETED
-- mediaUrl: https://cdn.../image.jpg
```

**Failed**:
```sql
SELECT id, status, processingStatus, processingError 
FROM Post 
WHERE id = 'postId';

-- Result:
-- id: cm...
-- status: FAILED
-- processingStatus: FAILED
-- processingError: "Upload not found."
```

## Build Status
✅ Build successful with `pnpm build`
✅ No TypeScript errors
✅ Processor registered and ready

## Testing the Flow

### Manual Test
1. Call `POST /api/posts/draft` with uploadIds
2. Check database - post should be DRAFT/PENDING
3. Wait a few seconds
4. Check database again - post should be PUBLISHED/COMPLETED
5. Check PostMedia table - media records should exist

### Check Queue Status
```bash
# In Redis CLI or Upstash console
KEYS bull:media-upload:*
LLEN bull:media-upload:active
LLEN bull:media-upload:completed
LLEN bull:media-upload:failed
```

## Next Steps

**Step 5**: Frontend Integration
- Update `post-composer.tsx` to use `/api/posts/draft` endpoint
- Remove client-side upload logic from post creation
- Add WebSocket listener for real-time status updates (optional)
- Update upload queue UI to show server-side processing status
- Handle DRAFT/PROCESSING/PUBLISHED states in feed

**Step 6**: WebSocket Events (Optional Enhancement)
- Emit events when post status changes
- Real-time updates in feed without refresh
- Show "Processing..." → "Published" transition
