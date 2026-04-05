# Test Case: Post Persistence After Refresh

## Langkah Test:
1. Buka browser console (F12)
2. Buat post baru dengan text "TEST POST 123"
3. Lihat console log - catat POST ID yang dibuat
4. Tunggu sampai post muncul di feed
5. Buka tab baru, paste URL ini: http://localhost:3000/api/backend/feed?page=1&limit=20
6. Cek apakah POST ID ada di response JSON
7. Refresh halaman feed
8. Cek apakah post masih ada

## Expected Behavior:
- Post harus ada di API response (step 6)
- Post harus tetap muncul setelah refresh (step 8)

## Jika Post TIDAK ada di API response (step 6):
→ MASALAH DI BACKEND: Post tidak tersimpan ke database

## Jika Post ADA di API response TAPI hilang setelah refresh (step 8):
→ MASALAH DI FRONTEND: Cache atau state management

## Debug Commands:

### Check database directly:
```bash
# Di terminal server
npx prisma studio
# Buka Posts table, cek apakah post ada
```

### Check localStorage cache:
```javascript
// Di browser console
const userId = 'YOUR_USER_ID'; // Ganti dengan user ID kamu
const cacheKey = `feed-cache:${userId}`;
const cache = localStorage.getItem(cacheKey);
console.log('Cache:', JSON.parse(cache));
```

### Check network requests:
1. Buka Network tab di DevTools
2. Filter: "feed"
3. Buat post baru
4. Refresh halaman
5. Lihat response dari GET /feed - apakah post ada?
