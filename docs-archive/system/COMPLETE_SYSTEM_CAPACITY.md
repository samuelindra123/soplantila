# Complete System Capacity Analysis
## Social Media Platform - All Scenarios

---

## PENTING: Peran Redis dalam Sistem

### ❌ **MISKONSEPSI**: Redis TIDAK menghandle upload media
### ✅ **FAKTA**: Redis hanya menghandle QUEUE untuk background processing

### Alur Upload yang Benar:
```
User Upload Media
    ↓
Client → DigitalOcean Spaces (Direct Upload)
    ↓
Get uploadId
    ↓
POST /api/posts/draft (content + uploadIds)
    ↓
API Server → Database (save post DRAFT)
    ↓
API Server → Redis Queue (add job)
    ↓
Background Worker → Process job
    ↓
Confirm upload & Update post to PUBLISHED
```

**Redis hanya menyimpan**:
- Job metadata (postId, userId, uploadIds)
- Job status (pending, processing, completed, failed)
- Queue management

**Upload media langsung ke**:
- DigitalOcean Spaces (storage)
- Tidak melalui Redis
- Tidak melalui API server

---

## SCENARIO 1: FREE TIER (Current Setup)

### Infrastructure
```
┌─────────────────────────────────────────┐
│ FREE TIER SETUP                         │
├─────────────────────────────────────────┤
│ API Server: Railway/Vercel Free        │
│ Redis: Upstash Free (10K commands/day) │
│ Database: Supabase Free (500MB)        │
│ Storage: DO Spaces ($5/month)          │
│                                         │
│ Total Cost: $5/month                   │
└─────────────────────────────────────────┘
```

### Capacity Analysis

#### **1. Redis Queue (BOTTLENECK)**
```
Commands per day: 10,000
Commands per post: ~15
Posts per day: 10,000 ÷ 15 = 666 posts
Safety margin (80%): 666 × 0.8 = ~530 posts/day
```

#### **2. API Server (Railway/Vercel Free)**
```
CPU: Shared (0.5-1 vCPU equivalent)
RAM: 512 MB
Concurrent requests: 100-200
Request timeout: 10-30 seconds
```

**Capacity per Operation**:

| Operation | Time | Throughput | Daily Capacity |
|-----------|------|------------|----------------|
| **Register** | 200-500ms | 10 req/s | 864,000 registrations/day |
| **Login** | 100-300ms | 20 req/s | 1,728,000 logins/day |
| **Get Feed** | 200-500ms | 10 req/s | 864,000 feed loads/day |
| **Create Post (draft)** | 50-100ms | 50 req/s | 4,320,000 posts/day |
| **Upload Media** | 1-5s | Direct to Spaces | Unlimited |
| **Like/Comment** | 50-100ms | 100 req/s | 8,640,000 actions/day |

**API Server NOT a bottleneck** - Redis Queue is!

#### **3. Database (Supabase Free)**
```
Storage: 500 MB
Connections: 60 concurrent
Bandwidth: 2 GB/month
```

**Capacity**:
- Users: ~50,000 users (10KB per user)
- Posts: ~100,000 posts (5KB per post)
- Daily writes: ~10,000 writes/day
- Daily reads: ~100,000 reads/day

#### **4. Storage (DigitalOcean Spaces)**
```
Storage: Unlimited (pay per GB)
Bandwidth: 1 TB/month
Upload: Direct from client
```

**Capacity**:
- Images (2MB avg): 500,000 images/month
- Videos (20MB avg): 50,000 videos/month
- Daily uploads: ~16,000 files/day

---

### **FREE TIER FINAL CAPACITY**

| Metric | Capacity | Bottleneck |
|--------|----------|------------|
| **Active Users/Day** | 200-300 | Redis Queue |
| **New Registrations/Day** | 500-1,000 | None |
| **Logins/Day** | 1,000-2,000 | None |
| **Posts/Day** | **530** | **Redis Queue** ⚠️ |
| **Media Uploads/Day** | 16,000 | Storage bandwidth |
| **Feed Loads/Day** | 10,000-20,000 | None |
| **Likes/Comments/Day** | 50,000-100,000 | None |
| **Concurrent Users** | 30-50 | API Server RAM |

### **User Behavior Assumptions**:
```
Average user per day:
- Login: 2x
- View feed: 5x
- Create post: 2x (LIMITED BY REDIS!)
- Upload media: 2x
- Like/comment: 10x
- Profile views: 3x

Total requests per user: ~24 requests/day
```

