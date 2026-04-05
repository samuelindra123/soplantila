"use client";

import { UserProfile, ProfileStats } from "@/types/api";
import { CheckCircle2Icon, MapPinIcon, BriefcaseIcon, CalendarIcon } from "@/components/ui/icons";
import { FriendButton } from "@/features/friendship/components/friend-button";
import Link from "next/link";
import { useState } from "react";
import { ConnectionsModal } from "./connections-modal";

type ProfileHeaderProps = {
  profile: UserProfile;
  userId?: string;
  isOwnProfile?: boolean;
  stats?: ProfileStats;
  onEditClick?: () => void;
};

export function ProfileHeader({ 
  profile,
  userId,
  isOwnProfile = false, 
  stats, 
  onEditClick,
}: ProfileHeaderProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"friends" | "followers" | "following">("friends");

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initials = `${profile.firstName[0] || ""}${profile.lastName[0] || ""}`.toUpperCase() || "U";

  const handleOpenModal = (tab: "friends" | "followers" | "following") => {
    setModalTab(tab);
    setModalOpen(true);
  };

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
                {userId && <FriendButton targetUserId={userId} />}
                <Link 
                  href={`/messenger?userId=${userId}`}
                  className="px-6 py-2.5 rounded-full bg-surface-dark border border-border-soft hover:bg-surface hover:border-accent/30 font-semibold text-sm transition-all hover:shadow-md active:scale-95"
                  aria-label={`Message ${profile.username}`}
                >
                  Kirim Pesan
                </Link>
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
              <button 
                onClick={() => handleOpenModal("friends")}
                className="flex items-center gap-1.5 hover:underline focus:outline-none focus:underline" 
                aria-label={`${formatCount(stats?.friends ?? 0)} teman`}
              >
                <span className="font-bold text-foreground text-base">
                  {formatCount(stats?.friends ?? 0)}
                </span>
                <span className="text-muted">Teman</span>
              </button>
              <button 
                onClick={() => handleOpenModal("followers")}
                className="flex items-center gap-1.5 hover:underline focus:outline-none focus:underline" 
                aria-label={`${formatCount(stats?.followers ?? 0)} pengikut`}
              >
                <span className="font-bold text-foreground text-base">
                  {formatCount(stats?.followers ?? 0)}
                </span>
                <span className="text-muted">Pengikut</span>
              </button>
              <button 
                onClick={() => handleOpenModal("following")}
                className="flex items-center gap-1.5 hover:underline focus:outline-none focus:underline" 
                aria-label={`${formatCount(stats?.following ?? 0)} mengikuti`}
              >
                <span className="font-bold text-foreground text-base">
                  {formatCount(stats?.following ?? 0)}
                </span>
                <span className="text-muted">Mengikuti</span>
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

      {/* Connections Modal */}
      {userId && (
        <ConnectionsModal
          userId={userId}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          defaultTab={modalTab}
        />
      )}
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
