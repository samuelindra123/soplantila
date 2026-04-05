# Kapasitas Sistem Saat Ini
## Redis Self-hosted + API Backend Development (Free Tier)

**Tanggal**: 5 April 2026
**Status**: Redis sudah upgrade, API masih free tier

---

## SETUP SAAT INI

```
┌─────────────────────────────────────────────────┐
│ CURRENT INFRASTRUCTURE                          │
├─────────────────────────────────────────────────┤
│ ✅ Redis: Self-hosted DO Droplet $12 (2GB RAM) │
│ ⚠️  API Backend: Railway/Vercel Free (512MB)   │
│ ⚠️  Database: Supabase Free (500MB, 5GB/month) │
│ ✅ Storage: DO Spaces ($5/month, 1TB/month)    │
│                                                 │
│ Total Cost: $17/month                          │
└─────────────────────────────────────────────────┘
```

---

## KOMPONEN SISTEM & KAPASITAS

### 1. Redis (Self-hosted) - ✅ TIDAK LAGI BOTTLENECK!

**Spesifikasi**:
```
Server: DigitalOcean Droplet $12/month
CPU: 1 vCPU
RAM: 2 GB (allocated 1.5GB untuk Redis)
Storage: 50 GB SSD
Bandwidth: 2 TB/month
Redis Version: 7.0.15
```

**Kapasitas**:
```
Commands per day: UNLIMITED ✅
Connections: 1,000 concurrent
Memory: 1.5 GB
Latency: 1-5ms (sangat cepat!)

Posts per day: 50,000+ (tidak ada limit!)
Queue jobs: 2,000 jobs/hour
Job processing: 5-10 seconds per job
```

**Kesimpulan**: Redis BUKAN bottleneck lagi! 🎉

---

### 2. API Backend (Railway/Vercel Free) - ⚠️ BOTTLENECK BARU!

**Spesifikasi**:
```
Platform: Railway Free / Vercel Free
CPU: Shared (0.5-1 vCPU equivalent)
RAM: 512 MB
Concurrent requests: 100-200
Request timeout: 10-30 seconds
Bandwidth: Unlimited (tapi CPU terbatas)
```

**Kapasitas per Operation**:

| Operation | Response Time | Throughput | Daily Capacity |
|-----------|---------------|------------|----------------|
| **Register** | 200-500ms | 10 req/s | 864,000/day |
| **Login** | 100-300ms | 20 req/s | 1,728,000/day |
| **Get Feed** | 200-500ms | 10 req/s | 864,000/day |
| **Create Post (draft)** | 50-100ms | 50 req/s | 4,320,000/day |
| **Like/Comment** | 50-100ms | 100 req/s | 8,640,000/day |

**Realitas dengan Shared CPU**:
```
Peak throughput: 50-100 req/s (bukan 100+ req/s)
Sustained throughput: 20-30 req/s
Concurrent users: 100-200 (bukan 500+)
```

**Kapasitas Realistis**:
- **Posts/day**: 5,000-10,000 (LIMITED BY CPU!)
- **Active users/day**: 500-1,000
- **Concurrent users**: 100-200

**Kesimpulan**: API Backend sekarang jadi bottleneck! ⚠️

---

### 3. Database (Supabase Free) - ⚠️⚠️ BOTTLENECK UTAMA!

**Spesifikasi**:
```
Storage: 500 MB
Connections: 60 concurrent
Bandwidth: 5 GB/month ⚠️⚠️⚠️
Row limit: Unlimited
```

**Kapasitas Storage**:
```
User record: ~10 KB per user
Post record: ~5 KB per post

Max users: 500 MB ÷ 10 KB = 50,000 users ✅
Max posts: 500 MB ÷ 5 KB = 100,000 posts ✅
```

**Kapasitas Bandwidth** (INI MASALAH BESAR!):
```
Bandwidth: 5 GB/month = 166 MB/day ⚠️⚠️⚠️

Feed request size: ~100 KB (10 posts + user data + media URLs)
Feed requests per day: 166 MB ÷ 100 KB = 1,660 requests/day

Post creation: ~10 KB per request
Post creations per day: 166 MB ÷ 10 KB = 16,600 posts/day

User profile: ~50 KB per request
Profile views per day: 166 MB ÷ 50 KB = 3,320 views/day
```

