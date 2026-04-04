# Complete Solution: Backend Queue System

## Problem Statement:
Current implementation TIDAK production-ready karena:
1. Post hilang jika refresh saat upload
2. Upload dibatalkan jika close tab
3. Post belum di database sampai upload selesai
4. No retry mechanism
5. No offline support

## Solution: Backend Queue dengan Draft Post

### Architecture:

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ 1. Submit post + files
       │    (multipart/form-data)
       ▼
┌─────────────────────┐
│   NestJS Backend    │
│                     │
│  ┌──────────────┐  │
│  │ POST /posts  │  │ 2. Create draft post in DB
│  │   /draft     │  │    (status: 'draft')
│  └──────┬───────┘  │
│         │          │
│         ▼          │
│  ┌──────────────┐  │
│  │  Database    │  │ 3. Post saved with status='draft'
│  │  (Prisma)    │  │    mediaUrls=null
│  └──────────────┘  │
│         │          │
│         ▼          │
│  ┌──────────────┐  │
│  │ Bull Queue   │  │ 4. Add job to queue
│  │ (Redis)      │  │    { postId, files }
│  └──────┬───────┘  │
│         │          │
│         ▼          │
│  ┌──────────────┐  │
│  │Queue Worker  │  │ 5. Process upload in background
│  │              │  │    - Upload to S3/Spaces
│  │              │  │    - Generate thumbnails
│  │              │  │    - Update post status='published'
│  └──────────────┘  │
└─────────────────────┘
       │
       │ 6. WebSocket notification
       ▼
┌─────────────┐
│   Browser   │ 7. Update UI
│  (Frontend) │    Show post in feed
└─────────────┘
```

### Benefits:

✅ **Post LANGSUNG di database** (status: draft)
✅ **Upload tidak terganggu refresh/close tab**
✅ **Auto-retry** jika gagal
✅ **Resume upload** dari mana saja
✅ **Scalable** untuk ribuan user
✅ **Offline support** (queue di server)
✅ **User bisa logout**, upload tetap jalan

### Implementation Steps:

#### Step 1: Update Database Schema
```prisma
model Post {
  id            String         @id @default(cuid())
  userId        String         @map("user_id")
  content       String         @db.Text
  status        PostStatus     @default(DRAFT) // NEW
  mediaUrl      String?        @map("media_url")
  processingStatus ProcessingStatus? @default(PENDING) // NEW
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  // ... other fields
}

enum PostStatus {
  DRAFT
  PUBLISHED
  FAILED
}

enum ProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

#### Step 2: Install Dependencies
```bash
cd apps/server
pnpm add @nestjs/bull bull
pnpm add -D @types/bull
pnpm add ioredis
```

#### Step 3: Setup Bull Queue Module
```typescript
// apps/server/src/queue/queue.module.ts
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'media-upload',
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
```

#### Step 4: Create Draft Post Endpoint
```typescript
// apps/server/src/modules/posts/posts.controller.ts
@Post('draft')
@UseInterceptors(FilesInterceptor('files', 4))
async createDraftPost(
  @CurrentUser() user: AuthenticatedUser,
  @Body() dto: CreateDraftPostDto,
  @UploadedFiles() files: Express.Multer.File[],
) {
  // 1. Create draft post in database IMMEDIATELY
  const post = await this.postsService.createDraft(user.sub, dto.content);
  
  // 2. Add to upload queue
  await this.uploadQueue.add('process-media', {
    postId: post.id,
    userId: user.sub,
    files: files.map(f => ({
      buffer: f.buffer,
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    })),
  });
  
  return {
    message: 'Post created, processing media...',
    data: {
      postId: post.id,
      status: 'processing',
    },
  };
}
```

