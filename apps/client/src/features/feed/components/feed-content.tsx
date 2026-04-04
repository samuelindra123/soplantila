'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Spinner } from '@/components/auth/auth-primitives';
import PostComposer from './post-composer';
import PostCard from './post-card';
import { getFeed, Post } from '../services/feed-service';
import { useRouter } from 'next/navigation';
import { ApiClientError } from '@/lib/api-client';

const FEED_CACHE_PREFIX = 'feed-cache';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedFeed {
  posts: Post[];
  timestamp: number;
  userId: string;
}

function getFeedCacheKey(userId: string) {
  return `${FEED_CACHE_PREFIX}:${userId}`;
}

function loadCachedFeed(userId: string): Post[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(getFeedCacheKey(userId));
    if (!raw) {
      console.log('[Cache] No cached feed found for user:', userId);
      return [];
    }

    const parsed = JSON.parse(raw) as CachedFeed | null;
    if (!parsed?.posts || !Array.isArray(parsed.posts)) {
      console.warn('[Cache] Invalid cache structure:', parsed);
      return [];
    }

    // Check if cache is expired
    const age = Date.now() - (parsed.timestamp || 0);
    if (age > CACHE_EXPIRY_MS) {
      console.log('[Cache] Cache expired:', { age: Math.round(age / 1000), maxAge: CACHE_EXPIRY_MS / 1000 });
      return [];
    }

    // Validate userId matches
    if (parsed.userId !== userId) {
      console.warn('[Cache] UserId mismatch:', { cached: parsed.userId, current: userId });
      localStorage.removeItem(getFeedCacheKey(userId));
      return [];
    }

    console.log('[Cache] Loaded cached feed:', { postsCount: parsed.posts.length, age: Math.round(age / 1000) + 's' });
    return parsed.posts;
  } catch (error) {
    console.error('[Cache] Failed to read cached feed:', error);
    return [];
  }
}

function saveCachedFeed(userId: string, posts: Post[]) {
  if (typeof window === 'undefined') return;

  try {
    // Only cache stable posts (not optimistic)
    const stablePosts = posts
      .filter((post) => post.clientStatus !== 'posting')
      .slice(0, 30);

    const cache: CachedFeed = {
      posts: stablePosts,
      timestamp: Date.now(),
      userId,
    };

    localStorage.setItem(getFeedCacheKey(userId), JSON.stringify(cache));
    console.log('[Cache] Saved feed to cache:', { userId, postsCount: stablePosts.length });
  } catch (error) {
    console.error('[Cache] Failed to persist cached feed:', error);
  }
}

// Deduplicate posts by ID, keeping the first occurrence
function deduplicatePosts(posts: Post[]): Post[] {
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (seen.has(post.id)) {
      return false;
    }
    seen.add(post.id);
    return true;
  });
}

