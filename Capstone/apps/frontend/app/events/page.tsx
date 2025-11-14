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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          Please connect your wallet to create events
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
        Create Event
      </h1>

      <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 border border-zinc-200 dark:border-zinc-800">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Community Name
            </label>
            <input
              type="text"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              placeholder="TestDAO"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Event Name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              placeholder="Community Meetup"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              rows={3}
              placeholder="Event details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              placeholder="San Francisco, CA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Event Date & Time
            </label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Max Attendees
            </label>
            <input
              type="number"
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(Number(e.target.value))}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              min={1}
            />
          </div>

          <button
            onClick={createEvent}
            disabled={loading || !communityName || !eventName || !eventDate}
            className="w-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 py-3 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Event"}
          </button>

          {message && (
            <div className={`p-4 rounded-lg ${message.includes("Error") ? "bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100" : "bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100"}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
