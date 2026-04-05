# Quick Testing Checklist ⚡

Checklist cepat untuk testing fitur sosial media yang baru diimplementasikan.

## 🚀 Quick Start

### Setup (5 menit)
- [ ] Backend running: `http://localhost:3001`
- [ ] Frontend running: `http://localhost:3000`
- [ ] PostgreSQL running
- [ ] Redis running
- [ ] 2 test accounts ready (tester1, tester2)

---

## ✅ Testing Checklist

### 1. Profile - Media Rendering (5 menit)

**Own Profile:**
- [ ] Go to `/profile`
- [ ] Posts show text + media (images/videos)
- [ ] Click Media tab → shows gallery
- [ ] Click media → modal opens
- [ ] Three-dot menu shows "Edit" & "Delete"

**Other's Profile:**
- [ ] Go to `/u/tester2`
- [ ] Posts show media correctly
- [ ] Media tab shows their gallery
- [ ] Three-dot menu shows "Report" only

**Status:** [ ] ✅ Pass [ ] ❌ Fail

---

### 2. Feed - Action Menu (3 menit)

- [ ] Go to `/feed`
- [ ] Your posts: NO three-dot menu
- [ ] Other's posts: three-dot menu with "Report" only
- [ ] Click Report → logs to console

**Status:** [ ] ✅ Pass [ ] ❌ Fail

---

### 3. Follow/Unfollow System (5 menit)

- [ ] Go to `/u/tester2`
- [ ] Click "Follow" → changes to "Following"
- [ ] Follower count +1
- [ ] Click "Following" → changes to "Follow"
- [ ] Follower count -1
- [ ] Refresh page → status persists
- [ ] No errors in console

**Status:** [ ] ✅ Pass [ ] ❌ Fail

---

### 4. Notifications (5 menit)

**As User B (receiver):**
- [ ] Go to `/notifications`
- [ ] Page loads (no 404)

**As User A (actor):**
- [ ] Follow User B

**Back to User B:**
- [ ] Refresh notifications
- [ ] New notification appears: "tester1 mulai mengikuti Anda"
- [ ] Shows timestamp
- [ ] Has unread indicator (dot)
- [ ] Click notification → goes to tester1's profile
- [ ] Notification marked as read

**Status:** [ ] ✅ Pass [ ] ❌ Fail

---

### 5. Database Check (3 menit)

```sql
-- Check follow relationship
SELECT * FROM user_follows 
WHERE follower_id = 'user_a_id' 
AND following_id = 'user_b_id';
-- Should return 1 row when following

-- Check notification
SELECT * FROM notifications 
WHERE user_id = 'user_b_id' 
AND type = 'FOLLOW'
ORDER BY created_at DESC 
LIMIT 1;
-- Should return notification record
```

- [ ] Follow record exists in database
- [ ] Notification record exists
- [ ] Timestamps accurate

**Status:** [ ] ✅ Pass [ ] ❌ Fail

---

### 6. API Testing (5 menit)

**Follow API:**
```bash
curl -X POST http://localhost:3001/api/users/{userId}/follow \
  -H "Authorization: Bearer {token}"
```
- [ ] Returns 200 OK
- [ ] Message: "User followed successfully"

**Get Notifications:**
```bash
curl -X GET http://localhost:3001/api/users/notifications \
  -H "Authorization: Bearer {token}"
```
- [ ] Returns 200 OK
- [ ] Shows notification list
- [ ] Pagination included

**Status:** [ ] ✅ Pass [ ] ❌ Fail

---

### 7. Edge Cases (5 menit)

- [ ] Cannot follow yourself (no button on own profile)
- [ ] Follow same user twice → shows error
- [ ] Network offline → shows error message
- [ ] Invalid user profile → shows 404 page
- [ ] Session expired → redirects to login

**Status:** [ ] ✅ Pass [ ] ❌ Fail

---

## 📊 Overall Results

| Feature | Status | Notes |
|---------|--------|-------|
| Profile Media | [ ] Pass [ ] Fail | |
| Feed Menu | [ ] Pass [ ] Fail | |
| Follow/Unfollow | [ ] Pass [ ] Fail | |
| Notifications | [ ] Pass [ ] Fail | |
| Database | [ ] Pass [ ] Fail | |
| API | [ ] Pass [ ] Fail | |
| Edge Cases | [ ] Pass [ ] Fail | |

**Total Time:** _______ minutes

**Overall Status:** 
- [ ] ✅ All Pass - Ready for Production
- [ ] ⚠️ Minor Issues - Needs Fixes
- [ ] ❌ Major Issues - Needs Rework

---

## 🐛 Quick Bug Report

**Bug Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Priority:**
- [ ] Critical (blocks testing)
- [ ] High (major feature broken)
- [ ] Medium (minor issue)
- [ ] Low (cosmetic)

---

## 📝 Notes

_____________________________________________________
_____________________________________________________
_____________________________________________________

---

**Tested By:** _______________
**Date:** _______________
**Environment:** [ ] Local [ ] Staging [ ] Production
