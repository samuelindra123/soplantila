# Debug Feed Issue - Step by Step

## Masalah
Post masih hilang setelah refresh halaman.

## Logging Telah Ditambahkan

Saya telah menambahkan comprehensive logging di:
1. **Frontend** (`feed-content.tsx`):
   - `[Cache]` - Cache operations
   - `[Feed]` - Feed loading dan state changes
   
2. **Backend** (`posts.service.ts`):
   - `[PostsService]` - Create post dan get feed operations

## Cara Debug

### 1. Buka Browser Console
- Buka aplikasi di browser
- Buka Developer Tools (F12)
- Pergi ke tab Console

### 2. Test Create Post
1. Buat post baru
2. Perhatikan log di console:
   ```
   [Feed] Post created callback: ...
   [Feed] After post created: ...
   [Cache] Saving cache after post created: ...
   [Feed] Scheduling background refresh in 500ms
   [Feed] Executing scheduled background refresh
   [Feed] Loading feed: ...
   [Feed] Received feed response: ...
   ```

### 3. Test Refresh
1. Setelah post dibuat, refresh halaman (F5)
2. Perhatikan log:
   ```
   [Feed] useEffect triggered: ...
   [Cache] Loaded cached feed: ... atau [Cache] No cached feed found
   [Feed] Loading feed: ...
   [Feed] Received feed response: ...
   [Feed] Replaced posts: ...
   ```

### 4. Cek Backend Logs
Di terminal server, cari log:
```
[PostsService] Creating post: ...
[PostsService] Post created successfully: ...
[PostsService] Getting feed: ...
[PostsService] Feed fetched: ...
```

## Skenario yang Perlu Dicek

### Skenario A: Post Tidak Tersimpan di Backend
**Gejala**: 
- Log `[PostsService] Post created successfully` muncul
- Tapi saat refresh, `[PostsService] Feed fetched: { postsCount: 0 }` atau post tidak ada

**Kemungkinan Penyebab**:
- Database transaction issue
- Post ter-delete secara tidak sengaja
- Query filter yang salah

**Solusi**: Cek database langsung dengan query:
```sql
SELECT id, content, "createdAt", "userId" FROM "Post" ORDER BY "createdAt" DESC LIMIT 5;
```

### Skenario B: Post Ada di Backend Tapi Tidak Muncul di Frontend
**Gejala**:
- `[PostsService] Feed fetched: { postsCount: 3 }` (ada post)
- Tapi `[Feed] Received feed response: { postsCount: 0 }` (tidak sampai frontend)

**Kemungkinan Penyebab**:
- API proxy issue
- Response transformation error
- Network error

**Solusi**: Cek Network tab di DevTools, lihat response `/api/backend/feed`

### Skenario C: Post Sampai Frontend Tapi Tidak Di-render
**Gejala**:
- `[Feed] Received feed response: { postsCount: 3 }`
- `[Feed] Replaced posts: { mergedCount: 3 }`
- Tapi UI masih kosong

**Kemungkinan Penyebab**:
- React rendering issue
- State update tidak trigger re-render
- Component unmount/remount

**Solusi**: Cek React DevTools, inspect `posts` state

### Skenario D: Cache Overwrite Issue
**Gejala**:
- Setelah create post, cache di-save dengan benar
- Tapi saat refresh, cache ter-load dengan data lama

**Kemungkinan Penyebab**:
- Multiple cache save operations
- Race condition

**Solusi**: Cek localStorage di DevTools:
```javascript
// Di console browser
localStorage.getItem('feed-cache:YOUR_USER_ID')
```

## Quick Checks

### 1. Cek localStorage
```javascript
// Di browser console
Object.keys(localStorage).filter(k => k.startsWith('feed-cache'))
```

### 2. Cek Post Count di Database
```bash
# Di server terminal
npx prisma studio
# Atau query langsung
```

### 3. Cek Network Request
- Buka Network tab
- Filter: `feed`
- Lihat response dari `/api/backend/feed?page=1&limit=20`

## Expected Flow (Normal)

### Create Post:
1. User submit → `[Feed] Post created callback`
2. Optimistic post added → `[Feed] After post created: { mergedCount: 1 }`
3. Cache saved → `[Cache] Saving cache after post created: { postsCount: 1 }`
4. Background refresh → `[Feed] Executing scheduled background refresh`
5. Server returns post → `[Feed] Received feed response: { postsCount: 1 }`

### Refresh Page:
1. Page load → `[Feed] useEffect triggered`
2. Load cache → `[Cache] Loaded cached feed: { postsCount: 1 }`
3. Display cache → `[Feed] Replaced posts: { mergedCount: 1 }`
4. Background fetch → `[Feed] Loading feed: { silent: true }`
5. Merge with server → `[Feed] Received feed response: { postsCount: 1 }`

## Jika Masih Hilang

Setelah melihat log, laporkan:
1. **Log lengkap dari console** (copy paste semua log dengan prefix `[Feed]`, `[Cache]`, `[PostsService]`)
2. **Screenshot Network tab** untuk request `/api/backend/feed`
3. **Isi localStorage** untuk key `feed-cache:*`
4. **Apakah post ada di database** (cek via Prisma Studio atau query langsung)

Dengan informasi ini, saya bisa identifikasi exact root cause dan fix yang tepat.
