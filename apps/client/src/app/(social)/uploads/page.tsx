'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { XIcon } from '@/components/ui/icons';
import {
  getUploadHistory,
  deleteHistory,
  clearOldCompleted,
  formatTimestamp,
  formatDuration,
  formatFileSize,
  getRelativeTime,
  type UploadHistory,
  UploadHistoryStatus,
  MediaUploadStatus,
} from '@/features/feed/services/upload-history-service';

export default function UploadsPage() {
  const [history, setHistory] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Load initial history
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await getUploadHistory(1, 20);
      setHistory(response.data);
      setHasMore(response.pagination.hasMore);
      setPage(1);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await getUploadHistory(nextPage, 20);
      setHistory((prev) => [...prev, ...response.data]);
      setHasMore(response.pagination.hasMore);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = async (historyId: string) => {
    try {
      await deleteHistory(historyId);
      setHistory((prev) => prev.filter((h) => h.id !== historyId));
    } catch (error) {
      console.error('Failed to delete history:', error);
    }
  };

  const handleClearOld = async () => {
    try {
      await clearOldCompleted();
      await loadHistory(); // Reload to show updated list
    } catch (error) {
      console.error('Failed to clear old completed:', error);
    }
  };

  const hasCompleted = history.some((h) => h.status === UploadHistoryStatus.COMPLETED);
  const hasActive = history.some(
    (h) => h.status === UploadHistoryStatus.UPLOADING || h.status === UploadHistoryStatus.PROCESSING
  );

  const getStatusDisplay = (item: UploadHistory) => {
    switch (item.status) {
      case UploadHistoryStatus.PENDING:
        return {
          icon: '⏳',
          text: 'Pending',
          color: 'text-muted',
        };
      case UploadHistoryStatus.UPLOADING:
        return {
          icon: '🔵',
          text: 'Uploading media...',
          color: 'text-accent',
        };
      case UploadHistoryStatus.PROCESSING:
        return {
          icon: '🔵',
          text: 'Creating post...',
          color: 'text-accent',
        };
      case UploadHistoryStatus.COMPLETED:
        return {
          icon: '✅',
          text: `Completed${item.processingTimeMs ? ` • ${formatDuration(item.processingTimeMs)}` : ''}`,
          color: 'text-success',
        };
      case UploadHistoryStatus.FAILED:
        return {
          icon: '❌',
          text: item.errorMessage || 'Failed',
          color: 'text-danger',
        };
      default:
        return {
          icon: '⏳',
          text: 'Unknown',
          color: 'text-muted',
        };
    }
  };

  const getMediaStatusDisplay = (status: MediaUploadStatus) => {
    switch (status) {
      case MediaUploadStatus.PENDING:
        return { icon: '⏳', color: 'bg-muted/10 text-muted' };
      case MediaUploadStatus.UPLOADING:
        return { icon: null, color: 'bg-accent/10' };
      case MediaUploadStatus.COMPLETED:
        return { icon: '✅', color: 'bg-success/10 text-success' };
      case MediaUploadStatus.FAILED:
        return { icon: '❌', color: 'bg-danger/10 text-danger' };
      default:
        return { icon: '⏳', color: 'bg-muted/10 text-muted' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex">
        <Sidebar />
        <main className="flex-1 ml-[70px] lg:ml-[260px] transition-all duration-500 min-h-[100dvh]">
          <div className="max-w-2xl mx-auto py-8 lg:py-12 px-4 sm:px-6">
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 ml-[70px] lg:ml-[260px] transition-all duration-500 min-h-[100dvh]">
        <div className="max-w-2xl mx-auto py-8 lg:py-12 px-4 sm:px-6">
          {/* Page Header */}
          <header className="mb-8 lg:mb-12 space-y-2 animate-reveal sticky top-0 bg-background/80 backdrop-blur-xl z-10 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-border-soft/50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Upload History</h1>
                <p className="text-[12px] font-medium text-muted mt-1">
                  {hasActive
                    ? `${history.filter((h) => h.status === UploadHistoryStatus.UPLOADING || h.status === UploadHistoryStatus.PROCESSING).length} upload(s) in progress`
                    : history.length > 0
                    ? `${history.length} upload${history.length > 1 ? 's' : ''} in history`
                    : 'No upload history'}
                </p>
              </div>
              {hasCompleted && (
                <button
                  onClick={handleClearOld}
                  className="px-4 py-2 rounded-full text-[13px] font-bold tracking-wider text-muted hover:text-foreground hover:bg-surface-dark transition-all active:scale-95"
                >
                  Clear old
                </button>
              )}
            </div>
          </header>

          {/* History Items */}
          {history.length === 0 ? (
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
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-[19px] font-bold text-foreground tracking-tight mb-2">
                No upload history
              </h3>
              <p className="text-muted text-[15px] max-w-xs mx-auto leading-relaxed">
                Your upload history will appear here. Create posts with media to see them tracked.
              </p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {history.map((item, index) => {
                const status = getStatusDisplay(item);
                return (
                  <article
                    key={item.id}
                    className="bg-surface border border-border-soft rounded-[2.5rem] overflow-hidden hover:border-accent/30 hover:shadow-hover transition-all duration-500 glass-strong animate-reveal"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Post Header */}
                    <div className="p-6 pb-4 flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground/95 leading-relaxed text-[15px] mb-3 whitespace-pre-wrap break-words">
                          {item.content}
                        </p>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[16px]">{status.icon}</span>
                          <span className={`text-[12px] font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <p className="text-[11px] text-muted/70">
                          {getRelativeTime(item.startedAt)} • {formatTimestamp(item.startedAt)}
                        </p>
                      </div>

                      {/* Remove Button */}
                      {(item.status === UploadHistoryStatus.COMPLETED ||
                        item.status === UploadHistoryStatus.FAILED) && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 -mt-1 -mr-2 hover:bg-surface-dark rounded-full transition-colors text-muted hover:text-foreground active:scale-95 flex-shrink-0"
                          aria-label="Remove"
                        >
                          <XIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    {/* Media Items */}
                    {item.mediaItems && item.mediaItems.length > 0 && (
                      <div className="px-6 pb-5 space-y-3">
                        {item.mediaItems.map((media) => {
                          const mediaStatus = getMediaStatusDisplay(media.status);
                          return (
                            <div
                              key={media.id}
                              className="flex items-center gap-4 p-4 rounded-2xl bg-surface-dark/50 border border-border-soft/30"
                            >
                              {/* Thumbnail */}
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-dark flex-shrink-0 border border-border-soft/50">
                                {media.thumbnailUrl || media.publicUrl ? (
                                  media.mediaType === 'IMAGE' ? (
                                    <img
                                      src={media.thumbnailUrl || media.publicUrl}
                                      alt={media.fileName}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <video
                                      src={media.thumbnailUrl || media.publicUrl}
                                      className="w-full h-full object-cover"
                                      muted
                                    />
                                  )
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted">
                                    {media.mediaType === 'IMAGE' ? '🖼️' : '🎬'}
                                  </div>
                                )}
                              </div>

                              {/* Progress */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[13px] font-medium text-foreground truncate">
                                    {media.fileName}
                                  </span>
                                  <span className="text-[11px] text-muted ml-2 font-medium">
                                    {formatFileSize(media.fileSize)}
                                  </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden border border-border-soft/30 mb-1">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      media.status === MediaUploadStatus.FAILED
                                        ? 'bg-danger'
                                        : media.status === MediaUploadStatus.COMPLETED
                                        ? 'bg-success'
                                        : 'bg-accent'
                                    }`}
                                    style={{ width: `${media.progress}%` }}
                                  />
                                </div>

                                {/* Status/Duration */}
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-muted">
                                    {media.status === MediaUploadStatus.COMPLETED && media.uploadTimeMs
                                      ? `✅ ${formatDuration(media.uploadTimeMs)}`
                                      : media.status === MediaUploadStatus.UPLOADING
                                      ? `${media.progress}%`
                                      : media.status === MediaUploadStatus.FAILED
                                      ? '❌ Failed'
                                      : '⏳ Pending'}
                                  </span>
                                </div>

                                {/* Error */}
                                {media.errorMessage && (
                                  <p className="text-[11px] text-danger mt-1 truncate">
                                    {media.errorMessage}
                                  </p>
                                )}
                              </div>

                              {/* Status Icon */}
                              <div className="flex-shrink-0">
                                {mediaStatus.icon ? (
                                  <div className={`w-9 h-9 rounded-full ${mediaStatus.color} flex items-center justify-center`}>
                                    <span className="text-[16px]">{mediaStatus.icon}</span>
                                  </div>
                                ) : media.status === MediaUploadStatus.UPLOADING ? (
                                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </article>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-6 py-3 rounded-full text-[14px] font-bold tracking-wider text-foreground bg-surface-dark hover:bg-surface transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      'Load more'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
