# Soplantila - Social Media Platform

Platform sosial media modern dengan fitur real-time updates, media sharing, dan sistem notifikasi.

## 🚀 Features

### ✅ Core Features
- **Authentication & Onboarding** - Sistem registrasi dan login dengan JWT
- **User Profiles** - Profile lengkap dengan avatar, cover, dan bio
- **Posts & Feed** - Create, read, update, delete posts dengan media support
- **Media Upload** - Multi-file upload (images & videos) dengan queue processing
- **Real-time Updates** - Server-Sent Events (SSE) untuk instant feed updates

### ✅ Social Features (Latest)
- **Follow/Unfollow System** - Follow users dan lihat follower/following count
- **Notifications** - Real-time notifications untuk follow actions
- **Media Gallery** - Tab khusus untuk melihat semua media user
- **Post Actions** - Edit (text only) dan delete posts

## 📁 Project Structure

```
soplantila/
├── apps/
│   ├── client/          # Next.js frontend
│   └── server/          # NestJS backend
├── docs/                # Project documentation
├── docs-archive/        # 📚 Development documentation archive
│   ├── feed/           # Feed system docs
│   ├── redis/          # Redis setup & config
│   ├── upload/         # Upload system docs
│   ├── sse/            # Server-Sent Events docs
│   ├── system/         # System & infrastructure
│   ├── implementation/ # Feature implementation docs
│   └── tests/          # Testing documentation
└── example/            # Example configurations
```

## 📚 Documentation

Dokumentasi lengkap pengembangan tersedia di folder **[docs-archive/](docs-archive/)**

### Quick Links
- 📖 [Documentation Index](docs-archive/README.md)
- 🚀 [Latest Implementation](docs-archive/implementation/IMPLEMENTATION_COMPLETE.md) - Follow/Unfollow & Notifications
- 🔄 [Feed System](docs-archive/feed/REAL_TIME_FEED_COMPLETE.md)
- 📤 [Upload System](docs-archive/upload/UPLOAD_HISTORY_COMPLETE.md)
- 🔴 [Redis Setup](docs-archive/redis/REDIS_INSTALLATION_GUIDE.md)
- 🔌 [SSE Implementation](docs-archive/sse/SSE_FIX_COMPLETE.md)

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework dengan App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **date-fns** - Date formatting

### Backend
- **NestJS** - Node.js framework
- **Prisma** - ORM untuk PostgreSQL
- **PostgreSQL** - Database
- **Redis** - Queue & caching
- **Bull** - Job queue processing
- **JWT** - Authentication
- **DigitalOcean Spaces** - Media storage (S3-compatible)

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL
- Redis
- pnpm (recommended) or npm

### Installation

1. Clone repository
```bash
git clone <repository-url>
cd soplantila
```

2. Install dependencies
```bash
# Backend
cd apps/server
pnpm install

# Frontend
cd apps/client
pnpm install
```

3. Setup environment variables
```bash
# Backend (.env)
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret"
REDIS_HOST="localhost"
REDIS_PORT=6379
DO_SPACES_ENDPOINT="..."
DO_SPACES_KEY="..."
DO_SPACES_SECRET="..."

# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001/api"
```

4. Run database migrations
```bash
cd apps/server
npx prisma migrate dev
```

5. Start development servers
```bash
# Backend (port 3001)
cd apps/server
pnpm run start:dev

# Frontend (port 3000)
cd apps/client
pnpm run dev
```

## 📊 Database Schema

Key models:
- **User** - User accounts
- **OnboardingProfile** - User profiles
- **Post** - User posts
- **PostMedia** - Multi-media attachments
- **UserFollow** - Follow relationships
- **Notification** - User notifications
- **TempUpload** - Temporary upload tracking
- **UploadHistory** - Upload history & status

See `apps/server/prisma/schema.prisma` for complete schema.

## 🔐 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/verify-otp` - Verify email OTP

### Users
- `GET /profile/me` - Get own profile
- `GET /profile/:username` - Get user profile
- `POST /users/:userId/follow` - Follow user
- `DELETE /users/:userId/follow` - Unfollow user
- `GET /users/notifications` - Get notifications

### Posts
- `GET /posts/feed` - Get feed
- `POST /posts` - Create post
- `GET /posts/:id` - Get post
- `PATCH /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post
- `GET /users/:userId/posts` - Get user posts

### Upload
- `POST /upload/presigned-url` - Get presigned URL
- `POST /posts/instant` - Create post with media

## 🧪 Testing

```bash
# Backend tests
cd apps/server
pnpm run test

# Frontend tests
cd apps/client
pnpm run test
```

## 📝 Development Notes

- Semua dokumentasi development ada di `docs-archive/`
- File MD diorganisir berdasarkan kategori (feed, redis, upload, dll)
- Setiap folder punya README.md sendiri
- File dengan prefix `COMPLETE` adalah dokumentasi final

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is private and proprietary.

## 👥 Team

Development team internal.

---

**Last Updated:** 2025
**Version:** 1.0.0