**With 300 active users**:
- Total requests: 7,200 requests/day
- Peak hour (10% of daily): 720 requests/hour = 0.2 req/s
- API can handle: 100+ req/s
- **API is NOT the bottleneck!**

---

## SCENARIO 2: BUDGET SETUP ($17/month)

### Infrastructure
```
┌─────────────────────────────────────────┐
│ BUDGET SETUP                            │
├─────────────────────────────────────────┤
│ API + Redis: DO Droplet $12 (2GB RAM)  │
│ Database: Supabase Free (500MB)        │
│ Storage: DO Spaces ($5/month)          │
│                                         │
│ Total Cost: $17/month                  │
└─────────────────────────────────────────┘
```

### Server Specs (DigitalOcean $12/month)
```
CPU: 1 vCPU (Intel/AMD)
RAM: 2 GB
Storage: 50 GB SSD
Bandwidth: 2 TB/month
```

### Capacity Analysis

#### **1. Redis (Self-hosted on same server)**
```
RAM allocated: 1.5 GB (75% of 2GB)
Commands: UNLIMITED
Connections: 5,000 concurrent
```

**Capacity**:
- Posts/day: **50,000** (no limit!)
- Queue jobs: 2,000 jobs/hour
- Job processing: 5-10 seconds per job

#### **2. API Server (NestJS on same server)**
```
RAM allocated: 500 MB (25% of 2GB)
CPU: 1 vCPU shared with Redis
Concurrent requests: 200-500
```

**Capacity per Operation**:

| Operation | Time | Throughput | Daily Capacity |
|-----------|------|------------|----------------|
| **Register** | 100-200ms | 20 req/s | 1,728,000/day |
| **Login** | 50-100ms | 50 req/s | 4,320,000/day |
| **Get Feed** | 100-200ms | 20 req/s | 1,728,000/day |
| **Create Post** | 20-50ms | 100 req/s | 8,640,000/day |
| **Like/Comment** | 20-50ms | 200 req/s | 17,280,000/day |

#### **3. Database (Supabase Free)**
```
Same as free tier: 500 MB, 60 connections
```

**Capacity**:
- Users: ~50,000 users
- Posts: ~100,000 posts
- **Becomes bottleneck at 50K users!**

#### **4. Storage (DigitalOcean Spaces)**
```
Same as free tier: 1 TB bandwidth/month
```

---

### **BUDGET SETUP FINAL CAPACITY**

| Metric | Capacity | Bottleneck |
|--------|----------|------------|
| **Active Users/Day** | 2,000-5,000 | Database storage |
| **New Registrations/Day** | 2,000-5,000 | None |
| **Logins/Day** | 10,000-20,000 | None |
| **Posts/Day** | **20,000-50,000** | Database writes |
| **Media Uploads/Day** | 16,000 | Storage bandwidth |
| **Feed Loads/Day** | 50,000-100,000 | Database reads |
| **Likes/Comments/Day** | 200,000-500,000 | None |
| **Concurrent Users** | 200-500 | API Server CPU |

### **User Behavior**:
```
With 5,000 active users:
- Total requests: 120,000 requests/day
- Peak hour: 12,000 requests/hour = 3.3 req/s
- API can handle: 200+ req/s
- **Still NOT the bottleneck!**
```

---

## SCENARIO 3: PRODUCTION SETUP ($59/month)

### Infrastructure
```
┌─────────────────────────────────────────┐
│ PRODUCTION SETUP                        │
├─────────────────────────────────────────┤
│ API + Redis: DO Droplet $24 (4GB RAM)  │
│ Database: Managed PostgreSQL $30       │
│ Storage: DO Spaces ($5/month)          │
│                                         │
│ Total Cost: $59/month                  │
└─────────────────────────────────────────┘
```

### Server Specs (DigitalOcean $24/month)
```
CPU: 2 vCPUs (Intel/AMD)
RAM: 4 GB
Storage: 80 GB SSD
Bandwidth: 4 TB/month
```

### Capacity Analysis

#### **1. Redis (Self-hosted)**
```
RAM allocated: 3 GB (75% of 4GB)
Commands: UNLIMITED
Connections: 10,000 concurrent
```

**Capacity**:
- Posts/day: **100,000+**
- Queue jobs: 5,000 jobs/hour
- Job processing: 2-5 seconds per job

#### **2. API Server (NestJS)**
```
RAM allocated: 1 GB (25% of 4GB)
CPU: 2 vCPUs
Concurrent requests: 1,000-2,000
```

**Capacity per Operation**:

