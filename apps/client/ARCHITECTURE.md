# Frontend Architecture - Theme Isolation

## Route Structure

Aplikasi ini menggunakan **Route Groups** untuk memisahkan area public dan social/dashboard dengan sistem theme yang terisolasi.

### Route Groups

```
src/app/
├── (auth)/              # Auth pages (login, register, forgot-password)
├── (public)/            # Public/marketing pages
│   ├── page.tsx         # Landing page
│   ├── about/
│   ├── platform/
│   ├── privacy/
│   ├── terms/
│   ├── safety/
│   ├── developers/
│   ├── discovery/       # Discovery marketing page
│   ├── messenger/       # Messenger marketing page
│   ├── onboarding/
│   └── verify-otp/
└── (social)/            # Social/dashboard app (THEME SCOPED)
    ├── layout.tsx       # ThemeProvider wrapper
    ├── dashboard/       # Main feed
    ├── notifications/
    ├── profile/
    └── settings/
```

## Theme Isolation

### Problem Yang Dipecahkan
- **Before**: ThemeProvider di root layout → dark/light toggle dashboard mempengaruhi landing page
- **After**: ThemeProvider hanya di `(social)/layout.tsx` → theme scoped ke dashboard area saja

### How It Works

1. **Root Layout** (`app/layout.tsx`)
   - Tidak ada ThemeProvider
   - Hanya AuthProvider
   - Body tidak auto-apply bg/color

2. **Public Layout** (`(public)/layout.tsx`)
   - Pass-through layout
   - Tidak ada theme wrapper
   - Pages menggunakan CSS variables default (light theme)

3. **Social Layout** (`(social)/layout.tsx`)
   - Mengandung ThemeProvider
   - Theme class applied ke wrapper div, BUKAN html root
   - localStorage key: `soplantila-social-theme`

4. **ThemeProvider Behavior**
   - Apply dark/light class ke wrapper ref element
   - Wrapper punya `bg-background` dan `text-foreground`
   - CSS variables dari `.dark` hanya berlaku di dalam wrapper

### CSS Variables

Global CSS di `globals.css`:
```css
:root {
  --background: #ffffff;  /* Default light */
  --foreground: #111111;
  /* ... */
}

.dark {
  --background: #000000;  /* Dark override */
  --foreground: #f5f5f7;
  /* ... */
}
```

Body tidak auto-apply:
```css
body {
  font-family: var(--font-sans);
  /* NO background/color - let pages control */
}
```

### Benefits

✅ Dark/light toggle di dashboard hanya mengubah social area  
✅ Landing page tetap light theme (atau bisa punya theme sendiri)  
✅ Tidak ada hydration mismatch antara server/client  
✅ Theme preference tersimpan per-area (social vs public)  
✅ Scalable untuk future theme customization  

## Adding New Social Pages

Untuk menambah halaman di area social/dashboard:

```tsx
// src/app/(social)/new-page/page.tsx
"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/features/auth/context/auth-context";

export default function NewPage() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 ml-[70px] lg:ml-[260px] p-8">
        {/* Content */}
      </main>
    </div>
  );
}
```

## Adding New Public Pages

Untuk menambah halaman marketing/public:

```tsx
// src/app/(public)/new-page/page.tsx
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default function NewPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main>{/* Content */}</main>
      <Footer />
    </div>
  );
}
```

## Theme Toggle

Theme toggle hanya tersedia di social area (sidebar):
- User bisa toggle dark/light mode
- Preference disimpan di `localStorage` dengan key `soplantila-social-theme`
- Hanya mempengaruhi pages di `(social)/*`

## Migration Notes

File yang dipindah:
- `dashboard/` → `(social)/dashboard/`
- `notifications/` → `(social)/notifications/` (created)
- `profile/` → `(social)/profile/` (created)
- `settings/` → `(social)/settings/` (created)
- `discovery/`, `messenger/` → `(public)/` (marketing pages)
- `onboarding/`, `verify-otp/` → `(public)/` (auth flow pages)

File yang diubah:
- `app/layout.tsx` - removed ThemeProvider
- `(social)/layout.tsx` - added ThemeProvider wrapper
- `components/theme/theme-provider.tsx` - apply theme to ref element, not html root
- `app/globals.css` - removed auto background/color from body