**Bandwidth Breakdown per User**:
```
1 user aktif per hari:
- Login: 5 KB
- View feed 5x: 5 × 100 KB = 500 KB
- Create post 2x: 2 × 10 KB = 20 KB
- Like/comment 10x: 10 × 2 KB = 20 KB
- Profile views 3x: 3 × 50 KB = 150 KB

Total per user: ~554 KB/day
```

**Kapasitas User**:
```
166 MB/day ÷ 554 KB/user = 306 users/day ⚠️⚠️⚠️
```

**Kesimpulan**: Database bandwidth adalah BOTTLENECK UTAMA! 🚨

---

### 4. Storage (DigitalOcean Spaces) - ✅ AMAN

**Spesifikasi**:
```
Storage: Unlimited (pay per GB)
Bandwidth: 1 TB/month
Upload: Direct from client (tidak melalui API)
CDN: Included
```

**Kapasitas**:
```
Images (2MB avg): 500,000 images/month
Videos (20MB avg): 50,000 videos/month
Daily uploads: ~16,000 files/day
```

**Kesimpulan**: Storage BUKAN bottleneck! ✅

---

## ANALISIS BOTTLENECK

### Ranking Bottleneck (dari paling parah):

1. **🚨 Database Bandwidth (Supabase Free)**: 5GB/month = 166MB/day
   - Hanya bisa handle **306 users/day** tanpa optimasi
   - Hanya bisa handle **1,660 feed loads/day**
   - INI BOTTLENECK PALING PARAH!

2. **⚠️ API Backend CPU (Railway/Vercel Free)**: Shared CPU
   - Bisa handle **5,000-10,000 posts/day**
   - Bisa handle **500-1,000 active users/day**
   - Bottleneck kedua

3. **✅ Redis (Self-hosted)**: TIDAK LAGI BOTTLENECK!
   - Unlimited commands
   - Bisa handle 50,000+ posts/day
   - Latency 1-5ms

4. **✅ Storage (DO Spaces)**: TIDAK BOTTLENECK
   - 1TB bandwidth/month
   - Direct upload dari client

---

## KAPASITAS SISTEM SAAT INI (REALISTIS)

### Tanpa Optimasi:

| Metric | Capacity | Bottleneck |
|--------|----------|------------|
| **Active Users/Day** | **300-500** | Database bandwidth |
| **New Registrations/Day** | 1,000-2,000 | None |
| **Logins/Day** | 2,000-5,000 | None |
| **Posts/Day** | **5,000-10,000** | API CPU |
| **Feed Loads/Day** | **1,000-1,660** | Database bandwidth ⚠️⚠️ |
| **Likes/Comments/Day** | 50,000-100,000 | None |
| **Concurrent Users** | **100-200** | API CPU |

### Dengan Optimasi (Cache + Pagination):

| Metric | Capacity | Improvement |
|--------|----------|-------------|
| **Active Users/Day** | **1,000-1,500** | 3x |
| **Posts/Day** | **10,000-15,000** | 2x |
| **Feed Loads/Day** | **5,000-8,000** | 5x |
| **Concurrent Users** | **200-300** | 2x |

---

## SKENARIO PENGGUNAAN REAL

### Skenario 1: 300 Active Users/Day (Tanpa Optimasi)

**User Behavior**:
```
Per user per day:
- Login: 2x = 10 KB
- View feed: 5x = 500 KB
- Create post: 2x = 20 KB
- Like/comment: 10x = 20 KB
- Profile views: 3x = 150 KB

Total: 700 KB/user/day
```

**Total Bandwidth**:
```
300 users × 700 KB = 210 MB/day
Monthly: 210 MB × 30 = 6.3 GB/month ⚠️ (OVER LIMIT!)
```

**Kesimpulan**: Dengan 300 users, sudah OVER LIMIT! 🚨

---

### Skenario 2: 300 Active Users/Day (Dengan Cache Redis)

**Optimasi**:
```
- Cache feed di Redis (TTL 5 menit)
- Hit rate: 80% (8 dari 10 request dari cache)
- Hanya 20% request ke database
```

**User Behavior (Optimized)**:
```
Per user per day:
- Login: 2x = 10 KB
- View feed: 5x = 100 KB (80% dari cache, 20% dari DB)
- Create post: 2x = 20 KB
- Like/comment: 10x = 20 KB
- Profile views: 3x = 150 KB

Total: 300 KB/user/day (turun dari 700 KB!)
```