| Operation | Time | Throughput | Daily Capacity |
|-----------|------|------------|----------------|
| **Register** | 50-100ms | 50 req/s | 4,320,000/day |
| **Login** | 30-50ms | 100 req/s | 8,640,000/day |
| **Get Feed** | 50-100ms | 50 req/s | 4,320,000/day |
| **Create Post** | 10-30ms | 200 req/s | 17,280,000/day |
| **Like/Comment** | 10-20ms | 500 req/s | 43,200,000/day |

#### **3. Database (Managed PostgreSQL $30)**
```
CPU: 1 vCPU
RAM: 1 GB
Storage: 10 GB
Connections: 25 concurrent
```

**Capacity**:
- Users: ~500,000 users
- Posts: ~5,000,000 posts
- Daily writes: 50,000 writes/day
- Daily reads: 500,000 reads/day

#### **4. Storage (DigitalOcean Spaces)**
```
Bandwidth: 4 TB/month (from API server)
```

**Capacity**:
- Daily uploads: 130,000 files/day

---

### **PRODUCTION SETUP FINAL CAPACITY**

| Metric | Capacity | Bottleneck |
|--------|----------|------------|
| **Active Users/Day** | 10,000-20,000 | Database connections |
| **New Registrations/Day** | 5,000-10,000 | None |
| **Logins/Day** | 50,000-100,000 | None |
| **Posts/Day** | **50,000-100,000** | Database writes |
| **Media Uploads/Day** | 130,000 | Storage bandwidth |
| **Feed Loads/Day** | 200,000-500,000 | Database reads |
| **Likes/Comments/Day** | 1,000,000+ | None |
| **Concurrent Users** | 1,000-2,000 | API Server RAM |

### **User Behavior**:
```
With 20,000 active users:
- Total requests: 480,000 requests/day
- Peak hour: 48,000 requests/hour = 13.3 req/s
- API can handle: 1,000+ req/s
- **Database becomes bottleneck at peak!**
```

---

## SCENARIO 4: SCALE SETUP ($152/month)

### Infrastructure
```
┌─────────────────────────────────────────┐
│ SCALE SETUP                             │
├─────────────────────────────────────────┤
│ API: 2x DO Droplet $24 (4GB RAM each)  │
│ Redis: Dedicated DO $12 (2GB RAM)      │
│ Database: Managed PostgreSQL $60       │
│ Storage: DO Spaces + CDN ($20/month)   │
│ Load Balancer: $12/month               │
│                                         │
│ Total Cost: $152/month                 │
└─────────────────────────────────────────┘
```

### Capacity Analysis

#### **1. Redis (Dedicated Server)**
```
CPU: 1 vCPU
RAM: 2 GB (100% for Redis)
Commands: UNLIMITED
Connections: 10,000 concurrent
```

**Capacity**:
- Posts/day: **200,000+**
- Queue jobs: 10,000 jobs/hour
- Job processing: 1-3 seconds per job

#### **2. API Servers (2x instances)**
```
Each server:
- CPU: 2 vCPUs
- RAM: 4 GB
- Concurrent: 2,000 requests

Total capacity: 4,000 concurrent requests
```

**Capacity per Operation**:

| Operation | Throughput | Daily Capacity |
|-----------|------------|----------------|
| **Register** | 100 req/s | 8,640,000/day |
| **Login** | 200 req/s | 17,280,000/day |
| **Get Feed** | 100 req/s | 8,640,000/day |
| **Create Post** | 400 req/s | 34,560,000/day |
| **Like/Comment** | 1,000 req/s | 86,400,000/day |

#### **3. Database (Managed PostgreSQL $60)**
```
CPU: 2 vCPUs
RAM: 4 GB
Storage: 50 GB
Connections: 100 concurrent
```

**Capacity**:
- Users: ~2,000,000 users
- Posts: ~20,000,000 posts
- Daily writes: 200,000 writes/day
- Daily reads: 2,000,000 reads/day

---

### **SCALE SETUP FINAL CAPACITY**

| Metric | Capacity | Bottleneck |
|--------|----------|------------|
| **Active Users/Day** | 50,000-100,000 | None |
| **New Registrations/Day** | 20,000-50,000 | None |
| **Logins/Day** | 200,000-500,000 | None |
| **Posts/Day** | **200,000-500,000** | None |
| **Media Uploads/Day** | 500,000+ | None |
| **Feed Loads/Day** | 2,000,000+ | None |
| **Likes/Comments/Day** | 5,000,000+ | None |
| **Concurrent Users** | 5,000-10,000 | Load Balancer |

---

