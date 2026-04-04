# Server Actions & Cookie Management - Security Fix

## Problem yang Diperbaiki

Error terjadi karena `clearAccessTokenCookie()` dipanggil di `getSessionUser()` yang digunakan di layout.tsx. Di Next.js 15+, cookies hanya bisa dimodifikasi di:
- Server Actions (fungsi dengan directive `"use server"`)
- Route Handlers (`app/api/*/route.ts`)

**Error sebelumnya:**
```
Cookies can only be modified in a Server Action or Route Handler
at clearAccessTokenCookie (src/lib/server/session.ts:21:21)
at getSessionUser (src/lib/server/session.ts:36:7)
at RootLayout (src/app/layout.tsx:29:23)
```

## Solusi yang Diterapkan

### 1. **Refactor `getSessionUser()` - Read-Only**

File: `apps/client/src/lib/server/session.ts`

✅ **SEBELUM:**
- Fungsi ini mencoba menghapus cookie jika token invalid
- Tidak aman karena dipanggil dari layout

✅ **SESUDAH:**
- Fungsi ini hanya membaca cookie dan validasi token
- Return `null` jika token invalid tanpa menghapus cookie
- Cookie cleanup dilakukan di client-side melalui Route Handler

```typescript
export async function getSessionUser(): Promise<MeResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await backendRequest<MeResponse>("/auth/me", { token });
  } catch (error) {
    if (error instanceof BackendRequestError) {
      // Don't clear cookie here - let client handle it via Route Handler
      return null;
    }
    throw error;
  }
}
```

### 2. **Konsolidasi Cookie Operations ke Server Actions**

File: `apps/client/src/features/auth/actions.ts`

✅ Semua operasi cookie (set, delete) sekarang ada di Server Actions:
- `setAccessTokenCookie()` - Private helper untuk set cookie
- `clearAccessTokenCookie()` - Private helper untuk delete cookie
- `loginAction()` - Login dan set cookie (BARU)
- `verifyOtpAction()` - Verify OTP dan set cookie
- `logoutAction()` - Logout dan clear cookie

### 3. **Route Handlers untuk Operasi Aman**

#### a. **Logout Route Handler**
File: `apps/client/src/app/api/auth/logout/route.ts`

```typescript
export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ success: true });
}
```

Usage di client:
```typescript
await fetch("/api/auth/logout", { method: "POST" });
```

#### b. **Refresh Session Route Handler**
File: `apps/client/src/app/api/auth/refresh/route.ts`

```typescript
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  try {
    const user = await backendRequest<MeResponse>("/auth/me", { token });
    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof BackendRequestError) {
      // Clear invalid cookie (SAFE - this is a Route Handler)
      cookieStore.delete(SESSION_COOKIE_NAME);
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    throw error;
  }
}
```

### 4. **Update Auth Context**

File: `apps/client/src/features/auth/context/auth-context.tsx`

✅ **Perubahan:**
- Menggunakan Route Handler `/api/auth/refresh` dan `/api/auth/logout`
- Menerima `initialUser` dari server untuk menghindari flash of unauthenticated content
- Lebih aman dan sesuai dengan best practices Next.js

```typescript
export function AuthProvider({
  children,
  initialUser,
  initialNextStep
}: {
  children: ReactNode;
  initialUser?: User | null;
  initialNextStep?: NextStep | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  const refreshUser = async () => {
    const response = await fetch("/api/auth/refresh");
    if (response.ok) {
      const result = await response.json();
      setUser(result.data);
    } else {
      setUser(null);
    }
  };
  // ...
}
```

### 5. **Update Login Form**

File: `apps/client/src/components/auth/auth-forms.tsx`

✅ Sekarang menggunakan `loginAction()` yang proper:

```typescript
const result = await loginAction({
  identifier: form.identifier,
  password: form.password,
});

if (result.success) {
  await refreshUser();
  // Redirect based on nextStep
}
```

## Struktur File yang Diperbarui

```
apps/client/src/
├── lib/
│   └── server/
│       ├── session.ts          ✅ Read-only, tidak modify cookies
│       └── backend-api.ts      ✅ Tidak berubah
├── features/
│   └── auth/
│       ├── actions.ts          ✅ Semua cookie operations di sini
│       └── context/
│           └── auth-context.tsx ✅ Menggunakan Route Handlers
├── components/
│   └── auth/
│       └── auth-forms.tsx      ✅ Menggunakan loginAction()
└── app/
    ├── layout.tsx              ✅ Aman, hanya read cookies
    └── api/
        └── auth/
            ├── logout/
            │   └── route.ts    ✅ BARU - POST untuk logout
            └── refresh/
                └── route.ts    ✅ BARU - GET untuk refresh session
```

## Best Practices yang Diterapkan

### ✅ DO's:
1. **Server Actions untuk form submissions** - `loginAction`, `registerAction`, dll
2. **Route Handlers untuk API operations** - `/api/auth/logout`, `/api/auth/refresh`
3. **Read-only functions untuk layout/pages** - `getSessionUser()`
4. **Client-side fetch untuk non-form operations** - logout via fetch
5. **Server-side initial data** - Pass `initialUser` ke AuthProvider

### ❌ DON'Ts:
1. **Jangan modify cookies di functions yang dipanggil dari layouts**
2. **Jangan gunakan Server Actions untuk GET requests** - gunakan Route Handlers
3. **Jangan clear cookies di error handlers non-Server Actions**
4. **Jangan call Server Actions dengan `await` di useEffect** - gunakan Route Handlers

## Testing

Untuk memastikan semua bekerja dengan baik:

1. **Test Login Flow:**
   ```bash
   # Login → should set cookie
   # Dashboard → should see user data
   ```

2. **Test Invalid Token:**
   ```bash
   # Manually corrupt cookie
   # Refresh page → should clear cookie and show login
   ```

3. **Test Logout:**
   ```bash
   # Click logout → should clear cookie and redirect
   ```

## Migration Notes

Jika ada code lain yang menggunakan `clearAccessTokenCookie` atau `setAccessTokenCookie` dari `session.ts`:

1. **Pindahkan ke Server Action** di `features/auth/actions.ts`
2. **Atau gunakan Route Handler** seperti `/api/auth/logout`
3. **Jangan panggil langsung** dari layouts atau non-Server Action contexts

## Security Benefits

✅ **Lebih Aman:**
- Cookie operations terpusat di Server Actions dan Route Handlers
- Tidak ada cookie modification di server components
- Consistent error handling untuk invalid tokens

✅ **Lebih Maintainable:**
- Clear separation of concerns
- Easy to audit cookie operations
- Follows Next.js 15+ conventions
