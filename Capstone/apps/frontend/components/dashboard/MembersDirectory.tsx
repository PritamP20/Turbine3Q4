"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getProgram, getConnection } from "@/lib/anchor-setup";
import { MembersDirectorySkeleton } from "./Skeletons";
import type { Member } from "@/types/dashboard";

interface MembersDirectoryProps {
  communityId: string;
}

export default function MembersDirectory({ communityId }: MembersDirectoryProps) {
  const wallet = useAnchorWallet();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'joinDate' | 'reputation'>('reputation');
  const [retryCount, setRetryCount] = useState(0);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 12; // Show 12 members per page (4x3 grid)
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (wallet && communityId) {
      fetchMembers();
    }
  }, [wallet, communityId]);

  // Auto-refresh members every 30 seconds
  useEffect(() => {
    if (!wallet || !communityId) return;

    const interval = setInterval(() => {
      fetchMembers();
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

      const membersData: Member[] = memberAccounts.map((account: any) => ({
        publicKey: account.publicKey.toString(),
        wallet: account.account.wallet.toString(),
        name: account.account.name,
        metadataUri: account.account.metadataUri,
        joinedAt: account.account.joinedAt.toNumber(),
        reputation: account.account.reputation,
        activityCount: 0, // Will be calculated from activities in later tasks
      }));

      setMembers(membersData);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error("Error fetching members:", err);
      setError("Failed to load members. Please check your connection.");
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchMembers();
        }, 3000); // Retry after 3 seconds
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = members.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.wallet.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'reputation') {
        return b.reputation - a.reputation;
      } else {
        return b.joinedAt - a.joinedAt;
      }
    });

    return sorted;
  }, [members, searchQuery, sortBy]);

  // Paginate members
  const paginatedMembers = useMemo(() => {
    const endIndex = page * ITEMS_PER_PAGE;
    return filteredAndSortedMembers.slice(0, endIndex);
  }, [filteredAndSortedMembers, page]);

  const hasMore = paginatedMembers.length < filteredAndSortedMembers.length;

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  // Reset pagination when search or sort changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy]);

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isHighReputation = (reputation: number) => {
    return reputation >= 100;
  };

  if (loading) {
    return <MembersDirectorySkeleton />;
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with total count */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Members Directory
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 mt-1">
            {filteredAndSortedMembers.length} {filteredAndSortedMembers.length === 1 ? 'member' : 'members'}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or wallet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="sm:w-48">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'joinDate' | 'reputation')}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="reputation">Sort by Reputation</option>
            <option value="joinDate">Sort by Join Date</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      {filteredAndSortedMembers.length === 0 ? (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              {searchQuery ? 'No members found' : 'No members yet'}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {searchQuery 
                ? `No members match "${searchQuery}". Try a different search term.`
                : 'This community has no members yet. Be the first to join!'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 transform active:scale-95 hover:shadow-md"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {paginatedMembers.map((member) => (
            <div
              key={member.publicKey}
              className="bg-white dark:bg-zinc-800 rounded-lg p-4 sm:p-6 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn"
            >
              {/* Member Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {member.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-mono truncate">
                    {formatWallet(member.wallet)}
                  </p>
                </div>
                
                {/* High Reputation Badge */}
                {isHighReputation(member.reputation) && (
                  <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 border border-yellow-300 dark:border-yellow-700 shrink-0">
                    ⭐ VIP
                  </span>
                )}
              </div>

              {/* Member Stats */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Reputation</span>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {member.reputation}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">Joined</span>
                  <span className="text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                    {formatDate(member.joinedAt)}
                  </span>
                </div>
              </div>

              {/* Reputation Bar */}
              <div className="mt-3 sm:mt-4">
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((member.reputation / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          </div>

          {/* Load more button */}
          {hasMore && (
            <div className="text-center pt-4 sm:pt-6">
              <button
                onClick={loadMore}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium transform active:scale-95 hover:shadow-md"
              >
                Load More ({filteredAndSortedMembers.length - paginatedMembers.length} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
