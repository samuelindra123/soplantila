"use client";

import { UserProfile, ProfileStats } from "@/types/api";
import { CheckCircle2Icon, MapPinIcon, BriefcaseIcon, CalendarIcon } from "@/components/ui/icons";

type ProfileHeaderProps = {
  profile: UserProfile;
  isOwnProfile?: boolean;
  stats?: ProfileStats;
  onEditClick?: () => void;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
  followLoading?: boolean;
};

export function ProfileHeader({ 
  profile, 
  isOwnProfile = false, 
  stats, 
  onEditClick,
  isFollowing = false,
  onFollowToggle,
  followLoading = false,
}: ProfileHeaderProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initials = `${profile.firstName[0] || ""}${profile.lastName[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="relative">
      {/* Cover Section - Full Width */}
      <div className="relative h-56 sm:h-72 lg:h-80 bg-gradient-to-br from-accent/20 via-accent/10 to-surface-dark overflow-hidden">
        {profile.coverImageUrl ? (
          <img
            src={profile.coverImageUrl}
            alt="Profile cover"
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Profile Identity Section - Anchored at Bottom */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Profile Image - Overlapping Cover */}
          <div className="absolute -top-20 sm:-top-24 left-0">
            <div className="relative group">
              <div className="h-32 w-32 sm:h-40 sm:w-40 lg:h-44 lg:w-44 rounded-3xl bg-surface border-4 border-background shadow-2xl overflow-hidden">
                {profile.fotoProfilUrl ? (
                  <img
                    src={profile.fotoProfilUrl}
                    alt={`${fullName}'s profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/20 to-accent/5">
                    <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-accent tracking-tight">
                      {initials}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons - Top Right */}
          <div className="flex items-center justify-end pt-4 pb-2 min-h-[80px] sm:min-h-[100px]">
            {isOwnProfile ? (
              <button 
                onClick={onEditClick}
                className="px-6 py-2.5 rounded-full bg-surface-dark border border-border-soft hover:bg-surface hover:border-accent/30 font-semibold text-sm transition-all hover:shadow-md active:scale-95"
                aria-label="Edit profile"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={onFollowToggle}
                  disabled={followLoading}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isFollowing
                      ? 'bg-surface-dark border border-border-soft hover:bg-surface hover:border-accent/30 text-foreground'
                      : 'bg-accent text-white hover:bg-accent-strong'
                  }`}
                  aria-label={isFollowing ? `Unfollow ${profile.username}` : `Follow ${profile.username}`}
                >
                  {followLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      {isFollowing ? 'Unfollowing...' : 'Following...'}
                    </span>
                  ) : (
                    isFollowing ? 'Following' : 'Follow'
                  )}
                </button>
                <button 
                  className="px-6 py-2.5 rounded-full bg-surface-dark border border-border-soft hover:bg-surface hover:border-accent/30 font-semibold text-sm transition-all hover:shadow-md active:scale-95"
                  aria-label={`Message ${profile.username}`}
                >
                  Message
                </button>
              </div>
            )}
          </div>

          {/* Identity Block - Below Profile Image */}
          <div className="pt-2 pb-6 space-y-4">
            {/* Name and Username */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                  {fullName}
                </h1>
                <CheckCircle2Icon className="h-6 w-6 sm:h-7 sm:w-7 text-accent flex-shrink-0" aria-label="Verified" />
              </div>
              <p className="text-muted text-base sm:text-lg mt-1">
                @{profile.username}
              </p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-foreground/90 text-[15px] sm:text-base leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              {profile.pekerjaan && (
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{profile.pekerjaan}</span>
                </div>
              )}
              {profile.tempatLahir && (
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>{profile.tempatLahir}</span>
                </div>
              )}
              {profile.tanggalLahir && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span>
                    Born {new Date(profile.tanggalLahir).toLocaleDateString("en-US", { 
                      month: "long", 
                      day: "numeric", 
                      year: "numeric" 
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5 sm:gap-6 text-sm pt-2">
              <button className="flex items-center gap-1.5 hover:underline focus:outline-none focus:underline" aria-label={`${formatCount(stats?.followers ?? 0)} followers`}>
                <span className="font-bold text-foreground text-base">
                  {formatCount(stats?.followers ?? 0)}
                </span>
                <span className="text-muted">Followers</span>
              </button>
              <button className="flex items-center gap-1.5 hover:underline focus:outline-none focus:underline" aria-label={`${formatCount(stats?.following ?? 0)} following`}>
                <span className="font-bold text-foreground text-base">
                  {formatCount(stats?.following ?? 0)}
                </span>
                <span className="text-muted">Following</span>
              </button>
              <div className="flex items-center gap-1.5" aria-label={`${formatCount(stats?.posts ?? 0)} posts`}>
                <span className="font-bold text-foreground text-base">
                  {formatCount(stats?.posts ?? 0)}
                </span>
                <span className="text-muted">Posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
