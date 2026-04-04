# Client Gap Analysis For Auth + Onboarding

Analisis ini merangkum apa yang saat ini belum ada di `apps/client` untuk bisa memakai backend yang sudah selesai.

## Yang Sudah Ada

- landing page marketing
- visual style premium untuk beberapa halaman marketing
- auth shell dan register/login form UI dasar
- route marketing seperti `/`, `/platform`, `/messenger`, `/developers`, `/privacy`, `/terms`

## Yang Belum Ada

### Auth Flow

- belum ada integrasi `POST /api/auth/register`
- belum ada integrasi `POST /api/auth/verify-otp`
- belum ada integrasi `POST /api/auth/resend-otp`
- belum ada integrasi `GET /api/auth/me`
- belum ada penyimpanan access token
- belum ada redirect logic berbasis `nextStep`
- belum ada proteksi route private

### Screen / Route

- belum ada page khusus verifikasi OTP
- belum ada page onboarding
- belum ada dashboard placeholder
- belum ada profile settings/edit profile page

### API Layer

- belum ada `src/lib/api` atau fetch wrapper typed
- belum ada types untuk response auth/onboarding
- belum ada central error parser dari backend response
- belum ada helper multipart request

### UX State

- form register/login masih mock, belum terhubung backend
- belum ada loading state yang benar-benar terkait request API
- belum ada state resend OTP
- belum ada feedback transisi register -> verify OTP -> onboarding
- belum ada session bootstrap saat page reload

### Onboarding

- belum ada form onboarding profile
- belum ada avatar upload preview
- belum ada multipart submit ke backend
- belum ada edit profile menggunakan `PATCH /api/onboarding/profile`
- belum ada delete avatar memakai `DELETE /api/onboarding/profile-image`

## Prioritas Implementasi

1. typed API client + token storage
2. register page real
3. verify OTP page real
4. onboarding page real
5. dashboard placeholder
6. bootstrap `GET /api/auth/me`
7. profile edit dan delete avatar

## Backend Contract Yang Sudah Siap Dipakai

- `POST /api/auth/register`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `GET /api/auth/me`
- `POST /api/onboarding/profile`
- `PATCH /api/onboarding/profile`
- `DELETE /api/onboarding/profile-image`

## Catatan Integrasi

- frontend harus mengirim `Authorization: Bearer <token>` untuk endpoint authenticated
- onboarding avatar wajib dikirim sebagai `multipart/form-data`
- `nextStep` dari backend harus jadi sumber redirect utama
- jangan asumsi user selalu `ACTIVE`; cek `PENDING_VERIFICATION`, `ONBOARDING_IN_PROGRESS`, `ACTIVE`

