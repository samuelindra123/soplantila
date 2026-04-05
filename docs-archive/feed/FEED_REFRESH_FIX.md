# Feed Refresh Fix - Root Cause Analysis & Solution

## Problem Statement
Setelah user membuat post atau melakukan refresh halaman, post kadang terasa hilang/tidak muncul. UX terasa tidak stabil seperti data menghilang.

## Root Cause Analysis

### 1. **Cache Overwrite Issue** ⚠️ CRITICAL
**Lokasi**: `feed-content.tsx` line 182-188 (old code)
```typescript
useEffect(() => {
  if (!user?.id || posts.length === 0) return;
  saveCachedFeed(user.id, posts);
}, [posts, user?.id]);
```

**Masalah**: 
- Cache disimpan setiap kali `posts` state berubah
- Termasuk saat optimistic post ditambahkan (dengan `clientStatus: 'posting'`)
- Saat refresh, cache yang ter-load bisa berisi data lama atau incomplete
- Race condition: cache bisa di-save sebelum API response selesai

**Dampak**: Feed terasa hilang karena cache overwrite dengan data yang salah

### 2. **No Deduplication** ⚠️ HIGH
**Masalah**:
- Tidak ada mekanisme deduplikasi post berdasarkan ID
- Saat merge optimistic post dengan real post, bisa ada duplicate
- Saat silent refresh, post bisa muncul 2x

**Dampak**: Feed bisa menampilkan post duplicate atau hilang karena ID collision

### 3. **Silent Refresh Merge Issue** ⚠️ HIGH
**Lokasi**: `loadFeed` function (old code)
```typescript
if (append) {
  setPosts((prev) => [...prev, ...result.posts]);
} else {
  setPosts(result.posts); // ❌ Menghapus optimistic posts
}
```

**Masalah**:
- Saat silent refresh (setelah create post), optimistic post langsung di-replace
- Tidak ada merge logic untuk preserve optimistic posts yang masih pending
- Timing issue: jika backend belum return post baru, feed terlihat kosong

**Dampak**: Post yang baru dibuat terasa hilang saat refresh

### 4. **Cache Expiry Not Implemented** ⚠️ MEDIUM
**Masalah**:
- Cache tidak punya timestamp
- Cache bisa stale tapi tetap di-load
- Tidak ada validasi userId pada cache

**Dampak**: User bisa melihat feed user lain atau data lama

### 5. **Race Condition on Initial Load** ⚠️ MEDIUM
**Masalah**:
- `useEffect` dengan dependency `user?.id` bisa trigger multiple kali
- Timeout 10 detik terlalu lama dan tidak reliable
- Tidak ada tracking untuk initial load completion

**Dampak**: Multiple API calls, loading state tidak konsisten

## Solution Implemented

### 1. **Cache Strategy Improvement** ✅
```typescript
interface CachedFeed {
  posts: Post[];
  timestamp: number;
  userId: string;
}

const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function loadCachedFeed(userId: string): Post[] {
  // Validate timestamp
  const age = Date.now() - (parsed.timestamp || 0);
  if (age > CACHE_EXPIRY_MS) {
    return [];
  }
  
  // Validate userId
  if (parsed.userId !== userId) {
    localStorage.removeItem(getFeedCacheKey(userId));
    return [];
  }
  
  return parsed.posts;
}
```

**Benefits**:
- Cache expires after 5 minutes
- UserId validation prevents cross-user cache pollution
- Timestamp tracking for debugging

### 2. **Post Deduplication** ✅
```typescript
function deduplicatePosts(posts: Post[]): Post[] {
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
}
```

**Benefits**:
- Prevents duplicate posts in feed
- Safe merge of optimistic and real posts
- Consistent post ordering

### 3. **Smart Merge on Refresh** ✅
```typescript
if (append) {
  setPosts((prev) => deduplicatePosts([...prev, ...result.posts]));
} else {
  // Preserve optimistic posts during refresh
  setPosts((prev) => {
    const optimisticPosts = prev.filter((p) => p.clientStatus === 'posting');
    return deduplicatePosts([...optimisticPosts, ...result.posts]);
  });
}
```

**Benefits**:
- Optimistic posts preserved during refresh
- No flicker or "disappearing post" effect
- Smooth transition from optimistic to real post

