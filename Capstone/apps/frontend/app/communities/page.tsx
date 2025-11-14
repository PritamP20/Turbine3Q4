"use client";

import { useState, useEffect } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getProgram, getConnection } from "@/lib/anchor-setup";

interface Community {
  publicKey: string;
  name: string;
  tokenSymbol: string;
  governanceThreshold: number;
  admin: string;
  memberCount: number;
  transferFeeBps: number;
}

export default function CommunitiesPage() {
  const { connected } = useWallet();
  const wallet = useAnchorWallet();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [communityName, setCommunityName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [governanceThreshold, setGovernanceThreshold] = useState(51);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (connected) {
      fetchCommunities();
    }
  }, [connected]);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet!, {});
      const program = getProgram(provider);

      // Fetch all community accounts
      const communityAccounts = await program.account.community.all();
      
      const communitiesData: Community[] = communityAccounts.map((account: any) => ({
        publicKey: account.publicKey.toString(),
        name: account.account.name,
        tokenSymbol: account.account.tokenSymbol,
        governanceThreshold: account.account.governanceThreshold,
        admin: account.account.admin.toString(),
        memberCount: account.account.memberCount,
        transferFeeBps: account.account.transferFeeBps,
      }));

      setCommunities(communitiesData);
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoading(false);
    }
  };

  const createCommunity = async () => {
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

      const [tokenMintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_mint"), Buffer.from(communityName)],
        program.programId
      );

      const [collectionMintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection_mint"), Buffer.from(communityName)],
        program.programId
      );

      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), communityPda.toBuffer()],
        program.programId
      );

      const tx = await program.methods
        .initializeCommunity(communityName, tokenSymbol, 9, governanceThreshold)
        .accountsStrict({
          community: communityPda,
          tokenMint: tokenMintPda,
          collectionMint: collectionMintPda,
          treasury: treasuryPda,
          admin: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      setMessage(`Community created! TX: ${tx}`);
      setCommunityName("");
      setTokenSymbol("");
      setShowCreateForm(false);
      
      // Refresh communities list
      setTimeout(() => fetchCommunities(), 2000);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-12 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-4">
            Please connect your wallet to view communities
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Communities
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Explore and join decentralized communities on Solana
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? "Cancel" : "+ Create Community"}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes("Error") ? "bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100" : "bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100"}`}>
          {message}
        </div>
      )}

      {/* Create Community Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 border border-zinc-200 dark:border-zinc-800 mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">
            Create New Community
          </h2>
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
                placeholder="My DAO"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Token Symbol
              </label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                placeholder="DAO"
                maxLength={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Governance Threshold (%)
              </label>
              <input
                type="number"
                value={governanceThreshold}
                onChange={(e) => setGovernanceThreshold(Number(e.target.value))}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                min={1}
                max={100}
              />
            </div>

            <button
              onClick={createCommunity}
              disabled={loading || !communityName || !tokenSymbol}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Community"}
            </button>
          </div>
        </div>
      )}

      {/* Communities List */}
      {loading && communities.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading communities...</p>
        </div>
      ) : communities.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-12 border border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-4">
            No communities found
          </p>
          <p className="text-zinc-500 dark:text-zinc-500">
            Be the first to create a community!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <CommunityCard key={community.publicKey} community={community} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityCard({ community }: { community: Community }) {
  const wallet = useAnchorWallet();
  const isAdmin = wallet && community.admin === wallet.publicKey.toString();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
            {community.name}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            ${community.tokenSymbol}
          </p>
        </div>
        {isAdmin && (
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
            Admin
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Members</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{community.memberCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Governance</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{community.governanceThreshold}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Transfer Fee</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{community.transferFeeBps / 100}%</span>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
          {community.publicKey}
        </p>
      </div>
    </div>
  );
}
