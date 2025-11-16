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
  const ITEMS_PER_PAGE = 12;
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (wallet && communityId) {
      fetchMembers();
    }
  }, [wallet, communityId]);

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

      const memberAccounts = await (program.account as any).member.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityPubkey.toBase58(),
          },
        },
      ]);

      const membersData: Member[] = memberAccounts.map((account: any) => {
        const memberData = account.account;
        
        let nftImage: string | undefined;
        if (typeof window !== 'undefined') {
          const storedImage = localStorage.getItem(
            `nft-image-${communityId}-${memberData.wallet.toString()}`
          );
          if (storedImage) {
            nftImage = storedImage;
          }
        }

        return {
          publicKey: account.publicKey.toString(),
          wallet: memberData.wallet.toString(),
          name: memberData.name,
          metadataUri: memberData.metadataUri,
          joinedAt: memberData.joinedAt.toNumber(),
          reputation: memberData.reputationScore,
          activityCount: 0,
          membershipNft: memberData.membershipNft?.toString(),
          nftImage,
        };
      });

      setMembers(membersData);
      setRetryCount(0);
    } catch (err: any) {
      console.error("Error fetching members:", err);
      setError("Failed to load members. Please check your connection.");
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchMembers();
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = members.filter(
        (member) =>
          member.name.toLowerCase().includes(query) ||
          member.wallet.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'reputation') {
        return b.reputation - a.reputation;
      } else {
        return b.joinedAt - a.joinedAt;
      }
    });

    return sorted;
  }, [members, searchQuery, sortBy]);

  const paginatedMembers = useMemo(() => {
    const endIndex = page * ITEMS_PER_PAGE;
    return filteredAndSortedMembers.slice(0, endIndex);
  }, [filteredAndSortedMembers, page]);

  const hasMore = paginatedMembers.length < filteredAndSortedMembers.length;

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

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
      <div className="bg-red-300 border-6 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">❌</span>
            <div>
              <p className="text-black font-black uppercase">{error}</p>
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
            className="px-4 py-2 bg-black text-white border-4 border-black font-black uppercase hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            Retry Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-yellow-300 border-6 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-3xl font-black text-black uppercase mb-2">
          Members Directory
        </h2>
        <p className="text-lg font-bold text-black">
          {filteredAndSortedMembers.length} {filteredAndSortedMembers.length === 1 ? 'Member' : 'Members'}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name or wallet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none placeholder-gray-500"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="sm:w-64">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'joinDate' | 'reputation')}
            className="w-full px-4 py-3 border-4 border-black bg-cyan-300 text-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none uppercase"
          >
            <option value="reputation">Sort by Reputation</option>
            <option value="joinDate">Sort by Join Date</option>
          </select>
        </div>
      </div>

      {/* Members Grid */}
      {filteredAndSortedMembers.length === 0 ? (
        <div className="bg-pink-200 border-6 border-black p-16 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-6xl block mb-4">👥</span>
          <h3 className="text-2xl font-black text-black uppercase mb-2">
            {searchQuery ? 'No Members Found' : 'No Members Yet'}
          </h3>
          <p className="text-lg font-bold text-black mb-6">
            {searchQuery 
              ? `No members match "${searchQuery}".`
              : 'This community has no members yet.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-black text-white border-4 border-black font-black uppercase hover:bg-purple-600 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedMembers.map((member) => (
              <div
                key={member.publicKey}
                className="bg-white border-6 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all"
              >
                {/* NFT Image */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative shrink-0">
                    {member.nftImage ? (
                      <div className="w-20 h-20 border-4 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <img
                          src={member.nftImage}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-300 to-pink-300 border-4 border-black flex items-center justify-center text-black font-black text-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {member.membershipNft && (
                      <div className="absolute -bottom-1 -right-1 bg-lime-300 text-black text-xs font-black px-2 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        NFT
                      </div>
                    )}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-black uppercase truncate mb-1">
                      {member.name}
                    </h3>
                    <p className="text-sm text-black font-bold font-mono truncate">
                      {formatWallet(member.wallet)}
                    </p>
                    
                    {isHighReputation(member.reputation) && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-black bg-yellow-300 text-black border-2 border-black">
                        ⭐ VIP
                      </span>
                    )}
                  </div>
                </div>

                {/* Member Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center bg-cyan-100 border-4 border-black p-2">
                    <span className="text-sm font-black text-black uppercase">Reputation</span>
                    <span className="text-sm font-black text-black">
                      {member.reputation}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-pink-100 border-4 border-black p-2">
                    <span className="text-sm font-black text-black uppercase">Joined</span>
                    <span className="text-sm font-bold text-black">
                      {formatDate(member.joinedAt)}
                    </span>
                  </div>
                </div>

                {/* Reputation Bar */}
                <div className="bg-gray-300 border-4 border-black h-4">
                  <div
                    className="bg-black h-full transition-all"
                    style={{ width: `${Math.min((member.reputation / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Load more button */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={loadMore}
                className="px-8 py-4 bg-black text-white border-4 border-black font-black text-lg uppercase hover:bg-purple-600 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1"
              >
                Load More ({filteredAndSortedMembers.length - paginatedMembers.length} Remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}