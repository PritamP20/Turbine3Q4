import { DashboardHeaderSkeleton } from "./Skeletons";
import type { CommunityStats } from "@/types/dashboard";

interface DashboardHeaderProps {
  community: {
    name: string;
    tokenSymbol: string;
  };
  stats: CommunityStats;
  onBack: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
}

export default function DashboardHeader({ community, stats, onBack, onRefresh, isRefreshing = false, isLoading = false }: DashboardHeaderProps) {
  if (isLoading) {
    return <DashboardHeaderSkeleton />;
  }
  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4 transition-all duration-200 hover:gap-3 transform hover:-translate-x-1"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm sm:text-base">Back to Communities</span>
        </button>

        {/* Community Info */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 truncate">
              {community.name}
            </h1>
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400">
              ${community.tokenSymbol}
            </p>
          </div>
          
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed shrink-0 w-full sm:w-auto hover:shadow-md transform active:scale-95"
              title="Refresh dashboard data"
            >
              <svg
                className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          )}
        </div>

        {/* Community Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 sm:p-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1">
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">Members</p>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.totalMembers}
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 sm:p-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1">
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">Proposals</p>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.totalProposals}
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 sm:p-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1">
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">Events</p>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {stats.totalEvents}
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 sm:p-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all duration-200 hover:shadow-md transform hover:-translate-y-1">
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mb-1">Treasury</p>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-50 truncate">
              {stats.treasuryBalance.toFixed(2)} SOL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
