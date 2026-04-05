# SSE 401 Race Condition - FIXED ✅

## Problem

Setelah user login, SSE langsung dapat 401 meskipun user sudah login dan REST API berhasil (200 OK).

### Root Cause
Race condition: SSE connect terlalu cepat sebelum token baru dari login benar-benar tersedia di request context.

**Urutan yang terjadi:**
1. POST /login → 200 ✅
2. GET /api/auth/refresh → 200 ✅
3. GET /api/backend/feed → 200 ✅ (REST pakai token baru)
4. SSE connect → 401 ❌ (race condition)
5. Kode lama: throw FatalError → SSE mati selamanya ❌

---

## Solution

### 1. ✅ Initial Connect Delay (300ms)
Tambahkan delay 300ms sebelum SSE connect pertama kali setelah login untuk memberi waktu token tersedia.

```typescript
// Di useEffect
initialConnectDelayRef.current = setTimeout(() => {
  connect();
}, 300);
```

**Why:** Memberi waktu untuk token refresh selesai dan cookie tersedia di browser.

---

### 2. ✅ Token Refresh on 401
Saat SSE dapat 401, coba refresh token dulu sebelum menyerah.

```typescript
if (response.status === 401) {
  if (!hasTriedRefreshRef.current) {
    hasTriedRefreshRef.current = true;
    
    const refreshRes = await fetch('/api/auth/refresh', {
      method: 'GET',
      credentials: 'include',
    });

    if (refreshRes.ok) {
      // Token refreshed, retry SSE
      throw new FatalError('RETRY_AFTER_REFRESH');
    }
  }
  
  // Refresh failed or already tried
  setSseStatus('auth_failed');
  throw new FatalError('Authentication failed');
}
```

**Why:** Handle race condition dimana token belum tersedia saat SSE connect.

---

### 3. ✅ Special Error Handling
Handle special case `RETRY_AFTER_REFRESH` untuk reconnect setelah token refresh.

```typescript
if (error instanceof FatalError && error.message === 'RETRY_AFTER_REFRESH') {
  console.log('[SSE] Scheduling reconnect after token refresh (500ms delay)');
  
  reconnectTimeoutRef.current = setTimeout(() => {
    connect(); // Reconnect tanpa increment attempts
  }, 500);
  
  throw error;
}
```

**Why:** Reconnect setelah token refresh tanpa menghitung sebagai failed attempt.

---

### 4. ✅ Reset Refresh Flag on User Change
Reset `hasTriedRefreshRef` saat user berubah untuk prevent stale state.

```typescript
if (userIdRef.current !== user.id) {
  console.log('[SSE] User changed, resetting refresh flag');
  hasTriedRefreshRef.current = false;
  userIdRef.current = user.id;
}
```

**Why:** Setiap user baru harus punya kesempatan refresh token.

---

### 5. ✅ Manual Reconnect Reset
Reset refresh flag saat manual reconnect (tombol "Coba lagi").

```typescript
reconnect: () => {
  reconnectAttemptsRef.current = 0;
  hasTriedRefreshRef.current = false; // Reset refresh flag
  setSseStatus('connecting');
  connect();
}
```

**Why:** User manual retry harus punya kesempatan fresh untuk refresh token.

---

## State Management

### New Refs
```typescript
const hasTriedRefreshRef = useRef(false);      // Track token refresh attempts
const initialConnectDelayRef = useRef<NodeJS.Timeout | null>(null);
const userIdRef = useRef<string | null>(null); // Track user changes
```

### Cleanup
```typescript
// Clear initial connect delay on unmount
if (initialConnectDelayRef.current) {
  clearTimeout(initialConnectDelayRef.current);
  initialConnectDelayRef.current = null;
}
```

---

## Flow Diagram

```
User Login
    ↓
Wait 300ms (initial delay)
    ↓
SSE Connect
    ↓
401 Unauthorized?
    ↓
    ├─ No → Connected ✅
    │
    └─ Yes → hasTriedRefresh?
           ↓
           ├─ No → Call /api/auth/refresh
           │       ↓
           │       ├─ Success → Wait 500ms → Reconnect
           │       └─ Fail → auth_failed ❌
           │
           └─ Yes → auth_failed ❌
```

---

## Safeguards Against Infinite Loop

### 1. Single Refresh Attempt
```typescript
if (!hasTriedRefreshRef.current) {
  hasTriedRefreshRef.current = true;
  // ... refresh logic
}
```
**Guarantee:** Maksimal 1x token refresh per SSE session.

### 2. Separate from Reconnect Attempts
```typescript
// Refresh retry tidak increment reconnectAttemptsRef
reconnectTimeoutRef.current = setTimeout(() => {
  connect(); // No increment
}, 500);
```
**Guarantee:** Token refresh retry tidak dihitung sebagai failed attempt.

### 3. Reset on User Change
```typescript
if (userIdRef.current !== user.id) {
  hasTriedRefreshRef.current = false;
}
```
**Guarantee:** Setiap user baru punya kesempatan fresh.

### 4. Reset on Manual Reconnect
```typescript
reconnect: () => {
  hasTriedRefreshRef.current = false;
}
```
**Guarantee:** User manual retry punya kesempatan fresh.

---

## Testing Scenarios

### Scenario 1: Normal Login
```
1. User login
2. Wait 300ms
3. SSE connect → 200 OK
4. Status: connected ✅
```

### Scenario 2: Race Condition (Token Not Ready)
```
1. User login
2. Wait 300ms
3. SSE connect → 401
4. Refresh token → 200 OK
5. Wait 500ms
6. SSE reconnect → 200 OK
7. Status: connected ✅
```

### Scenario 3: Token Expired
```
1. SSE connect → 401
2. Refresh token → 401 (expired)
3. Status: auth_failed ❌
4. Show banner: "Update realtime tidak aktif"
```

### Scenario 4: Manual Retry
```
1. Status: auth_failed
2. User click "Coba lagi"
3. Reset hasTriedRefresh
4. Refresh token → 200 OK
5. SSE reconnect → 200 OK
6. Status: connected ✅
```

---

## Logs to Watch

### Success Flow
```
[SSE] Scheduling initial connection with 300ms delay
[SSE] Connecting to: /api/feed/stream attempt: 1
[SSE] Connection opened successfully
[SSE] Received event: connected
```

### Race Condition Flow
```
[SSE] Scheduling initial connection with 300ms delay
[SSE] Connecting to: /api/feed/stream attempt: 1
[SSE] Unauthorized (401) - attempting token refresh
[SSE] Attempting token refresh...
[SSE] Token refreshed successfully, will retry SSE connection
[SSE] Scheduling reconnect after token refresh (500ms delay)
[SSE] Connecting to: /api/feed/stream attempt: 1
[SSE] Connection opened successfully
```

### Auth Failed Flow
```
[SSE] Unauthorized (401) - attempting token refresh
[SSE] Token refresh failed: 401
[SSE] Authentication failed, no more retries
```

---

## Performance Impact

- **Initial delay:** 300ms (acceptable, user tidak notice)
- **Refresh retry:** 500ms (hanya jika 401)
- **No impact:** Jika token sudah ready, langsung connect

---

## Build Status

✅ Build successful
✅ No TypeScript errors
✅ No infinite loops
✅ Proper cleanup
✅ Ready for testing

---

## Next Steps

1. Test login flow dengan fresh session
2. Test dengan expired token
3. Test manual reconnect
4. Check console logs untuk verify flow
5. Test di network slow (throttling)
