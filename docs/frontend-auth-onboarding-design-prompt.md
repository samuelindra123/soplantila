# Frontend Prompt: Auth + OTP + Onboarding Flow

Gunakan prompt ini untuk membangun implementasi frontend di `apps/client` agar terhubung ke backend NestJS yang sudah siap.

## Prompt

Bertindaklah sebagai **Senior Frontend Engineer + Product Designer** yang sangat berpengalaman dengan **Next.js App Router, React 19, TypeScript, form UX, multipart upload, authentication flow, OTP verification, onboarding wizard, dan integration ke backend REST API**.

Saya memiliki project frontend Next.js di:

`apps/client`

Backend NestJS saya sudah siap dengan endpoint berikut:

- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `GET /api/auth/me`
- `POST /api/onboarding/profile`
- `PATCH /api/onboarding/profile`
- `DELETE /api/onboarding/profile-image`

Saya ingin kamu mengimplementasikan **frontend flow register -> verify OTP -> onboarding -> ready to dashboard** dengan kualitas production-ready, UI premium, UX jelas, dan integrasi backend yang rapi.

## Konteks Codebase Frontend Saat Ini

Project sudah punya landing page dan auth visual shell, tetapi masih dominan statis:

- halaman utama marketing sudah ada
- form login/register saat ini belum benar-benar memanggil backend
- belum ada page khusus verifikasi OTP
- belum ada page onboarding profile
- belum ada API layer typed
- belum ada auth session persistence di client
- belum ada guard redirect berbasis `GET /api/auth/me`
- belum ada upload avatar ke endpoint onboarding

Jangan membuat desain generik. Pertahankan visual language yang bold dan premium yang sudah ada di project, tetapi rapikan agar flow auth terasa konsisten dan modern.

## Tujuan Implementasi

Bangun alur berikut:

1. User membuka `/register`
2. User isi email, password, confirm password
3. Frontend validasi ringan lalu submit ke `POST /api/auth/register`
4. Jika sukses, user diarahkan ke page verifikasi OTP
5. User isi OTP dari email
6. Frontend submit ke `POST /api/auth/verify-otp`
7. Jika sukses, simpan access token secara aman di client untuk tahap frontend saat ini
8. Ambil current user jika perlu lewat `GET /api/auth/me`
9. Jika `nextStep === COMPLETE_ONBOARDING`, arahkan ke onboarding
10. User isi onboarding profile dan optional avatar
11. Frontend submit multipart form ke `POST /api/onboarding/profile`
12. Jika sukses dan `nextStep === DASHBOARD`, arahkan ke dashboard placeholder

## Endpoint Contract Yang Harus Diikuti

### `POST /api/auth/register`

Request:

```json
{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd!",
  "confirmPassword": "StrongP@ssw0rd!"
}
```

Success:

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email with the OTP we sent.",
  "data": {
    "userId": "user_xxx",
    "email": "user@example.com",
    "status": "PENDING_VERIFICATION"
  }
}
```

### `POST /api/auth/verify-otp`

Request:

```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

Success:

```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": {
    "accessToken": "jwt-token",
    "tokenType": "Bearer",
    "user": {
      "id": "user_xxx",
      "email": "user@example.com",
      "status": "ONBOARDING_IN_PROGRESS",
      "onboardingCompleted": false
    },
    "nextStep": "COMPLETE_ONBOARDING"
  }
}
```

### `POST /api/auth/resend-otp`

Request:

```json
{
  "email": "user@example.com"
}
```

### `GET /api/auth/me`

Header:

```txt
Authorization: Bearer <token>
```

Success:

```json
{
  "success": true,
  "message": "Current user fetched successfully.",
  "data": {
    "id": "user_xxx",
    "email": "user@example.com",
    "emailVerifiedAt": "2026-04-03T15:04:42.348Z",
    "status": "ACTIVE",
    "onboardingCompleted": true,
    "profile": {
      "firstName": "Samuel",
      "lastName": "QA",
      "username": "samuelqa682840",
      "tanggalLahir": "2000-04-03T00:00:00.000Z",
      "tempatLahir": "Jakarta",
      "gender": "MALE",
      "pekerjaan": "Software Engineer",
      "fotoProfilUrl": "https://soplantila.sfo3.cdn.digitaloceanspaces.com/...",
      "bio": "Testing onboarding storage integration."
    },
    "nextStep": "DASHBOARD"
  }
}
```

