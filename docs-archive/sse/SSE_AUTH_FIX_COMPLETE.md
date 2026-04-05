# SSE Authentication Fix - Complete

## Problem Summary

Dua masalah utama yang diperbaiki:

### 1. SSE 401 Unauthorized Error
**Root Cause:** Backend JWT strategy mengharapkan token di header `Authorization: Bearer <token>`, tapi SSE proxy mengirim token sebagai cookie.

**Symptoms:**
- SSE connection selalu gagal dengan 401
- Banner "Update otomatis tidak aktif" muncul
- Real-time updates tidak berfungsi

### 2. Infinite Loop di Feed Component
**Root Cause:** `useEffect` di `feed-content.tsx` memanggil `setPosts([])` saat user logout, yang memicu re-render dan loop karena dependency array tidak stabil.

**Symptoms:**
- Console error: "Maximum update depth exceeded"
- Browser freeze/hang
- Component re-render terus menerus

---

## Solutions Implemented

### Fix 1: SSE Proxy Authentication (apps/client/src/app/api/feed/stream/route.ts)

**Changed:**
```typescript
// BEFORE (WRONG - backend tidak pakai cookies)
headers: {
  'Accept': 'text/event-stream',
  'Cookie': `access_token=${accessToken}`,
}

// AFTER (CORRECT - backend pakai Bearer token)
headers: {
  'Accept': 'text/event-stream',
  'Authorization': `Bearer ${accessToken}`,
}
```

**Why it works:**
- Backend `JwtStrategy` menggunakan `ExtractJwt.fromAuthHeaderAsBearerToken()`
- Ini hanya membaca token dari header `Authorization: Bearer <token>`
- Cookie tidak dibaca sama sekali oleh JWT strategy
- SSE proxy sekarang mengirim token dengan format yang benar

**Additional improvements:**
- Better error logging dengan JSON response
- Shows available cookies untuk debugging
- Checks both `access_token` dan `soplantila_access_token` cookie names

---

### Fix 2: Feed Component Infinite Loop (apps/client/src/features/feed/components/feed-content.tsx)

**Changed:**
```typescript
// BEFORE (WRONG - setPosts dipanggil sebelum clear timers)
if (!user) {
  lastFetchedUserIdRef.current = null;
  initialLoadCompleteRef.current = false;
  setPosts([]);  // ❌ Trigger re-render
  setError(null);
  // ... clear timers after
}

// AFTER (CORRECT - clear timers dulu, baru reset state)
if (!user) {
  lastFetchedUserIdRef.current = null;
  initialLoadCompleteRef.current = false;
  
  // Clear timers FIRST
  if (refreshTimeoutRef.current) {
    clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = null;
  }
  if (pollingIntervalRef.current) {
    clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = null;
  }
  
  // THEN reset state
  setPosts([]);
  setError(null);
  setIsLoading(false);
  setSessionCheckFailed(false);
  setIsRefreshing(false);
}
```

**Why it works:**
- Clear semua timers/intervals SEBELUM update state
- Mencegah timer yang masih aktif trigger effect lagi
- State updates dilakukan setelah cleanup selesai
- Added `eslint-disable-next-line` comment untuk dokumentasi

---

## Testing Checklist

### SSE Connection
- [ ] Login → SSE connect otomatis setelah 500ms
- [ ] Status indicator berubah: idle → connecting → connected
- [ ] Dot hijau "Live" muncul di header
- [ ] Console log: `[SSE] Connected successfully`
- [ ] Tidak ada error 401 di console

### Real-time Updates
- [ ] Buat post baru → muncul di feed tanpa refresh
- [ ] Post dari user lain muncul real-time (jika ada)
- [ ] Delete post → hilang dari feed real-time

### Auth Flow
- [ ] Login → SSE connect otomatis
- [ ] Logout → SSE disconnect, no infinite loop
- [ ] Token expired → banner "Update otomatis tidak aktif" muncul
- [ ] Click "Coba sambung ulang" → refresh token → reconnect

### No Infinite Loop
- [ ] Login/logout tidak freeze browser
- [ ] Console tidak spam error "Maximum update depth"
- [ ] Feed load normal tanpa loop

---

## Technical Details

### Cookie Flow
1. User login → backend set cookie `soplantila_access_token`
2. Browser kirim cookie otomatis ke `/api/feed/stream`
3. SSE proxy baca cookie dari `cookieStore`
4. SSE proxy forward ke backend dengan header `Authorization: Bearer <token>`
5. Backend JWT guard validate token
6. SSE stream established

### Backend JWT Strategy
```typescript
// apps/server/src/modules/auth/strategies/jwt.strategy.ts
jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
```
Ini HANYA baca dari header `Authorization: Bearer <token>`, tidak dari cookies.

### Why Not Use Cookie Extractor?
Bisa saja backend diubah untuk baca dari cookies, tapi:
- Lebih aman pakai Bearer token (standard OAuth2)
- Cookie extractor butuh custom implementation
- SSE proxy sudah ada, tinggal fix header
- Konsisten dengan REST API yang juga pakai Bearer token

---

## Files Changed

1. `apps/client/src/app/api/feed/stream/route.ts`
   - Changed: Cookie → Authorization Bearer header
   - Improved: Error logging dengan JSON response

2. `apps/client/src/features/feed/components/feed-content.tsx`
   - Fixed: Infinite loop di useEffect cleanup
   - Changed: Clear timers before state updates

---

## Expected Behavior After Fix

### On Login
```
[SSE Proxy] Request received, checking cookies... { hasAccessToken: true }
[SSE Proxy] Connecting to backend SSE with token: eyJhbGciOiJIUzI1NiIs...
[SSE Proxy] Connected successfully, streaming to client
[SSE] Connection opened successfully
[SSE] Connected successfully
```

### UI State
- Header shows: "🟢 Live" (green dot)
- Subtitle: "Real-time updates active"
- No yellow warning banner
- Feed updates automatically

### On Logout
```
[Feed] User logged out, resetting state
[SSE] Disconnecting
[SSE] Connection closed
```
- No infinite loop
- No console errors
- Clean state reset

---

## Monitoring

### Success Indicators
- SSE status: `connected`
- `isConnected: true`
- Green dot visible
- No 401 errors in console
- Real-time posts appear

### Failure Indicators
- SSE status: `auth_failed`
- Yellow banner: "Update otomatis tidak aktif"
- Console: `[SSE] Unauthorized (401)`
- Need to check:
  - Cookie ada di browser?
  - Cookie name benar? (`soplantila_access_token`)
  - Token valid?
  - Backend running?

---

## Next Steps

1. Restart dev server (frontend dan backend)
2. Clear browser cookies
3. Login fresh
4. Verify SSE connects successfully
5. Test real-time updates
6. Test logout (no infinite loop)

---

## Prevention

### For Future Development

**DO:**
- Always use `Authorization: Bearer <token>` untuk authenticated requests
- Clear timers/intervals BEFORE state updates di cleanup
- Use `useCallback` dengan stable dependencies
- Add `eslint-disable` comments untuk documented exceptions

**DON'T:**
- Assume backend reads cookies (check JWT strategy first)
- Update state before cleanup di useEffect
- Add unstable functions to dependency arrays
- Mix cookie auth dan Bearer token auth

---

Status: ✅ **COMPLETE**
Date: 2026-04-05
