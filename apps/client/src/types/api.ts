export type ApiSuccess<T> = {
  success: true;
  message?: string;
  data: T;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  timestamp: string;
  path: string;
};

export type UserStatus =
  | "PENDING_VERIFICATION"
  | "EMAIL_VERIFIED"
  | "ONBOARDING_IN_PROGRESS"
  | "ACTIVE"
  | "SUSPENDED";

export type NextStep = "VERIFY_EMAIL" | "COMPLETE_ONBOARDING" | "DASHBOARD";

export type UserProfile = {
  firstName: string;
  lastName: string;
  username: string;
  tanggalLahir: string;
  tempatLahir: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  pekerjaan: string;
  fotoProfilUrl: string | null;
  coverImageUrl: string | null;
  bio: string;
};

export type ProfileStats = {
  posts: number;
  followers: number;
  following: number;
  isFollowing?: boolean;
};

export type FullProfile = {
  id: string;
  email?: string;
  profile: UserProfile;
  stats: ProfileStats;
};

export type User = {
  id: string;
  email: string;
  emailVerifiedAt?: string | null;
  status: UserStatus;
  onboardingCompleted: boolean;
  profile?: UserProfile;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  user: User;
  nextStep: NextStep;
};

export type MeResponse = User & {
  nextStep: NextStep;
};

export type RegisterResponse = {
  userId: string;
  email: string;
  status: UserStatus;
};

export type ResendOtpResponse = {
  delivered: boolean;
};

export type OnboardingResponse = {
  user: User;
  nextStep: NextStep;
};

export type UpdateProfileResponse = {
  message: string;
  data: {
    user: User;
  };
};

export type DeleteProfileImageResponse = {
  profileImageDeleted: boolean;
  profile: UserProfile | null;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