## COMPLETE COMPARISON TABLE

| Setup | Cost | Users/Day | Posts/Day | Concurrent | Bottleneck |
|-------|------|-----------|-----------|------------|------------|
| **Free Tier** | $5 | 200-300 | 530 | 30-50 | Redis Queue |
| **Budget** | $17 | 2,000-5,000 | 20,000 | 200-500 | Database |
| **Production** | $59 | 10,000-20,000 | 50,000 | 1,000-2,000 | Database |
| **Scale** | $152 | 50,000-100,000 | 200,000 | 5,000-10,000 | None |

---

## DETAILED OPERATION BREAKDOWN

### **1. User Registration**
```
Flow:
Client → POST /api/auth/register
    ↓
Validate input (email, password)
    ↓
Hash password (bcrypt)
    ↓
Insert to database
    ↓
Send verification email
    ↓
Return success

Time: 200-500ms
Bottleneck: Email sending (async)
Capacity: Unlimited (async processing)
```

### **2. User Login**
```
Flow:
Client → POST /api/auth/login
    ↓
Find user in database
    ↓
Verify password (bcrypt)
    ↓
Generate JWT token
    ↓
Return token + user data

Time: 100-300ms
Bottleneck: Database query
Capacity: 10,000-50,000 logins/day per server
```

### **3. Create Post with Media**
```
Flow:
Client → Upload media to DO Spaces (direct)
    ↓
Get uploadId
    ↓
Client → POST /api/posts/draft
    ↓
API → Insert post to database (DRAFT)
    ↓
API → Add job to Redis queue
    ↓
Return postId immediately
    ↓
Background Worker → Process job
    ↓
Confirm upload & Update post (PUBLISHED)

Time: 50-100ms (API response)
Background: 2-10s (processing)
Bottleneck: Redis queue (free tier only)
Capacity: 530 posts/day (free) to unlimited (paid)
```

### **4. Get Feed**
```
Flow:
Client → GET /api/feed?page=1
    ↓
Query database (posts with PUBLISHED status)
    ↓
Join with user profiles
    ↓
Join with media
    ↓
Return paginated results

Time: 100-500ms
Bottleneck: Database query complexity
Capacity: 10,000-100,000 requests/day
Optimization: Cache with Redis (5 min TTL)
```

### **5. Like/Comment**
```
Flow:
Client → POST /api/posts/:id/like
    ↓
Check if already liked
    ↓
Insert/Delete like record
    ↓
Update post likes count
    ↓
Return success

Time: 50-100ms
Bottleneck: Database write
Capacity: 50,000-500,000 actions/day
```

---

## OPTIMIZATION RECOMMENDATIONS

### **For Free Tier (Current)**
```
1. ✅ Implement feed caching (reduce DB reads by 80%)
2. ✅ Optimize database indexes
3. ✅ Compress images before upload
4. ✅ Use connection pooling
5. ⚠️ Monitor Redis commands usage daily
```

### **When to Upgrade**
```
Upgrade to Budget ($17) when:
- Redis commands > 8,000/day
- Active users > 250/day
- Posts > 500/day

Upgrade to Production ($59) when:
- Active users > 3,000/day
- Posts > 15,000/day
- Database storage > 400 MB

Upgrade to Scale ($152) when:
- Active users > 15,000/day
- Posts > 40,000/day
- API response time > 500ms
```

---

## FINAL ANSWER

### **Free Tier dapat menghandle**:
- ✅ **200-300 active users per hari**
- ✅ **530 posts per hari** (LIMITED BY REDIS!)
- ✅ **30-50 concurrent users**
- ✅ **1,000-2,000 registrations per hari**
- ✅ **10,000-20,000 feed loads per hari**
- ✅ **50,000-100,000 likes/comments per hari**
- ✅ **16,000 media uploads per hari**

### **Bottleneck**: Redis Queue (Upstash free 10K commands/day)
### **NOT Bottleneck**: API Server, Database, Storage

### **Rekomendasi Server untuk Scale**:

| Users/Day | Server Spec | Cost | Posts/Day |
|-----------|-------------|------|-----------|
| 0-300 | Free tier | $5 | 530 |
| 300-5K | 2GB RAM, 1 vCPU | $17 | 20,000 |
| 5K-20K | 4GB RAM, 2 vCPUs | $59 | 50,000 |
| 20K-100K | 2x 4GB + dedicated Redis | $152 | 200,000 |

**Kesimpulan**: Sistem sudah bagus, Redis queue adalah satu-satunya bottleneck di free tier! 🚀