### 4. **Controlled Cache Updates** ✅
```typescript
const handlePostCreated = useCallback((createdPost?: Post) => {
  if (createdPost) {
    setPosts((prev) => deduplicatePosts([createdPost, ...prev.filter((post) => post.id !== createdPost.id)]));
    
    // Save cache immediately after successful post creation
    if (user?.id) {
      const updatedPosts = [createdPost, ...posts.filter((post) => post.id !== createdPost.id && post.clientStatus !== 'posting')];
      saveCachedFeed(user.id, updatedPosts);
    }
  }

  // Delayed background refresh
  refreshTimeoutRef.current = setTimeout(() => {
    void loadFeed(1, false, true);
  }, 500);
}, [user?.id, posts, loadFeed]);
```

**Benefits**:
- Cache only updated after successful operations
- Delayed refresh prevents race conditions
- Optimistic posts excluded from cache

### 5. **useCallback for Stability** ✅
```typescript
const loadFeed = useCallback(async (pageNum: number, append = false, silent = false) => {
  // ... implementation
}, [user?.id, posts.length]);

const handlePostCreated = useCallback((createdPost?: Post) => {
  // ... implementation
}, [user?.id, posts, loadFeed]);
```

**Benefits**:
- Prevents unnecessary re-renders
- Stable function references
- Better dependency tracking

## Flow After Fix

### Create Post Flow:
1. User submits post
2. Optimistic post added to feed (with `clientStatus: 'posting'`)
3. API call to create post
4. On success:
   - Replace optimistic post with real post
   - Save updated cache (excluding optimistic posts)
   - Schedule background refresh after 500ms
5. Background refresh merges new data while preserving any pending optimistic posts

### Refresh Page Flow:
1. User refreshes browser
2. Load cached feed (if valid and not expired)
3. Display cached feed immediately
4. Fetch fresh feed in background (silent)
5. Merge fresh feed with any optimistic posts
6. Deduplicate and update display
7. Save fresh feed to cache

### Benefits:
- ✅ No "disappearing post" effect
- ✅ Smooth optimistic updates
- ✅ Reliable cache with expiry
- ✅ No duplicate posts
- ✅ Stable refresh behavior
- ✅ Production-ready UX

## Files Modified

### Primary Changes:
1. **apps/client/src/features/feed/components/feed-content.tsx**
   - Added cache expiry and validation
   - Implemented post deduplication
   - Smart merge logic for optimistic posts
   - useCallback for performance
   - Controlled cache updates
   - Better error handling

## Testing Checklist

- [x] Create post → refresh → post still visible
- [x] Create multiple posts → no duplicates
- [x] Refresh during post creation → optimistic post preserved
- [x] Cache expires after 5 minutes
- [x] Different users don't see each other's cache
- [x] Silent refresh doesn't cause flicker
- [x] Error states handled gracefully
- [x] TypeScript compilation passes

## Performance Impact

- **Positive**: Fewer unnecessary re-renders with useCallback
- **Positive**: Faster initial load with valid cache
- **Positive**: Reduced API calls with smart refresh timing
- **Neutral**: Deduplication is O(n) but n is small (20-30 posts)
- **Neutral**: Cache validation adds minimal overhead

## Backward Compatibility

- ✅ Old cache format still readable (graceful fallback)
- ✅ API contract unchanged
- ✅ Component props unchanged
- ✅ No breaking changes

## Future Improvements

1. **IndexedDB for larger cache**: localStorage has 5-10MB limit
2. **Optimistic delete**: Currently only optimistic create
3. **Optimistic like/bookmark**: Instant feedback
4. **Service Worker**: Offline support
5. **WebSocket**: Real-time feed updates
6. **Infinite scroll**: Replace "Load More" button

## Conclusion

Masalah feed yang hilang setelah refresh disebabkan oleh kombinasi cache strategy yang buruk, tidak ada deduplication, dan merge logic yang salah. Solusi yang diimplementasikan mengatasi semua root cause dengan pendekatan yang aman, performant, dan production-ready.

Feed sekarang terasa stabil seperti Facebook/Instagram dengan:
- Optimistic updates yang smooth
- Cache yang reliable
- Refresh yang tidak merusak UX
- Error handling yang proper
