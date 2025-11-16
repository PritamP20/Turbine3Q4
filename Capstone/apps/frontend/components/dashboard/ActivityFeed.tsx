"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useActivities } from "@/lib/hooks/useCommunityData";
import ActivityItem from "./ActivityItem";
import { ActivityFeedSkeleton } from "./Skeletons";

interface ActivityFeedProps {
  communityId: string;
}

export default function ActivityFeed({ communityId }: ActivityFeedProps) {
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Use React Query hook for activities
  const { data: allActivities = [], isLoading, error, isRefetching } = useActivities(communityId);

  // Paginate activities
  const paginatedActivities = useMemo(() => {
    const endIndex = page * ITEMS_PER_PAGE;
    return allActivities.slice(0, endIndex);
  }, [allActivities, page]);

  const hasMore = paginatedActivities.length < allActivities.length;

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  // Infinite scroll using Intersection Observer
  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoading]);

  if (isLoading) {
    return <ActivityFeedSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">Failed to load activities</p>
      </div>
    );
  }

  if (allActivities.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center max-w-md">
          <svg
            className="mx-auto h-16 w-16 text-zinc-400 dark:text-zinc-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            No activities yet
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Community activities like proposals, events, and member actions will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity list */}
      <div className="space-y-3">
        {paginatedActivities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="text-center pt-4">
          <button
            onClick={loadMore}
            className="w-full sm:w-auto px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform active:scale-95 hover:shadow-md"
          >
            Load More ({allActivities.length - paginatedActivities.length} remaining)
          </button>
        </div>
      )}

      {/* Loading more indicator */}
      {hasMore && isRefetching && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      {!hasMore && isRefetching && (
        <div className="text-center text-sm text-zinc-500 dark:text-zinc-500 flex items-center justify-center gap-2 py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-zinc-500"></div>
          <span>Checking for new activities...</span>
        </div>
      )}
    </div>
  );
}
