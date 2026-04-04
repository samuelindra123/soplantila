"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/features/auth/context/auth-context";
import { Spinner } from "@/components/auth/auth-primitives";
import { InfoIcon } from "@/components/ui/icons";
import { ApiClientError } from "@/lib/api-client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import { ProfileTabs, ProfileTab } from "@/features/profile/components/profile-tabs";
import { ProfilePosts } from "@/features/profile/components/profile-posts";
import { ProfileEmptyTab } from "@/features/profile/components/profile-empty-tab";
import { profileService } from "@/features/profile/services/profile-service";
import { FullProfile } from "@/types/api";
import { Post } from "@/types/social";

type ProfileLoadStatus = "loading" | "ready" | "unauthorized" | "not_found" | "error";

export default function UserProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  
  // Profile state
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<ProfileLoadStatus>("loading");
  
  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  
  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Check if viewing own profile and redirect immediately
  useEffect(() => {
    if (!authLoading && user?.id === userId) {
      router.replace('/profile');
    }
  }, [user?.id, userId, authLoading, router]);

  // Don't render anything if it's own profile (will redirect)
  if (!authLoading && user?.id === userId) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Spinner className="h-10 w-10 text-accent" />
      </div>
    );
  }

  // Fetch profile data
  const fetchProfile = useCallback(async (): Promise<ProfileLoadStatus> => {
    if (!userId) {
      setProfileStatus("not_found");
      setProfileLoading(false);
      return "not_found";
    }
    
    setProfileLoading(true);
    setProfileStatus("loading");
    
    try {
      const data = await profileService.getUserProfileById(userId);
      setProfile(data);
      setIsFollowing(data.stats?.isFollowing ?? false);
      setProfileStatus("ready");
      return "ready";
    } catch (err) {
      console.error('Profile fetch error:', err);
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
  }, [userId]);

  // Fetch user posts
  const fetchPosts = useCallback(async () => {
    if (!userId) return;
    
    setPostsLoading(true);
    setPostsError(null);
    
    try {
      const data = await profileService.getUserPosts(userId);
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Posts fetch error:', err);
      if (err instanceof ApiClientError && err.status === 404) {
        setPosts([]);
        return;
      }
      setPostsError("Failed to load posts");
    } finally {
      setPostsLoading(false);
    }
  }, [userId]);

  // Load data on mount and when userId changes
  useEffect(() => {
    const loadData = async () => {
      const status = await fetchProfile();
      if (status === "ready") {
        await fetchPosts();
      }
    };

    void loadData();
  }, [userId, fetchProfile, fetchPosts]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!userId || followLoading) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await profileService.unfollowUser(userId);
        setIsFollowing(false);
        // Update follower count
        if (profile?.stats) {
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followers: (profile.stats.followers || 0) - 1,
              isFollowing: false,
            },
          });
        }
      } else {
        await profileService.followUser(userId);
        setIsFollowing(true);
        // Update follower count
        if (profile?.stats) {
          setProfile({
            ...profile,
            stats: {
              ...profile.stats,
              followers: (profile.stats.followers || 0) + 1,
              isFollowing: true,
            },
          });
        }
      }
    } catch (err) {
      console.error('Follow/unfollow error:', err);
      alert('Failed to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  // Show loading state
  if (profileLoading || profileStatus === "loading") {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Spinner className="h-10 w-10 text-accent" />
      </div>
    );
  }

  // Show not found state
  if (profileStatus === "not_found") {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex">
        <Sidebar />
        <main className="flex-1 ml-[70px] lg:ml-[260px] transition-all duration-500 min-h-[100dvh]">
          <div className="min-h-[70dvh] flex items-center justify-center px-4 sm:px-6">
            <section className="w-full max-w-xl rounded-[2rem] border border-border-soft bg-surface/80 p-6 sm:p-8 shadow-premium glass animate-reveal">
              <div className="space-y-5 text-center">
                <div className="mx-auto h-16 w-16 rounded-full border border-border-soft bg-surface-dark/70 flex items-center justify-center">
                  <InfoIcon className="h-8 w-8 text-accent" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">User not found</h2>
                  <p className="text-sm sm:text-base text-muted leading-relaxed">
                    This profile doesn't exist or has been removed.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
                  <button
                    onClick={() => router.push('/feed')}
                    className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90"
                  >
                    Back to Feed
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (profileStatus === "error" || !profile) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex">
        <Sidebar />
        <main className="flex-1 ml-[70px] lg:ml-[260px] transition-all duration-500 min-h-[100dvh]">
          <div className="min-h-[70dvh] flex items-center justify-center px-4 sm:px-6">
            <section className="w-full max-w-xl rounded-[2rem] border border-border-soft bg-surface/80 p-6 sm:p-8 shadow-premium glass animate-reveal">
              <div className="space-y-5 text-center">
                <div className="mx-auto h-16 w-16 rounded-full border border-border-soft bg-surface-dark/70 flex items-center justify-center">
                  <InfoIcon className="h-8 w-8 text-danger" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Failed to load profile</h2>
                  <p className="text-sm sm:text-base text-muted leading-relaxed">
                    Something went wrong. Please try again.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
                  <button
                    onClick={() => fetchProfile()}
                    className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push('/feed')}
                    className="inline-flex items-center justify-center rounded-full border border-border-soft bg-surface-dark px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-accent/30 hover:bg-surface"
                  >
                    Back to Feed
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 ml-[70px] lg:ml-[260px] transition-all duration-500 min-h-[100dvh]">
        {/* Profile Header */}
        <div className="pb-6">
          <ProfileHeader 
            profile={profile.profile}
            isOwnProfile={false}
            stats={profile.stats}
            isFollowing={isFollowing}
            onFollowToggle={handleFollowToggle}
            followLoading={followLoading}
          />
        </div>

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
                  className="px-4 py-2 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-strong transition-colors"
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
                  This user hasn't posted anything yet.
                </p>
              </div>
            ) : (
              <ProfilePosts posts={posts} />
            )
          )}
          {activeTab === "media" && <ProfileEmptyTab type="media" />}
          {activeTab === "about" && <ProfileEmptyTab type="about" />}
          {activeTab === "likes" && <ProfileEmptyTab type="likes" />}
        </div>
      </main>
    </div>
  );
}
