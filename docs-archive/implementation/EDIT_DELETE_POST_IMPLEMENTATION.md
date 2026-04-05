# Implementation: Edit & Delete Post Features

## Overview
Implementasi fitur edit dan delete postingan dengan validasi ownership dan UI yang user-friendly.

## Backend Implementation

### 1. Update Post DTO
**File**: `apps/server/src/modules/posts/dto/update-post.dto.ts`

```typescript
export class UpdatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'Content tidak boleh kosong' })
  @MaxLength(5000, { message: 'Content maksimal 5000 karakter' })
  content: string;
}
```

### 2. Posts Service
**File**: `apps/server/src/modules/posts/posts.service.ts`

Added method `updatePost`:
- Validates post ownership
- Updates only content (media cannot be changed)
- Broadcasts update event via SSE
- Returns formatted post response

### 3. Posts Controller
**File**: `apps/server/src/modules/posts/posts.controller.ts`

Added endpoint:
```
PUT /posts/:id
```

Features:
- JWT authentication required
- Validates ownership
- Updates post content only
- Returns success message with updated data

Existing endpoint:
```
DELETE /posts/:id
```

Features:
- JWT authentication required
- Validates ownership
- Deletes post and cascades to media
- Cleans up storage files asynchronously

## Frontend Implementation

### 1. Edit Post Modal
**File**: `apps/client/src/components/social/edit-post-modal.tsx`

Features:
- Textarea with character counter (max 5000)
- Loading state during save
- Validation: content cannot be empty
- Clear messaging: "Anda hanya bisa mengedit teks, media tidak bisa diubah"
- Responsive design with backdrop blur
- Uses React Portal to render at body level (prevents z-index issues)
- Prevents body scroll when modal is open
- Auto-focus on textarea when opened
- z-index: 9999 to ensure it appears above all other elements

### 2. Post Card Integration
**File**: `apps/client/src/components/social/post-card.tsx`

Added:
- `isEditModalOpen` state
- `isEditing` state
- `handleEditClick()` - Opens edit modal
- `handleEditConfirm()` - Calls API and refreshes page
- `handleDeleteConfirm()` - Calls API and refreshes page (updated from TODO)

Updated:
- Pass `onEdit` prop to PostMenu
- Render EditPostModal component
- Proper error handling with user feedback

### 3. Post Menu
**File**: `apps/client/src/components/social/post-menu.tsx`

Already supports:
- Edit button (calls `onEdit` callback)
- Delete button (calls `onDelete` callback)
- Conditional rendering based on `isOwnPost` and `showInFeed`

## API Endpoints

### Update Post
```
PUT /api/backend/posts/:id
Content-Type: application/json

Body:
{
  "content": "Updated post content"
}

Response:
{
  "message": "Post updated successfully.",
  "data": { ...post }
}
```

### Delete Post
```
DELETE /api/backend/posts/:id

Response:
{
  "message": "Post deleted successfully."
}
```

## Business Rules

### Edit Post
1. Only post owner can edit
2. Only content can be edited (media is immutable)
3. Content must not be empty
4. Content max 5000 characters
5. Update broadcasts to SSE for real-time updates

### Delete Post
1. Only post owner can delete
2. Deletion cascades to PostMedia table
3. Storage files cleaned up asynchronously
4. Deletion broadcasts to SSE for real-time updates

## User Experience

### Edit Flow
1. User clicks three-dot menu on own post (in Profile page)
2. Clicks "Edit postingan"
3. Modal opens with current content
4. User edits text (character counter visible)
5. Clicks "Simpan"
6. Loading state shown
7. Page refreshes to show updated post
8. If error: alert shown, modal stays open

### Delete Flow
1. User clicks three-dot menu on own post
2. Clicks "Hapus postingan"
3. Confirmation modal appears
4. User confirms deletion
5. Loading state shown
6. Page refreshes (post removed)
7. If error: alert shown, modal stays open

## Error Handling

### Backend
- 404: Post not found
- 403: Not authorized (not post owner)
- 400: Validation errors (empty content, too long)

### Frontend
- Network errors: Alert with retry message
- Validation: Inline feedback (character counter, empty check)
- Loading states: Disabled buttons, spinner

## Testing Checklist

### Backend
- [ ] PUT /posts/:id with valid data returns 200
- [ ] PUT /posts/:id with empty content returns 400
- [ ] PUT /posts/:id with >5000 chars returns 400
- [ ] PUT /posts/:id by non-owner returns 403
- [ ] PUT /posts/:id with invalid ID returns 404
- [ ] DELETE /posts/:id by owner returns 200
- [ ] DELETE /posts/:id by non-owner returns 403
- [ ] DELETE /posts/:id with invalid ID returns 404
- [ ] Storage cleanup happens after delete

### Frontend
- [ ] Edit button only shows in Profile page for own posts
- [ ] Edit modal opens with current content
- [ ] Character counter updates correctly
- [ ] Cannot save empty content
- [ ] Cannot save during loading
- [ ] Success: page refreshes with updated content
- [ ] Error: alert shown, can retry
- [ ] Delete confirmation modal works
- [ ] Delete success: post removed from list
- [ ] Delete error: alert shown

### Integration
- [ ] Edit post updates in database
- [ ] Edit post broadcasts SSE event
- [ ] Delete post removes from database
- [ ] Delete post broadcasts SSE event
- [ ] Media files not affected by edit
- [ ] Media files cleaned up after delete

## Future Improvements

1. Optimistic UI updates (no page refresh)
2. Toast notifications instead of alerts
3. Undo delete functionality
4. Edit history tracking
5. Draft save for edits
6. Batch delete for multiple posts

---
**Date**: 2026-04-05
**Status**: ✅ Complete
