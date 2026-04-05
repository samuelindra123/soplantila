# Testing Flow - Social Media Features

Panduan testing lengkap untuk fitur Follow/Unfollow, Notifications, Profile Media, dan Post Actions.

## 📋 Table of Contents

1. [Pre-requisites](#pre-requisites)
2. [Test Environment Setup](#test-environment-setup)
3. [Feature 1: Profile Page - Post & Media Tab](#feature-1-profile-page---post--media-tab)
4. [Feature 2: Feed Page - Action Menu](#feature-2-feed-page---action-menu)
5. [Feature 3: Follow/Unfollow System](#feature-3-followunfollow-system)
6. [Feature 4: Notification System](#feature-4-notification-system)
7. [Database Verification](#database-verification)
8. [API Testing](#api-testing)
9. [Edge Cases & Error Handling](#edge-cases--error-handling)
10. [Performance Testing](#performance-testing)

---

## Pre-requisites

### Required Setup
- ✅ Backend server running on `http://localhost:3001`
- ✅ Frontend server running on `http://localhost:3000`
- ✅ PostgreSQL database running
- ✅ Redis server running (for queue processing)
- ✅ At least 3 test user accounts created

### Test Accounts Needed

Create these test accounts:

1. **User A (Main Tester)**
   - Email: `tester1@test.com`
   - Username: `tester1`
   - Password: `Test123!`

2. **User B (Target User)**
   - Email: `tester2@test.com`
   - Username: `tester2`
   - Password: `Test123!`

3. **User C (Additional User)**
   - Email: `tester3@test.com`
   - Username: `tester3`
   - Password: `Test123!`

### Test Data Preparation

**User B should have:**
- At least 3 posts with text only
- At least 2 posts with images
- At least 1 post with video
- Total: 6+ posts

**User C should have:**
- At least 2 posts with mixed content

---

## Test Environment Setup

### 1. Database Reset (Optional)

```bash
cd apps/server
npx prisma migrate reset
npx prisma db seed # If you have seed file
```

### 2. Start Servers

```bash
# Terminal 1 - Backend
cd apps/server
pnpm run start:dev

# Terminal 2 - Frontend
cd apps/client
pnpm run dev

# Terminal 3 - Redis (if not running as service)
redis-server
```

### 3. Verify Services

```bash
# Check backend
curl http://localhost:3001/health

# Check Redis
redis-cli ping
```

---

## Feature 1: Profile Page - Post & Media Tab

### Test Case 1.1: Media Rendering in Post Tab (Own Profile)

**Steps:**
1. Login as User A
2. Navigate to `/profile`
3. Ensure you're on "Posts" tab (default)
4. Create a new post with image:
   - Click "Create Post" button
   - Enter text: "Test post with image"
   - Upload an image (JPG/PNG, < 5MB)
   - Click "Post"
5. Wait for upload to complete
6. Verify the post appears in feed

**Expected Results:**
- ✅ Post shows text content
- ✅ Image renders correctly below text
- ✅ Image has rounded corners and border
- ✅ Image is clickable/zoomable
- ✅ No console errors

**Verification Points:**
```javascript
// Check in browser console
document.querySelectorAll('[class*="mediaItems"]').length > 0
// Should return true if media is rendered
```

### Test Case 1.2: Media Rendering in Post Tab (Other's Profile)

**Steps:**
1. Stay logged in as User A
2. Navigate to User B's profile: `/u/tester2`
3. View posts in "Posts" tab
4. Scroll through all posts

**Expected Results:**
- ✅ All posts with media show images/videos
- ✅ Text-only posts show text only
- ✅ Videos show play button overlay
- ✅ Video duration displayed (if available)
- ✅ Media loads progressively (lazy loading)

### Test Case 1.3: Action Menu in Profile - Own Posts

**Steps:**
1. On your profile (`/profile`)
2. Find a post you created
3. Click the three-dot menu (⋮) on the post

**Expected Results:**
- ✅ Menu appears with 2 options:
  - "Edit postingan"
  - "Hapus postingan"
- ✅ No "Report" option visible
- ✅ Menu has proper styling and positioning

### Test Case 1.4: Edit Post (Text Only)

**Steps:**
1. Click "Edit postingan" from menu
2. Edit modal should appear
3. Modify the text content
4. Try to remove/change media (should not be possible)
5. Click "Save"

**Expected Results:**
- ✅ Modal shows current post text
- ✅ Media is displayed but not editable
- ✅ No option to remove or replace media
- ✅ Text can be edited
- ✅ Save updates text only
- ✅ Media remains unchanged
- ✅ Post updates in real-time

**Note:** If edit modal is not yet implemented, this should show TODO message.

### Test Case 1.5: Delete Post

**Steps:**
1. Click "Hapus postingan" from menu
2. Confirmation modal appears
3. Click "Confirm Delete"

**Expected Results:**
- ✅ Confirmation modal shows warning
- ✅ Post is removed from profile
- ✅ Post is removed from feed
- ✅ Database record deleted
- ✅ Media files remain in storage (for reference)

### Test Case 1.6: Tab Media - Gallery View

**Steps:**
1. On your profile (`/profile`)
2. Click "Media" tab
3. View the media gallery

**Expected Results:**
- ✅ Grid layout (2-4 columns depending on screen size)
- ✅ Only media from posts shown (no text-only posts)
- ✅ Images show thumbnails
- ✅ Videos show thumbnail with play icon
- ✅ Video duration badge visible
- ✅ Click media opens modal viewer
- ✅ Modal shows full-size media
- ✅ Modal has close button (X)
- ✅ Videos play in modal

### Test Case 1.7: Tab Media - Empty State

**Steps:**
1. Login as a new user with no posts
2. Navigate to profile
3. Click "Media" tab

**Expected Results:**
- ✅ Empty state message: "No media yet"
- ✅ Helpful text: "Photos and videos from posts will appear here"
- ✅ Icon displayed (image icon)
- ✅ No loading spinner

### Test Case 1.8: Tab Media - Other User's Profile

**Steps:**
1. Navigate to User B's profile: `/u/tester2`
2. Click "Media" tab

**Expected Results:**
- ✅ Shows User B's media only
- ✅ Grid layout consistent
- ✅ Click opens modal viewer
- ✅ No edit/delete options

---

## Feature 2: Feed Page - Action Menu

### Test Case 2.1: Own Post in Feed - No Menu

**Steps:**
1. Navigate to `/feed`
2. Find your own post in the feed
3. Look for three-dot menu

**Expected Results:**
- ✅ NO three-dot menu visible on own posts
- ✅ Post displays normally
- ✅ Like, comment, share buttons visible
- ✅ Bookmark button visible

### Test Case 2.2: Other's Post in Feed - Report Menu

**Steps:**
1. Still on `/feed`
2. Find a post from User B or User C
3. Click three-dot menu (⋮)

**Expected Results:**
- ✅ Menu appears
- ✅ Only ONE option: "Laporkan postingan"
- ✅ No Edit option
- ✅ No Delete option
- ✅ Menu styled correctly

### Test Case 2.3: Report Post Action

**Steps:**
1. Click "Laporkan postingan"
2. Observe behavior

**Expected Results:**
- ✅ Report modal appears (or TODO message)
- ✅ Console logs report action
- ✅ Menu closes after click
- ✅ No errors in console

**Note:** Full report functionality may show TODO message if not implemented.

---

## Feature 3: Follow/Unfollow System

### Test Case 3.1: Follow User from Profile

**Steps:**
1. Login as User A
2. Navigate to User B's profile: `/u/tester2`
3. Verify initial state (not following)
4. Click "Follow" button

**Expected Results:**
- ✅ Button shows "Follow" initially
- ✅ Button changes to "Following" after click
- ✅ Button shows loading state during request
- ✅ Follower count increases by 1
- ✅ No page refresh needed
- ✅ No errors in console

### Test Case 3.2: Unfollow User

**Steps:**
1. On User B's profile (already following)
2. Click "Following" button
3. Observe behavior

**Expected Results:**
- ✅ Button changes back to "Follow"
- ✅ Follower count decreases by 1
- ✅ Loading state shown
- ✅ Real-time update
- ✅ No errors

### Test Case 3.3: Follow from Post Click

**Steps:**
1. Go to `/feed`
2. Find a post from User C
3. Click on User C's name/avatar
4. Should navigate to `/u/tester3`
5. Click "Follow" button

**Expected Results:**
- ✅ Navigation works correctly
- ✅ Profile loads
- ✅ Follow button functional
- ✅ No 404 or routing errors

### Test Case 3.4: Follow Status Persistence

**Steps:**
1. Follow User B
2. Refresh the page (F5)
3. Check follow status

**Expected Results:**
- ✅ Still shows "Following" button
- ✅ Follower count correct
- ✅ Data persisted in database

### Test Case 3.5: Multiple Follow/Unfollow

**Steps:**
1. Follow User B
2. Unfollow User B
3. Follow User B again
4. Repeat 5 times

**Expected Results:**
- ✅ Each action works correctly
- ✅ No duplicate entries in database
- ✅ Count updates accurately
- ✅ No race conditions
- ✅ No errors

### Test Case 3.6: Cannot Follow Self

**Steps:**
1. Navigate to your own profile
2. Look for Follow button

**Expected Results:**
- ✅ No Follow button visible
- ✅ Shows "Edit Profile" button instead
- ✅ Stats show your own followers/following

### Test Case 3.7: Follow from Different Sessions

**Steps:**
1. Login as User A in Browser 1
2. Login as User B in Browser 2 (incognito)
3. User A follows User B
4. Check User B's profile in Browser 2

**Expected Results:**
- ✅ User B sees follower count increase
- ✅ May need refresh (unless real-time implemented)
- ✅ Database shows correct relationship

---

## Feature 4: Notification System

### Test Case 4.1: Access Notifications Page

**Steps:**
1. Login as User A
2. Click "Notifications" in sidebar
3. Should navigate to `/notifications`

**Expected Results:**
- ✅ Page loads successfully
- ✅ Shows "Notifikasi" heading
- ✅ Shows notification list or empty state
- ✅ No 404 error

### Test Case 4.2: Follow Notification Creation

**Steps:**
1. Login as User A in Browser 1
2. Login as User B in Browser 2
3. User A follows User B
4. In Browser 2, navigate to `/notifications`

**Expected Results:**
- ✅ New notification appears
- ✅ Format: "tester1 mulai mengikuti Anda"
- ✅ Shows User A's avatar
- ✅ Shows timestamp (e.g., "2 menit yang lalu")
- ✅ Notification is unread (has indicator)
- ✅ Notification at top of list

### Test Case 4.3: Unfollow Notification (Optional)

**Steps:**
1. User A unfollows User B
2. Check User B's notifications

**Expected Results:**
- ✅ New notification: "tester1 berhenti mengikuti Anda"
- ✅ Or no notification (depending on implementation)
- ✅ Previous follow notification remains

### Test Case 4.4: Notification Timestamp

**Steps:**
1. Create a follow notification
2. Wait 1 minute
3. Refresh notifications page
4. Check timestamp

**Expected Results:**
- ✅ Shows "1 menit yang lalu"
- ✅ Updates to "2 menit yang lalu" after another minute
- ✅ Shows "1 jam yang lalu" after 60 minutes
- ✅ Shows date for older notifications
- ✅ Uses Indonesian locale

### Test Case 4.5: Mark Notification as Read

**Steps:**
1. Have unread notifications
2. Click on a notification

**Expected Results:**
- ✅ Notification marked as read
- ✅ Unread indicator (dot) disappears
- ✅ Navigates to relevant page (user profile)
- ✅ Database updated

### Test Case 4.6: Mark All as Read

**Steps:**
1. Have multiple unread notifications
2. Click "Tandai semua dibaca" button

**Expected Results:**
- ✅ All notifications marked as read
- ✅ All unread indicators disappear
- ✅ Button may disappear or disable
- ✅ Database updated

### Test Case 4.7: Notification Click Navigation

**Steps:**
1. Click on a follow notification
2. Observe navigation

**Expected Results:**
- ✅ Navigates to follower's profile
- ✅ URL: `/u/{username}`
- ✅ Profile loads correctly
- ✅ Can follow back from there

### Test Case 4.8: Empty Notifications State

**Steps:**
1. Login as new user with no notifications
2. Navigate to `/notifications`

**Expected Results:**
- ✅ Shows empty state message
- ✅ "Belum ada notifikasi"
- ✅ Helpful text about what notifications will show
- ✅ Bell icon displayed
- ✅ No loading spinner

### Test Case 4.9: Notification List Pagination

**Steps:**
1. Create 50+ notifications (follow/unfollow multiple times)
2. Navigate to notifications page
3. Scroll to bottom

**Expected Results:**
- ✅ Shows first 20-50 notifications
- ✅ Load more button or infinite scroll
- ✅ Smooth loading
- ✅ No duplicate notifications

---

## Database Verification

### Test Case 5.1: UserFollow Table

**SQL Query:**
```sql
SELECT * FROM user_follows 
WHERE follower_id = 'user_a_id' 
AND following_id = 'user_b_id';
```

**Expected Results:**
- ✅ Record exists when following
- ✅ Record deleted when unfollowed
- ✅ `created_at` timestamp accurate
- ✅ No duplicate records

### Test Case 5.2: Notification Table

**SQL Query:**
```sql
SELECT * FROM notifications 
WHERE user_id = 'user_b_id' 
AND actor_id = 'user_a_id'
ORDER BY created_at DESC;
```

**Expected Results:**
- ✅ Notification record created on follow
- ✅ `type` = 'FOLLOW'
- ✅ `is_read` = false initially
- ✅ `created_at` timestamp accurate
- ✅ Proper foreign key relationships

### Test Case 5.3: Post Media Relation

**SQL Query:**
```sql
SELECT p.id, p.content, pm.media_type, pm.public_url 
FROM posts p
LEFT JOIN post_media pm ON p.id = pm.post_id
WHERE p.user_id = 'user_a_id';
```

**Expected Results:**
- ✅ Posts with media have post_media records
- ✅ Text-only posts have no post_media records
- ✅ Multiple media per post supported
- ✅ `sort_order` maintained

### Test Case 5.4: Follower Count Accuracy

**SQL Query:**
```sql
-- User B's followers
SELECT COUNT(*) FROM user_follows 
WHERE following_id = 'user_b_id';

-- User B's following
SELECT COUNT(*) FROM user_follows 
WHERE follower_id = 'user_b_id';
```

**Expected Results:**
- ✅ Count matches UI display
- ✅ Updates in real-time
- ✅ No orphaned records

---

## API Testing

### Test Case 6.1: Follow User API

**Request:**
```bash
curl -X POST http://localhost:3001/api/users/{userId}/follow \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "message": "User followed successfully"
}
```

**Status Code:** `200 OK`

### Test Case 6.2: Unfollow User API

**Request:**
```bash
curl -X DELETE http://localhost:3001/api/users/{userId}/follow \
  -H "Authorization: Bearer {token}"
```

**Expected Response:**
```json
{
  "message": "User unfollowed successfully"
}
```

**Status Code:** `200 OK`

### Test Case 6.3: Get Notifications API

**Request:**
```bash
curl -X GET http://localhost:3001/api/users/notifications?page=1&limit=20 \
  -H "Authorization: Bearer {token}"
```

**Expected Response:**
```json
{
  "message": "Notifications fetched successfully",
  "data": {
    "notifications": [
      {
        "id": "notif_id",
        "type": "FOLLOW",
        "isRead": false,
        "createdAt": "2025-01-15T10:30:00Z",
        "actor": {
          "id": "user_id",
          "username": "tester1",
          "firstName": "Test",
          "lastName": "User",
          "fotoProfilUrl": "https://..."
        },
        "post": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

**Status Code:** `200 OK`

### Test Case 6.4: Get User Posts with Media

**Request:**
```bash
curl -X GET http://localhost:3001/api/users/{userId}/posts?page=1&limit=20 \
  -H "Authorization: Bearer {token}"
```

**Expected Response:**
```json
{
  "message": "Posts fetched successfully",
  "data": {
    "posts": [
      {
        "id": "post_id",
        "content": "Post text",
        "mediaItems": [
          {
            "id": "media_id",
            "mediaType": "image",
            "url": "https://...",
            "previewImageUrl": null,
            "mimeType": "image/jpeg",
            "fileSize": 1024000,
            "width": 1920,
            "height": 1080
          }
        ],
        "likes": 5,
        "comments": 2,
        "isOwner": true,
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

### Test Case 6.5: Error Handling - Follow Self

**Request:**
```bash
curl -X POST http://localhost:3001/api/users/{ownUserId}/follow \
  -H "Authorization: Bearer {token}"
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "You cannot follow yourself"
}
```

**Status Code:** `400 Bad Request`

### Test Case 6.6: Error Handling - Already Following

**Request:**
```bash
# Follow same user twice
curl -X POST http://localhost:3001/api/users/{userId}/follow \
  -H "Authorization: Bearer {token}"
```

**Expected Response:**
```json
{
  "statusCode": 400,
  "message": "You are already following this user"
}
```

**Status Code:** `400 Bad Request`

---

## Edge Cases & Error Handling

### Test Case 7.1: Network Error During Follow

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to follow a user
4. Re-enable network

**Expected Results:**
- ✅ Shows error message
- ✅ Button returns to original state
- ✅ User can retry
- ✅ No duplicate requests

### Test Case 7.2: Session Expired

**Steps:**
1. Login and get token
2. Wait for token to expire (or manually expire)
3. Try to follow a user

**Expected Results:**
- ✅ Shows "Session expired" message
- ✅ Redirects to login page
- ✅ No crash or white screen

### Test Case 7.3: User Not Found

**Steps:**
1. Navigate to `/u/nonexistentuser`

**Expected Results:**
- ✅ Shows "User not found" page
- ✅ Helpful message
- ✅ Link back to feed
- ✅ No crash

### Test Case 7.4: Large Media Upload

**Steps:**
1. Try to upload image > 10MB
2. Try to upload video > 50MB

**Expected Results:**
- ✅ Shows file size error
- ✅ Upload rejected
- ✅ Helpful message about size limits
- ✅ No server crash

### Test Case 7.5: Concurrent Follow/Unfollow

**Steps:**
1. Open 2 browser tabs
2. Follow user in Tab 1
3. Immediately unfollow in Tab 2
4. Check database

**Expected Results:**
- ✅ Final state is consistent
- ✅ No duplicate records
- ✅ No race condition errors
- ✅ Notification count accurate

### Test Case 7.6: Deleted User Profile

**Steps:**
1. Follow User B
2. User B deletes account (simulate in DB)
3. Check your following list
4. Check notifications

**Expected Results:**
- ✅ Follow relationship removed (cascade delete)
- ✅ Notifications may remain or be removed
- ✅ No broken links
- ✅ No errors

---

## Performance Testing

### Test Case 8.1: Feed Load Time

**Steps:**
1. Navigate to `/feed`
2. Measure time to first post visible
3. Check Network tab

**Expected Results:**
- ✅ First post visible < 2 seconds
- ✅ Images lazy load
- ✅ No blocking requests
- ✅ Smooth scrolling

### Test Case 8.2: Notification Load Time

**Steps:**
1. Have 100+ notifications
2. Navigate to `/notifications`
3. Measure load time

**Expected Results:**
- ✅ Page loads < 1 second
- ✅ Pagination works
- ✅ Smooth scrolling
- ✅ No memory leaks

### Test Case 8.3: Media Gallery Performance

**Steps:**
1. Profile with 50+ media items
2. Navigate to Media tab
3. Scroll through gallery

**Expected Results:**
- ✅ Grid renders quickly
- ✅ Thumbnails load progressively
- ✅ No layout shift
- ✅ Smooth scrolling

---

## Test Completion Checklist

### Feature 1: Profile - Post & Media ✅
- [ ] Media renders in posts (own profile)
- [ ] Media renders in posts (other's profile)
- [ ] Action menu shows Edit & Delete
- [ ] Edit post (text only) works
- [ ] Delete post works
- [ ] Media tab shows gallery
- [ ] Media tab empty state
- [ ] Media modal viewer works

### Feature 2: Feed - Action Menu ✅
- [ ] Own posts have no menu
- [ ] Other's posts show Report menu
- [ ] Report action works

### Feature 3: Follow/Unfollow ✅
- [ ] Follow button works
- [ ] Unfollow button works
- [ ] Follower count updates
- [ ] Status persists after refresh
- [ ] Cannot follow self
- [ ] No duplicate follows

### Feature 4: Notifications ✅
- [ ] Notifications page accessible
- [ ] Follow creates notification
- [ ] Notification format correct
- [ ] Timestamp accurate
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Click navigates correctly
- [ ] Empty state shows

### Database ✅
- [ ] UserFollow records correct
- [ ] Notification records correct
- [ ] PostMedia relations correct
- [ ] Counts accurate

### API ✅
- [ ] Follow API works
- [ ] Unfollow API works
- [ ] Get notifications API works
- [ ] Get posts with media API works
- [ ] Error handling works

### Edge Cases ✅
- [ ] Network errors handled
- [ ] Session expiry handled
- [ ] User not found handled
- [ ] Large files rejected
- [ ] Concurrent actions handled

### Performance ✅
- [ ] Feed loads quickly
- [ ] Notifications load quickly
- [ ] Media gallery performs well

---

## Bug Report Template

If you find bugs during testing, use this template:

```markdown
## Bug Report

**Feature:** [e.g., Follow System]
**Test Case:** [e.g., 3.1 - Follow User from Profile]
**Severity:** [Critical / High / Medium / Low]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots:**
[Attach if applicable]

**Console Errors:**
```
[Paste console errors]
```

**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Backend Version: [commit hash]
- Frontend Version: [commit hash]

**Additional Notes:**
[Any other relevant information]
```

---

## Success Criteria

All features are considered successfully implemented when:

1. ✅ All test cases pass
2. ✅ No critical bugs found
3. ✅ Database integrity maintained
4. ✅ API responses correct
5. ✅ UI/UX smooth and responsive
6. ✅ Error handling robust
7. ✅ Performance acceptable
8. ✅ No console errors
9. ✅ Mobile responsive
10. ✅ Accessibility basic compliance

---

**Testing Date:** _____________
**Tester Name:** _____________
**Test Environment:** _____________
**Overall Status:** [ ] Pass [ ] Fail [ ] Partial

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
