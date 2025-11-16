/**
 * Loading skeleton components for dashboard sections
 */

export function ActivityFeedSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700 animate-pulse"
        >
          <div className="flex items-start gap-4">
            {/* Icon skeleton */}
            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-full shrink-0" />
            
            <div className="flex-1 space-y-3">
              {/* Title skeleton */}
              <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
              
              {/* Details skeleton */}
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
              
              {/* Timestamp skeleton */}
              <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MembersDirectorySkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-48 animate-pulse" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32 animate-pulse" />
      </div>

      {/* Search and sort skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
        <div className="sm:w-48 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
      </div>

      {/* Members grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700 animate-pulse"
          >
            <div className="space-y-4">
              {/* Name and wallet skeleton */}
              <div className="space-y-2">
                <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
              </div>

              {/* Stats skeleton */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-12" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
                </div>
              </div>

              {/* Progress bar skeleton */}
              <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-56 animate-pulse" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-64 animate-pulse" />
      </div>

      {/* Leaderboard entries skeleton */}
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-800 rounded-lg p-4 border-2 border-zinc-200 dark:border-zinc-700 animate-pulse"
          >
            <div className="flex items-center gap-4">
              {/* Rank skeleton */}
              <div className="w-16 shrink-0">
                <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded mx-auto w-12" />
              </div>

              {/* Member info skeleton */}
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
              </div>

              {/* Stats skeleton */}
              <div className="flex items-center gap-6">
                <div className="text-right space-y-2">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-16" />
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16" />
                  <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-12" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EventsSectionSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab navigation skeleton */}
      <div className="flex space-x-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded w-32 animate-pulse" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded w-24 animate-pulse" />
      </div>

      {/* Events grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700 animate-pulse"
          >
            <div className="space-y-4">
              {/* Event name skeleton */}
              <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />

              {/* Event description skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-5/6" />
              </div>

              {/* Event details skeleton */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-24" />
                </div>
              </div>

              {/* Attendees skeleton */}
              <div className="space-y-2">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-28" />
                <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
              </div>

              {/* Button skeleton */}
              <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatSectionSkeleton() {
  return (
    <div className="flex flex-col h-[600px]">
      {/* Header skeleton */}
      <div className="mb-4 space-y-2">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-48 animate-pulse" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-56 animate-pulse" />
      </div>

      {/* Messages container skeleton */}
      <div className="flex-1 mb-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 animate-pulse ${
                  i % 2 === 0
                    ? 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
                    : 'bg-blue-600'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 rounded w-20 ${
                      i % 2 === 0 ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-blue-400'
                    }`} />
                    <div className={`h-3 rounded w-16 ${
                      i % 2 === 0 ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-blue-400'
                    }`} />
                  </div>
                  <div className={`h-4 rounded w-48 ${
                    i % 2 === 0 ? 'bg-zinc-200 dark:bg-zinc-700' : 'bg-blue-400'
                  }`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input skeleton */}
      <div className="flex gap-2">
        <div className="flex-1 h-20 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
        <div className="w-24 h-20 bg-zinc-200 dark:bg-zinc-700 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export function DashboardHeaderSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700 mb-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-64" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
        </div>
        <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
            <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
