interface FeedStatusBarProps {
  status: 'idle' | 'connecting' | 'connected' | 'auth_failed' | 'error';
  isEndpointMissing?: boolean;
  onRetry?: () => void;
  onRefreshAuth?: () => void;
}

export function FeedStatusBar({ status, isEndpointMissing, onRetry, onRefreshAuth }: FeedStatusBarProps) {
  // Don't show if there's already a sticky banner (auth_failed or connecting)
  if (status === 'idle' || status === 'connected' || status === 'auth_failed' || status === 'connecting') {
    return null;
  }

  return (
    <div className="mb-4 animate-slide-down">
      {/* Network Error State */}
      {status === 'error' && (
        <div className="bg-surface border border-border-soft rounded-2xl px-4 py-3 flex items-center justify-between glass-strong">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[13px] font-medium text-muted">
              {isEndpointMissing 
                ? 'Fitur realtime tidak tersedia'
                : 'Update otomatis nonaktif'
              }
            </span>
          </div>
          {onRetry && !isEndpointMissing && (
            <button
              onClick={onRetry}
              className="text-[12px] font-semibold text-accent hover:underline"
            >
              Perbaiki
            </button>
          )}
        </div>
      )}
    </div>
  );
}
