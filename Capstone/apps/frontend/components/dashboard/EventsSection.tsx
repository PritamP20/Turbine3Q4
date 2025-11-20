"use client";

import { useState, useEffect } from "react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getProgram, getConnection } from "@/lib/anchor-setup";
import { parseTransactionError, logTransactionError, retryTransaction } from "@/lib/transaction-errors";
import EventCard from "./EventCard";
import { EventsSectionSkeleton } from "./Skeletons";
import type { CommunityEvent } from "@/types/dashboard";

interface EventsSectionProps {
  communityId: string;
}

export default function EventsSection({ communityId }: EventsSectionProps) {
  const wallet = useAnchorWallet();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (wallet && communityId) {
      fetchEvents();
    }
  }, [wallet, communityId]);

  // Auto-refresh events every 30 seconds
  useEffect(() => {
    if (!wallet || !communityId) return;

    const interval = setInterval(() => {
      fetchEvents();
    }, 30000);

    return () => clearInterval(interval);
  }, [wallet, communityId]);

  const fetchEvents = async () => {
    if (!wallet) return;

    setLoading(true);
    setError("");

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPubkey = new PublicKey(communityId);

      // Fetch all events for this community
      const eventAccounts = await (program.account as any).event.all([
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: communityPubkey.toBase58(),
          },
        },
      ]);

      // Check which events the user has RSVP'd to
      const userAttendances = await fetchUserAttendances(program, wallet.publicKey);

      const now = Math.floor(Date.now() / 1000);

      const fetchedEvents: CommunityEvent[] = eventAccounts.map((account: any) => {
        const eventData = account.account;
        const hasRSVPd = userAttendances.has(account.publicKey.toString());

        return {
          publicKey: account.publicKey.toString(),
          eventId: account.publicKey.toString(),
          name: eventData.name,
          description: eventData.description,
          location: "Virtual", // Location is not in the current Event struct, using default
          startTime: eventData.startTime.toNumber(),
          maxAttendees: eventData.maxAttendees,
          currentAttendees: eventData.currentAttendees,
          organizer: eventData.organizer.toString(),
          hasRSVPd,
        };
      });

      setEvents(fetchedEvents);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please check your connection.");
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchEvents();
        }, 3000); // Retry after 3 seconds
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAttendances = async (program: any, userWallet: PublicKey): Promise<Set<string>> => {
    try {
      // Fetch all attendance records for this user
      const attendances = await (program.account as any).attendance.all([
        {
          memcmp: {
            offset: 8 + 32, // After discriminator + event pubkey
            bytes: userWallet.toBase58(),
          },
        },
      ]);

      // Return a set of event public keys the user has RSVP'd to
      return new Set(attendances.map((a: any) => a.account.event.toString()));
    } catch (error) {
      console.error("Error fetching user attendances:", error);
      return new Set();
    }
  };

  const handleRSVP = async (eventPublicKey: string) => {
    if (!wallet) return;

    // Optimistic UI update
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.publicKey === eventPublicKey
          ? { ...event, hasRSVPd: true, currentAttendees: event.currentAttendees + 1 }
          : event
      )
    );

    try {
      await retryTransaction(async () => {
        const connection = getConnection();
        const provider = new AnchorProvider(connection, wallet, {});
        const program = getProgram(provider);

        const eventPubkey = new PublicKey(eventPublicKey);
        const communityPubkey = new PublicKey(communityId);

        // Get event account to get the event name (needed for PDA derivation)
        const eventAccount = await (program.account as any).event.fetch(eventPubkey);
        
        // Get community account to get the name
        const communityAccount = await (program.account as any).community.fetch(communityPubkey);

        // Derive PDAs
        const [memberPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("member"), communityPubkey.toBuffer(), wallet.publicKey.toBuffer()],
          program.programId
        );

        const [attendancePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("attendance"), eventPubkey.toBuffer(), memberPda.toBuffer()],
          program.programId
        );

        const [tokenMintPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("token_mint"), Buffer.from(communityAccount.name)],
          program.programId
        );

        // Create a virtual RSVP card ID based on user's wallet
        // This allows RSVP without physical NFC card
        const cardId = `rsvp-${wallet.publicKey.toString().slice(0, 8)}`;

        const [nfcCardPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("nfc_card"), communityPubkey.toBuffer(), Buffer.from(cardId)],
          program.programId
        );

        // Get associated token account
        const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
        const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

        const [memberTokenAccount] = PublicKey.findProgramAddressSync(
          [
            wallet.publicKey.toBuffer(),
            TOKEN_PROGRAM_ID.toBuffer(),
            tokenMintPda.toBuffer(),
          ],
          ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // Check if NFC card exists, if not we need to create it first
        let nfcCardExists = false;
        try {
          await (program.account as any).nfcCard.fetch(nfcCardPda);
          nfcCardExists = true;
        } catch (e) {
          // NFC card doesn't exist
          nfcCardExists = false;
        }

        // If NFC card doesn't exist, create it first
        if (!nfcCardExists) {
          const createCardTx = await (program.methods as any)
            .createNfcCard(cardId, `Virtual RSVP Card`)
            .accounts({
              nfcCard: nfcCardPda,
              member: memberPda,
              community: communityPubkey,
              owner: wallet.publicKey,
              payer: wallet.publicKey,
              systemProgram: new PublicKey("11111111111111111111111111111111"),
            })
            .rpc();

          console.log("Created virtual RSVP card:", createCardTx);
        }

        // Check if member exists, if not show error
        let memberExists = false;
        try {
          await (program.account as any).member.fetch(memberPda);
          memberExists = true;
        } catch (e) {
          console.error("Member account not found. User needs to join the community first.");
          throw new Error("You must join this community before RSVPing to events. Please register as a member first.");
        }

        // Now record attendance (RSVP)
        console.log("Recording attendance with accounts:", {
          event: eventPubkey.toString(),
          attendance: attendancePda.toString(),
          member: memberPda.toString(),
          nfcCard: nfcCardPda.toString(),
          community: communityPubkey.toString(),
          tokenMint: tokenMintPda.toString(),
          memberTokenAccount: memberTokenAccount.toString(),
          memberWallet: wallet.publicKey.toString(),
        });

        const tx = await (program.methods as any)
          .recordAttendance(cardId)
          .accounts({
            event: eventPubkey,
            attendance: attendancePda,
            member: memberPda,
            nfcCard: nfcCardPda,
            community: communityPubkey,
            tokenMint: tokenMintPda,
            memberTokenAccount: memberTokenAccount,
            memberWallet: wallet.publicKey,
            payer: wallet.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: new PublicKey("11111111111111111111111111111111"),
          })
          .rpc();

        console.log("RSVP successful:", tx);
      }, 2); // Retry up to 2 times

      // Refresh events to get accurate data from blockchain
      await fetchEvents();
    } catch (err: any) {
      // Log error for debugging
      console.error("RSVP Error:", err);
      
      const parsedError = logTransactionError('RSVP', err, {
        eventPublicKey,
        communityId,
      });
      
      // Revert optimistic update on error
      await fetchEvents();
      
      // Show user-friendly error message
      alert(err.message || parsedError.userFriendlyMessage || 'Failed to RSVP to event. Please try again.');
      alert(parsedError.userFriendlyMessage);
      throw err;
    }
  };

  const upcomingEvents = events.filter((event) => {
    const now = Math.floor(Date.now() / 1000);
    return event.startTime > now;
  }).sort((a, b) => a.startTime - b.startTime); // Sort by soonest first

  const pastEvents = events.filter((event) => {
    const now = Math.floor(Date.now() / 1000);
    return event.startTime <= now;
  }).sort((a, b) => b.startTime - a.startTime); // Sort by most recent first

  if (loading) {
    return <EventsSectionSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-400 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-black font-bold">{error}</p>
              {retryCount > 0 && retryCount < MAX_RETRIES && (
                <p className="text-sm text-black font-bold mt-1">
                  RETRYING... (ATTEMPT {retryCount + 1} OF {MAX_RETRIES})
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setRetryCount(0);
              fetchEvents();
            }}
            className="px-4 py-2 bg-black text-red-400 font-black border-2 border-black hover:bg-white hover:text-black transition-all"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-6 py-3 font-black border-4 border-black transition-all ${
            activeTab === "upcoming"
              ? "bg-yellow-400 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          UPCOMING ({upcomingEvents.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-6 py-3 font-black border-4 border-black transition-all ${
            activeTab === "past"
              ? "bg-yellow-400 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          PAST ({pastEvents.length})
        </button>
      </div>

      {/* Events Grid */}
      {activeTab === "upcoming" && (
        <div>
          {upcomingEvents.length === 0 ? (
            <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
              <div className="w-20 h-20 bg-yellow-400 border-4 border-black mx-auto mb-6 flex items-center justify-center text-4xl">
                📅
              </div>
              <h3 className="text-2xl font-black text-black mb-2">NO UPCOMING EVENTS</h3>
              <p className="text-lg font-bold text-black">Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.publicKey}
                  event={event}
                  onRSVP={handleRSVP}
                  isUpcoming={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "past" && (
        <div>
          {pastEvents.length === 0 ? (
            <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
              <div className="w-20 h-20 bg-gray-300 border-4 border-black mx-auto mb-6 flex items-center justify-center text-4xl">
                📅
              </div>
              <h3 className="text-2xl font-black text-black mb-2">NO PAST EVENTS</h3>
              <p className="text-lg font-bold text-black">History will appear here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {pastEvents.map((event) => (
                <EventCard
                  key={event.publicKey}
                  event={event}
                  onRSVP={handleRSVP}
                  isUpcoming={false}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
