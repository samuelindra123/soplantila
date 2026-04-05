"use client";

import { MediaItem } from "@/types/social";
import { ImageIcon, VideoIcon } from "@/components/ui/icons";
import { useState } from "react";

type ProfileMediaProps = {
  media: MediaItem[];
  isLoading?: boolean;
};

export function ProfileMedia({ media, isLoading = false }: ProfileMediaProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="aspect-square bg-surface-dark/50 rounded-2xl border border-border-soft animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-20 px-4 sm:px-6">
        <div className="text-center space-y-4">
          <div className="mx-auto h-24 w-24 rounded-full bg-surface-dark/50 border border-border-soft flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-muted/50" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">No media yet</h3>
            <p className="text-muted text-sm max-w-sm mx-auto">
              Photos and videos from posts will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {media.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelectedMedia(item)}
              className="group relative aspect-square bg-surface-dark rounded-2xl border border-border-soft overflow-hidden hover:border-accent/30 hover:shadow-lg transition-all duration-300 animate-reveal"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {item.mediaType === 'image' ? (
                <img
                  src={item.url}
                  alt="Media"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <>
                  <img
                    src={item.previewImageUrl || item.url}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition-all">
                      <VideoIcon className="h-6 w-6 text-foreground ml-0.5" />
                    </div>
                  </div>
                  {item.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded-lg text-white text-xs font-medium">
                      {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}
                    </div>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Media Viewer Modal */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div
            className="max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedMedia.mediaType === 'image' ? (
              <img
                src={selectedMedia.url}
                alt="Media"
                className="w-full h-full object-contain rounded-2xl"
              />
            ) : (
              <video
                src={selectedMedia.url}
                poster={selectedMedia.previewImageUrl}
                controls
                autoPlay
                className="w-full h-full object-contain rounded-2xl"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>
      )}
    </>
  );
}
