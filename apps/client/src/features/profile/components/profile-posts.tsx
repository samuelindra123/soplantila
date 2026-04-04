"use client";

import { Post } from "@/types/social";
import { PostCard } from "@/components/social/post-card";
import { FileTextIcon } from "@/components/ui/icons";

type ProfilePostsProps = {
  posts: Post[];
  isLoading?: boolean;
};

export function ProfilePosts({ posts, isLoading = false }: ProfilePostsProps) {
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-surface-dark/50 rounded-[2.5rem] border border-border-soft animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 sm:px-6">
        <div className="text-center space-y-4">
          <div className="mx-auto h-24 w-24 rounded-full bg-surface-dark/50 border border-border-soft flex items-center justify-center">
            <FileTextIcon className="h-12 w-12 text-muted/50" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">No posts yet</h3>
            <p className="text-muted text-sm max-w-sm mx-auto">
              When posts are shared, they'll appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      <div className="space-y-6 sm:space-y-8">
        {posts.map((post, i) => (
          <div
            key={post.id}
            className="animate-reveal"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <PostCard post={post} />
          </div>
        ))}
      </div>

      {/* End of Posts Indicator */}
      {posts.length > 0 && (
        <div className="py-12 text-center">
          <div className="h-1.5 w-12 bg-border-soft mx-auto rounded-full mb-4" />
          <p className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
            End of posts
          </p>
        </div>
      )}
    </div>
  );
}
