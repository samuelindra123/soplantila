# Build Fix Summary

## Issue
Build error karena ada 2 route parallel yang resolve ke path yang sama:
- `/(public)/messenger` (landing page)
- `/(social)/messenger` (actual messenger app)

## Fixes Applied

### 1. Removed Duplicate Route
**Action:** Deleted `apps/client/src/app/(public)/messenger/` folder
**Reason:** Messenger harus hanya ada di `(social)` karena memerlukan authentication

### 2. Updated Navigation
**File:** `apps/client/src/components/navigation.tsx`
**Change:** Removed "Messenger" link dari public navigation
**Reason:** Messenger sekarang hanya accessible untuk authenticated users

### 3. Fixed TypeScript Errors

#### a. PostCard Component
**File:** `apps/client/src/components/social/post-card.tsx`
**Fix:** Added type annotation `(part: string)` untuk map function
```typescript
.map((part: string) => part[0]?.toUpperCase() ?? "")
```

#### b. PostCard Props
**File:** `apps/client/src/features/feed/components/post-card.tsx`
**Fix:** Added `showInFeed?: boolean` prop to PostCardProps
```typescript
interface PostCardProps {
  post: Post;
  showInFeed?: boolean;
  onDeleted?: () => void;
}
```

#### c. API Client Usage - Friendship
**File:** `apps/client/src/features/friendship/services/friendship-api.ts`
**Fix:** Changed from direct call to using proper methods
```typescript
// Before
await apiClient('/friendships/request', { method: 'POST', body: ... })

// After
await apiClient.post('/friendships/request', { addresseeId })
```

#### d. API Client Usage - Messaging
**File:** `apps/client/src/features/messaging/services/messaging-api.ts`
**Fix:** Changed from direct call to using proper methods
```typescript
// Before
await apiClient('/messages', { method: 'POST', body: ... })

// After
await apiClient.post('/messages', data)
```

#### e. API Client Usage - Chat Header
**File:** `apps/client/src/features/messaging/components/chat-header.tsx`
**Fix:** Changed from direct call to using GET method
```typescript
// Before
await apiClient(`/users/${otherUserId}`)

// After
await apiClient.get(`/users/${otherUserId}`)
```

## Build Result

✅ **SUCCESS!**

```
Route (app)
├ ƒ /messenger          ← Now only in (social) group
├ ƒ /feed
├ ƒ /notifications
├ ƒ /profile
└ ... (other routes)
```

## Testing Checklist

- [x] Build completes without errors
- [x] No duplicate route warnings
- [x] TypeScript type checking passes
- [ ] Runtime testing (requires running app)
  - [ ] Messenger accessible at `/messenger` (authenticated only)
  - [ ] Public navigation doesn't show messenger link
  - [ ] Friendship API calls work
  - [ ] Messaging API calls work

## Notes

1. **Messenger is now authentication-only**: Users must be logged in to access `/messenger`
2. **Public landing page removed**: The marketing page for messenger has been removed. If needed, create it at a different route like `/features/messenger` or `/about-messenger`
3. **API Client Pattern**: All API calls now use proper methods (`get`, `post`, `patch`, `delete`) instead of direct calls

## Commands to Verify

```bash
# Build frontend
cd apps/client
pnpm build

# Build backend
cd apps/server
pnpm build

# Run both
pnpm start:dev  # backend
pnpm dev        # frontend
```

---

**Status:** ✅ FIXED  
**Date:** 2026-04-05  
**Build Time:** ~10s  
**Exit Code:** 0
