'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { useUploadQueue } from '@/features/feed/services/upload-queue-store';
import { XIcon } from '@/components/ui/icons';

export default function UploadsPage() {
  const { queue, removePost, clearCompleted } = useUploadQueue();

  const hasCompleted = queue.some((post) => post.status === 'completed');
  const hasActive = queue.some((post) => post.status === 'uploading' || post.status === 'creating');

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex">
      <Sidebar />
      
      <main className="flex-1 ml-[70px] lg:ml-[260px] transition-all duration-500 min-h-[100dvh]">
        <div className="max-w-2xl mx-auto py-8 lg:py-12 px-4 sm:px-6">
          
          {/* Page Header */}
          <header className="mb-8 lg:mb-12 space-y-2 animate-reveal sticky top-0 bg-background/80 backdrop-blur-xl z-10 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-border-soft/50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Upload Queue</h1>
                <p className="text-[12px] font-medium text-muted mt-1">
                  {hasActive ? `${queue.filter(p => p.status === 'uploading' || p.status === 'creating').length} upload(s) in progress` : 'No active uploads'}
                </p>
              </div>
              {hasCompleted && (
                <button
                  onClick={clearCompleted}
                  className="px-4 py-2 rounded-full text-[13px] font-bold tracking-wider text-muted hover:text-foreground hover:bg-surface-dark transition-all active:scale-95"
                >
                  Clear completed
                </button>
              )}
            </div>
          </header>

          {/* Queue Items */}
          {queue.length === 0 ? (
            <div className="bg-surface border border-border-soft rounded-[2.5rem] p-12 text-center glass-strong animate-reveal">
              <div className="w-20 h-20 mx-auto mb-6 rounded-[1.5rem] bg-accent/10 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="text-[19px] font-bold text-foreground tracking-tight mb-2">
                No uploads in queue
              </h3>
              <p className="text-muted text-[15px] max-w-xs mx-auto leading-relaxed">
                When you create posts with media, they will appear here while uploading.
              </p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {queue.map((post, index) => (
                <article
                  key={post.id}
                  className="bg-surface border border-border-soft rounded-[2.5rem] overflow-hidden hover:border-accent/30 hover:shadow-hover transition-all duration-500 glass-strong animate-reveal"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Post Header */}
                  <div className="p-6 pb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-foreground/95 leading-relaxed text-[15px] mb-3 whitespace-pre-wrap">
                        {post.content}
                      </p>
                      
                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        {post.status === 'uploading' && (
                          <>
                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            <span className="text-[12px] text-muted font-medium">Uploading media...</span>
                          </>
                        )}
                        {post.status === 'creating' && (
                          <>
                            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            <span className="text-[12px] text-muted font-medium">Creating post...</span>
                          </>
                        )}
                        {post.status === 'completed' && (
                          <>
                            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-[12px] text-success font-medium">Posted successfully</span>
                          </>
                        )}
                        {post.status === 'failed' && (
                          <>
                            <svg className="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-[12px] text-danger font-medium">
                              {post.error || 'Failed to create post'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    {(post.status === 'completed' || post.status === 'failed') && (
                      <button
                        onClick={() => removePost(post.id)}
                        className="p-2 -mt-1 -mr-2 hover:bg-surface-dark rounded-full transition-colors text-muted hover:text-foreground active:scale-95"
                        aria-label="Remove"
                      >
                        <XIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  {/* Media Items */}
                  {post.media.length > 0 && (
                    <div className="px-6 pb-5 space-y-3">
                      {post.media.map((media) => (
                        <div
                          key={media.id}
                          className="flex items-center gap-4 p-4 rounded-2xl bg-surface-dark/50 border border-border-soft/30"
                        >
                          {/* Preview */}
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-dark flex-shrink-0 border border-border-soft/50">
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
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[13px] font-medium text-foreground truncate">
                                {media.file.name}
                              </span>
                              <span className="text-[12px] text-muted ml-2 font-bold">
                                {media.status === 'completed' ? '100%' : `${media.progress}%`}
                              </span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden border border-border-soft/30">
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

                            {/* Error */}
                            {media.error && (
                              <p className="text-[11px] text-danger mt-2 truncate">
                                {media.error}
                              </p>
                            )}
                          </div>

                          {/* Status Icon */}
                          <div className="flex-shrink-0">
                            {media.status === 'completed' && (
                              <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            {media.status === 'failed' && (
                              <div className="w-9 h-9 rounded-full bg-danger/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            )}
                            {media.status === 'uploading' && (
                              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                              </div>
                            )}
                            {media.status === 'pending' && (
                              <div className="w-9 h-9 rounded-full bg-muted/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
