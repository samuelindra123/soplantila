"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/features/auth/context/auth-context";
import { Spinner } from "@/components/auth/auth-primitives";
import { InfoIcon } from "@/components/ui/icons";
import { ApiClientError } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { useEffect, useTransition, useState, useCallback } from "react";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ProfileTabs, ProfileTab } from "@/features/profile/components/profile-tabs";
import { ProfilePosts } from "@/features/profile/components/profile-posts";
import { ProfileMedia } from "@/features/profile/components/profile-media";
import { ProfileEmptyTab } from "@/features/profile/components/profile-empty-tab";
import { EditProfileModal } from "@/features/profile/components/edit-profile-modal";
import { profileService } from "@/features/profile/services/profile-service";
import { FullProfile } from "@/types/api";
import { Post, MediaItem } from "@/types/social";

type ProfileLoadStatus = "loading" | "ready" | "unauthorized" | "not_found" | "error";

type ProfileStateCardProps = {
  title: string;
  description: string;
  primaryAction: {
    label: string;
    onClick: () => void | Promise<void>;
    isLoading?: boolean;
    disabled?: boolean;
  };
  secondaryActions?: {
    label: string;
    onClick: () => void | Promise<void>;
    disabled?: boolean;
  }[];
  feedback?: string | null;
};

