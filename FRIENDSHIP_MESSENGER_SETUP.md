# Setup Friendship System & Real-time Messenger

Panduan lengkap untuk menginstall dan menjalankan fitur Sistem Pertemanan dan Real-time Messenger.

## 📋 Prerequisites

- Node.js 18+ dan pnpm
- PostgreSQL database
- Redis (untuk Bull Queue yang sudah ada)

## 🚀 Installation Steps

### 1. Install Dependencies

```bash
# Backend dependencies
cd apps/server
pnpm install

# Frontend dependencies  
cd ../client
pnpm install
```

### 2. Database Migration

```bash
cd apps/server

# Generate Prisma Client
pnpm prisma:generate

# Create and run migration
pnpm prisma:migrate:dev --name add_friendship_and_messaging

# Atau jika sudah ada migration, jalankan:
pnpm prisma:migrate:deploy
```

### 3. Environment Variables

Pastikan file `.env` di `apps/server` memiliki:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
CLIENT_URL="http://localhost:3000"
```

Pastikan file `.env.local` di `apps/client` memiliki:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

### 4. Start Services

```bash
# Terminal 1: Start Backend
cd apps/server
pnpm start:dev

# Terminal 2: Start Frontend
cd apps/client
pnpm dev
```

## 🧪 Testing

### Manual Testing Checklist

#### Friendship System

1. **Send Friend Request**
   - Login sebagai User A
   - Kunjungi profil User B (`/u/username-b`)
   - Klik tombol "Tambah Teman"
   - Verifikasi tombol berubah menjadi "Permintaan Terkirim"

2. **Accept Friend Request**
   - Login sebagai User B
   - Buka halaman Notifications (`/notifications`)
   - Lihat notifikasi friend request dari User A
   - Klik "Setujui Pertemanan"
   - Verifikasi status berubah menjadi "Teman"

3. **Dynamic Button Status**
   - User B kunjungi profil User A
   - Verifikasi tombol menampilkan "Setujui Pertemanan" (bukan "Tambah Teman")
   - Setelah accept, tombol berubah menjadi "Teman"

4. **Remove Friend**
   - Klik tombol "Teman" di profil
   - Konfirmasi penghapusan
   - Verifikasi status kembali ke "Tambah Teman"

#### Messaging System

1. **Access Messenger**
   - Klik ikon Paper Airplane di sidebar
   - Verifikasi halaman messenger terbuka dengan layout modern

2. **Send First Message (Non-Friend)**
   - Pilih user yang belum berteman dari conversation list
   - Atau klik "Kirim Pesan" di profil user
   - Kirim 1 pesan
   - Verifikasi input terkunci dengan pesan: "Anda hanya dapat mengirim 1 pesan sampai permintaan pertemanan disetujui"

3. **Unlimited Messages (Friends)**
   - Setelah pertemanan disetujui
   - Verifikasi input chat tidak terkunci
   - Kirim multiple pesan
   - Verifikasi semua pesan terkirim

4. **Real-time Features**
   - Buka 2 browser/tab berbeda (User A dan User B)
   - User A mulai mengetik
   - Verifikasi User B melihat:
     - "sedang mengetik..." di header
     - Animasi 3 dots di chat area
   - User A kirim pesan
   - Verifikasi User B menerima pesan secara real-time tanpa refresh

5. **Conversation List**
   - Verifikasi sidebar kiri menampilkan:
     - Daftar user yang sudah berteman
     - Daftar user yang pernah bertukar pesan
     - Last message preview
     - Unread count badge
     - Timestamp

6. **Media Support (UI Ready)**
   - Verifikasi tombol Photo, Video, Audio tersedia
   - Note: Backend sudah support, tinggal implement upload flow

## 🏗️ Architecture Overview

### Database Schema

**Friendships Table:**
- `id`: Primary key
- `requesterId`: User yang mengirim request
- `addresseeId`: User yang menerima request
- `status`: PENDING | ACCEPTED | REJECTED | BLOCKED
- `createdAt`, `updatedAt`

**Messages Table:**
- `id`: Primary key
- `senderId`, `receiverId`: User references
- `content`: Text content (nullable)
- `messageType`: TEXT | IMAGE | AUDIO | VIDEO
- `mediaUrl`, `thumbnailUrl`: Media URLs (nullable)
- `status`: SENT | DELIVERED | READ
- `isDeleted`: Soft delete flag
- `createdAt`, `updatedAt`

**TypingIndicators Table:**
- `id`: Primary key
- `userId`: User yang mengetik
- `targetId`: User yang menerima indikator
- `isTyping`: Boolean
- `updatedAt`

### Backend Modules

**FriendshipModule:**
- `FriendshipController`: REST endpoints
- `FriendshipService`: Business logic
- DTOs: SendFriendRequestDto, UpdateFriendshipDto

**MessagingModule:**
- `MessagingController`: REST endpoints
- `MessagingService`: Business logic
- `MessagingGateway`: WebSocket handler (Socket.io)
- DTOs: SendMessageDto, TypingIndicatorDto

### Frontend Components

**Friendship:**
- `FriendButton`: Dynamic button component
- `friendshipApi`: API client service

**Messaging:**
- `MessengerPage`: Main messenger layout
- `ConversationList`: Sidebar dengan daftar chat
- `ChatWindow`: Main chat container
- `ChatHeader`: Header dengan typing indicator
- `ChatMessages`: Message list dengan typing animation
- `ChatInput`: Input dengan media buttons
- `messagingApi`: API client service
- `socket.ts`: Socket.io client setup

## 🔧 API Endpoints

### Friendship

```
POST   /friendships/request          - Send friend request
PATCH  /friendships/:id/accept       - Accept friend request
PATCH  /friendships/:id/reject       - Reject friend request
DELETE /friendships/:id              - Remove friend
GET    /friendships/status/:userId   - Get friendship status
GET    /friendships/friends          - Get friends list
GET    /friendships/pending          - Get pending requests
```

### Messaging

```
POST   /messages                     - Send message (REST fallback)
GET    /messages/conversation/:id    - Get conversation history
GET    /messages/conversations       - Get conversation list
POST   /messages/mark-read/:id       - Mark messages as read
GET    /messages/can-send/:id        - Check if can send message
```

### WebSocket Events

**Client → Server:**
- `sendMessage`: Send new message
- `typing`: Update typing indicator
- `markAsRead`: Mark messages as read
- `joinConversation`: Join conversation room
- `leaveConversation`: Leave conversation room

**Server → Client:**
- `newMessage`: New message received
- `messageSent`: Message sent confirmation
- `messageError`: Error sending message
- `userTyping`: User typing indicator
- `messagesRead`: Messages marked as read

## 🎨 UI/UX Features

### Messenger Design (Facebook Messenger-inspired)

- **Modern Layout**: Sidebar + Chat window
- **Conversation List**: Avatar, name, last message, timestamp, unread badge
- **Chat Bubbles**: Blue (own) vs White (other)
- **Typing Indicator**: 
  - Header: "sedang mengetik..."
  - Chat: 3-dots bouncing animation
- **Message Status**: Sent, Delivered, Read
- **Media Buttons**: Photo, Video, Audio (UI ready)
- **Responsive**: Mobile-friendly layout

### Friendship UI

- **Dynamic Button States**:
  - None: "Tambah Teman" (Blue)
  - Pending (Requester): "Permintaan Terkirim" (Gray, disabled)
  - Pending (Addressee): "Setujui Pertemanan" (Green)
  - Accepted: "Teman" (Gray, removable)
- **Notifications**: Friend request & accept notifications
- **Profile Integration**: Buttons di profile header

## 🐛 Troubleshooting

### Socket.io Connection Issues

```bash
# Check if backend is running
curl http://localhost:4000/health

