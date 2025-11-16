"use client";

import { useState } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getProgram, getConnection } from "@/lib/anchor-setup";

export default function EventsPage() {
  const { connected } = useWallet();
  const wallet = useAnchorWallet();
  const [communityName, setCommunityName] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [maxAttendees, setMaxAttendees] = useState(100);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const createEvent = async () => {
    if (!wallet) {
      setMessage("Please connect your wallet");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const [communityPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("community"), Buffer.from(communityName)],
        program.programId
      );

      const [memberPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("member"), communityPda.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
      );

      const eventId = `Event${Date.now()}`;
      const [eventPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("event"), communityPda.toBuffer(), Buffer.from(eventId)],
        program.programId
      );

      const eventTimestamp = new BN(Math.floor(new Date(eventDate).getTime() / 1000));

      const tx = await program.methods
        .createEvent(
          eventId,
          eventName,
          eventDescription,
          eventLocation,
          eventTimestamp,
          new BN(maxAttendees)
        )
        .accountsStrict({
          event: eventPda,
          community: communityPda,
          member: memberPda,
          organizer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setMessage(`Event created! TX: ${tx}`);
      setEventName("");
      setEventDescription("");
      setEventLocation("");
      setEventDate("");
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-pink-300 border-6 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md text-center">
          <span className="text-6xl mb-4 block">🔒</span>
          <p className="text-xl font-black text-black uppercase">
            Connect Wallet to Create Events
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black text-black uppercase mb-4" style={{ textShadow: '5px 5px 0px #FF69B4' }}>
            Create Event
          </h1>
          <p className="text-lg font-bold text-black">
            Organize community meetups and gatherings
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-lime-200 border-6 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-6">
            {/* Community Name */}
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Community Name
              </label>
              <input
                type="text"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                placeholder="TestDAO"
              />
            </div>

            {/* Event Name */}
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                placeholder="Community Meetup"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Description
              </label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none resize-none"
                rows={4}
                placeholder="Event details..."
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Location
              </label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                placeholder="San Francisco, CA"
              />
            </div>

            {/* Event Date & Time */}
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Event Date & Time
              </label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
              />
            </div>

            {/* Max Attendees */}
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Max Attendees
              </label>
              <input
                type="number"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(Number(e.target.value))}
                className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                min={1}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={createEvent}
              disabled={loading || !communityName || !eventName || !eventDate}
              className="w-full bg-black text-white border-4 border-black py-4 font-black text-lg uppercase hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1"
            >
              {loading ? "Creating..." : "Create Event"}
            </button>

            {/* Message Display */}
            {message && (
              <div
                className={`p-4 border-4 border-black font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                  message.includes("Error")
                    ? "bg-red-300 text-black"
                    : "bg-green-300 text-black"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}