export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-surface border border-border-soft rounded-[2.5rem] p-6 glass-strong animate-pulse"
        >
          {/* Header: Avatar + Name */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-surface-dark" />
            <div className="flex-1">
              <div className="h-4 bg-surface-dark rounded-full w-32 mb-2" />
              <div className="h-3 bg-surface-dark rounded-full w-24" />
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-surface-dark rounded-full w-full" />
            <div className="h-4 bg-surface-dark rounded-full w-5/6" />
            <div className="h-4 bg-surface-dark rounded-full w-4/6" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6 pt-3 border-t border-border-soft/50">
            <div className="h-8 bg-surface-dark rounded-full w-16" />
            <div className="h-8 bg-surface-dark rounded-full w-16" />
            <div className="h-8 bg-surface-dark rounded-full w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeedSkeletonInline({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-6 sm:space-y-8 mt-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-surface border border-border-soft rounded-[2.5rem] p-6 glass-strong animate-pulse"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-surface-dark" />
            <div className="flex-1">
              <div className="h-4 bg-surface-dark rounded-full w-32 mb-2" />
              <div className="h-3 bg-surface-dark rounded-full w-24" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-surface-dark rounded-full w-full" />
            <div className="h-4 bg-surface-dark rounded-full w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