# Check Socket.io namespace
# Should connect to: http://localhost:4000/messaging
```

### Database Migration Errors

```bash
# Reset database (CAUTION: Deletes all data)
cd apps/server
pnpm prisma:migrate:reset

# Or manually fix:
pnpm prisma:migrate:resolve --rolled-back "migration_name"
pnpm prisma:migrate:deploy
```

### CORS Issues

Pastikan `CLIENT_URL` di backend `.env` sesuai dengan URL frontend.

## 📦 Build for Production

```bash
# Backend
cd apps/server
pnpm build
pnpm start:prod

# Frontend
cd apps/client
pnpm build
pnpm start
```

## ✅ Definition of Done

- [x] Database schema created with migrations
- [x] Backend API endpoints implemented
- [x] WebSocket real-time messaging working
- [x] Frontend UI components created
- [x] Friendship flow working (send, accept, reject, remove)
- [x] Message limit for non-friends (1 message)
- [x] Unlimited messages for friends
- [x] Typing indicators (header + animation)
- [x] Conversation list with unread counts
- [x] Modern messenger UI (Facebook-inspired)
- [x] Paper airplane icon in sidebar
- [x] Friend button in profile
- [x] Message button in profile
- [x] No localStorage usage (all persisted to DB)
- [x] Ready for `pnpm build`

## 🎯 Next Steps (Optional Enhancements)

1. **Media Upload**: Implement photo/video/audio upload flow
2. **Message Reactions**: Add emoji reactions to messages
3. **Message Search**: Search within conversations
4. **Group Chat**: Extend to support group conversations
5. **Voice/Video Call**: Integrate WebRTC for calls
6. **Push Notifications**: Browser push notifications
7. **Message Encryption**: End-to-end encryption
8. **Read Receipts**: Show who read messages
9. **Online Status**: Show user online/offline status
10. **Message Forwarding**: Forward messages to other chats

## 📝 Notes

- Semua data disimpan di PostgreSQL (tidak ada localStorage)
- Socket.io namespace: `/messaging`
- Typing indicator timeout: 1 second
- Message limit check dilakukan di backend
- Friendship status checked sebelum allow unlimited messages
- Real-time updates via WebSocket
- Fallback ke REST API jika WebSocket gagal

## 🤝 Contributing

Jika ada bug atau improvement, silakan buat issue atau pull request.

---

**Created by:** AI Assistant  
**Date:** 2026-04-05  
**Version:** 1.0.0
