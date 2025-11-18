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

      const memberAccounts = await (program.account as any).member.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityPubkey.toBase58(),
          },
        },
      ]);

      const membersData: Member[] = memberAccounts.map((account: any) => {
        const reputationScore = account.account.reputationScore || account.account.reputation_score || 0;
        const reputation = typeof reputationScore === 'object' && reputationScore.toNumber 
          ? reputationScore.toNumber() 
          : Number(reputationScore);

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
          activityCount: 0,
        };
      });

      setMembers(membersData);
      setRetryCount(0);
    } catch (err: any) {
      console.error("Error fetching members:", err);
      
      let errorMessage = "Failed to load leaderboard. ";
      if (err.message?.includes("Account does not exist")) {
        errorMessage += "No members found in this community yet.";
      } else if (err.message?.includes("Invalid public key")) {
        errorMessage += "Invalid community ID.";
      } else {
        errorMessage += "Please check your connection and try again.";
      }
      
      setError(errorMessage);
      
      if (retryCount < MAX_RETRIES && !err.message?.includes("Invalid public key")) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchMembers();
        }, 3000);
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

    const originalAlreadyClaimed = alreadyClaimed;
    const originalTreasuryBalance = treasuryBalance;

    setAlreadyClaimed(true);
    if (treasuryBalance !== null) {
      setTreasuryBalance(treasuryBalance - amount);
    }

    try {
      await retryTransaction(async () => {
        const connection = getConnection();
        const provider = new AnchorProvider(connection, wallet, {});
        
        const { sufficient, balance } = await checkTreasuryBalance(provider, communityId, amount);
        if (!sufficient) {
          throw new Error(`InsufficientBalance: Treasury has ${balance} tokens, need ${amount}`);
        }

        const result = await claimReward(provider, communityId, rank, amount);
        
        if (!result.success) {
          throw new Error(result.error || "Failed to claim reward");
        }
        
        return result;
      }, 2);

      setClaimSuccess(`Successfully claimed ${amount} tokens!`);
      
      await fetchMembers();
      await checkTreasury();
      
      setTimeout(() => setClaimSuccess(null), 5000);
    } catch (err: any) {
      const parsedError = logTransactionError('Claim Reward', err, {
        rank,
        amount,
        communityId,
      });
      
      setAlreadyClaimed(originalAlreadyClaimed);
      setTreasuryBalance(originalTreasuryBalance);
      
      setClaimError(parsedError.userFriendlyMessage);
      
      setTimeout(() => setClaimError(null), 8000);
    } finally {
      setClaimingReward(false);
    }
  };

  const leaderboard = useMemo(() => {
    const sorted = [...members].sort((a, b) => {
      if (b.reputation !== a.reputation) {
        return b.reputation - a.reputation;
      }
      
      if (b.activityCount !== a.activityCount) {
        return b.activityCount - a.activityCount;
      }
      
      return a.joinedAt - b.joinedAt;
    });

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

  const top10 = useMemo(() => leaderboard.slice(0, 10), [leaderboard]);

  const currentUserEntry = useMemo(() => {
    if (!wallet) return null;
    return leaderboard.find(entry => entry.member.wallet === wallet.publicKey.toString());
  }, [leaderboard, wallet]);

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400';
    if (rank === 2) return 'bg-gray-300';
    if (rank === 3) return 'bg-orange-400';
    return 'bg-white';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-red-400 border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-black font-bold">{error}</p>
              {retryCount > 0 && retryCount < MAX_RETRIES && (
                <p className="text-sm text-black font-bold mt-1">
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
            className="px-4 py-2 bg-black text-red-400 font-black border-2 border-black hover:bg-white hover:text-black transition-all"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
        <div className="w-20 h-20 bg-pink-400 border-4 border-black mx-auto mb-6 flex items-center justify-center text-4xl">
          🏆
        </div>
        <h3 className="text-2xl font-black text-black mb-2">NO LEADERBOARD YET</h3>
        <p className="text-lg font-bold text-black">
          Start earning reputation through community activities!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-black">LEADERBOARD</h2>
        <p className="text-sm font-bold text-black mt-1">
          Top performers ranked by reputation
        </p>
      </div>

      {/* Success Message */}
      {claimSuccess && (
        <div className="bg-lime-400 border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-2">
            <span className="text-black text-xl font-black">✓</span>
            <p className="text-black font-bold">{claimSuccess}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {claimError && (
        <div className="bg-red-400 border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-black text-xl font-black">✕</span>
              <p className="text-black font-bold">{claimError}</p>
            </div>
            <button
              onClick={() => setClaimError(null)}
              className="text-black hover:bg-black hover:text-red-400 p-1 border-2 border-black transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Treasury Balance */}
      {treasuryBalance !== null && (
        <div className="bg-cyan-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm font-black text-black">
            TREASURY: {treasuryBalance.toFixed(2)} TOKENS
          </p>
        </div>
      )}

      {/* Current User's Rank (if not in top 10) */}
      {currentUserEntry && currentUserEntry.rank > 10 && (
        <div className="bg-yellow-400 border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-black text-black">
                #{currentUserEntry.rank}
              </div>
              <div>
                <p className="text-base font-black text-black">YOUR POSITION</p>
                <p className="text-sm font-bold text-black">
                  {currentUserEntry.reputation} reputation
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-black">
              Keep going!
            </p>
          </div>
        </div>
      )}

      {/* Top 10 Leaderboard */}
      <div className="space-y-3">
        {top10.map((entry) => {
          const isUser = entry.member.wallet === wallet?.publicKey.toString();
          const rankColor = getRankColor(entry.rank);

          return (
            <div
              key={entry.member.publicKey}
              className={`${rankColor} border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all ${
                isUser ? 'ring-4 ring-cyan-400' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="shrink-0 w-16 text-center">
                  <div className="text-3xl font-black text-black">
                    {getRankEmoji(entry.rank)}
                  </div>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-black truncate">
                      {entry.member.name}
                    </h3>
                    {isUser && (
                      <span className="px-2 py-1 text-xs font-black bg-black text-cyan-400 border-2 border-black">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-black font-mono">
                    {formatWallet(entry.member.wallet)}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs font-black text-black">REP</p>
                    <p className="text-2xl font-black text-black">
                      {entry.reputation}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-black text-black">ACTIVITY</p>
                    <p className="text-2xl font-black text-black">
                      {entry.activityCount}
                    </p>
                  </div>
                </div>

                {/* Reward */}
                {entry.rewardEligible && (
                  <div className="shrink-0">
                    <div className="bg-lime-400 border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-xs font-black text-black mb-1">
                        REWARD
                      </p>
                      <p className="text-lg font-black text-black">
                        {entry.potentialReward} 🪙
                      </p>
                      {isUser && (
                        <>
                          {alreadyClaimed ? (
                            <div className="mt-2 w-full px-3 py-2 text-xs font-black bg-gray-400 text-white text-center border-2 border-black">
                              CLAIMED
                            </div>
                          ) : (
                            <button
                              className="mt-2 w-full px-3 py-2 text-xs font-black bg-black text-lime-400 hover:bg-white hover:text-black border-2 border-black transition-all disabled:opacity-50"
                              onClick={() => handleClaimReward(entry.rank, entry.potentialReward!)}
                              disabled={claimingReward || alreadyClaimed}
                            >
                              {claimingReward ? 'CLAIMING...' : 'CLAIM'}
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
      <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-sm font-bold text-black">
          <span className="font-black">HOW IT WORKS:</span> Members ranked by reputation, then activity, then join date. Top 3 get token rewards!
        </p>
      </div>
    </div>
  );
}
