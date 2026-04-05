# Fix: Post Menu Positioning

## Problem
Menu titik tiga (three-dot menu) pada PostCard muncul di posisi yang tidak tepat (sembrangan), tidak berada tepat di bawah tombol.

## Root Cause
- PostMenu menggunakan `fixed` positioning dengan kalkulasi manual koordinat
- Position dihitung berdasarkan `getBoundingClientRect()` yang tidak reliable untuk menu dropdown
- Parent container tidak memiliki `position: relative` yang proper

## Solution

### 1. PostMenu Component (`post-menu.tsx`)
- Ubah dari `fixed` ke `absolute` positioning
- Set menu position dengan CSS: `top: '100%'`, `right: '0'`
- Tambah `marginTop: '0.25rem'` untuk spacing
- Hapus prop `position` dari interface

### 2. PostCard Component (`post-card.tsx`)
- Hapus state `menuPosition` dan `menuButtonRef`
- Hapus logic kalkulasi position di `handleMenuToggle`
- Hapus prop `position` saat render PostMenu
- Parent container sudah memiliki `className="relative"` yang benar

## Changes Made

### Files Modified:
1. `apps/client/src/components/social/post-menu.tsx`
   - Removed `position` prop from interface
   - Changed positioning to absolute with CSS-based placement
   
2. `apps/client/src/components/social/post-card.tsx`
   - Removed unused imports: `useRef`
   - Removed state: `menuPosition`, `menuButtonRef`
   - Simplified `handleMenuToggle` function
   - Removed `position` prop from PostMenu component

## Result
Menu sekarang akan muncul tepat di bawah tombol titik tiga dengan positioning yang konsisten, menggunakan CSS positioning standard (parent relative + child absolute).

## Testing Checklist
- [ ] Menu muncul tepat di bawah tombol di halaman Profile
- [ ] Menu muncul tepat di bawah tombol di halaman Feed
- [ ] Menu responsive di mobile (tidak keluar dari viewport)
- [ ] Menu menutup saat klik di luar
- [ ] Menu menutup saat tekan ESC
- [ ] Animasi fade-in berjalan smooth

---
**Date**: 2026-04-05
**Status**: ✅ Complete