function ProfileStateCard({
  title,
  description,
  primaryAction,
  secondaryActions = [],
  feedback,
}: ProfileStateCardProps) {
  return (
    <section className="w-full max-w-xl rounded-[2rem] border border-border-soft bg-surface/80 p-6 sm:p-8 shadow-premium glass animate-reveal">
      <div className="space-y-5 text-center">
        <div className="mx-auto h-16 w-16 rounded-full border border-border-soft bg-surface-dark/70 flex items-center justify-center">
          <InfoIcon className="h-8 w-8 text-accent" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm sm:text-base text-muted leading-relaxed">{description}</p>
          {feedback ? <p className="text-xs sm:text-sm text-accent font-semibold">{feedback}</p> : null}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
          <button
            onClick={() => {
              void primaryAction.onClick();
            }}
            disabled={primaryAction.disabled}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            {primaryAction.isLoading ? "Please wait..." : primaryAction.label}
          </button>
          {secondaryActions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  void action.onClick();
                }}
                disabled={action.disabled}
                className="inline-flex items-center justify-center rounded-full border border-border-soft bg-surface-dark px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-accent/30 hover:bg-surface disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState<string | null>(null);
  
  // Profile state
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileLoadStatus>("loading");
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  
  // Media state
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  // Edit profile modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const navigateToLogin = useCallback(() => {
    setSessionFeedback("Mengarahkan Anda ke halaman masuk...");
    startTransition(() => {
      router.push("/login");
    });
  }, [router]);

  const navigateToDashboard = useCallback(() => {
    startTransition(() => {
      router.push("/dashboard");
    });
  }, [router]);

  const handleRefreshSession = useCallback(async () => {
    setIsRefreshingSession(true);
    setSessionFeedback("Memeriksa sesi Anda...");
    const isSessionActive = await refreshUser();

    if (!isSessionActive) {
      setSessionFeedback("Sesi tidak ditemukan. Silakan masuk kembali.");
      setProfileStatus("unauthorized");
      setIsRefreshingSession(false);
      return;
    }

    setSessionFeedback("Sesi berhasil diperbarui. Memuat profil...");
    setIsRefreshingSession(false);
  }, [refreshUser]);

  // Fetch profile data
  const fetchProfile = useCallback(async (): Promise<ProfileLoadStatus> => {
    if (!user) {
      setProfile(null);
      setProfileStatus("unauthorized");
      setProfileLoading(false);
      return "unauthorized";
    }
    
    setProfileLoading(true);
    setProfileStatus("loading");
    
    try {
      const data = await profileService.getMyProfile();
      setProfile(data);
      setProfileStatus("ready");
      return "ready";
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setProfile(null);
        setProfileStatus("unauthorized");
        return "unauthorized";
      }
      if (err instanceof ApiClientError && err.status === 404) {
        setProfile(null);
        setProfileStatus("not_found");
        return "not_found";
      }
      setProfile(null);
      setProfileStatus("error");
      return "error";
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  // Fetch user posts
  const fetchPosts = useCallback(async () => {
    if (!user) return;
    
    setPostsLoading(true);
    setPostsError(null);
    
    try {
      const data = await profileService.getUserPosts(user.id);
      setPosts(data.posts);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setPostsError("Sesi Anda berakhir. Masuk kembali untuk melihat postingan.");
        return;
      }
      if (err instanceof ApiClientError && err.status === 404) {
        setPostsError("Postingan belum tersedia saat ini.");
        return;
      }
      setPostsError("Kami belum bisa memuat postingan saat ini.");
    } finally {
      setPostsLoading(false);
    }
  }, [user]);

  // Fetch user media
  const fetchMedia = useCallback(async () => {
    if (!user) return;
    
    setMediaLoading(true);
    setMediaError(null);
    
    try {
      const data = await profileService.getUserMedia(user.id);
      setMedia(data);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setMediaError("Sesi Anda berakhir.");
        return;
      }
      setMediaError("Gagal memuat media.");
    } finally {
      setMediaLoading(false);
    }
  }, [user]);

  // Load data when auth state changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      setProfileStatus("unauthorized");
      setPosts([]);
      setPostsError(null);
      setPostsLoading(false);
      return;
    }

    const loadData = async () => {
      const status = await fetchProfile();
      if (status === "ready") {
        await fetchPosts();
        if (activeTab === "media") {
          await fetchMedia();
        }
      }
    };

    void loadData();
  }, [user, fetchProfile, fetchPosts, fetchMedia, activeTab]);
  
  // Handlers for edit profile modal
  const handleOpenEditModal = () => setIsEditModalOpen(true);
  const handleCloseEditModal = () => setIsEditModalOpen(false);
  const handleEditSuccess = () => {
    // Refresh profile data after successful edit
    void fetchProfile();
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Spinner className="h-10 w-10 text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 ml-[70px] lg:ml-[260px] transition-all duration-500 min-h-[100dvh]">
        {/* Profile Header */}
        <div className="pb-6">
          {!user ? (
            <div className="min-h-[70dvh] flex items-center justify-center px-4 sm:px-6">
              <ProfileStateCard
                title="Masuk untuk melihat profil Anda"
                description="Anda perlu masuk kembali untuk membuka profil dan melanjutkan aktivitas."
                feedback={sessionFeedback}
                primaryAction={{
                  label: "Login Again",
                  onClick: navigateToLogin,
                  isLoading: isPending,
                }}
                secondaryActions={[
                  {
                    label: "Refresh Session",
                    onClick: handleRefreshSession,
                    disabled: isRefreshingSession,
                  },
                  {
                    label: "Back to Dashboard",
                    onClick: navigateToDashboard,
                    disabled: isPending,
                  },
                ]}
              />
            </div>
          ) : profileLoading || profileStatus === "loading" ? (
            <div className="h-96 flex items-center justify-center">
              <Spinner className="h-8 w-8 text-accent" />
            </div>
          ) : profileStatus === "unauthorized" ? (
            <div className="min-h-[70dvh] flex items-center justify-center px-4 sm:px-6">
              <ProfileStateCard
                title="Sesi Anda telah berakhir"
                description="Kami belum bisa menampilkan profil. Perbarui sesi Anda atau masuk kembali."
                feedback={sessionFeedback}
                primaryAction={{
                  label: "Refresh Session",
                  onClick: handleRefreshSession,
                  isLoading: isRefreshingSession,
                  disabled: isPending,
                }}
                secondaryActions={[
                  {
                    label: "Login Again",
                    onClick: navigateToLogin,
                    disabled: isPending || isRefreshingSession,
                  },
                  {
                    label: "Back to Dashboard",
                    onClick: navigateToDashboard,
                    disabled: isPending || isRefreshingSession,
                  },
                ]}
              />
            </div>
          ) : profileStatus === "not_found" ? (
            <div className="min-h-[70dvh] flex items-center justify-center px-4 sm:px-6">
              <ProfileStateCard
                title="Profil belum tersedia"
                description="Profil ini belum bisa ditemukan. Coba muat ulang atau kembali ke dashboard."
                primaryAction={{
                  label: "Try Again",
                  onClick: () => {
                    void fetchProfile();
                  },
                  disabled: isPending,
                }}
                secondaryActions={[
                  {
                    label: "Back to Dashboard",
                    onClick: navigateToDashboard,
                    disabled: isPending,
                  },
                ]}
              />
            </div>
          ) : profileStatus === "error" || !profile ? (
            <div className="min-h-[70dvh] flex items-center justify-center px-4 sm:px-6">
              <ProfileStateCard
                title="Kami tidak bisa memuat profil saat ini"
                description="Coba beberapa saat lagi. Jika masalah berlanjut, refresh sesi Anda."
                primaryAction={{
                  label: "Try Again",
                  onClick: () => {
                    void fetchProfile();
                  },
                  disabled: isPending,
                }}
                secondaryActions={[
                  {
                    label: "Refresh Session",
                    onClick: handleRefreshSession,
                    disabled: isRefreshingSession || isPending,
                  },
                  {
                    label: "Back to Dashboard",
                    onClick: navigateToDashboard,
                    disabled: isPending,
                  },
                ]}
              />
            </div>
          ) : (
            <ProfileHeader 
              profile={profile.profile}
              isOwnProfile={true}
              stats={profile.stats}
              onEditClick={handleOpenEditModal}
            />
          )}
        </div>

        {profileStatus === "ready" && profile ? (
          <>
            {/* Profile Tabs */}
            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <div className="pb-12">
              {activeTab === "posts" && (
                postsLoading ? (
                  <div className="py-16 flex justify-center">
                    <Spinner className="h-8 w-8 text-accent" />
                  </div>
                ) : postsError ? (
                  <div className="py-16 flex flex-col items-center gap-4 text-center px-4">
                    <p className="text-muted text-sm sm:text-base">{postsError}</p>
                    <button
                      onClick={fetchPosts}
                      className="px-4 py-2 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                      Try Again
                    </button>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-dark flex items-center justify-center">
                      <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted text-sm max-w-xs mx-auto">
                      When you create posts, they will appear here.
                    </p>
                  </div>
                ) : (
                  <ProfilePosts posts={posts} />
                )
              )}
              {activeTab === "media" && (
                mediaLoading ? (
                  <ProfileMedia media={[]} isLoading={true} />
                ) : mediaError ? (
                  <div className="py-16 flex flex-col items-center gap-4 text-center px-4">
                    <p className="text-muted text-sm sm:text-base">{mediaError}</p>
                    <button
                      onClick={fetchMedia}
                      className="px-4 py-2 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-strong transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <ProfileMedia media={media} />
                )
              )}
              {activeTab === "about" && <ProfileEmptyTab type="about" />}
              {activeTab === "likes" && <ProfileEmptyTab type="likes" />}
            </div>
          </>
        ) : (
          <div className="pb-12" />
        )}
      </main>
      
      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          profile={profile.profile}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
