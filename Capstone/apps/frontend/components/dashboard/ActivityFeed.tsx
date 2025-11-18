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
      <div className="bg-red-400 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
        <p className="text-black font-black text-lg">FAILED TO LOAD ACTIVITIES</p>
      </div>
    );
  }

  if (allActivities.length === 0) {
    return (
      <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
        <div className="w-20 h-20 bg-cyan-400 border-4 border-black mx-auto mb-6 flex items-center justify-center text-4xl">
          📋
        </div>
        <h3 className="text-2xl font-black text-black mb-2">
          NO ACTIVITIES YET
        </h3>
        <p className="text-lg font-bold text-black">
          Community activities will appear here!
        </p>
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
            className="w-full sm:w-auto px-6 py-3 font-black bg-cyan-400 text-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            LOAD MORE ({allActivities.length - paginatedActivities.length})
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
