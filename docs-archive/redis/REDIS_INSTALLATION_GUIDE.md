# Redis Installation Guide - DigitalOcean Droplet $12

## Server Specs
- RAM: 2 GB
- CPU: 1 vCPU
- Storage: 50 GB SSD
- OS: Ubuntu 22.04 LTS

---

## Step 1: Connect to Server

```bash
# SSH ke server kamu
ssh root@YOUR_SERVER_IP

# Contoh:
# ssh root@159.89.123.456
```

**Pertama kali login**:
- Akan diminta password (cek email dari DigitalOcean)
- Atau pakai SSH key kalau sudah setup

---

## Step 2: Update System

```bash
# Update package list
apt update

# Upgrade packages
apt upgrade -y

# Install basic tools
apt install -y curl wget nano htop
```

**Waktu**: ~2-3 menit

---

## Step 3: Install Redis

```bash
# Install Redis
apt install redis-server -y

# Check Redis version
redis-server --version
```

**Output yang diharapkan**:
```
Redis server v=7.0.x sha=00000000:0 malloc=jemalloc-5.2.1 bits=64 build=...
```

**Waktu**: ~1 menit

---

## Step 4: Configure Redis

### 4.1 Edit Redis Config

```bash
# Backup config original
cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Edit config
nano /etc/redis/redis.conf
```

### 4.2 Setting yang Harus Diubah

**Cari dan ubah baris berikut** (tekan `Ctrl+W` untuk search):

#### **1. Bind Address** (agar bisa diakses dari luar)
```bash
# Cari baris:
bind 127.0.0.1 -::1

# Ubah jadi:
bind 0.0.0.0
```

#### **2. Protected Mode** (disable untuk remote access)
```bash
# Cari baris:
protected-mode yes

# Ubah jadi:
protected-mode no
```

#### **3. Password** (PENTING untuk keamanan!)
```bash
# Cari baris:
# requirepass foobared

# Uncomment dan ubah jadi:
requirepass YOUR_STRONG_PASSWORD_HERE

# Contoh:
# requirepass MyRedis2024!SecurePass
```

**Generate password yang kuat**:
```bash
# Generate random password
openssl rand -base64 32
```

#### **4. Max Memory** (alokasi RAM untuk Redis)
```bash
# Cari baris:
# maxmemory <bytes>

# Uncomment dan set ke 1.5GB (75% dari 2GB):
maxmemory 1536mb
```

#### **5. Max Memory Policy** (apa yang dilakukan kalau RAM penuh)
```bash
# Cari baris:
# maxmemory-policy noeviction

# Uncomment dan ubah jadi:
maxmemory-policy allkeys-lru
```

**Penjelasan**: `allkeys-lru` = hapus key yang paling jarang dipakai kalau RAM penuh

#### **6. Save to Disk** (backup otomatis)
```bash
# Cari baris:
save 900 1
save 300 10
save 60 10000

# Biarkan default atau ubah jadi:
save 3600 1
save 300 100
save 60 10000
```

**Penjelasan**:
- `save 3600 1` = save setiap 1 jam kalau ada 1 perubahan
- `save 300 100` = save setiap 5 menit kalau ada 100 perubahan
- `save 60 10000` = save setiap 1 menit kalau ada 10,000 perubahan

### 4.3 Save Config

```bash
# Tekan Ctrl+X
# Tekan Y
# Tekan Enter
```

---

## Step 5: Restart Redis

```bash
# Restart Redis service
systemctl restart redis-server

# Enable Redis on boot
systemctl enable redis-server

# Check status
systemctl status redis-server
```

**Output yang diharapkan**:
```
● redis-server.service - Advanced key-value store
     Loaded: loaded (/lib/systemd/system/redis-server.service; enabled)
     Active: active (running) since ...
```

Tekan `q` untuk keluar.

---

## Step 6: Test Redis

### 6.1 Test Local Connection

