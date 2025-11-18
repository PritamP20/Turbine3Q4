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
    const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const day = date.getDate();
    const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }).toUpperCase();
    return { month, day, time };
  };

  const isFull = event.maxAttendees !== null && event.currentAttendees >= event.maxAttendees;
  const { month, day, time } = formatDate(event.startTime);
  
  const attendancePercentage = event.maxAttendees 
    ? Math.round((event.currentAttendees / event.maxAttendees) * 100)
    : 0;

  return (
    <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
      {/* Header */}
      <div className="bg-yellow-400 border-b-4 border-black p-4">
        <div className="flex items-start gap-3">
          <div className="bg-black text-yellow-400 px-3 py-2 border-2 border-black shrink-0">
            <div className="text-xs font-black leading-none">{month}</div>
            <div className="text-2xl font-black leading-none">{day}</div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-black leading-tight mb-1">
              {event.name}
            </h3>
            <div className="text-xs font-bold text-black">🕐 {time}</div>
          </div>
          {event.hasRSVPd && (
            <div className="bg-lime-400 text-black px-2 py-1 text-xs font-black border-2 border-black shrink-0">
              ✓ GOING
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Description */}
        <p className="text-sm font-bold text-black mb-4 line-clamp-2">
          {event.description}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Location */}
          <div className="col-span-2 p-2 bg-cyan-400 border-2 border-black">
            <div className="text-xs font-black text-black mb-1">📍 LOCATION</div>
            <div className="text-xs font-bold text-black truncate">{event.location}</div>
          </div>

          {/* Attendees */}
          <div className="p-2 bg-pink-400 border-2 border-black">
            <div className="text-xs font-black text-black mb-1">👥 ATTENDEES</div>
            <div className="text-sm font-black text-black">
              {event.currentAttendees}
              {event.maxAttendees !== null && ` / ${event.maxAttendees}`}
            </div>
            {event.maxAttendees !== null && (
              <div className="w-full h-2 bg-black border border-black mt-1">
                <div
                  className="h-full bg-lime-400 transition-all"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </div>
            )}
          </div>

          {/* Organizer */}
          <div className="p-2 bg-purple-400 border-2 border-black">
            <div className="text-xs font-black text-black mb-1">🎯 HOST</div>
            <div className="text-xs font-bold text-black font-mono truncate">
              {event.organizer.slice(0, 8)}...
            </div>
          </div>
        </div>

        {/* RSVP Button */}
        {isUpcoming && !event.hasRSVPd && (
          <button
            onClick={handleRSVP}
            disabled={isRSVPing || isFull}
            className={`w-full py-3 font-black text-sm border-4 border-black transition-all ${
              isFull
                ? "bg-gray-300 text-black cursor-not-allowed"
                : isRSVPing
                ? "bg-yellow-400 text-black"
                : "bg-lime-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
            }`}
          >
            {isRSVPing ? "RSVP'ING..." : isFull ? "EVENT FULL" : "RSVP TO EVENT"}
          </button>
        )}

        {!isUpcoming && (
          <div className="w-full py-3 bg-gray-300 text-black font-black text-sm border-4 border-black text-center">
            EVENT ENDED
          </div>
        )}
      </div>
    </div>
  );
}
