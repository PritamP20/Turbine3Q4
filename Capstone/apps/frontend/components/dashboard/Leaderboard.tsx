"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getProgram, getConnection } from "@/lib/anchor-setup";
import { 
  calculateRewardAmount, 
  isEligibleForReward, 
  claimReward, 
  hasClaimedReward,
  checkTreasuryBalance 
} from "@/lib/rewards";
import { logTransactionError, retryTransaction } from "@/lib/transaction-errors";
import { LeaderboardSkeleton } from "./Skeletons";
import type { Member, LeaderboardEntry } from "@/types/dashboard";

interface LeaderboardProps {
  communityId: string;
}

export default function Leaderboard({ communityId }: LeaderboardProps) {
  const wallet = useAnchorWallet();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimingReward, setClaimingReward] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [treasuryBalance, setTreasuryBalance] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (wallet && communityId) {
      fetchMembers();
      checkIfAlreadyClaimed();
      checkTreasury();
    }
  }, [wallet, communityId]);

  // Auto-refresh leaderboard every 30 seconds to catch reputation changes
  useEffect(() => {
    if (!wallet || !communityId) return;

    const interval = setInterval(() => {
      fetchMembers();
      checkTreasury();
    }, 30000);

    return () => clearInterval(interval);
  }, [wallet, communityId]);

  const fetchMembers = async () => {
    setLoading(true);
    setError("");

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet!, {});
      const program = getProgram(provider);

      const communityPubkey = new PublicKey(communityId);

      // Fetch all member accounts for this community
      const memberAccounts = await (program.account as any).member.all([
        {
          memcmp: {
            offset: 8, // After discriminator
            bytes: communityPubkey.toBase58(),
          },
        },
      ]);

      const membersData: Member[] = memberAccounts.map((account: any) => {
        console.log("Member account data:", account.account);
        
        // Handle reputation score - convert BN to number
        const reputationScore = account.account.reputationScore || account.account.reputation_score || 0;
        const reputation = typeof reputationScore === 'object' && reputationScore.toNumber 
          ? reputationScore.toNumber() 
          : Number(reputationScore);

        // Handle joinedAt - convert BN to number
        const joinedAtValue = account.account.joinedAt;
        const joinedAt = typeof joinedAtValue === 'object' && joinedAtValue.toNumber
          ? joinedAtValue.toNumber()
          : Number(joinedAtValue);

        return {
          publicKey: account.publicKey.toString(),
          wallet: account.account.wallet.toString(),
          name: account.account.name,
          metadataUri: account.account.metadataUri || account.account.metadata_uri,
          joinedAt,
          reputation,
          activityCount: 0, // Will be calculated from activities in later tasks
        };
      });

      setMembers(membersData);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error("Error fetching members:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        logs: err.logs,
      });
      
      let errorMessage = "Failed to load leaderboard. ";
      if (err.message?.includes("Account does not exist")) {
        errorMessage += "No members found in this community yet.";
      } else if (err.message?.includes("Invalid public key")) {
        errorMessage += "Invalid community ID.";
      } else {
        errorMessage += "Please check your connection and try again.";
      }
      
      setError(errorMessage);
      
      // Retry logic
      if (retryCount < MAX_RETRIES && !err.message?.includes("Invalid public key")) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchMembers();
        }, 3000); // Retry after 3 seconds
      }
    } finally {
      setLoading(false);
    }
  };

  const checkIfAlreadyClaimed = async () => {
    if (!wallet) return;
    
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const claimed = await hasClaimedReward(provider, communityId);
      setAlreadyClaimed(claimed);
    } catch (err) {
      console.error("Error checking claim status:", err);
    }
  };

  const checkTreasury = async () => {
    if (!wallet) return;
    
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const { balance } = await checkTreasuryBalance(provider, communityId, 100);
      setTreasuryBalance(balance);
    } catch (err) {
      console.error("Error checking treasury:", err);
    }
  };

  const handleClaimReward = async (rank: number, amount: number) => {
    if (!wallet) return;
    
    setClaimingReward(true);
    setClaimSuccess(null);
    setClaimError(null);

    // Store original state for potential rollback
    const originalAlreadyClaimed = alreadyClaimed;
    const originalTreasuryBalance = treasuryBalance;

    // Optimistically update UI
    setAlreadyClaimed(true);
    if (treasuryBalance !== null) {
      setTreasuryBalance(treasuryBalance - amount);
    }

    try {
      await retryTransaction(async () => {
        const connection = getConnection();
        const provider = new AnchorProvider(connection, wallet, {});
        
        // Check treasury balance first
        const { sufficient, balance } = await checkTreasuryBalance(provider, communityId, amount);
        if (!sufficient) {
          throw new Error(`InsufficientBalance: Treasury has ${balance} tokens, need ${amount}`);
        }

        // Execute claim
        const result = await claimReward(provider, communityId, rank, amount);
        
        if (!result.success) {
          throw new Error(result.error || "Failed to claim reward");
        }
        
        return result;
      }, 2); // Retry up to 2 times

      setClaimSuccess(`Successfully claimed ${amount} tokens!`);
      
      // Refresh data to get accurate state from blockchain
      await fetchMembers();
      await checkTreasury();
      
      // Clear success message after 5 seconds
      setTimeout(() => setClaimSuccess(null), 5000);
    } catch (err: any) {
      // Log error for debugging
      const parsedError = logTransactionError('Claim Reward', err, {
        rank,
        amount,
        communityId,
      });
      
      // Revert optimistic update on error
      setAlreadyClaimed(originalAlreadyClaimed);
      setTreasuryBalance(originalTreasuryBalance);
      
      // Show user-friendly error message
      setClaimError(parsedError.userFriendlyMessage);
      
      // Auto-dismiss error after 8 seconds
      setTimeout(() => setClaimError(null), 8000);
    } finally {
      setClaimingReward(false);
    }
  };

  // Calculate leaderboard with ranking logic
  const leaderboard = useMemo(() => {
    // Sort members by reputation (descending), then by activity count (descending), then by join date (ascending)
    const sorted = [...members].sort((a, b) => {
      // Primary: Reputation score (descending)
      if (b.reputation !== a.reputation) {
        return b.reputation - a.reputation;
      }
      
      // Secondary: Activity count (descending)
      if (b.activityCount !== a.activityCount) {
        return b.activityCount - a.activityCount;
      }
      
      // Tertiary: Join date (ascending - earlier is better)
      return a.joinedAt - b.joinedAt;
    });

    // Calculate ranks and create leaderboard entries
    const entries: LeaderboardEntry[] = sorted.map((member, index) => {
      const rank = index + 1;
      const potentialReward = calculateRewardAmount(rank);
      const rewardEligible = isEligibleForReward(rank, member.reputation);

      return {
        rank,
        member,
        reputation: member.reputation,
        activityCount: member.activityCount,
        rewardEligible,
        potentialReward: rewardEligible ? potentialReward : undefined,
      };
    });

    return entries;
  }, [members]);

  // Get top 10 members
  const top10 = useMemo(() => leaderboard.slice(0, 10), [leaderboard]);

  // Find current user's position
  const currentUserEntry = useMemo(() => {
    if (!wallet) return null;
    return leaderboard.find(entry => entry.member.wallet === wallet.publicKey.toString());
  }, [leaderboard, wallet]);

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700' };
    if (rank === 2) return { emoji: '🥈', color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20', border: 'border-gray-300 dark:border-gray-700' };
    if (rank === 3) return { emoji: '🥉', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700' };
    return null;
  };

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 rounded-lg p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-900 dark:text-red-100 font-semibold">{error}</p>
              {retryCount > 0 && retryCount < MAX_RETRIES && (
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Retrying... (Attempt {retryCount + 1} of {MAX_RETRIES})
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setRetryCount(0);
              fetchMembers();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Retry Now
          </button>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
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
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            No leaderboard yet
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The leaderboard will appear once members start earning reputation through community activities.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Member Leaderboard
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
          Top performers ranked by reputation and activity
        </p>
      </div>

      {/* Success Message */}
      {claimSuccess && (
        <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
            <p className="text-green-900 dark:text-green-100 font-semibold">{claimSuccess}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {claimError && (
        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400 text-xl">✕</span>
              <p className="text-red-900 dark:text-red-100 font-semibold">{claimError}</p>
            </div>
            <button
              onClick={() => setClaimError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Treasury Balance Info */}
      {treasuryBalance !== null && (
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <span className="font-semibold">Treasury Balance:</span> {treasuryBalance.toFixed(2)} tokens
          </p>
        </div>
      )}

      {/* Current User's Rank (if not in top 10) */}
      {currentUserEntry && currentUserEntry.rank > 10 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4 border-2 border-blue-300 dark:border-blue-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                #{currentUserEntry.rank}
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Your Position
                </p>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  {currentUserEntry.reputation} reputation
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                Keep going to reach top 10!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Leaderboard */}
      <div className="space-y-2 sm:space-y-3">
        {top10.map((entry) => {
          const badge = getRankBadge(entry.rank);
          const isUser = entry.member.wallet === wallet?.publicKey.toString();

          return (
            <div
              key={entry.member.publicKey}
              className={`rounded-lg p-3 sm:p-4 border-2 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 animate-fadeIn ${
                isUser
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                  : badge
                  ? `${badge.bg} ${badge.border}`
                  : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600'
              }`}
            >
              {/* Mobile Layout */}
              <div className="flex flex-col gap-3 sm:hidden">
                <div className="flex items-center justify-between">
                  {/* Rank */}
                  <div className="shrink-0 w-12 text-center">
                    {badge ? (
                      <div className="flex flex-col items-center">
                        <span className="text-2xl animate-bounce-subtle">{badge.emoji}</span>
                        <span className={`text-xs font-bold ${badge.color}`}>
                          #{entry.rank}
                        </span>
                      </div>
                    ) : (
                      <div className="text-xl font-bold text-zinc-600 dark:text-zinc-400">
                        #{entry.rank}
                      </div>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0 px-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {entry.member.name}
                      </h3>
                      {isUser && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate">
                      {formatWallet(entry.member.wallet)}
                    </p>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-around border-t border-zinc-200 dark:border-zinc-700 pt-2">
                  <div className="text-center">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Reputation</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {entry.reputation}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">Activity</p>
                    <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {entry.activityCount}
                    </p>
                  </div>
                </div>

                {/* Reward Eligibility */}
                {entry.rewardEligible && (
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 border border-green-300 dark:border-green-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-green-800 dark:text-green-200 font-semibold">
                        Reward Eligible
                      </p>
                      <p className="text-base font-bold text-green-900 dark:text-green-100">
                        {entry.potentialReward} tokens
                      </p>
                    </div>
                    {isUser && (
                      <>
                        {alreadyClaimed ? (
                          <div className="w-full px-3 py-2 text-xs font-semibold rounded bg-gray-400 text-white text-center">
                            Already Claimed
                          </div>
                        ) : (
                          <button
                            className="w-full px-3 py-2 text-xs font-semibold rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-all duration-200 transform active:scale-95 hover:shadow-md"
                            onClick={() => handleClaimReward(entry.rank, entry.potentialReward!)}
                            disabled={claimingReward || alreadyClaimed}
                          >
                            {claimingReward ? 'Claiming...' : 'Claim Reward'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop Layout */}
              <div className="hidden sm:flex items-center gap-4">
                {/* Rank */}
                <div className="shrink-0 w-16 text-center">
                  {badge ? (
                    <div className="flex flex-col items-center">
                      <span className="text-3xl animate-bounce-subtle">{badge.emoji}</span>
                      <span className={`text-sm font-bold ${badge.color}`}>
                        #{entry.rank}
                      </span>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                      #{entry.rank}
                    </div>
                  )}
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {entry.member.name}
                    </h3>
                    {isUser && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-600 text-white">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                    {formatWallet(entry.member.wallet)}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Reputation</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {entry.reputation}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Activity</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {entry.activityCount}
                    </p>
                  </div>
                </div>

                {/* Reward Eligibility */}
                {entry.rewardEligible && (
                  <div className="shrink-0">
                    <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 border border-green-300 dark:border-green-700">
                      <p className="text-xs text-green-800 dark:text-green-200 font-semibold mb-1">
                        Reward Eligible
                      </p>
                      <p className="text-lg font-bold text-green-900 dark:text-green-100">
                        {entry.potentialReward} tokens
                      </p>
                      {isUser && (
                        <>
                          {alreadyClaimed ? (
                            <div className="mt-2 w-full px-3 py-1 text-xs font-semibold rounded bg-gray-400 text-white text-center">
                              Already Claimed
                            </div>
                          ) : (
                            <button
                              className="mt-2 w-full px-3 py-1 text-xs font-semibold rounded bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-all duration-200 transform active:scale-95 hover:shadow-md"
                              onClick={() => handleClaimReward(entry.rank, entry.potentialReward!)}
                              disabled={claimingReward || alreadyClaimed}
                            >
                              {claimingReward ? 'Claiming...' : 'Claim Reward'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold">How rankings work:</span> Members are ranked by reputation score, 
          then by activity count, and finally by join date. Top 3 members are eligible for token rewards.
        </p>
      </div>
    </div>
  );
}