"use client";

import { useState, useRef } from "react";
import { Post } from "@/types/social";
import {
  BookmarkIcon,
  CheckCircle2Icon,
  HeartIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  Share2Icon,
} from "@/components/ui/icons";
import { PostMenu } from "./post-menu";
import { DeletePostModal } from "./delete-post-modal";

export function PostCard({ post }: { post: Post }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  // Handle both post.user and post.author for backwards compatibility
  const user = post.user || (post as any).author;
  
  if (!user) {
    console.error("PostCard: Missing user/author data", post);
    return null;
  }

  const userName = user.name || user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown User";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const handleMenuToggle = () => {
    if (!isMenuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setIsMenuOpen(!isMenuOpen);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    // TODO: Implement actual delete API call
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    console.log("Deleting post:", post.id);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    // TODO: Refresh posts or remove from list
  };

  return (
    <article className="group bg-surface border border-border-soft rounded-[2.5rem] overflow-hidden hover:border-accent/30 hover:shadow-hover transition-all duration-500 glass-strong">
      <div className="p-6 pb-4 flex items-start justify-between">
        <div className="flex items-center gap-4 cursor-pointer group/user">
          <div className="h-12 w-12 shrink-0 rounded-[1.25rem] bg-surface-dark overflow-hidden border border-border-soft/50 shadow-sm group-hover/user:shadow-md transition-all">
            {(user.avatar || user.avatarUrl || user.fotoProfilUrl) ? (
              <img src={(user.avatar || user.avatarUrl || user.fotoProfilUrl) as string} alt={userName} className="h-full w-full object-cover rounded-[1rem] group-hover/user:scale-105 transition-transform duration-500" />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[1rem] bg-accent/10 text-[13px] font-bold text-accent">
                {initials || "U"}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-[15px] tracking-tight group-hover/user:text-accent transition-colors">{userName}</h4>
              {user.isVerified && <CheckCircle2Icon className="h-4 w-4 text-accent" />}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted font-medium mt-0.5">
              <span>@{user.username || "unknown"}</span>
              <span className="text-[10px]">•</span>
              <time className="hover:underline">{post.createdAt}</time>
            </div>
          </div>
        </div>
        <div className="relative">
          <button 
            ref={menuButtonRef}
            onClick={handleMenuToggle}
            className="p-2 -mt-1 -mr-2 hover:bg-surface-dark rounded-full transition-colors text-muted hover:text-foreground active:scale-95" 
            aria-label="More options"
          >
            <MoreHorizontalIcon className="h-5 w-5" />
          </button>
          <PostMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            onDelete={handleDeleteClick}
            isOwnPost={true}
            position={menuPosition}
          />
        </div>
      </div>

      <div className="px-6 pb-5">
        <p className="text-foreground/95 leading-relaxed text-[15px] mb-5 whitespace-pre-wrap font-normal">{post.content}</p>
        {post.media && (
          <div className="rounded-[2rem] overflow-hidden border border-border-soft/50 bg-surface-dark group-hover:shadow-premium transition-all duration-700">
            <img
              src={post.media}
              alt="Post media"
              className="w-full h-full object-cover max-h-[500px] group-hover:scale-[1.02] transition-transform duration-1000 ease-out"
              loading="lazy"
            />
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-border-soft/30 flex items-center justify-between bg-surface-dark/30">
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2.5 text-muted hover:text-danger transition-all group/btn active:scale-95" aria-label="Like post">
            <div className={`p-2 rounded-full transition-colors ${post.isLiked ? 'bg-danger/10' : 'group-hover/btn:bg-danger/10'}`}>
              <HeartIcon className={`h-5 w-5 transition-transform ${post.isLiked ? "fill-danger text-danger" : "group-hover/btn:scale-110"}`} />
            </div>
            <span className={`text-[13px] font-bold tracking-tighter transition-colors ${post.isLiked ? 'text-danger' : ''}`}>{post.likes}</span>
          </button>
          <button className="flex items-center gap-2.5 text-muted hover:text-accent transition-all group/btn active:scale-95" aria-label="Comment on post">
            <div className="p-2 rounded-full group-hover/btn:bg-accent/10 transition-colors">
               <MessageCircleIcon className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
            </div>
            <span className="text-[13px] font-bold tracking-tighter">{post.comments}</span>
          </button>
          <button className="flex items-center text-muted hover:text-foreground transition-all group/btn active:scale-95" aria-label="Share post">
            <div className="p-2 rounded-full group-hover/btn:bg-surface-dark transition-colors">
              <Share2Icon className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
            </div>
          </button>
        </div>
        <button className={`transition-all active:scale-95 group/btn ${post.isBookmarked ? "text-accent" : "text-muted hover:text-foreground"}`} aria-label="Bookmark post">
           <div className={`p-2 rounded-full transition-colors ${post.isBookmarked ? 'bg-accent/10' : 'group-hover/btn:bg-surface-dark'}`}>
             <BookmarkIcon className={`h-5 w-5 transition-transform group-hover/btn:scale-110 ${post.isBookmarked ? "fill-accent" : ""}`} />
           </div>
        </button>
      </div>

      {/* Delete Modal */}
      <DeletePostModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </article>
  );
}
