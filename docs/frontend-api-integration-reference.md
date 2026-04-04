# Frontend API Integration Reference

Dokumen ringkas ini untuk implementasi frontend terhadap backend auth dan onboarding yang sudah tersedia.

## Base URL

Development:

```txt
http://localhost:3000/api
```

Jika frontend dan backend beda origin, siapkan env frontend seperti:

```txt
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## Error Shape

Backend error konsisten seperti ini:

```json
{
  "success": false,
  "error": {
    "code": "Conflict",
    "message": "Email is already registered."
  },
  "timestamp": "2026-04-03T12:00:00.000Z",
  "path": "/api/auth/register"
}
```

Frontend sebaiknya punya helper:

- baca `error.message`
- fallback ke pesan generik bila shape tidak lengkap

## Success Shape

Backend success konsisten seperti ini:

```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": {}
}
```

## Auth Endpoints

### Register

`POST /auth/register`

Body:

```json
{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd!",
  "confirmPassword": "StrongP@ssw0rd!"
}
```

Frontend action:

- jika sukses, redirect ke verify OTP
- simpan email sementara di query param atau local state

### Verify OTP

`POST /auth/verify-otp`

Body:

```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

Frontend action:

- simpan `accessToken`
- baca `nextStep`
- redirect ke onboarding jika `COMPLETE_ONBOARDING`
- redirect ke dashboard jika `DASHBOARD`

### Resend OTP

`POST /auth/resend-otp`

Frontend action:

- tampilkan success toast/message netral
- hormati cooldown di UI walau backend juga throttle

### Current User

`GET /auth/me`

Header:

```txt
Authorization: Bearer <token>
```

Frontend action:

- pakai saat app bootstrap
- tentukan redirect route dari `nextStep`
- pakai data `profile` untuk dashboard dan profile settings

## Onboarding Endpoints

### Create Onboarding

`POST /onboarding/profile`

Content-Type:

```txt
multipart/form-data
```

Field:

- `firstName`
- `lastName`
- `username`
- `tanggalLahir`
- `tempatLahir`
- `gender`
- `pekerjaan`
- `bio`
- `fotoProfil` optional `File`

### Update Profile

`PATCH /onboarding/profile`

Dipakai untuk edit profile setelah onboarding.

### Delete Profile Image

`DELETE /onboarding/profile-image`

Frontend action:

- setelah sukses, kosongkan preview/avatar state
- refresh current user bila perlu

## Frontend Types Yang Perlu Dibuat

Minimal:

```ts
type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  timestamp: string;
  path: string;
};

type UserStatus =
  | "PENDING_VERIFICATION"
  | "EMAIL_VERIFIED"
  | "ONBOARDING_IN_PROGRESS"
  | "ACTIVE"
  | "SUSPENDED";

type NextStep = "VERIFY_EMAIL" | "COMPLETE_ONBOARDING" | "DASHBOARD";
```

## Frontend Session Handling

Untuk tahap implementasi awal:

- simpan access token di client storage helper
- saat app mount, cek token
- jika token ada, panggil `GET /auth/me`
- jika token invalid, hapus token dan redirect ke login/register

## Catatan UX Penting

- jangan reset input user saat submit gagal
- tampilkan error spesifik dari backend jika ada
- disable submit saat request berjalan
- untuk onboarding avatar, tampilkan preview dan opsi hapus
- setelah verify OTP sukses, redirect harus otomatis dan jelas

