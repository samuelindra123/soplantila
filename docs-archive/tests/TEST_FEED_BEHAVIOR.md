# Test Feed Behavior - Manual Testing Guide

## Prerequisites
1. Server running (`npm run dev` di apps/server)
2. Client running (`npm run dev` di apps/client)
3. Browser dengan DevTools terbuka
4. User sudah login

## Test Case 1: Create Post Without Refresh
**Tujuan**: Memastikan post muncul setelah dibuat

**Steps**:
1. Buka halaman `/feed`
2. Buka Console di DevTools
3. Buat post baru dengan text "Test Post 1"
4. Submit

**Expected Result**:
- Post langsung muncul di feed
- Console log:
  ```
  [Feed] Post created callback: { hasPost: true, postId: "..." }
  [Feed] After post created: { mergedCount: 1 }
  [Cache] Saving cache after post created: { postsCount: 1 }
  [Feed] Scheduling background refresh in 500ms
  [Feed] Executing scheduled background refresh
  [Feed] Received feed response: { postsCount: 1 }
  ```

**Pass Criteria**: ✅ Post terlihat di feed tanpa refresh

---

## Test Case 2: Refresh After Create Post
**Tujuan**: Memastikan post tetap ada setelah refresh

**Steps**:
1. Lanjut dari Test Case 1
2. Tunggu 2 detik (pastikan background refresh selesai)
3. Refresh halaman (F5 atau Ctrl+R)
4. Perhatikan console log

**Expected Result**:
- Post tetap muncul setelah refresh
- Console log:
  ```
  [Feed] useEffect triggered: { shouldFetch: false }
  [Cache] Loaded cached feed: { postsCount: 1, age: "Xs" }
  [Feed] Replaced posts: { mergedCount: 1 }
  [Feed] Loading feed: { silent: true }
  [Feed] Received feed response: { postsCount: 1 }
  ```

**Pass Criteria**: ✅ Post tetap terlihat setelah refresh

---

## Test Case 3: Immediate Refresh After Create
**Tujuan**: Test race condition - refresh sebelum background refresh selesai

**Steps**:
1. Buat post baru "Test Post 2"
2. SEGERA refresh halaman (dalam 1 detik)
3. Perhatikan console log

**Expected Result**:
- Post tetap muncul (dari cache atau dari server)
- Console log menunjukkan cache loaded atau server response

**Pass Criteria**: ✅ Post tidak hilang meskipun refresh cepat

---

## Test Case 4: Multiple Posts
**Tujuan**: Memastikan multiple posts tidak duplicate atau hilang

**Steps**:
1. Buat 3 post berturut-turut:
   - "Test Post A"
   - "Test Post B"
   - "Test Post C"
2. Tunggu semua selesai
3. Refresh halaman
4. Cek jumlah post

**Expected Result**:
- Semua 3 post muncul
- Tidak ada duplicate
- Urutan benar (C, B, A dari atas ke bawah)

**Pass Criteria**: ✅ Semua post muncul tanpa duplicate

---

## Test Case 5: Cache Expiry
**Tujuan**: Memastikan cache expired tidak digunakan

**Steps**:
1. Buat post "Test Cache Expiry"
2. Tunggu post muncul
3. Di console, manipulasi cache timestamp:
   ```javascript
   const userId = 'YOUR_USER_ID'; // Ganti dengan user ID aktual
   const cacheKey = `feed-cache:${userId}`;
   const cache = JSON.parse(localStorage.getItem(cacheKey));
   cache.timestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
   localStorage.setItem(cacheKey, JSON.stringify(cache));
   ```
4. Refresh halaman

**Expected Result**:
- Console log: `[Cache] Cache expired: { age: 360, maxAge: 300 }`
- Feed di-fetch dari server, bukan dari cache
- Post tetap muncul

**Pass Criteria**: ✅ Expired cache tidak digunakan, post tetap muncul

---

## Test Case 6: Different User Cache
**Tujuan**: Memastikan cache tidak tercampur antar user

**Steps**:
1. Login sebagai User A
2. Buat post "User A Post"
3. Logout
4. Login sebagai User B
5. Cek feed

**Expected Result**:
- Feed User B tidak menampilkan cache User A
- Console log: `[Cache] UserId mismatch` atau `[Cache] No cached feed found`

**Pass Criteria**: ✅ Cache tidak tercampur antar user

---

## Test Case 7: Network Error Handling
**Tujuan**: Memastikan error handling tidak menghapus cache

**Steps**:
1. Buat post "Test Network Error"
2. Tunggu post muncul
3. Di DevTools Network tab, enable "Offline"
4. Refresh halaman

**Expected Result**:
- Cache loaded dan ditampilkan
- Error message muncul (optional)
- Post tetap terlihat dari cache

**Pass Criteria**: ✅ Cache digunakan saat network error

---

## Test Case 8: Backend Verification
**Tujuan**: Memastikan post benar-benar tersimpan di database

**Steps**:
1. Buat post "Backend Verification Test"
2. Cek server log:
   ```
   [PostsService] Creating post: ...
   [PostsService] Post created successfully: { postId: "...", createdAt: "..." }
   ```
3. Query database langsung:
   ```bash
   npx prisma studio
   # Atau di psql/mysql client
   SELECT id, content, "createdAt" FROM "Post" ORDER BY "createdAt" DESC LIMIT 5;
   ```

**Expected Result**:
- Post ada di database
- createdAt timestamp benar
- userId benar

**Pass Criteria**: ✅ Post tersimpan di database

---

## Debugging Checklist

Jika test case gagal, cek:

### Frontend Issues:
- [ ] Console log lengkap (copy semua log)
- [ ] Network tab - request `/api/backend/feed` response
- [ ] localStorage - key `feed-cache:*` content
- [ ] React DevTools - `posts` state value

### Backend Issues:
- [ ] Server log - `[PostsService]` entries
- [ ] Database - query Post table
- [ ] API response - format dan data

### Common Issues:
- [ ] Cache timestamp salah
- [ ] UserId mismatch
- [ ] Deduplication tidak jalan
- [ ] Background refresh tidak trigger
- [ ] Database transaction rollback

## Report Format

Jika masih ada issue, laporkan dengan format:

```
Test Case: [Nomor dan nama test case]
Status: FAIL

Console Log:
[Paste semua log dengan prefix [Feed], [Cache], [PostsService]]

Network Response:
[Screenshot atau copy response dari /api/backend/feed]

localStorage:
[Copy content dari feed-cache:* key]

Database Query Result:
[Copy hasil query Post table]

Expected: [Apa yang seharusnya terjadi]
Actual: [Apa yang benar-benar terjadi]
```

Dengan informasi lengkap ini, saya bisa pinpoint exact issue dan provide targeted fix.
