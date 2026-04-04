export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

export const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,30}$/;

export const ALLOWED_PROFILE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'api',
  'app',
  'auth',
  'billing',
  'contact',
  'dashboard',
  'explore',
  'feed',
  'help',
  'home',
  'login',
  'logout',
  'media',
  'me',
  'message',
  'messages',
  'messenger',
  'moderator',
  'notifications',
  'onboarding',
  'privacy',
  'register',
  'root',
  'settings',
  'signup',
  'support',
  'system',
  'user',
  'users',
  'verify',
] as const;
