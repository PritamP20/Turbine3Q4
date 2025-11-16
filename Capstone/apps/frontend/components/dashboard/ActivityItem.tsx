"use client";

import type { Activity } from "@/types/dashboard";

interface ActivityItemProps {
  activity: Activity;
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case "member_joined":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case "proposal_created":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "vote_cast":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case "event_created":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case "token_transfer":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case "treasury_deposit":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case "member_joined":
        return "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400";
      case "proposal_created":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400";
      case "vote_cast":
        return "text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400";
      case "event_created":
        return "text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400";
      case "token_transfer":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400";
      case "treasury_deposit":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400";
      default:
        return "text-zinc-600 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  const getActivityLabel = () => {
    switch (activity.type) {
      case "member_joined":
        return "Member Joined";
      case "proposal_created":
        return "Proposal Created";
      case "vote_cast":
        return "Vote Cast";
      case "event_created":
        return "Event Created";
      case "token_transfer":
        return "Token Transfer";
      case "treasury_deposit":
        return "Treasury Deposit";
      default:
        return "Activity";
    }
  };

  const getActivityDescription = () => {
    const actorDisplay = activity.actorName || truncateAddress(activity.actor);

    switch (activity.details.type) {
      case "member_joined":
        return (
          <>
            <span className="font-semibold">{activity.details.memberName}</span> joined the community
          </>
        );
      case "proposal_created":
        return (
          <>
            <span className="font-semibold">{actorDisplay}</span> created proposal{" "}
            <span className="font-medium text-blue-600 dark:text-blue-400">
              "{activity.details.proposalTitle}"
            </span>
          </>
        );
      case "vote_cast":
        return (
          <>
            <span className="font-semibold">{actorDisplay}</span> voted{" "}
            <span className={`font-medium ${activity.details.vote === "yes" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {activity.details.vote.toUpperCase()}
            </span>{" "}
            on a proposal
          </>
        );
      case "event_created":
        return (
          <>
            <span className="font-semibold">{actorDisplay}</span> created event{" "}
            <span className="font-medium text-orange-600 dark:text-orange-400">
              "{activity.details.eventName}"
            </span>
          </>
        );
      case "token_transfer":
        return (
          <>
            <span className="font-semibold">{actorDisplay}</span> transferred{" "}
            <span className="font-medium">{activity.details.amount}</span> tokens to{" "}
            <span className="font-medium">{truncateAddress(activity.details.recipient)}</span>
          </>
        );
      case "treasury_deposit":
        return (
          <>
            <span className="font-semibold">{actorDisplay}</span> deposited{" "}
            <span className="font-medium">{activity.details.amount}</span> tokens to treasury
          </>
        );
      default:
        return <span>Unknown activity</span>;
    }
  };

  return (
    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-md animate-fadeIn">
      {/* Icon */}
      <div className={`shrink-0 p-1.5 sm:p-2 rounded-lg ${getActivityColor()}`}>
        <div className="w-4 h-4 sm:w-5 sm:h-5">
          {getActivityIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-500 uppercase tracking-wide">
            {getActivityLabel()}
          </span>
          <span className="hidden sm:inline text-xs text-zinc-400 dark:text-zinc-600">•</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-500">
            {formatTimestamp(activity.timestamp)}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 wrap-break-word">
          {getActivityDescription()}
        </p>
      </div>
    </div>
  );
}
