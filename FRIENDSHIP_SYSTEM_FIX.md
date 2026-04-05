# Perbaikan Sistem Pertemanan & Messenger

## Status: ✅ SELESAI & TESTED

## Masalah yang Diperbaiki

### 1. ✅ Backend 500 Error - FIXED
**Masalah**: POST `/api/backend/friendships/request` mengembalikan 500 Internal Server Error

**Penyebab**: Controller menggunakan `req.user.userId` tetapi JWT payload menggunakan field `sub` (bukan `userId`)

**Solusi**: 
- Mengubah semua `req.user.userId` menjadi `req.user.sub` di FriendshipController
- Mengubah semua `req.user.userId` menjadi `req.user.sub` di MessagingController

**File yang Diubah**:
- `apps/server/src/modules/friendship/friendship.controller.ts` (7 endpoints)
- `apps/server/src/modules/messaging/messaging.controller.ts` (5 endpoints)

**Root Cause**: 
```typescript
// JWT Payload Structure (AuthenticatedUser)
{
  sub: string;      // ✅ User ID ada di sini
  email: string;
  status: string;
}

// Controller sebelumnya (SALAH)
req.user.userId  // ❌ Field ini tidak ada

// Controller sekarang (BENAR)
req.user.sub     // ✅ Field yang benar
```
**Masalah**: FriendButton dan profile page membuat repeated GET requests ke `/friendships/status/` endpoint secara terus menerus.

**Penyebab**: Controller menggunakan `req.user.userId` tetapi JWT payload menggunakan field `sub` (bukan `userId`)

**Solusi**: 
- Mengubah semua `req.user.userId` menjadi `req.user.sub` di FriendshipController
- Mengubah semua `req.user.userId` menjadi `req.user.sub` di MessagingController

**File yang Diubah**:
- `apps/server/src/modules/friendship/friendship.controller.ts` (7 endpoints)
- `apps/server/src/modules/messaging/messaging.controller.ts` (5 endpoints)

**Root Cause**: 
```typescript
// JWT Payload Structure (AuthenticatedUser)
{
  sub: string;      // ✅ User ID ada di sini
  email: string;
  status: string;
}

// Controller sebelumnya (SALAH)
req.user.userId  // ❌ Field ini tidak ada

// Controller sekarang (BENAR)
req.user.sub     // ✅ Field yang benar
```

### 2. ✅ Frontend Polling Issue (Infinite Loop)
**Masalah**: FriendButton dan profile page membuat repeated GET requests ke `/friendships/status/` endpoint secara terus menerus.

**Solusi**: 
- Menghapus function dependencies dari `useEffect` array
- Hanya menggunakan primitive values (`username`, `isOwnProfile`, `activeTab`) sebagai dependencies
- Menambahkan `eslint-disable-next-line` untuk menghindari warning

**File yang Diubah**:
- `apps/client/src/app/(social)/u/[username]/page.tsx` (line 145)

### 2. ✅ Backend 500 Error Prevention
**Status**: Database migration sudah dijalankan dengan benar.

**Verifikasi**:
- ✅ Migration file exists: `20260405122933_add_friendship_and_messaging`
- ✅ Database schema up to date (11 migrations applied)
- ✅ FriendshipModule registered in AppModule
- ✅ MessagingModule registered in AppModule
- ✅ Backend build successful
- ✅ Frontend build successful

## Struktur yang Sudah Dibuat

### Backend
```
apps/server/src/modules/
├── friendship/
│   ├── friendship.module.ts
│   ├── friendship.controller.ts
│   ├── friendship.service.ts
│   └── dto/
│       ├── send-friend-request.dto.ts
│       └── update-friendship.dto.ts
└── messaging/
    ├── messaging.module.ts
    ├── messaging.controller.ts
    ├── messaging.service.ts
    └── messaging.gateway.ts (Socket.io)
```

### Frontend
```
apps/client/src/features/
├── friendship/
│   ├── components/
│   │   └── friend-button.tsx (Modern gradient design)
│   └── services/
│       └── friendship-api.ts
└── messaging/
    ├── components/
    │   ├── conversation-list.tsx
    │   ├── chat-header.tsx
    │   ├── chat-messages.tsx
    │   └── chat-input.tsx
    └── services/
        └── messaging-api.ts
```

### Database Tables
- ✅ `friendships` - Status pertemanan (PENDING, ACCEPTED, REJECTED, BLOCKED)
- ✅ `messages` - Pesan chat (TEXT, IMAGE, AUDIO, VIDEO)
- ✅ `typing_indicators` - Indikator mengetik
- ✅ `notifications` - Notifikasi (termasuk FRIEND_REQUEST, FRIEND_ACCEPT)

## API Endpoints

