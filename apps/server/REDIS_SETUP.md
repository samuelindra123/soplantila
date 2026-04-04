# Redis Setup Instructions (Upstash)

## Step 1: Create Upstash Account & Database

1. Go to: https://console.upstash.com/
2. Sign up (free, no credit card required)
3. Click "Create Database"
4. Select:
   - Name: soplantila-queue
   - Type: Regional
   - Region: Choose closest to your server
   - TLS: Enabled
5. Click "Create"

## Step 2: Get Connection Details

After database created, you'll see:
- Endpoint: `xxx-xxx-xxx.upstash.io`
- Port: `6379`
- Password: `AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ`

## Step 3: Update .env File

Replace these values in `apps/server/.env`:

```env
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
REDIS_HOST=YOUR_ENDPOINT.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_PASSWORD
REDIS_TLS=true
```

Example (with real values):
```env
REDIS_URL=redis://default:AxxxQ@abc-123-xyz.upstash.io:6379
REDIS_HOST=abc-123-xyz.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AxxxQ
REDIS_TLS=true
```

## Step 4: Test Connection

Run: `pnpm run start:dev`

You should see: "Redis connected successfully"

## Free Tier Limits:
- 10,000 commands/day
- ~200 uploads/day
- Perfect for development & small apps