export default function FeedContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [sessionCheckFailed, setSessionCheckFailed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Track the last user ID we fetched for
  const lastFetchedUserIdRef = useRef<string | null>(null);
  // Track if initial load is complete
  const initialLoadCompleteRef = useRef(false);
  // Track pending refresh
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadFeed = useCallback(async (pageNum: number, append = false, silent = false) => {
    try {
      console.log('[Feed] Loading feed:', { pageNum, append, silent, currentPostsCount: posts.length });
      
      if (!silent) {
        if (pageNum === 1) setIsLoading(true);
        else setIsLoadingMore(true);
      } else if (pageNum === 1 && !append) {
        setIsRefreshing(true);
      }
      
      setError(null);
      setSessionCheckFailed(false);
      
      const result = await getFeed(pageNum, 20);
      
      console.log('[Feed] Received feed response:', { 
        postsCount: result?.posts?.length, 
        hasMore: result?.pagination?.hasMore,
        page: result?.pagination?.page 
      });
      
      // Safety check for result
      if (!result || !result.posts) {
        console.warn('[Feed] Invalid feed response:', result);
        if (!silent) {
          setPosts([]);
          setHasMore(false);
        }
        return;
      }
      
      if (append) {
        setPosts((prev) => {
          const merged = deduplicatePosts([...prev, ...result.posts]);
          console.log('[Feed] Appended posts:', { prevCount: prev.length, newCount: result.posts.length, mergedCount: merged.length });
          return merged;
        });
      } else {
        // For page 1
        setPosts((prev) => {
          // Keep optimistic posts
          const optimisticPosts = prev.filter((p) => p.clientStatus === 'posting');
          
          // If this is a silent refresh (background), merge with existing posts to avoid losing recent posts
          if (silent) {
            // Keep existing posts that are newer than oldest server post
            const oldestServerTime = result.posts.length > 0 
              ? new Date(result.posts[0].createdAt).getTime() 
              : Date.now();
            
            const recentLocalPosts = prev.filter((p) => {
              if (p.clientStatus === 'posting') return false; // Already in optimisticPosts
              const postTime = new Date(p.createdAt).getTime();
              return postTime > oldestServerTime;
            });
            
            const merged = deduplicatePosts([...optimisticPosts, ...recentLocalPosts, ...result.posts]);
            console.log('[Feed] Silent refresh merged:', { 
              optimisticCount: optimisticPosts.length,
              recentLocalCount: recentLocalPosts.length,
              serverCount: result.posts.length, 
              mergedCount: merged.length
            });
            return merged;
          }
          
          // Normal refresh: replace with server data
          const merged = deduplicatePosts([...optimisticPosts, ...result.posts]);
          console.log('[Feed] Replaced posts:', { 
            optimisticCount: optimisticPosts.length, 
            serverCount: result.posts.length, 
            mergedCount: merged.length,
            serverPostIds: result.posts.map(p => p.id).slice(0, 5)
          });
          return merged;
        });
      }
      
      setHasMore(result.pagination?.hasMore ?? false);
      setPage(pageNum);

      // Save to cache only on successful page 1 load
      if (user?.id && pageNum === 1 && !append) {
        console.log('[Feed] Saving to cache:', { userId: user.id, postsCount: result.posts.length });
        saveCachedFeed(user.id, result.posts);
      }

      initialLoadCompleteRef.current = true;
    } catch (err) {
      console.error('[Feed] Load error:', err);
      
      // Handle 401 specifically
      if (err instanceof ApiClientError && err.status === 401) {
        setSessionCheckFailed(true);
        setError('Your session has expired. Please login again.');
        if (!silent) {
          setPosts([]);
        }
        return;
      }
      
      const message = err instanceof Error ? err.message : 'Failed to load feed';
      if (!silent) {
        setError(message);
        // Don't clear posts if we have cached data
        if (posts.length === 0) {
          setPosts([]);
        }
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
      setIsRefreshing(false);
    }
  }, [user?.id, posts.length]);

  useEffect(() => {
    console.log('[Feed] useEffect triggered:', { 
      userId: user?.id, 
      lastFetchedUserId: lastFetchedUserIdRef.current,
      shouldFetch: user?.id && lastFetchedUserIdRef.current !== user.id
    });
    
    // Only fetch if user exists and it's a different user than last fetch
    if (user?.id && lastFetchedUserIdRef.current !== user.id) {
      console.log('[Feed] Starting initial load for user:', user.id);
      lastFetchedUserIdRef.current = user.id;
      initialLoadCompleteRef.current = false;

      const cachedPosts = loadCachedFeed(user.id);
      if (cachedPosts.length > 0) {
        console.log('[Feed] Using cached feed, fetching fresh in background');
        setPosts(cachedPosts);
        setIsLoading(false);
        setError(null);
        // Still fetch fresh data in background
        void loadFeed(1, false, true);
      } else {
        console.log('[Feed] No cache, fetching fresh feed');
        setIsLoading(true);
        void loadFeed(1, false, false);
      }
    }
    
    // Reset when user logs out
    if (!user) {
      console.log('[Feed] User logged out, resetting state');
      lastFetchedUserIdRef.current = null;
      initialLoadCompleteRef.current = false;
      setPosts([]);
      setError(null);
      setIsLoading(false);
      setSessionCheckFailed(false);
      setIsRefreshing(false);
      
      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [user?.id, loadFeed]);

  const createOptimisticPost = useRef((draft: Post) => {
    console.log('[Feed] Creating optimistic post:', { postId: draft.id, content: draft.content.substring(0, 50) });
    setPosts((prev) => {
      const merged = deduplicatePosts([draft, ...prev]);
      console.log('[Feed] After optimistic post:', { prevCount: prev.length, mergedCount: merged.length });
      return merged;
    });
    setError(null);
  });

  const handlePostCreated = useCallback((createdPost?: Post) => {
    console.log('[Feed] Post created callback:', { 
      hasPost: !!createdPost, 
      postId: createdPost?.id,
      content: createdPost?.content?.substring(0, 50)
    });
    
    if (createdPost) {
      // Simple approach: Just refetch from server to ensure consistency
      console.log('[Feed] Refetching feed from server after post creation');
      void loadFeed(1, false, false);
    }
  }, [loadFeed]);

  const handlePostSettled = useCallback((temporaryId: string, createdPost?: Post) => {
    console.log('[Feed] Post settled callback:', { 
      temporaryId, 
      hasCreatedPost: !!createdPost,
      createdPostId: createdPost?.id 
    });
    
    if (createdPost) {
      // Simple approach: Just refetch from server to ensure consistency
      console.log('[Feed] Refetching feed from server after post settled');
      void loadFeed(1, false, false);
    } else {
      // Remove failed optimistic post
      console.log('[Feed] Removing failed optimistic post:', temporaryId);
      setPosts((prev) => prev.filter((post) => post.id !== temporaryId));
    }
  }, [loadFeed]);

  const handlePostDeleted = useCallback(() => {
    loadFeed(1);
  }, [loadFeed]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      loadFeed(page + 1, true);
    }
  }, [isLoadingMore, hasMore, page, loadFeed]);

  const handleLoginRedirect = () => {
    router.push('/login?reason=session-expired');
  };

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Spinner className="h-10 w-10 text-accent" />
      </div>
    );
  }

  // Show login prompt if no user and auth is not loading
  if (!user && !authLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-surface border border-border-soft rounded-[2rem] p-8 text-center glass-strong shadow-premium animate-reveal">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-3 text-foreground">Session Required</h2>
          <p className="text-muted text-sm mb-6 leading-relaxed">
            You need to be logged in to view your feed. Please sign in to continue.
          </p>
          <button
            onClick={handleLoginRedirect}
            className="w-full px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-strong transition-all active:scale-95 shadow-sm"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }
  
  // Show session expired error if detected
  if (sessionCheckFailed && error) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex">
        <Sidebar />
        <main className="flex-1 ml-[70px] lg:ml-[260px] transition-all duration-500 min-h-[100dvh] flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-surface border border-border-soft rounded-[2rem] p-8 text-center glass-strong shadow-premium animate-reveal">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-danger/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-3 text-foreground">Session Expired</h2>
            <p className="text-muted text-sm mb-6 leading-relaxed">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLoginRedirect}
                className="w-full px-6 py-3 rounded-full bg-accent text-white font-semibold hover:bg-accent-strong transition-all active:scale-95 shadow-sm"
              >
                Sign In Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 rounded-full bg-surface-dark border border-border-soft text-foreground font-semibold hover:bg-surface hover:border-accent/30 transition-all active:scale-95"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans selection:bg-accent/20 flex relative">
      <Sidebar />

      {/* Main Feed Container */}
      <main className="flex-1 ml-[70px] lg:ml-[260px] mr-0 xl:mr-[340px] transition-all duration-500 min-h-[100dvh]">
        <div className="max-w-2xl mx-auto py-8 lg:py-12 px-4 sm:px-6">
          
          {/* Page Header */}
          <header className="mb-8 lg:mb-12 space-y-2 animate-reveal sticky top-0 bg-background/80 backdrop-blur-xl z-10 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-border-soft/50">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Home</h1>
            {isRefreshing ? (
              <p className="text-[12px] font-medium text-muted">
                Updating your feed in background...
              </p>
            ) : null}
          </header>

          {/* Composer */}
          <div className="mb-10 animate-reveal">
            <PostComposer
              onPostCreated={handlePostCreated}
              onPostQueued={(draft) => createOptimisticPost.current(draft)}
              onPostSettled={handlePostSettled}
            />
          </div>

          <div className="h-px bg-border-soft/50 w-full mb-8" />

          {/* Feed */}
          {isLoading ? (
            <FeedSkeleton />
          ) : error ? (
            <div className="bg-surface border border-border-soft rounded-[2.5rem] p-10 text-center glass-strong animate-reveal">
              <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-danger/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-danger text-[15px] font-medium mb-5">{error}</p>
              <button
                onClick={() => loadFeed(1)}
                className="px-6 py-2.5 rounded-full text-[13px] font-bold tracking-wider text-white bg-accent hover:bg-accent-strong transition-all active:scale-95"
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <EmptyFeed />
          ) : (
            <>
              <div className="space-y-6 sm:space-y-8">
                {posts.map((post, index) => (
                  <div 
                    key={post.id} 
                    className="animate-reveal"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <PostCard post={post} onDeleted={handlePostDeleted} />
                  </div>
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="text-center py-6">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-8 py-3 rounded-full text-[13px] font-bold tracking-wider text-muted bg-surface-dark hover:bg-surface-dark/80 hover:text-foreground border border-border-soft transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}

              {/* End of Feed Indicator */}
              {!hasMore && (
                <div className="py-16 text-center">
                  <div className="h-1.5 w-12 bg-border-soft mx-auto rounded-full mb-6" />
                  <p className="text-[12px] font-bold text-muted uppercase tracking-[0.2em]">You&apos;re all caught up</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Right Panel - Suggestions */}
      <aside className="fixed right-0 top-0 h-screen w-[340px] hidden xl:flex flex-col py-8 px-6 border-l border-border-soft glass-strong z-20">
        <div className="space-y-10 overflow-y-auto pr-2 pb-8 custom-scrollbar">
          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted group-focus-within:text-accent transition-colors" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m20 20-3.5-3.5"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-surface-dark border border-transparent rounded-full py-3 pl-11 pr-4 text-[15px] outline-none focus:bg-background focus:border-accent/40 focus:shadow-sm transition-all"
            />
          </div>

          {/* Trending Section */}
          <div className="p-5 rounded-[1.5rem] bg-surface-dark/50 border border-border-soft/40 backdrop-blur-sm">
            <h3 className="text-[16px] font-bold tracking-tight mb-5 px-1">Trending</h3>
            <div className="space-y-1">
              {["#NextJS15", "#Soplantila", "#SilkUI", "#DigitalPrivacy"].map((tag, i) => (
                <div key={tag} className="group cursor-pointer hover:bg-surface-dark p-3 -mx-2 rounded-xl transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[12px] text-muted font-medium mb-1">Trending in Tech</p>
                      <p className="font-bold text-[15px] group-hover:text-accent transition-colors">{tag}</p>
                      <p className="text-[13px] text-muted mt-1">{(10 - i) * 1.2}K posts</p>
                    </div>
                    <button className="text-muted hover:text-foreground p-1 rounded-full hover:bg-surface-dark transition-colors" aria-label="More options">
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                        <circle cx="5" cy="12" r="1.5"></circle>
                        <circle cx="12" cy="12" r="1.5"></circle>
                        <circle cx="19" cy="12" r="1.5"></circle>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Who to Follow Section */}
          <div className="p-5 rounded-[1.5rem] bg-surface-dark/50 border border-border-soft/40 backdrop-blur-sm">
            <h3 className="text-[16px] font-bold tracking-tight mb-5 px-1">Who to follow</h3>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-surface-dark border border-border-soft overflow-hidden">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=User${i}`} 
                        alt={`User ${i} avatar`} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold group-hover:underline leading-tight">Creator {i}</span>
                      <span className="text-[13px] text-muted leading-tight">@creator{i}</span>
                    </div>
                  </div>
                  <button className="bg-foreground text-background px-4 py-1.5 rounded-full text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <nav className="flex flex-wrap gap-x-3 gap-y-1 px-2 text-[13px] text-muted/80">
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Cookies</a>
            <a href="#" className="hover:underline">Accessibility</a>
            <span>© 2026 Soplantila</span>
          </nav>
        </div>
      </aside>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Post skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-surface border border-border-soft rounded-[2.5rem] overflow-hidden glass-strong"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="p-6 pb-4">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-[1.25rem] bg-surface-dark animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-surface-dark rounded-lg animate-pulse" />
                <div className="h-3 w-24 bg-surface-dark rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
          <div className="px-6 pb-5 space-y-3">
            <div className="h-4 w-full bg-surface-dark rounded-lg animate-pulse" />
            <div className="h-4 w-3/4 bg-surface-dark rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-surface-dark rounded-lg animate-pulse" />
          </div>
          <div className="px-6 py-4 border-t border-border-soft/30 bg-surface-dark/30">
            <div className="flex gap-6">
              <div className="h-9 w-16 bg-surface-dark rounded-full animate-pulse" />
              <div className="h-9 w-16 bg-surface-dark rounded-full animate-pulse" />
              <div className="h-9 w-9 bg-surface-dark rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="bg-surface border border-border-soft rounded-[2.5rem] p-12 text-center glass-strong animate-reveal">
      <div className="w-20 h-20 mx-auto mb-6 rounded-[1.5rem] bg-accent/10 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
      </div>
      <h3 className="text-[19px] font-bold text-foreground tracking-tight mb-2">
        Your feed is empty
      </h3>
      <p className="text-muted text-[15px] max-w-xs mx-auto leading-relaxed">
        Be the first to share something! Create a post above to get started.
      </p>
    </div>
  );
}