### `POST /api/onboarding/profile`

Content-Type:

```txt
multipart/form-data
```

Fields:

- `firstName`
- `lastName`
- `username`
- `tanggalLahir`
- `tempatLahir`
- `gender`
- `pekerjaan`
- `bio`
- `fotoProfil` optional file

### `PATCH /api/onboarding/profile`

Dipakai untuk edit profile setelah onboarding awal selesai.

### `DELETE /api/onboarding/profile-image`

Dipakai untuk menghapus avatar profile.

## Requirement Frontend

### 1. Struktur Folder

Sarankan dan implementasikan struktur yang rapi, misalnya:

- `src/app/register/page.tsx`
- `src/app/verify-otp/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/features/auth/components/*`
- `src/features/auth/api/*`
- `src/features/auth/types/*`
- `src/features/auth/hooks/*`
- `src/features/onboarding/components/*`
- `src/features/onboarding/api/*`
- `src/lib/api/*`
- `src/lib/storage/*`

### 2. Auth State

Buat auth state yang ringan dan maintainable:

- simpan access token di client storage yang eksplisit untuk tahap ini
- sediakan helper baca/tulis token
- sediakan helper fetch current user
- redirect user ke halaman yang sesuai berdasarkan `nextStep`

### 3. Register UX

Halaman `/register` harus:

- memanfaatkan visual shell yang sudah ada
- menampilkan validasi email/password/confirm password
- menampilkan loading state submit
- menampilkan server error message yang aman
- jika berhasil, redirect ke `/verify-otp?email=...`

### 4. Verify OTP UX

Halaman `/verify-otp` harus:

- fokus pada input OTP 6 digit
- punya countdown atau disabled resend state sederhana
- punya tombol resend OTP
- menampilkan success/error state jelas
- jika verify berhasil, simpan token lalu redirect ke `/onboarding`

### 5. Onboarding UX

Halaman `/onboarding` harus:

- rapi di mobile dan desktop
- jelas memisahkan mandatory dan optional field
- validasi frontend sinkron dengan backend
- upload avatar optional
- preview avatar sebelum submit
- submit memakai `FormData`
- menampilkan error field-level bila memungkinkan
- setelah sukses redirect ke `/dashboard`

### 6. Dashboard Placeholder

Jika dashboard belum ada, buat placeholder premium yang menampilkan:

- nama user
- username
- avatar
- status account
- CTA ke edit profile

### 7. Profile Edit Readiness

Walau fokus utama onboarding awal, siapkan arsitektur agar mudah menambah:

- edit profile
- delete avatar
- refresh current user

## Design Direction

Pertahankan gaya visual existing project:

- premium
- bold typography
- spacious layout
- modern glass/polished surfaces jika sudah ada
- jauh dari form template generik

Tetapi perbaiki auth journey agar:

- lebih fokus
- lebih sedikit distraksi
- CTA utama sangat jelas
- feedback async terasa meyakinkan
- state disabled/loading/error/success lengkap

## Technical Constraints

- gunakan TypeScript penuh
- jangan tambah dependency besar jika tidak perlu
- bila fetch wrapper cukup, tidak perlu pakai library tambahan
- ikuti App Router Next.js yang ada di repo
- jangan buat abstraksi berlebihan
- semua API response harus typed
- semua error handling harus konsisten

## Hal Yang Wajib Dibuat

- typed API client untuk auth dan onboarding
- page register
- page verify OTP
- page onboarding
- page dashboard placeholder
- token storage helper
- `me` bootstrap helper
- route redirect logic minimal
- multipart upload integration

## Definition of Done

Task dianggap selesai jika:

- user bisa daftar dari frontend
- user bisa verifikasi OTP
- user bisa lanjut onboarding
- user bisa upload avatar optional
- user bisa sampai dashboard
- response backend dipakai sesuai contract
- UI responsif dan rapi
- state loading/error/success lengkap
- code siap direview dan di-merge

## Output Yang Saya Inginkan

Saat mengerjakan, jelaskan:

1. apa yang diubah
2. file utama yang dibuat/diubah
3. bagaimana flow frontend terhubung ke backend
4. asumsi yang dipakai
5. apa yang masih placeholder

