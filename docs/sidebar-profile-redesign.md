# Sidebar Profile Section Redesign

## Overview
Redesign sidebar dengan memindahkan profile section ke paling bawah dan menampilkan data user real dari database (username + profile photo).

## Tanggal Implementasi
4 April 2026

## Perubahan Utama

### 1. Reposisi Profile Section

**Sebelum:**
- Profile menu item berada di tengah navigation (setelah Messages)
- Menggunakan UserIcon generic
- Label: "Profile" (static text)

**Sesudah:**
- Profile section dipindahkan ke **paling bawah sidebar**
- Berada di atas Theme toggle dan Logout
- Posisi: `Bottom Section` → Profile → Theme → Logout

### 2. Profile Display dari Database

**Data yang Ditampilkan:**
```typescript
// From user.profile (backend data)
profile.fotoProfilUrl    // Profile photo URL
profile.username         // Username akun
profile.firstName        // First name
profile.lastName         // Last name
```

**Layout:**
- **Profile Photo**: 40px × 40px, rounded-xl
  - Jika ada foto: menampilkan `fotoProfilUrl` dari database
  - Jika tidak ada: fallback gradient dengan inisial
  - Border: 2px border-border-soft
  - Online indicator: green dot di pojok kanan bawah

- **Text Info** (desktop only):
  - Full name: font-bold, text-sm
  - Username: @username, text-xs, text-muted

### 3. Visual Design

**Profile Card Style:**
```tsx
// Normal state
className="hover:bg-surface-dark rounded-2xl px-3 py-3"

// Active state (saat di /profile)
className="bg-accent/10 border border-accent/20"
```

**Components:**
- Profile photo container: `h-10 w-10 rounded-xl overflow-hidden`
- Fallback avatar: `bg-gradient-to-br from-accent/20 to-accent/5`
- Online indicator: `h-3 w-3 bg-green-500 rounded-full`
- Initials: calculated dari firstName[0] + lastName[0]

### 4. Responsive Behavior

**Mobile (< 1024px):**
- Sidebar width: 70px
- Hanya tampil profile photo + online indicator
- Text (name/username) disembunyikan
- Active indicator: vertical bar accent di kanan

**Desktop (≥ 1024px):**
- Sidebar width: 260px
- Tampil profile photo + full name + username
- Text truncate jika terlalu panjang

### 5. Navigation Structure

**Menu Order (Top to Bottom):**
```
Logo
├── Feed
├── Explore
├── Notifications
├── Messages
└── Settings

Bottom Section (border-top)
├── Profile (with photo & username)
├── Theme Toggle
└── Logout
```

### 6. Fallback Handling

**Jika user.profile tidak ada:**
```typescript
const initials = user?.profile 
  ? `${user.profile.firstName[0] || ""}${user.profile.lastName[0] || ""}`.toUpperCase()
  : "U";

const username = user?.profile?.username || "user";
const fullName = user?.profile 
  ? `${user.profile.firstName} ${user.profile.lastName}`
  : "User";
```

**Avatar Fallback:**
- Tidak menggunakan UserIcon generic
- Gradient background: `from-accent/20 to-accent/5`
- Display inisial dengan font-bold text-accent

## Technical Implementation

### Profile Section Code
```tsx
<Link
  href="/profile"
  className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${
    pathname === "/profile"
      ? "bg-accent/10 border border-accent/20"
      : "hover:bg-surface-dark"
  }`}
>
  {/* Profile Photo with Online Indicator */}
  <div className="relative shrink-0">
    <div className="h-10 w-10 rounded-xl overflow-hidden border-2">
      {profilePhoto ? (
        <img src={profilePhoto} alt={`${username}'s profile`} />
      ) : (
        <div className="bg-gradient-to-br from-accent/20 to-accent/5">
          <span className="text-sm font-bold text-accent">{initials}</span>
        </div>
      )}
    </div>
    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 border-2 border-background rounded-full" />
  </div>

  {/* Name & Username (desktop only) */}
  <div className="hidden lg:block flex-1 min-w-0">
    <p className="font-bold text-sm text-foreground truncate">{fullName}</p>
    <p className="text-xs text-muted truncate">@{username}</p>
  </div>
</Link>
```

### Data Flow
```
AuthContext → user.profile → Sidebar Component
                              ├── fotoProfilUrl (profile photo)
                              ├── username (username display)
                              ├── firstName (for full name)
                              └── lastName (for full name)
```

## File yang Diubah

**`apps/client/src/components/layout/sidebar.tsx`**
- Removed UserIcon dari MENU_ITEMS
- Added profile section di bottom
- Integrated user data dari useAuth()
- Display profile photo & username dari database

## Benefits

### 1. UX Best Practice
- Profile di bawah mengikuti pattern aplikasi modern (Slack, Discord, VS Code)
- User identity selalu visible di posisi konsisten
- Quick access ke profile tanpa scroll

### 2. Data-Driven
- Username langsung dari database (bukan hardcoded)
- Profile photo real (bukan icon generic)
- Dynamic display based on user data

### 3. Visual Clarity
- Profile section terpisah jelas dari main navigation
- Online indicator menambah sense of presence
- Fallback yang elegan tanpa icon generic

### 4. Better Context
- User selalu tahu siapa yang sedang login
- Profile photo sebagai visual identifier
- Username sebagai text identifier

### 5. Responsive Design
- Mobile: compact dengan photo only
- Desktop: full info dengan name + username
- Smooth transitions antar breakpoints

## Accessibility

- Profile link dengan aria-label deskriptif: `Go to {username}'s profile`
- Image alt text: `{username}'s profile`
- Online indicator: purely decorative (no aria needed)
- Keyboard navigable
- Focus states clear
- Text truncate prevents overflow

## Visual States

### Normal State
- Background: transparent
- Border: none
- Hover: bg-surface-dark
- Photo border: border-border-soft
- Smooth transitions

### Active State (di /profile)
- Background: bg-accent/10
- Border: border-accent/20
- Photo border: border-accent/30
- Highlighted clearly

### Interactive Elements
- Profile photo: hover border color change
- Card: hover background change
- Online indicator: always visible
- All transitions: 300ms

## Testing Checklist

- [x] Build berhasil tanpa error
- [x] TypeScript compilation lulus
- [x] Profile section di paling bawah
- [x] Username dari database ditampilkan
- [x] Profile photo dari database ditampilkan
- [x] Fallback avatar tanpa icon generic
- [x] Online indicator visible
- [x] Responsive desktop/mobile
- [x] Dark mode compatible
- [x] Active state working
- [x] Navigation ke /profile working

## Notes

- Profile section sekarang menjadi anchor identity di sidebar
- Menghilangkan redundant Profile menu item dari main nav
- User data fetched dari AuthContext (real backend data)
- Design pattern mengikuti modern sidebar conventions
- Fallback tetap maintain visual consistency
- Ready untuk production deployment