**Total Bandwidth**:
```
300 users × 300 KB = 90 MB/day
Monthly: 90 MB × 30 = 2.7 GB/month ✅ (AMAN!)
```

**Kesimpulan**: Dengan cache, 300 users AMAN! ✅

---

### Skenario 3: 1,000 Active Users/Day (Dengan Cache + Pagination)

**Optimasi**:
```
- Cache feed di Redis (TTL 5 menit)
- Pagination (10 posts per page, bukan 20)
- Lazy load images
- Compress response
```

**User Behavior (Heavily Optimized)**:
```
Per user per day:
- Login: 2x = 10 KB
- View feed: 5x = 50 KB (cache + pagination + lazy load)
- Create post: 2x = 20 KB
- Like/comment: 10x = 20 KB
- Profile views: 3x = 75 KB (lazy load)

Total: 175 KB/user/day
```

**Total Bandwidth**:
```
1,000 users × 175 KB = 175 MB/day
Monthly: 175 MB × 30 = 5.25 GB/month ✅ (AMAN!)
```

**Kesimpulan**: Dengan optimasi berat, 1,000 users AMAN! ✅

---

## BREAKDOWN BANDWIDTH DATABASE

### Request Types & Sizes:

| Request Type | Size | Frequency/User/Day | Total/User |
|--------------|------|-------------------|------------|
| **Login** | 5 KB | 2x | 10 KB |
| **Get Feed** | 100 KB | 5x | 500 KB |
| **Create Post** | 10 KB | 2x | 20 KB |
| **Like/Comment** | 2 KB | 10x | 20 KB |
| **Profile View** | 50 KB | 3x | 150 KB |
| **Get Notifications** | 10 KB | 5x | 50 KB |
| **Search** | 20 KB | 2x | 40 KB |
| **TOTAL** | - | - | **790 KB/user/day** |

### Bandwidth Limit Calculation:

```
Database bandwidth: 5 GB/month = 166 MB/day

Without optimization:
166 MB ÷ 790 KB = 210 users/day ⚠️

With feed cache (80% hit rate):
Feed: 500 KB → 100 KB (reduce 80%)
Total: 790 KB → 390 KB
166 MB ÷ 390 KB = 435 users/day ✅

With cache + pagination:
Feed: 500 KB → 50 KB (reduce 90%)
Total: 790 KB → 340 KB
166 MB ÷ 340 KB = 500 users/day ✅

With cache + pagination + lazy load:
Feed: 500 KB → 50 KB
Profile: 150 KB → 75 KB
Total: 790 KB → 265 KB
166 MB ÷ 265 KB = 640 users/day ✅

With all optimizations + compression:
Total: 790 KB → 110 KB (reduce 86%)
166 MB ÷ 110 KB = 1,545 users/day ✅✅
```

---

## OPTIMASI YANG HARUS DILAKUKAN

### Priority 1: Cache Feed di Redis (CRITICAL!)

**Implementasi**:
```typescript
// Cache feed untuk 5 menit
const cacheKey = `feed:user:${userId}:page:${page}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached); // Dari cache, TIDAK hit database!
}

const feed = await database.getFeed(userId, page);
await redis.setex(cacheKey, 300, JSON.stringify(feed)); // Cache 5 menit

return feed;
```

**Impact**:
- Reduce database bandwidth: 80%
- Capacity: 210 users → 435 users (2x!)
- Response time: 200ms → 5ms (40x faster!)

---

### Priority 2: Pagination

**Implementasi**:
```typescript
// Reduce dari 20 posts per page ke 10 posts
const POSTS_PER_PAGE = 10; // Sebelumnya 20

// Response size: 100 KB → 50 KB (50% reduction)
```

**Impact**:
- Reduce database bandwidth: 50%
- Capacity: 435 users → 500 users
- Better UX (faster load)

---

### Priority 3: Lazy Load Images

**Implementasi**:
```typescript
// Jangan kirim full image URLs di feed
// Kirim thumbnail URLs saja
{
  "mediaUrl": "https://cdn.../thumbnail.jpg", // 50KB
  "fullMediaUrl": "https://cdn.../full.jpg"   // Load on demand
}
```

**Impact**:
- Reduce database bandwidth: 30%
- Capacity: 500 users → 640 users
- Faster feed load

---

### Priority 4: Response Compression

**Implementasi**:
```typescript
// Enable gzip compression di NestJS
app.use(compression());

