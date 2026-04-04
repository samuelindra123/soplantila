'use client';

import { useUploadQueue } from '@/features/feed/services/upload-queue-store';
import { XIcon } from '@/components/ui/icons';

export function UploadQueueSidebar() {
  const { queue, removePost, clearCompleted } = useUploadQueue();

  if (queue.length === 0) return null;

  const hasCompleted = queue.some((post) => post.status === 'completed');

  return (
    <div className="fixed bottom-6 right-6 w-[380px] max-h-[500px] bg-surface border border-border-soft rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-soft/50 bg-surface-dark/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <h3 className="text-sm font-bold text-foreground">Upload Queue</h3>
          <span className="text-xs text-muted">({queue.length})</span>
        </div>
        {hasCompleted && (
          <button
            onClick={clearCompleted}
            className="text-xs text-muted hover:text-foreground transition-colors"
          >
            Clear completed
          </button>
        )}
      </div>

      {/* Queue Items */}
      <div className="overflow-y-auto max-h-[420px] custom-scrollbar">
        {queue.map((post) => (
          <div
            key={post.id}
            className="p-4 border-b border-border-soft/30 hover:bg-surface-dark/20 transition-colors"
          >
            {/* Post Content */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm text-foreground/90 line-clamp-2 flex-1">
                {post.content}
              </p>
              {post.status === 'completed' && (
                <button
                  onClick={() => removePost(post.id)}
                  className="text-muted hover:text-foreground transition-colors p-1"
                  aria-label="Remove"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Media Items */}
            {post.media.length > 0 && (
              <div className="space-y-2 mb-3">
                {post.media.map((media) => (
                  <div
                    key={media.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-surface-dark/50"
                  >
                    {/* Preview */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-dark flex-shrink-0">
                      {media.mediaType === 'image' ? (
                        <img
                          src={media.previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={media.previewUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                    </div>

                    {/* Progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground truncate">
                          {media.file.name}
                        </span>
                        <span className="text-xs text-muted ml-2">
                          {media.status === 'completed' ? '100%' : `${media.progress}%`}
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            media.status === 'failed'
                              ? 'bg-danger'
                              : media.status === 'completed'
                              ? 'bg-success'
                              : 'bg-accent'
                          }`}
                          style={{ width: `${media.progress}%` }}
                        />
                      </div>

                      {/* Status */}
                      {media.error && (
                        <p className="text-xs text-danger mt-1 truncate">
                          {media.error}
                        </p>
                      )}
                    </div>

                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {media.status === 'completed' && (
                        <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {media.status === 'failed' && (
                        <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      {media.status === 'uploading' && (
                        <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Post Status */}
            <div className="flex items-center gap-2">
              {post.status === 'uploading' && (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs text-muted">Uploading media...</span>
                </>
              )}
              {post.status === 'creating' && (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs text-muted">Creating post...</span>
                </>
              )}
              {post.status === 'completed' && (
                <>
                  <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-success font-medium">Posted successfully</span>
                </>
              )}
              {post.status === 'failed' && (
                <>
                  <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-xs text-danger font-medium">
                    {post.error || 'Failed to create post'}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
