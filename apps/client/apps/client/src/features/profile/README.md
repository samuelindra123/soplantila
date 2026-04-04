# Profile Feature

Halaman profile user modern ala Facebook untuk aplikasi Soplantila.

## 📁 Struktur File

```
src/features/profile/
└── components/
    ├── profile-header.tsx      # Header profile dengan foto, nama, bio, metadata
    ├── profile-tabs.tsx        # Tab navigasi (Posts, Media, About, Likes)
    ├── profile-posts.tsx       # Daftar posts user + empty state
    └── profile-empty-tab.tsx   # Empty state untuk tab Media, About, Likes
```

## ✨ Fitur

### ProfileHeader
- ✅ Cover section dengan gradient elegan
- ✅ Foto profil besar dan menonjol
- ✅ Nama lengkap + verified badge
- ✅ Username sebagai informasi sekunder
- ✅ Bio user
- ✅ Metadata: pekerjaan, tempat lahir, tanggal lahir dengan icons
- ✅ Action buttons (Edit Profile / Follow + Message)
- ✅ Responsive mobile, tablet, desktop
- ✅ Dark/Light mode support

### ProfileTabs
- ✅ 4 tabs: Posts, Media, About, Likes
- ✅ Active state dengan underline accent
- ✅ Hover state yang smooth
- ✅ Sticky positioning saat scroll
- ✅ Horizontal scroll di mobile (no scrollbar)
- ✅ Accessible dengan aria attributes

### ProfilePosts
- ✅ Menggunakan PostCard component yang sudah ada
- ✅ Loading state dengan skeleton
- ✅ Empty state yang elegan dengan icon
- ✅ Staggered animation saat render
- ✅ End of posts indicator

### ProfileEmptyTab
- ✅ Empty state untuk Media, About, Likes
- ✅ Icon yang sesuai untuk setiap tipe
- ✅ Message yang informatif

## 🎨 Design Principles

1. **Facebook-like**: Header menonjol, identitas user jelas, konten tersusun rapi
2. **Premium & Modern**: Mengikuti design system aplikasi (glass effect, rounded corners, shadows)
3. **Social-first**: Fokus pada identitas dan konten user, bukan admin panel
4. **Clean Hierarchy**: Visual hierarchy yang kuat dari header → tabs → content
5. **Responsive**: Mobile-first approach, semua elemen tetap usable di layar kecil

## 🌓 Dark Mode

Semua komponen mendukung dark/light mode:
- Background colors adaptif
- Text colors dengan proper contrast
- Border colors yang sesuai
- Shadow yang menyesuaikan mode

## 📱 Responsive Breakpoints

- **Mobile** (< 640px): Stacked layout, horizontal scroll tabs
- **Tablet** (640px - 1024px): Semi-compressed layout
- **Desktop** (> 1024px): Full layout dengan spacing optimal

## 🔧 Type Safety

Semua komponen menggunakan TypeScript dengan:
- Proper prop types
- Type inference dari User & UserProfile
- No `any` types

## 🚀 Next Steps

Komponen sudah siap digunakan untuk:
1. Implementasi API real untuk fetch user posts
2. Implementasi tab Media (gallery view)
3. Implementasi tab About (detailed info)
4. Implementasi tab Likes (liked posts)
5. Edit profile functionality
6. View other user's profile (bukan own profile)

## 💡 Usage Example

```tsx
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ProfileTabs } from "@/features/profile/components/profile-tabs";
import { ProfilePosts } from "@/features/profile/components/profile-posts";

// Di halaman profile
<ProfileHeader 
  profile={user.profile} 
  email={user.email} 
  isOwnProfile={true} 
/>
<ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
<ProfilePosts posts={userPosts} />
```
