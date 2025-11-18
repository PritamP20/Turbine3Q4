"use client";

import { useState, useEffect, useMemo } from 'react';
import { useMembers } from "@/lib/hooks/useCommunityData";
import { MembersDirectorySkeleton } from "./Skeletons";
import type { Member } from "@/types/dashboard";

interface MembersDirectoryProps {
  communityId: string;
}

export default function MembersDirectory({ communityId }: MembersDirectoryProps) {
  const { data: membersData, isLoading, error: queryError } = useMembers(communityId);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'joinDate' | 'reputation'>('reputation');
  const [page, setPage] = useState(1);
  const [imageCache, setImageCache] = useState<Record<string, string>>({});
  const ITEMS_PER_PAGE = 12;

  // Load images from localStorage and API
  useEffect(() => {
    if (!membersData) return;

    console.log('Loading images for', membersData.length, 'members');

    const loadImages = async () => {
      const newCache: Record<string, string> = {};

      for (const member of membersData) {
        const cacheKey = `${communityId}-${member.wallet}`;
        const storageKey = `nft-image-${cacheKey}`;
        
        console.log('Checking member:', member.name, 'wallet:', member.wallet);
        console.log('Metadata URI:', member.metadataUri);
        
        // Skip if already cached
        if (imageCache[cacheKey]) {
          console.log('Image already in cache for', member.name);
          newCache[cacheKey] = imageCache[cacheKey];
          continue;
        }

        // Try localStorage first
        const storedImage = localStorage.getItem(storageKey);
        if (storedImage) {
          console.log('Found image in localStorage for', member.name);
          newCache[cacheKey] = storedImage;
          continue;
        }

        // Check if member has custom image based on metadata URI
        const hasCustomImage = member.metadataUri?.includes('/custom');
        console.log('Has custom image:', hasCustomImage);
        
        if (hasCustomImage) {
          // Fetch from API
          try {
            console.log('Fetching from API:', `/api/nft-images/${communityId}/${member.wallet}`);
            const response = await fetch(`/api/nft-images/${communityId}/${member.wallet}`);
            if (response.ok) {
              const data = await response.json();
              if (data.image) {
                console.log('Got image from API for', member.name);
                newCache[cacheKey] = data.image;
                localStorage.setItem(storageKey, data.image);
              }
            } else {
              console.log('API response not ok:', response.status);
            }
          } catch (error) {
            console.error('Failed to fetch NFT image:', error);
          }
        }
      }

      console.log('Loaded', Object.keys(newCache).length, 'images');
      if (Object.keys(newCache).length > 0) {
        setImageCache(prev => ({ ...prev, ...newCache }));
      }
    };

    loadImages();
  }, [membersData, communityId]);

  // Enhance members data with NFT images
  const members: Member[] = useMemo(() => {
    if (!membersData) return [];
    
    return membersData.map((member) => {
      const cacheKey = `${communityId}-${member.wallet}`;
      const nftImage = imageCache[cacheKey];

      return {
        ...member,
        nftImage,
      };
    });
  }, [membersData, communityId, imageCache]);

  // Filter and sort members
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

  // Paginate members
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

  if (isLoading) {
    return <MembersDirectorySkeleton />;
  }

  if (queryError) {
    return (
      <div className="bg-red-50 dark:bg-red-950 rounded-lg p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-900 dark:text-red-100 font-semibold">Failed to load members</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Data will refresh automatically in 30 seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-black">
            MEMBERS DIRECTORY
          </h2>
          <p className="text-sm font-bold text-black mt-1">
            {filteredAndSortedMembers.length} {filteredAndSortedMembers.length === 1 ? 'MEMBER' : 'MEMBERS'}
            {searchQuery && ` MATCHING "${searchQuery}"`}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="SEARCH BY NAME OR WALLET..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border-4 border-black bg-white text-black placeholder-gray-400 font-bold focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="sm:w-64">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'joinDate' | 'reputation')}
            className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold focus:outline-none focus:border-cyan-400"
          >
            <option value="reputation">SORT BY REPUTATION</option>
            <option value="joinDate">SORT BY JOIN DATE</option>
          </select>
        </div>
      </div>

      {filteredAndSortedMembers.length === 0 ? (
        <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="w-20 h-20 bg-pink-400 border-4 border-black mx-auto mb-6 flex items-center justify-center text-4xl">
            👥
          </div>
          <h3 className="text-2xl font-black text-black mb-2">
            {searchQuery ? 'NO MEMBERS FOUND' : 'NO MEMBERS YET'}
          </h3>
          <p className="text-lg font-bold text-black mb-4">
            {searchQuery 
              ? `NO MATCH FOR "${searchQuery}"`
              : 'BE THE FIRST TO JOIN!'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-cyan-400 text-black font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              CLEAR SEARCH
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedMembers.map((member) => (
            <div
              key={member.publicKey}
              className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              {/* NFT Image */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  {member.nftImage ? (
                    <div className="w-24 h-24 border-4 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <img
                        src={member.nftImage}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-linear-to-br from-cyan-400 to-pink-400 border-4 border-black flex items-center justify-center text-white font-black text-4xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {member.membershipNft && (
                    <div className="absolute -bottom-2 -right-2 bg-lime-400 text-black text-xs font-black px-2 py-1 border-2 border-black">
                      NFT ✓
                    </div>
                  )}
                </div>
              </div>

              {/* Member Info */}
              <div className="text-center mb-4 pb-4 border-b-4 border-black">
                <h3 className="text-lg font-black text-black mb-1 truncate">
                  {member.name}
                </h3>
                <p className="text-xs font-bold text-black font-mono truncate">
                  {formatWallet(member.wallet)}
                </p>
                {isHighReputation(member.reputation) && (
                  <span className="inline-block mt-2 px-3 py-1 text-xs font-black bg-yellow-400 text-black border-2 border-black">
                    ⭐ VIP
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center p-2 bg-cyan-100 border-2 border-black">
                  <span className="text-xs font-black text-black">REPUTATION</span>
                  <span className="text-lg font-black text-black">
                    {member.reputation}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 bg-pink-100 border-2 border-black">
                  <span className="text-xs font-black text-black">JOINED</span>
                  <span className="text-xs font-black text-black">
                    {formatDate(member.joinedAt)}
                  </span>
                </div>
              </div>

              {/* Reputation Bar */}
              <div className="w-full h-4 bg-gray-200 border-2 border-black">
                <div
                  className="h-full bg-lime-400 border-r-2 border-black transition-all"
                  style={{ width: `${Math.min((member.reputation / 200) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
          </div>

          {hasMore && (
            <div className="text-center pt-6">
              <button
                onClick={loadMore}
                className="w-full sm:w-auto px-6 py-3 bg-cyan-400 text-black font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
              >
                LOAD MORE ({filteredAndSortedMembers.length - paginatedMembers.length})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
