"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { PostCard } from "@/components/social/post-card";
import { Spinner } from "@/components/auth/auth-primitives";
import { useAuth } from "@/features/auth/context/auth-context";
import { Post } from "@/types/social";
import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

const MOCK_FEED: Post[] = [
  {
    id: "1",
    user: {
      id: "u1", name: "Samuel Indrabastian", username: "samuelind",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Samuel", isVerified: true
    },
    content: "Membangun produk bukan hanya soal fitur, tapi soal rasa. Bagaimana user merasa aman dan nyaman saat menjelajahi setiap sudut interface kita. ✨ #PremiumDesign",
    media: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000",
    likes: 1240,
    comments: 42,
    isLiked: true,
    createdAt: "2j lalu"
  },
  {
    id: "2",
    user: {
      id: "u2", name: "Modern Architect", username: "arch_design",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Design"
    },
    content: "Minimalism is not the absence of something. It's the perfect amount of something. Soplantila 2.0 interface looks promising!",
    likes: 850,
    comments: 12,
    createdAt: "5j lalu"
  }
];

export default function DashboardContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isLoading && !user) {
      startTransition(() => {
        router.replace("/login");
      });
    }
  }, [user, isLoading, router]);

  // Show consistent loading state during auth check
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Spinner className="h-10 w-10 text-accent" />
      </div>
    );
  }

  // If no user after loading, show minimal UI while redirecting
  if (!user) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Spinner className="h-10 w-10 text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans selection:bg-accent/20 flex relative">
      <Sidebar />

      {/* Main Feed Container */}
      <main className="flex-1 ml-[70px] lg:ml-[260px] mr-0 xl:mr-[340px] transition-all duration-500 min-h-[100dvh]">
        <div className="max-w-2xl mx-auto py-8 lg:py-12 px-4 sm:px-6">

          {/* Subtle Page Header */}
          <header className="mb-8 lg:mb-12 space-y-2 animate-reveal sticky top-0 bg-background/80 backdrop-blur-xl z-10 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-border-soft/50">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Home</h1>
          </header>

          {/* Quick Compose Mockup */}
          <div className="mb-10 p-4 lg:p-5 rounded-[2.5rem] bg-surface border border-border-soft focus-within:border-accent/40 focus-within:shadow-premium transition-all duration-300 glass group">
             <div className="flex items-start gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-tr from-accent to-accent-strong flex items-center justify-center text-white text-sm font-bold shadow-sm">
                   {user.profile?.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <textarea
                    placeholder="What's happening?!"
                    className="w-full bg-transparent border-none outline-none resize-none overflow-hidden min-h-[50px] text-[17px] sm:text-[19px] placeholder:text-muted/60 mt-1.5 focus:placeholder:text-muted/40 transition-colors"
                    rows={1}
                  />
                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-border-soft/50 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                     <div className="flex items-center gap-2 text-accent">
                        {/* Placeholder for media buttons */}
                        <div className="h-8 w-8 rounded-full hover:bg-accent/10 flex items-center justify-center cursor-pointer transition-colors">
                           <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><g><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></g></svg>
                        </div>
                     </div>
                     <button className="bg-foreground text-background px-5 py-2 rounded-full text-[14px] font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-sm disabled:opacity-50">
                        Post
                     </button>
                  </div>
                </div>
             </div>
          </div>

          <div className="h-px bg-border-soft/50 w-full mb-8" />

          {/* Post Loop */}
          <div className="space-y-6 sm:space-y-8">
            {MOCK_FEED.map((post, i) => (
              <div key={post.id} className="animate-reveal" style={{ animationDelay: `${i * 100}ms` }}>
                <PostCard post={post} />
              </div>
            ))}
          </div>

          {/* End of Feed Indicator */}
          <div className="py-16 text-center">
             <div className="h-1.5 w-12 bg-border-soft mx-auto rounded-full mb-6" />
             <p className="text-[12px] font-bold text-muted uppercase tracking-[0.2em]">You&apos;re all caught up</p>
          </div>
        </div>
      </main>

      {/* Right Panel - Suggestions (Hidden on mobile/tablet) */}
      <aside className="fixed right-0 top-0 h-screen w-[340px] hidden xl:flex flex-col py-8 px-6 border-l border-border-soft glass-strong z-20">
        <div className="space-y-10 overflow-y-auto pr-2 pb-8 custom-scrollbar">
          {/* Search Bar */}
          <div className="relative group">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted group-focus-within:text-accent transition-colors" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
             </div>
             <input
                type="text"
                placeholder="Search..."
                className="w-full bg-surface-dark border border-transparent rounded-full py-3 pl-11 pr-4 text-[15px] outline-none focus:bg-background focus:border-accent/40 focus:shadow-sm transition-all"
             />
          </div>

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
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true"><circle cx="5" cy="12" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="19" cy="12" r="1.5"></circle></svg>
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-[1.5rem] bg-surface-dark/50 border border-border-soft/40 backdrop-blur-sm">
             <h3 className="text-[16px] font-bold tracking-tight mb-5 px-1">Who to follow</h3>
             <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-surface-dark border border-border-soft overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=User${i}`} alt={`User ${i} avatar`} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[14px] font-bold group-hover:underline leading-tight">Creator {i}</span>
                           <span className="text-[13px] text-muted leading-tight">@creator{i}</span>
                        </div>
                     </div>
                     <button className="bg-foreground text-background px-4 py-1.5 rounded-full text-[13px] font-bold hover:opacity-90 active:scale-95 transition-all">Follow</button>
                  </div>
                ))}
             </div>
          </div>

          {/* Subtle Footer Links */}
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
