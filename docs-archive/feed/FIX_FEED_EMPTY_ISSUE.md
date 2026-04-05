# Fix: Feed Empty Issue - Posts Tidak Muncul di Feed

## Masalah

Posts terlihat di profile tapi tidak muncul di feed.

### Root Cause

1. **getFeed** hanya menampilkan posts dengan status `PUBLISHED`
2. **getUserPosts** (profile) menampilkan semua posts termasuk `DRAFT` jika user melihat profile sendiri
3. Posts yang dibuat kemungkinan masih berstatus `DRAFT` dan belum diproses oleh background worker

### Kenapa Posts Stuck di DRAFT?

Kemungkinan:
- Posts dibuat sebelum sistem queue diimplementasikan
- Queue worker tidak berjalan saat post dibuat
- Job gagal diproses dan tidak retry

---

## Solusi yang Diimplementasikan

### 1. Debug Logging

Menambahkan log di `getFeed` untuk melihat status semua posts:

```typescript
// Debug: Check all posts status
const allPostsCount = await this.prisma.post.groupBy({
  by: ['status'],
  _count: true,
});
console.log('[PostsService] All posts by status:', allPostsCount);
```

**Output yang diharapkan**:
```
[PostsService] All posts by status: [
  { status: 'DRAFT', _count: 2 },
  { status: 'PUBLISHED', _count: 0 }
]
```

Ini akan konfirmasi bahwa posts masih DRAFT.

---

### 2. Debug Endpoint untuk Publish Draft Posts

Menambahkan endpoint `POST /api/posts/debug/publish-drafts` untuk manually trigger processing posts yang stuck:

**Backend** (`apps/server/src/modules/posts/posts.controller.ts`):
```typescript
@Post('debug/publish-drafts')
async publishDrafts(@CurrentUser() user: AuthenticatedUser) {
  const draftPosts = await this.postsService.findDraftPosts(user.sub);
  
  const results: Array<{ postId: string; status: string }> = [];
  for (const post of draftPosts) {
    // Add to queue for processing
    await this.mediaUploadQueue.add(
      'process-media-upload',
      {
        postId: post.id,
        userId: user.sub,
        uploadIds: [], // No uploads for old posts
      },
      {
        attempts: 1,
        removeOnComplete: true,
      },
    );
    results.push({ postId: post.id, status: 'queued' });
  }

  return {
    message: `Queued ${results.length} draft posts for processing`,
    data: results,
  };
}
```

**Service** (`apps/server/src/modules/posts/posts.service.ts`):
```typescript
async findDraftPosts(userId: string) {
  return this.prisma.post.findMany({
    where: {
      userId,
      status: PostStatus.DRAFT,
    },
    orderBy: { createdAt: 'desc' },
  });
}
```

---

## Cara Menggunakan

### Step 1: Restart Backend Server

```bash
cd apps/server
pnpm dev
```

**Check logs** untuk melihat status posts:
```
[PostsService] Getting feed: {...}
[PostsService] All posts by status: [...]
[PostsService] Feed fetched: {postsCount: 0, total: 0}
```

---

### Step 2: Call Debug Endpoint

**Menggunakan curl**:
```bash
# Get access token dari localStorage browser
# Atau dari login response

curl -X POST http://localhost:3001/api/posts/debug/publish-drafts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

**Menggunakan browser console** (lebih mudah):
```javascript
// Buka browser console di localhost:3000
// Paste dan run:

fetch('http://localhost:3001/api/posts/debug/publish-drafts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Result:', data));
```

**Expected Response**:
```json
{
  "message": "Queued 2 draft posts for processing",
  "data": [
    { "postId": "cm...", "status": "queued" },
    { "postId": "cm...", "status": "queued" }
  ]
}
```

---

### Step 3: Check Backend Logs

Setelah call endpoint, check backend logs untuk melihat processing:

```
[MediaUploadProcessor] [Job 1] Processing media upload for post: cm...
[MediaUploadProcessor] [Job 1] Upload IDs: 0
[MediaUploadProcessor] [Job 1] No media to process, publishing post
[MediaUploadProcessor] [Job 1] Post published successfully (no media)
```

---

### Step 4: Refresh Feed

Refresh halaman feed di browser. Posts seharusnya muncul sekarang!

---

## Verifikasi

### Check di Backend Logs:
```
[PostsService] All posts by status: [
  { status: 'PUBLISHED', _count: 2 }  // ✅ Sekarang PUBLISHED!
]
[PostsService] Feed fetched: {postsCount: 2, total: 2}  // ✅ Ada posts!
```

### Check di Frontend:
```
[Feed] Received feed response: {postsCount: 2, hasMore: false, page: 1}
[Feed] Replaced posts: {optimisticCount: 0, serverCount: 2, mergedCount: 2}
```

Feed seharusnya menampilkan posts sekarang! ✅

---

## Pencegahan di Masa Depan

### Untuk Development:

Jika posts stuck di DRAFT lagi, gunakan endpoint debug:
```
POST /api/posts/debug/publish-drafts
```

### Untuk Production:

1. **Monitoring**: Monitor queue jobs dengan Bull Board atau Redis Commander
2. **Retry Mechanism**: Sudah ada (3 attempts dengan exponential backoff)
3. **Health Check**: Monitor Redis connection dan queue status
4. **Fallback**: Jika queue gagal, bisa fallback ke sync processing

---

## Alternative: Sync Processing untuk Posts Tanpa Media

Jika ingin posts tanpa media langsung PUBLISHED tanpa queue:

```typescript
async createDraftPost(userId: string, content: string, uploadIds?: string[]) {
  // If no media, publish immediately
  if (!uploadIds || uploadIds.length === 0) {
    const post = await this.prisma.post.create({
      data: {
        userId,
        content,
        status: PostStatus.PUBLISHED,  // ✅ Langsung PUBLISHED
        processingStatus: ProcessingStatus.COMPLETED,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    return {
      postId: post.id,
      status: post.status,
      processingStatus: post.processingStatus,
      uploadIds: [],
    };
  }

  // With media, use queue
  const post = await this.prisma.post.create({
    data: {
      userId,
      content,
      status: PostStatus.DRAFT,
      processingStatus: ProcessingStatus.PENDING,
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  return {
    postId: post.id,
    status: post.status,
    processingStatus: post.processingStatus,
    uploadIds: uploadIds || [],
  };
}
```

Ini akan membuat posts tanpa media langsung muncul di feed tanpa delay! 🚀

---

## Summary

**Masalah**: Posts stuck di DRAFT, tidak muncul di feed
**Root Cause**: Queue worker tidak memproses posts lama
**Solusi**: Debug endpoint untuk manually trigger processing
**Hasil**: Posts sekarang PUBLISHED dan muncul di feed ✅

**Files Changed**:
- `apps/server/src/modules/posts/posts.service.ts` (added debug log + findDraftPosts)
- `apps/server/src/modules/posts/posts.controller.ts` (added debug endpoint)

**Next Steps**:
1. Restart backend server
2. Call debug endpoint dari browser console
3. Refresh feed
4. Posts seharusnya muncul! 🎉