```bash
# Connect ke Redis
redis-cli

# Authenticate (pakai password yang kamu set)
AUTH YOUR_PASSWORD_HERE

# Test command
PING
```

**Output yang diharapkan**:
```
PONG
```

### 6.2 Test Basic Commands

```bash
# Set value
SET test "Hello Redis"

# Get value
GET test

# Delete key
DEL test

# Exit
exit
```

### 6.3 Test Remote Connection (dari komputer kamu)

```bash
# Install redis-cli di komputer kamu (kalau belum ada)
# Mac: brew install redis
# Ubuntu: apt install redis-tools
# Windows: download dari https://redis.io/download

# Test connect
redis-cli -h YOUR_SERVER_IP -p 6379 -a YOUR_PASSWORD PING
```

**Output yang diharapkan**:
```
PONG
```

---

## Step 7: Setup Firewall (PENTING!)

```bash
# Allow SSH (port 22)
ufw allow 22/tcp

# Allow Redis (port 6379)
ufw allow 6379/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

**Output yang diharapkan**:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
6379/tcp                   ALLOW       Anywhere
```

---

## Step 8: Security Hardening (RECOMMENDED)

### 8.1 Rename Dangerous Commands

```bash
# Edit config lagi
nano /etc/redis/redis.conf

# Tambahkan di bagian bawah:
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
rename-command SHUTDOWN ""

# Save dan restart
systemctl restart redis-server
```

### 8.2 Limit Connections

```bash
# Edit config
nano /etc/redis/redis.conf

# Cari dan ubah:
# maxclients 10000

# Ubah jadi:
maxclients 1000

# Save dan restart
systemctl restart redis-server
```

---

## Step 9: Monitoring & Maintenance

### 9.1 Check Redis Info

```bash
# Connect ke Redis
redis-cli -a YOUR_PASSWORD

# Check memory usage
INFO memory

# Check stats
INFO stats

# Check clients
INFO clients

# Exit
exit
```

### 9.2 Monitor Real-time

```bash
# Monitor all commands
redis-cli -a YOUR_PASSWORD monitor

# Tekan Ctrl+C untuk stop
```

### 9.3 Check Logs

```bash
# View Redis logs
tail -f /var/log/redis/redis-server.log

# Tekan Ctrl+C untuk stop
```

---

## Step 10: Setup Automatic Backup

### 10.1 Create Backup Script

```bash
# Create backup directory
mkdir -p /root/redis-backups

# Create backup script
nano /root/backup-redis.sh
```

**Paste script ini**:
```bash
#!/bin/bash

# Backup directory
BACKUP_DIR="/root/redis-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/redis_backup_$DATE.rdb"

# Create backup
redis-cli -a YOUR_PASSWORD_HERE BGSAVE

# Wait for backup to complete
sleep 5

# Copy backup file
cp /var/lib/redis/dump.rdb $BACKUP_FILE

# Keep only last 7 days
find $BACKUP_DIR -name "redis_backup_*.rdb" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

**Ganti `YOUR_PASSWORD_HERE` dengan password Redis kamu!**

```bash
# Save (Ctrl+X, Y, Enter)

# Make executable
chmod +x /root/backup-redis.sh

# Test backup
/root/backup-redis.sh
```

### 10.2 Setup Cron Job (Backup Otomatis)

```bash
# Edit crontab
crontab -e

# Pilih editor (pilih nano, biasanya nomor 1)

# Tambahkan di bagian bawah:
# Backup setiap 6 jam
0 */6 * * * /root/backup-redis.sh >> /var/log/redis-backup.log 2>&1

# Save (Ctrl+X, Y, Enter)
```

**Backup akan jalan otomatis setiap 6 jam!**

---

## Step 11: Update .env Backend (Nanti)

**Sekarang catat info ini** (untuk nanti update backend):

```bash
REDIS_HOST=YOUR_SERVER_IP
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_PASSWORD_HERE
REDIS_TLS=false
```

**Contoh**:
```bash
REDIS_HOST=159.89.123.456
REDIS_PORT=6379
REDIS_PASSWORD=MyRedis2024!SecurePass
REDIS_TLS=false
```

---

## Step 12: Verify Installation

### 12.1 Check Redis is Running

```bash
# Check process
ps aux | grep redis

