"use client";

import { useState } from "react";
import type { CommunityEvent } from "@/types/dashboard";

interface EventCardProps {
  event: CommunityEvent;
  onRSVP: (eventPublicKey: string) => Promise<void>;
  isUpcoming: boolean;
}

export default function EventCard({ event, onRSVP, isUpcoming }: EventCardProps) {
  const [isRSVPing, setIsRSVPing] = useState(false);

  const handleRSVP = async () => {
    setIsRSVPing(true);
    try {
      await onRSVP(event.publicKey);
    } catch (error) {
      console.error("RSVP failed:", error);
    } finally {
      setIsRSVPing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isFull = event.maxAttendees !== null && event.currentAttendees >= event.maxAttendees;

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 sm:p-6 border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
      {/* Event Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
            {event.name}
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
            {formatDate(event.startTime)}
          </p>
        </div>
        
        {event.hasRSVPd && (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs font-medium rounded-full self-start">
            RSVP'd
          </span>
        )}
      </div>

      {/* Event Description */}
      <p className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300 mb-3 sm:mb-4 line-clamp-3">
        {event.description}
      </p>

      {/* Event Details */}
      <div className="space-y-2 mb-3 sm:mb-4">
        <div className="flex items-center text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{event.location}</span>
        </div>

        <div className="flex items-center text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>
            {event.currentAttendees}
            {event.maxAttendees !== null && ` / ${event.maxAttendees}`} attendees
          </span>
        </div>

        <div className="flex items-center text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="truncate">Organizer: {event.organizer.slice(0, 8)}...</span>
        </div>
      </div>

      {/* RSVP Button */}
      {isUpcoming && !event.hasRSVPd && (
        <button
          onClick={handleRSVP}
          disabled={isRSVPing || isFull}
          className={`w-full py-2 px-4 text-sm sm:text-base rounded-lg font-medium transition-all duration-200 transform active:scale-95 ${
            isFull
              ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
              : isRSVPing
              ? "bg-blue-400 dark:bg-blue-700 text-white cursor-wait"
              : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white hover:shadow-md"
          }`}
        >
          {isRSVPing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              RSVPing...
            </span>
          ) : isFull ? (
            "Event Full"
          ) : (
            "RSVP to Event"
          )}
        </button>
      )}
    </div>
  );
}