#### Step 5: Queue Processor
```typescript
// apps/server/src/modules/posts/processors/media-upload.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('media-upload')
export class MediaUploadProcessor {
  constructor(
    private readonly uploadService: MediaUploadService,
    private readonly postsService: PostsService,
    private readonly websocketGateway: WebSocketGateway,
  ) {}

  @Process('process-media')
  async processMedia(job: Job) {
    const { postId, userId, files } = job.data;
    
    try {
      // Update status to processing
      await this.postsService.updateProcessingStatus(
        postId, 
        'PROCESSING'
      );
      
      // Upload files to S3/Spaces
      const uploadedMedia = [];
      for (const file of files) {
        const result = await this.uploadService.uploadFile(file);
        uploadedMedia.push(result);
        
        // Update progress
        const progress = (uploadedMedia.length / files.length) * 100;
        await job.progress(progress);
        
        // Notify frontend via WebSocket
        this.websocketGateway.emitToUser(userId, 'upload-progress', {
          postId,
          progress,
        });
      }
      
      // Update post with media URLs and publish
      await this.postsService.publishPost(postId, uploadedMedia);
      
      // Notify frontend
      this.websocketGateway.emitToUser(userId, 'post-published', {
        postId,
      });
      
      return { success: true };
    } catch (error) {
      // Mark as failed
      await this.postsService.updateProcessingStatus(
        postId, 
        'FAILED',
        error.message
      );
      
      // Notify frontend
      this.websocketGateway.emitToUser(userId, 'post-failed', {
        postId,
        error: error.message,
      });
      
      throw error; // Bull will retry
    }
  }
}
```

#### Step 6: Frontend Integration
```typescript
// apps/client/src/features/feed/hooks/use-upload-status.ts
import { useEffect } from 'react';
import { io } from 'socket.io-client';

export function useUploadStatus() {
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WS_URL);
    
    socket.on('upload-progress', ({ postId, progress }) => {
      // Update queue progress
      updatePost(postId, { progress });
    });
    
    socket.on('post-published', ({ postId }) => {
      // Mark as completed
      updatePost(postId, { status: 'completed' });
      
      // Refetch feed
      refetchFeed();
    });
    
    socket.on('post-failed', ({ postId, error }) => {
      // Mark as failed
      updatePost(postId, { status: 'failed', error });
    });
    
    return () => {
      socket.disconnect();
    };
  }, []);
}
```

#### Step 7: Updated Post Composer
```typescript
const handleSubmit = async () => {
  const formData = new FormData();
  formData.append('content', content);
  
  media.forEach((m) => {
    formData.append('files', m.file);
  });
  
  try {
    // Submit to draft endpoint
    const response = await apiClient.post('/posts/draft', formData);
    
    // Clear composer immediately
    setContent('');
    setMedia([]);
    
    // Show success message
    toast.success('Post is being processed...');
    
    // Post is now in database with status='draft'
    // Upload will continue in background even if user refreshes
    
  } catch (error) {
    toast.error('Failed to create post');
  }
};
```

### Comparison:

| Feature | Before (Client-Side) | After (Backend Queue) |
|---------|---------------------|----------------------|
| Post in DB | ❌ After upload | ✅ Immediately (draft) |
| Survive refresh | ❌ Upload cancelled | ✅ Upload continues |
| Survive close tab | ❌ Upload stops | ✅ Upload continues |
| Survive logout | ❌ Upload stops | ✅ Upload continues |
| Auto retry | ❌ No | ✅ Yes (Bull retry) |
| Scalability | ⚠️ Limited | ✅ High |
| Production-ready | ❌ No | ✅ Yes |

### Migration Path:

**Phase 1: Keep current implementation** (Quick fix)
- Add localStorage persist ✅ (Done)
- Add beforeunload warning ✅ (Done)
- Accept limitations

**Phase 2: Implement backend queue** (Production-ready)
- Setup Redis + Bull
- Create draft post endpoint
- Queue processor
- WebSocket notifications
- Migrate existing code

**Phase 3: Advanced features**
- Pause/Resume upload
- Bandwidth throttling
- Upload analytics
- Multi-device sync

### Recommendation:

**Untuk production app dengan banyak user:**
→ **WAJIB implement Phase 2 (Backend Queue)**

**Untuk MVP/testing:**
→ Current implementation cukup (dengan keterbatasan yang jelas)

### Timeline Estimate:

- Phase 1 (Current): ✅ Done
- Phase 2 (Backend Queue): ~2-3 days
  - Day 1: Setup Redis, Bull, Database schema
  - Day 2: Implement queue processor, endpoints
  - Day 3: Frontend integration, testing
- Phase 3 (Advanced): ~1 week

### Cost Consideration:

**Current (Client-Side):**
- Cost: $0 (no additional infrastructure)
- Limitation: Not production-ready

**Backend Queue:**
- Cost: ~$10-20/month (Redis hosting)
- Benefit: Production-ready, scalable

### Decision:

Apakah Anda mau saya implement Backend Queue sekarang?
Atau tetap pakai current implementation dengan keterbatasan yang ada?
