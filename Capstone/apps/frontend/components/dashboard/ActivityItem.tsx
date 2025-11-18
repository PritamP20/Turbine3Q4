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

    if (diffMins < 1) return "JUST NOW";
    if (diffMins < 60) return `${diffMins}M AGO`;
    if (diffHours < 24) return `${diffHours}H AGO`;
    if (diffDays < 7) return `${diffDays}D AGO`;
    
    return date.toLocaleDateString().toUpperCase();
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case "member_joined":
        return "👤";
      case "proposal_created":
        return "📝";
      case "vote_cast":
        return "🗳️";
      case "event_created":
        return "📅";
      case "token_transfer":
        return "💸";
      case "treasury_deposit":
        return "💰";
      default:
        return "📌";
    }
  };

  const getActivityColor = () => {
    switch (activity.type) {
      case "member_joined":
        return "bg-lime-400";
      case "proposal_created":
        return "bg-cyan-400";
      case "vote_cast":
        return "bg-pink-400";
      case "event_created":
        return "bg-yellow-400";
      case "token_transfer":
        return "bg-orange-400";
      case "treasury_deposit":
        return "bg-green-400";
      default:
        return "bg-white";
    }
  };

  const getActivityLabel = () => {
    switch (activity.type) {
      case "member_joined":
        return "MEMBER JOINED";
      case "proposal_created":
        return "PROPOSAL CREATED";
      case "vote_cast":
        return "VOTE CAST";
      case "event_created":
        return "EVENT CREATED";
      case "token_transfer":
        return "TOKEN TRANSFER";
      case "treasury_deposit":
        return "TREASURY DEPOSIT";
      default:
        return "ACTIVITY";
    }
  };

  const getActivityDescription = () => {
    const actorDisplay = activity.actorName || truncateAddress(activity.actor);

    switch (activity.details.type) {
      case "member_joined":
        return (
          <>
            <span className="font-black">{activity.details.memberName}</span> JOINED THE COMMUNITY
          </>
        );
      case "proposal_created":
        return (
          <>
            <span className="font-black">{actorDisplay}</span> CREATED PROPOSAL{" "}
            <span className="font-black">"{activity.details.proposalTitle}"</span>
          </>
        );
      case "vote_cast":
        return (
          <>
            <span className="font-black">{actorDisplay}</span> VOTED{" "}
            <span className="font-black">{activity.details.vote.toUpperCase()}</span> ON A PROPOSAL
          </>
        );
      case "event_created":
        return (
          <>
            <span className="font-black">{actorDisplay}</span> CREATED EVENT{" "}
            <span className="font-black">"{activity.details.eventName}"</span>
          </>
        );
      case "token_transfer":
        return (
          <>
            <span className="font-black">{actorDisplay}</span> TRANSFERRED{" "}
            <span className="font-black">{activity.details.amount}</span> TOKENS TO{" "}
            <span className="font-black">{truncateAddress(activity.details.recipient)}</span>
          </>
        );
      case "treasury_deposit":
        return (
          <>
            <span className="font-black">{actorDisplay}</span> DEPOSITED{" "}
            <span className="font-black">{activity.details.amount}</span> TOKENS TO TREASURY
          </>
        );
      default:
        return <span>UNKNOWN ACTIVITY</span>;
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
      {/* Icon */}
      <div className={`shrink-0 w-12 h-12 ${getActivityColor()} border-4 border-black flex items-center justify-center text-2xl`}>
        {getActivityIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-black text-black">
            {getActivityLabel()}
          </span>
          <span className="text-xs font-black text-black">•</span>
          <span className="text-xs font-black text-black">
            {formatTimestamp(activity.timestamp)}
          </span>
        </div>
        <p className="text-sm font-bold text-black">
          {getActivityDescription()}
        </p>
      </div>
    </div>
  );
}