// Response size: 100 KB → 30 KB (70% reduction)
```

**Impact**:
- Reduce database bandwidth: 70%
- Capacity: 640 users → 1,545 users (2.4x!)
- Faster response time

---

## UPGRADE PATH

### Kapan Harus Upgrade?

#### Upgrade Database ke Supabase Pro ($25/month):
```
Trigger:
- Active users > 1,000/day
- Database bandwidth > 4 GB/month
- Feed loads > 5,000/day

Benefits:
- Bandwidth: 5 GB → 50 GB (10x!)
- Storage: 500 MB → 8 GB (16x!)
- Connections: 60 → 120 (2x!)
- Capacity: 1,500 users → 15,000 users (10x!)
```

#### Upgrade API ke Dedicated Server ($12-24/month):
```
Trigger:
- Active users > 500/day
- Posts > 5,000/day
- Response time > 500ms
- Concurrent users > 150

Benefits:
- CPU: Shared → 1-2 vCPU dedicated
- RAM: 512 MB → 2-4 GB
- Throughput: 50 req/s → 200 req/s (4x!)
- Capacity: 1,000 users → 5,000 users (5x!)
```

---

## MONITORING YANG HARUS DILAKUKAN

### 1. Database Bandwidth (CRITICAL!)

```bash
# Check di Supabase Dashboard
# Settings → Usage → Bandwidth

# Alert jika > 4 GB/month (80% limit)
```

### 2. API Response Time

```bash
# Monitor average response time
# Alert jika > 500ms
```

### 3. Redis Memory

```bash
redis-cli -h 139.59.235.81 -p 6379 -a 'PASSWORD' INFO memory

# Alert jika > 1.2 GB (80% limit)
```

### 4. Concurrent Users

```bash
# Monitor active connections
# Alert jika > 150 concurrent users
```

---

## KESIMPULAN FINAL

### Kapasitas Sistem Saat Ini:

**Tanpa Optimasi**:
- ❌ **306 users/day** (LIMITED BY DATABASE BANDWIDTH!)
- ❌ **1,660 feed loads/day**
- ⚠️ **5,000-10,000 posts/day** (limited by API CPU)
- ⚠️ **100-200 concurrent users**

**Dengan Optimasi (Cache + Pagination + Lazy Load + Compression)**:
- ✅ **1,000-1,500 users/day**
- ✅ **5,000-8,000 feed loads/day**
- ✅ **10,000-15,000 posts/day**
- ✅ **200-300 concurrent users**

### Bottleneck Ranking:

1. 🚨 **Database Bandwidth** (5GB/month) - BOTTLENECK UTAMA!
2. ⚠️ **API CPU** (Shared) - Bottleneck kedua
3. ✅ **Redis** (Self-hosted) - TIDAK LAGI BOTTLENECK!
4. ✅ **Storage** (DO Spaces) - TIDAK BOTTLENECK

### Action Items:

**Immediate (Sekarang)**:
1. ✅ Implement feed caching di Redis (Priority 1!)
2. ✅ Add pagination (10 posts per page)
3. ✅ Enable response compression
4. ✅ Lazy load images

**Short-term (1-2 minggu)**:
1. Monitor database bandwidth usage
2. Optimize database queries
3. Add database indexes
4. Implement connection pooling

**Mid-term (1-2 bulan)**:
1. Upgrade database ke Supabase Pro ($25) jika users > 1,000/day
2. Upgrade API ke dedicated server ($12-24) jika users > 500/day

### Cost Projection:

| Users/Day | Setup | Monthly Cost |
|-----------|-------|--------------|
| 0-300 | Current (with optimization) | $17 |
| 300-1,500 | Current + heavy optimization | $17 |
| 1,500-5,000 | + Supabase Pro | $42 |
| 5,000-15,000 | + Dedicated API | $66-90 |
| 15,000+ | + Scale infrastructure | $150+ |

---

**Status**: Redis sudah powerful, tapi database bandwidth jadi bottleneck baru! 🚨
**Next Step**: Implement feed caching ASAP untuk reduce database bandwidth 80%! 🚀