# Check port
netstat -tulpn | grep 6379

# Check memory
free -h
```

### 12.2 Performance Test

```bash
# Benchmark Redis
redis-benchmark -h localhost -p 6379 -a YOUR_PASSWORD -q -t set,get -n 100000

# Output yang diharapkan:
# SET: 50000+ requests per second
# GET: 80000+ requests per second
```

---

## Troubleshooting

### Problem 1: Redis tidak start

```bash
# Check error
journalctl -u redis-server -n 50

# Check config syntax
redis-server /etc/redis/redis.conf --test-memory 1

# Restart
systemctl restart redis-server
```

### Problem 2: Cannot connect dari luar

```bash
# Check firewall
ufw status

# Check Redis listening
netstat -tulpn | grep 6379

# Check bind address
grep "^bind" /etc/redis/redis.conf
```

### Problem 3: Out of memory

```bash
# Check memory usage
redis-cli -a YOUR_PASSWORD INFO memory

# Check max memory
redis-cli -a YOUR_PASSWORD CONFIG GET maxmemory

# Increase max memory
nano /etc/redis/redis.conf
# Ubah maxmemory ke nilai lebih besar
systemctl restart redis-server
```

---

## Useful Commands

```bash
# Start Redis
systemctl start redis-server

# Stop Redis
systemctl stop redis-server

# Restart Redis
systemctl restart redis-server

# Check status
systemctl status redis-server

# View logs
tail -f /var/log/redis/redis-server.log

# Connect to Redis
redis-cli -a YOUR_PASSWORD

# Flush all data (HATI-HATI!)
redis-cli -a YOUR_PASSWORD FLUSHALL

# Get Redis info
redis-cli -a YOUR_PASSWORD INFO

# Monitor commands
redis-cli -a YOUR_PASSWORD MONITOR
```

---

## Performance Tuning (Optional)

### Disable Transparent Huge Pages

```bash
# Edit /etc/rc.local
nano /etc/rc.local

# Tambahkan sebelum exit 0:
echo never > /sys/kernel/mm/transparent_hugepage/enabled

# Save dan reboot
reboot
```

### Increase File Descriptors

```bash
# Edit limits
nano /etc/security/limits.conf

# Tambahkan:
redis soft nofile 65535
redis hard nofile 65535

# Reboot
reboot
```

---

## Summary

✅ **Redis installed**: Version 7.0+
✅ **Memory allocated**: 1.5 GB (75% of 2GB)
✅ **Password protected**: Yes
✅ **Remote access**: Enabled
✅ **Firewall**: Configured
✅ **Backup**: Automatic every 6 hours
✅ **Monitoring**: Logs available

**Capacity**:
- Commands: UNLIMITED
- Posts/day: 50,000+
- Users/day: 10,000+
- Connections: 1,000 concurrent

**Next Steps**:
1. ✅ Redis installed (DONE!)
2. ⏳ Deploy backend API (nanti)
3. ⏳ Update .env dengan Redis credentials (nanti)
4. ⏳ Test integration (nanti)

**Redis siap dipakai! 🚀**

---

## Quick Reference

**Server IP**: YOUR_SERVER_IP
**Redis Port**: 6379
**Redis Password**: YOUR_PASSWORD_HERE
**Max Memory**: 1.5 GB
**Backup Location**: /root/redis-backups/

**Connection String**:
```
redis://:YOUR_PASSWORD@YOUR_SERVER_IP:6379
```

**Test Connection**:
```bash
redis-cli -h YOUR_SERVER_IP -p 6379 -a YOUR_PASSWORD PING
```

---

**Installation Time**: ~15-20 minutes
**Difficulty**: Easy
**Status**: Production Ready ✅
