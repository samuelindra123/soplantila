'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Post, deletePost } from '../services/feed-service';
import { formatDistanceToNow } from 'date-fns';
import VideoPlayer from './video-player';
import {
  BookmarkIcon,
  CheckCircle2Icon,
  HeartIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  Share2Icon,
} from '@/components/ui/icons';
import { DeletePostModal } from '@/components/social/delete-post-modal';

interface PostCardProps {
  post: Post;
  showInFeed?: boolean;
  onDeleted?: () => void;
}

export default function PostCard({ post, showInFeed = false, onDeleted }: PostCardProps) {
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [isBookmarked, setIsBookmarked] = useState(Boolean(post.isBookmarked));

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePost(post.id);
      onDeleted?.();
    } catch (error) {
      console.error('Failed to delete post:', error);
      toast.error('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleMenuToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const mediaItems = post.mediaItems || [];
  const hasMultipleMedia = mediaItems.length > 1;
  const isPosting = post.clientStatus === 'posting';

  // Safety: Ensure author exists
  const author = post.author || {
    id: 'unknown',
    username: 'unknown',
    displayName: 'Unknown User',
    avatarUrl: undefined,
    isVerified: false,
  };

  // Generate initials from display name
  const initials = (author.displayName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const toggleLike = () => {
    if (isPosting) return;
    setIsLiked((prev) => {
      setLikeCount((count) => Math.max(0, count + (prev ? -1 : 1)));
      return !prev;
    });
  };

  const toggleBookmark = () => {
    if (isPosting) return;
    setIsBookmarked((prev) => !prev);
  };

  return (
    <article className="group bg-surface border border-border-soft rounded-[2.5rem] overflow-hidden hover:border-accent/30 hover:shadow-hover transition-all duration-500 glass-strong">
      {/* Header */}
      <div className="p-6 pb-4 flex items-start justify-between">
        <div className="flex items-center gap-4 cursor-pointer group/user">
          <Link href={`/u/${author.username}`}>
            <div className="h-12 w-12 shrink-0 rounded-[1.25rem] bg-surface-dark overflow-hidden border border-border-soft/50 shadow-sm group-hover/user:shadow-md transition-all">
              {author.avatarUrl ? (
                <img 
                  src={author.avatarUrl} 
                  alt={author.displayName} 
                  className="h-full w-full object-cover rounded-[1rem] group-hover/user:scale-105 transition-transform duration-500" 
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-[1rem] bg-accent/10 text-[13px] font-bold text-accent">
                  {initials || 'U'}
                </div>
              )}
            </div>
          </Link>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <Link href={`/u/${author.username}`}>
                <h4 className="font-bold text-[15px] tracking-tight group-hover/user:text-accent transition-colors">
                  {author.displayName}
                </h4>
              </Link>
              {author.isVerified && (
                <CheckCircle2Icon className="h-4 w-4 text-accent" />
              )}
              {isPosting && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                  Posting
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-muted font-medium mt-0.5">
              <span>@{author.username}</span>
              <span className="text-[10px]">•</span>
              <time className="hover:underline cursor-pointer">{timeAgo}</time>
            </div>
          </div>
        </div>

        {/* Menu button - hide for own posts in feed */}
        {!post.isOwner && (
          <div className="relative">
            <button
              type="button"
              onClick={handleMenuToggle}
              className="p-2 -mt-1 -mr-2 hover:bg-surface-dark rounded-full transition-colors text-muted hover:text-foreground active:scale-95"
              aria-label="More options"
            >
              <MoreHorizontalIcon className="h-5 w-5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-surface/98 backdrop-blur-xl border border-border-soft/50 rounded-xl shadow-2xl overflow-hidden min-w-[200px] animate-in fade-in zoom-in-95 duration-150">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        // TODO: Implement report functionality
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-surface-dark/50 transition-colors text-left group"
                    >
                      <svg className="h-[18px] w-[18px] text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                      </svg>
                      <span className="text-[14px] font-medium text-foreground">Laporkan postingan</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-6 pb-5">
          <p className="text-foreground/95 leading-relaxed text-[15px] whitespace-pre-wrap font-normal">
            {post.content}
          </p>
        </div>
      )}

      {/* Media */}
      {mediaItems.length > 0 && (
        <div className="px-6 pb-5">
          <div className="relative rounded-[2rem] overflow-hidden border border-border-soft/50 bg-surface-dark group-hover:shadow-premium transition-all duration-700">
            {/* Current media */}
            {mediaItems[currentMediaIndex]?.mediaType === 'video' ? (
              <VideoPlayer
                src={mediaItems[currentMediaIndex].url}
                poster={mediaItems[currentMediaIndex].previewImageUrl}
              />
            ) : (
              <img
                src={mediaItems[currentMediaIndex].url}
                alt={`Post media ${currentMediaIndex + 1}`}
                className="w-full max-h-[500px] object-contain group-hover:scale-[1.02] transition-transform duration-1000 ease-out"
                loading="lazy"
              />
            )}

            {/* Carousel controls */}
            {hasMultipleMedia && (
              <>
                {/* Previous */}
                {currentMediaIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentMediaIndex((i) => i - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background text-foreground flex items-center justify-center transition-all active:scale-95 shadow-lg"
                    aria-label="Previous media"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                )}

                {/* Next */}
                {currentMediaIndex < mediaItems.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentMediaIndex((i) => i + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background text-foreground flex items-center justify-center transition-all active:scale-95 shadow-lg"
                    aria-label="Next media"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                  {mediaItems.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentMediaIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentMediaIndex
                          ? 'bg-accent w-6'
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                      aria-label={`Go to media ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fallback for legacy mediaUrl */}
      {mediaItems.length === 0 && post.mediaUrl && (
        <div className="px-6 pb-5">
          <div className="rounded-[2rem] overflow-hidden border border-border-soft/50 bg-surface-dark group-hover:shadow-premium transition-all duration-700">
            <img
              src={post.mediaUrl}
              alt="Post media"
              className="w-full max-h-[500px] object-contain group-hover:scale-[1.02] transition-transform duration-1000 ease-out"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 border-t border-border-soft/30 flex items-center justify-between bg-surface-dark/30">
        <div className="flex items-center gap-6">
          {/* Like */}
          <button 
            onClick={toggleLike}
            className="flex items-center gap-2.5 text-muted hover:text-danger transition-all group/btn active:scale-95 disabled:opacity-40" 
            disabled={isPosting}
            aria-label="Like post"
          >
            <div className={`p-2 rounded-full transition-colors ${isLiked ? 'bg-danger/10' : 'group-hover/btn:bg-danger/10'}`}>
              <HeartIcon className={`h-5 w-5 transition-transform ${isLiked ? 'fill-danger text-danger' : 'group-hover/btn:scale-110'}`} />
            </div>
            <span className={`text-[13px] font-bold tracking-tighter transition-colors ${isLiked ? 'text-danger' : ''}`}>
              {likeCount}
            </span>
          </button>

          {/* Comment */}
          <button 
            className="flex items-center gap-2.5 text-muted hover:text-accent transition-all group/btn active:scale-95 disabled:opacity-40" 
            disabled={isPosting}
            aria-label="Comment on post"
          >
            <div className="p-2 rounded-full group-hover/btn:bg-accent/10 transition-colors">
              <MessageCircleIcon className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
            </div>
            <span className="text-[13px] font-bold tracking-tighter">
              {post.comments || 0}
            </span>
          </button>

          {/* Share */}
          <button 
            className="flex items-center text-muted hover:text-foreground transition-all group/btn active:scale-95 disabled:opacity-40" 
            disabled={isPosting}
            aria-label="Share post"
          >
            <div className="p-2 rounded-full group-hover/btn:bg-surface-dark transition-colors">
              <Share2Icon className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
            </div>
          </button>
        </div>

        {/* Bookmark */}
        <button 
          onClick={toggleBookmark}
          className={`transition-all active:scale-95 group/btn disabled:opacity-40 ${isBookmarked ? 'text-accent' : 'text-muted hover:text-foreground'}`} 
          disabled={isPosting}
          aria-label="Bookmark post"
        >
          <div className={`p-2 rounded-full transition-colors ${isBookmarked ? 'bg-accent/10' : 'group-hover/btn:bg-surface-dark'}`}>
            <BookmarkIcon className={`h-5 w-5 transition-transform group-hover/btn:scale-110 ${isBookmarked ? 'fill-accent' : ''}`} />
          </div>
        </button>
      </div>

      {/* Delete Modal */}
      <DeletePostModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </article>
  );
}
