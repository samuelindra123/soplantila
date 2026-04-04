# Step 3: Draft Post Endpoint - COMPLETE ✅

## What Was Done

### 1. Created Draft Post DTO
**File**: `apps/server/src/modules/posts/dto/create-draft-post.dto.ts`
- Accepts `content` (required, max 2000 chars)
- Accepts `uploadIds` (optional array of upload IDs from temp uploads)

### 2. Added Draft Post Service Method
**File**: `apps/server/src/modules/posts/posts.service.ts`
- `createDraftPost()` - Creates post immediately with:
  - `status: DRAFT`
  - `processingStatus: PENDING`
  - No media attached yet
- Returns `postId`, `status`, `processingStatus`, and `uploadIds`

### 3. Updated Feed & User Posts Queries
**File**: `apps/server/src/modules/posts/posts.service.ts`
- `getFeed()` - Only shows `PUBLISHED` posts
- `getUserPosts()` - Shows all posts if viewing own profile, only `PUBLISHED` for others
- `formatPost()` - Now includes `status`, `processingStatus`, `processingError` fields

### 4. Created Draft Post Endpoint
**File**: `apps/server/src/modules/posts/posts.controller.ts`
- `POST /api/posts/draft` - New endpoint
- Creates draft post in database immediately
- Adds job to Bull queue `media-upload` with:
  - Job name: `process-media-upload`
  - Payload: `{ postId, userId, uploadIds }`
  - Retry: 3 attempts with exponential backoff
- Returns immediately with post ID and status

### 5. Registered Queue in Posts Module
**File**: `apps/server/src/modules/posts/posts.module.ts`
- Imported `BullModule`
- Registered `media-upload` queue

## API Contract

### Request
```http
POST /api/posts/draft
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Post content here",
  "uploadIds": ["upload-id-1", "upload-id-2"]  // optional
}
```

### Response
```json
{
  "message": "Post is being processed.",
  "data": {
    "postId": "cm...",
    "status": "DRAFT",
    "processingStatus": "PENDING"
  }
}
```

## How It Works

1. **Client calls** `POST /api/posts/draft` with content and uploadIds
2. **Server immediately**:
   - Creates post in database with `DRAFT` status
   - Returns postId to client
3. **Server queues job** to Bull/Redis:
   - Job contains: postId, userId, uploadIds
   - Job will be processed in background (Step 4)
4. **Client receives** postId and can show "Processing..." state
5. **Background processor** (Step 4) will:
   - Confirm uploads from temp storage
   - Attach media to post
   - Update status to `PUBLISHED`
   - Emit WebSocket event (Step 5)

## Database State

After calling draft endpoint:
```sql
SELECT id, status, processingStatus, content, mediaUrl 
FROM Post 
WHERE id = 'postId';

-- Result:
-- id: cm...
-- status: DRAFT
-- processingStatus: PENDING
-- content: "Post content here"
-- mediaUrl: NULL
```

## Build Status
✅ Build successful with `pnpm build`
✅ No TypeScript errors
✅ Redis connection verified

## Next Steps

**Step 4**: Implement Queue Processor
- Create `MediaUploadProcessor` in `apps/server/src/modules/posts/processors/`
- Process `process-media-upload` jobs
- Confirm uploads and attach media to post
- Update post status to `PUBLISHED` or `FAILED`
- Handle errors and retries

**Step 5**: Frontend Integration
- Update post-composer to use `/api/posts/draft`
- Add WebSocket listener for upload progress
- Update upload queue UI to show server-side progress
