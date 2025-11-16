'use client';

import { useMembershipNFT } from '@/hooks/useMembershipNFT';

interface MembershipNFTProps {
  communityId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MembershipNFT({ communityId, size = 'md' }: MembershipNFTProps) {
  const { nft, loading, error } = useMembershipNFT(communityId);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-zinc-200 dark:bg-zinc-800 rounded-lg animate-pulse flex items-center justify-center`}>
        <span className="text-zinc-400">Loading...</span>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className={`${sizeClasses[size]} bg-zinc-100 dark:bg-zinc-800 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center`}>
        <span className="text-zinc-400 text-sm text-center px-2">No NFT</span>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg overflow-hidden shadow-lg border-2 border-white dark:border-zinc-900`}>
        {nft.image ? (
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
            {nft.name.charAt(0)}
          </div>
        )}
      </div>
      
      {/* Hover overlay with details */}
      <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-2">
        <p className="text-white font-semibold text-sm text-center mb-1">{nft.name}</p>
        <p className="text-zinc-300 text-xs">{nft.symbol}</p>
        <a
          href={`https://explorer.solana.com/address/${nft.mint}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-blue-400 hover:text-blue-300 text-xs underline"
        >
          View on Explorer
        </a>
      </div>

      {/* Badge */}
      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
        Member
      </div>
    </div>
  );
}

export function MembershipNFTCard({ communityId }: { communityId: string }) {
  const { nft, loading, error } = useMembershipNFT(communityId);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !nft) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
        <span>🎫</span>
        Membership NFT
      </h3>
      
      <div className="flex items-start gap-4">
        <MembershipNFT communityId={communityId} size="md" />
        
        <div className="flex-1">
          <h4 className="font-semibold text-zinc-900 dark:text-zinc-50 mb-2">{nft.name}</h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
            This NFT represents your membership in the community. It was minted when you joined and is stored in your wallet.
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Symbol:</span>
              <span className="text-zinc-900 dark:text-zinc-50 font-medium">{nft.symbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-400">Mint:</span>
              <a
                href={`https://explorer.solana.com/address/${nft.mint}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs"
              >
                {nft.mint.slice(0, 8)}...{nft.mint.slice(-8)}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