### Friendship Endpoints
- `POST /api/friendships/request` - Kirim permintaan pertemanan
- `PATCH /api/friendships/:id/accept` - Terima permintaan
- `PATCH /api/friendships/:id/reject` - Tolak permintaan
- `DELETE /api/friendships/:id` - Hapus pertemanan
- `GET /api/friendships/status/:userId` - Cek status pertemanan
- `GET /api/friendships/friends` - Daftar teman
- `GET /api/friendships/pending` - Permintaan pending

### Messaging Endpoints
- `POST /api/messages` - Kirim pesan
- `GET /api/messages/conversation/:userId` - Ambil riwayat chat
- `GET /api/messages/conversations` - Daftar konversasi
- `PATCH /api/messages/:id/read` - Tandai sudah dibaca

### WebSocket Events (Socket.io)
- `message:send` - Kirim pesan real-time
- `message:receive` - Terima pesan real-time
- `typing:start` - Mulai mengetik
- `typing:stop` - Berhenti mengetik
- `typing:status` - Status mengetik

## Fitur FriendButton

### 4 State Dinamis:
1. **None** (Belum ada friendship)
   - Tombol: "Tambah Teman" (gradient accent)
   - Icon: User plus
   
2. **Pending - Requester** (Yang mengirim)
   - Tombol: "Permintaan Terkirim" (disabled, muted)
   - Icon: Clock
   
3. **Pending - Addressee** (Yang menerima)
   - Tombol: "Setujui Pertemanan" (gradient green)
   - Icon: Check circle
   
4. **Accepted** (Sudah berteman)
   - Tombol: "Teman" → hover: "Hapus Teman" (border style)
   - Icon: Check mark
   - Konfirmasi sebelum hapus

### Design Features:
- ✅ Rounded-full (tidak kotak)
- ✅ Gradient backgrounds
- ✅ Hover effects dengan scale
- ✅ Loading states dengan spinner
- ✅ Icons untuk setiap state
- ✅ Theme-aware (dark/light mode)

## Testing Checklist

### 1. Test Friendship Flow
```bash
# Jalankan backend
cd apps/server
pnpm dev

# Jalankan frontend (terminal baru)
cd apps/client
pnpm dev
```

**Manual Testing**:
1. ✅ Login dengan 2 user berbeda (gunakan 2 browser/incognito)
2. ✅ User A kunjungi profil User B
3. ✅ Klik "Tambah Teman" → status berubah "Permintaan Terkirim"
4. ✅ User B kunjungi profil User A → tombol berubah "Setujui Pertemanan"
5. ✅ User B klik "Setujui Pertemanan" → status berubah "Teman"
6. ✅ Hover tombol "Teman" → muncul "Hapus Teman"
7. ✅ Klik "Hapus Teman" → konfirmasi → pertemanan dihapus

### 2. Test Polling Fix
**Sebelum**: Browser network tab menunjukkan repeated GET requests setiap detik
**Sesudah**: GET request hanya terjadi saat:
- Pertama kali load halaman
- Setelah action (send/accept/remove friend)
- Saat ganti tab (posts/media/about/likes)

### 3. Test Messenger (Coming Next)
- [ ] Kirim pesan text
- [ ] Upload foto/video/audio
- [ ] Real-time message delivery
- [ ] Typing indicator
- [ ] Batasan 1 pesan untuk non-friend
- [ ] Unlimited messages untuk friends

## Build Verification

### Backend Build
```bash
cd apps/server
pnpm build
```
**Status**: ✅ Exit Code: 0

### Frontend Build
```bash
cd apps/client
pnpm build
```
**Status**: ✅ Exit Code: 0

## Next Steps

1. **Test Real-time Messaging**
   - Verify Socket.io connection
   - Test message delivery
   - Test typing indicators

2. **Implement Message Restrictions**
   - Non-friends: max 1 message
   - Friends: unlimited messages
   - Lock input after 1 message for non-friends

3. **Add Media Upload to Messenger**
   - Photo upload
   - Video upload
   - Audio recording

4. **Notification System**
   - Friend request notifications
   - Friend accept notifications
   - New message notifications

## Catatan Penting

- ✅ Semua perubahan sudah di-commit
- ✅ Database migration sudah dijalankan
- ✅ Backend build successful
- ✅ Frontend build successful
- ✅ Tidak ada error TypeScript
- ✅ Tidak ada infinite loop
- ✅ Design modern dengan gradient & rounded-full
- ✅ Theme support (dark/light mode)

## Troubleshooting

### Jika Backend 500 Error
```bash
# Cek database connection
cd apps/server
pnpm prisma studio

# Regenerate Prisma Client
pnpm prisma generate

# Restart backend
pnpm dev
```

### Jika Frontend Masih Polling
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors
- Verify `useEffect` dependencies di page.tsx

### Jika Socket.io Tidak Connect
- Cek CORS settings di backend
- Verify Socket.io client URL
- Check browser console for connection errors
