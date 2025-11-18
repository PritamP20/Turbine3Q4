"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getProgram, getConnection, NETWORK } from "@/lib/anchor-setup";
import { JoinCommunityModal } from "@/components/JoinCommunityModal";

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
    if (!wallet) {
      console.log("No wallet connected, skipping fetch");
      return;
    }

    setLoading(true);
    console.log("Fetching communities from chain...");
    
    try {
      const connection = getConnection();
      console.log("Connection established to:", NETWORK);
      
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);
      console.log("Program ID:", program.programId.toString());

      console.log("Calling program.account.community.all()...");
      const communityAccounts = await (program.account as any).community.all();
      console.log("Found communities:", communityAccounts.length);
      
      const communitiesData: Community[] = communityAccounts.map((account: any) => {
        console.log("Community account:", {
          publicKey: account.publicKey.toString(),
          name: account.account.name,
          memberCount: account.account.memberCount,
        });
        
        return {
          publicKey: account.publicKey.toString(),
          name: account.account.name,
          tokenSymbol: account.account.tokenSymbol,
          governanceThreshold: account.account.governanceThreshold,
          admin: account.account.admin.toString(),
          memberCount: account.account.memberCount,
          transferFeeBps: account.account.transferFeeBps,
        };
      });

      console.log("Setting communities state with", communitiesData.length, "communities");
      setCommunities(communitiesData);
    } catch (error: any) {
      console.error("Error fetching communities:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        logs: error.logs,
      });
      setMessage(`Error loading communities: ${error.message}`);
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

      // Derive treasury token account (ATA for treasury)
      const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
      const [treasuryTokenAccount] = PublicKey.findProgramAddressSync(
        [
          treasuryPda.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenMintPda.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const tx = await program.methods
        .initializeCommunity(communityName, tokenSymbol, 9, governanceThreshold)
        .accounts({
          community: communityPda,
          tokenMint: tokenMintPda,
          collectionMint: collectionMintPda,
          treasury: treasuryPda,
          treasuryTokenAccount: treasuryTokenAccount,
          admin: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      setMessage(`Community created! TX: ${tx}`);
      setCommunityName("");
      setTokenSymbol("");
      setShowCreateForm(false);
      
      setTimeout(() => fetchCommunities(), 2000);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white border-8 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-cyan-400 border-4 border-black mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-black mb-4">WALLET NOT CONNECTED</h2>
            <p className="text-lg font-bold text-black">
              Please connect your wallet to view communities
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 py-8 sm:py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex-1">
            <h1 className="text-3xl sm:text-5xl font-black text-black mb-2">
              COMMUNITIES
            </h1>
            <p className="text-base sm:text-lg font-bold text-black">
              Explore and join decentralized communities on Solana
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchCommunities}
              disabled={loading}
              className="bg-pink-400 text-black px-6 py-4 font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all whitespace-nowrap disabled:opacity-50"
            >
              {loading ? "⟳" : "↻"} REFRESH
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-lime-400 text-black px-6 py-4 font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all whitespace-nowrap"
            >
              {showCreateForm ? "✕ CANCEL" : "+ CREATE COMMUNITY"}
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6 p-4 border-4 border-black font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
            message.includes("Error") 
              ? "bg-red-400 text-black" 
              : "bg-lime-400 text-black"
          }`}>
            <div className="flex items-center justify-between">
              <span>{message}</span>
              <button 
                onClick={() => setMessage("")}
                className="text-black hover:bg-black hover:text-white p-1 border-2 border-black transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Create Community Form */}
        {showCreateForm && (
          <div className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
            <h2 className="text-2xl sm:text-3xl font-black text-black mb-6 pb-4 border-b-4 border-black">
              CREATE NEW COMMUNITY
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase">
                  Community Name
                </label>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  className="w-full px-4 py-3 border-4 border-black font-bold text-black focus:outline-none focus:ring-0 focus:border-cyan-400"
                  placeholder="My DAO"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase">
                  Token Symbol
                </label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  className="w-full px-4 py-3 border-4 border-black font-bold text-black focus:outline-none focus:ring-0 focus:border-cyan-400"
                  placeholder="DAO"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-black text-black mb-2 uppercase">
                  Governance Threshold (%)
                </label>
                <input
                  type="number"
                  value={governanceThreshold}
                  onChange={(e) => setGovernanceThreshold(Number(e.target.value))}
                  className="w-full px-4 py-3 border-4 border-black font-bold text-black focus:outline-none focus:ring-0 focus:border-cyan-400"
                  min={1}
                  max={100}
                />
              </div>

              <button
                onClick={createCommunity}
                disabled={loading || !communityName || !tokenSymbol}
                className="w-full bg-cyan-400 text-black py-4 font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
              >
                {loading ? "CREATING..." : "CREATE COMMUNITY"}
              </button>
            </div>
          </div>
        )}

        {/* Communities List */}
        {loading && communities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 border-8 border-black border-t-cyan-400 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-xl font-black text-black">LOADING COMMUNITIES...</p>
          </div>
        ) : communities.length === 0 ? (
          <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="w-20 h-20 bg-pink-400 border-4 border-black mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-black mb-2">NO COMMUNITIES FOUND</h3>
            <p className="text-lg font-bold text-black">
              Be the first to create a community!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <CommunityCard key={community.publicKey} community={community} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommunityCard({ community }: { community: Community }) {
  const wallet = useAnchorWallet();
  const isAdmin = wallet && community.admin === wallet.publicKey.toString();
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [message, setMessage] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkMembership();
  }, [wallet, community]);

  const checkMembership = async () => {
    if (!wallet) return;
    
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPda = new PublicKey(community.publicKey);
      const [memberPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("member"), communityPda.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
      );

      const memberAccount = await (program.account as any).member.fetch(memberPda);
      if (memberAccount) {
        setIsMember(true);
      }
    } catch (error) {
      setIsMember(false);
    }
  };

  const joinCommunity = async (memberName: string, imageFile: File | null) => {
    if (!wallet) return;

    setJoining(true);
    setMessage("");

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPda = new PublicKey(community.publicKey);
      
      const communityAccount = await (program.account as any).community.fetch(communityPda);
      
      const [memberPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("member"), communityPda.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
      );

      const [membershipNftMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("membership_nft"), communityPda.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
      );

      const [memberNftTokenAccount] = PublicKey.findProgramAddressSync(
        [
          wallet.publicKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          membershipNftMint.toBuffer(),
        ],
        new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")
      );

      const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
      const [nftMetadata] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          membershipNftMint.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      // Handle image upload
      let hasCustomImage = false;
      
      if (imageFile) {
        console.log('Processing image file:', imageFile.name, imageFile.size);
        
        // Read image as data URL
        const imageDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
        
        console.log('Image converted to data URL, length:', imageDataUrl.length);
        
        // Store in localStorage for immediate access
        const storageKey = `nft-image-${communityPda.toString()}-${wallet.publicKey.toString()}`;
        localStorage.setItem(storageKey, imageDataUrl);
        console.log('Image stored in localStorage with key:', storageKey);
        
        // Upload to API for persistence and sharing
        try {
          const response = await fetch(`/api/nft-images/${communityPda.toString()}/${wallet.publicKey.toString()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageDataUrl }),
          });
          
          if (response.ok) {
            hasCustomImage = true;
            console.log('Image uploaded to API successfully');
          } else {
            console.error('API upload failed with status:', response.status);
          }
        } catch (error) {
          console.error('Failed to upload image to API:', error);
        }
      }
      
      // Use a compact metadata URI that fits in Solana's limits
      const metadataUri = `https://nft.storage/${communityPda.toString()}/${wallet.publicKey.toString()}/${hasCustomImage ? 'custom' : 'default'}`;
      console.log('Metadata URI:', metadataUri);
      
      const tx = await program.methods
        .registerMember(memberName, metadataUri)
        .accountsStrict({
          member: memberPda,
          community: communityPda,
          membershipNftMint: membershipNftMint,
          memberNftTokenAccount: memberNftTokenAccount,
          nftMetadata: nftMetadata,
          wallet: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"),
          metadataProgram: METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      setMessage("Successfully joined! Membership NFT minted! 🎉");
      setIsMember(true);
      setShowJoinModal(false);
      setTimeout(() => setMessage(""), 5000);
    } catch (error: any) {
      console.error("Join error:", error);
      setMessage(`Error: ${error.message}`);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setJoining(false);
    }
  };

  const handleCardClick = () => {
    if (isMember) {
      router.push(`/communities/${community.publicKey}`);
    }
  };

  const cardColors = [
    'bg-cyan-400',
    'bg-yellow-400',
    'bg-pink-400',
    'bg-lime-400',
  ];
  
  const colorIndex = parseInt(community.publicKey.slice(0, 8), 16) % cardColors.length;
  const bgColor = cardColors[colorIndex];

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all ${
        isMember 
          ? 'cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px]' 
          : ''
      }`}
    >
      <div className={`${bgColor} border-b-4 border-black p-4`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-black text-black mb-1 break-words">
              {community.name}
            </h3>
            <p className="text-lg font-black text-black">
              ${community.tokenSymbol}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {isMember && (
              <span className="px-3 py-1 bg-black text-lime-400 text-xs font-black border-2 border-black whitespace-nowrap">
                MEMBER
              </span>
            )}
            {isAdmin && (
              <span className="px-3 py-1 bg-black text-cyan-400 text-xs font-black border-2 border-black whitespace-nowrap">
                ADMIN
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
            <span className="font-black text-black text-sm">MEMBERS</span>
            <span className="font-black text-black text-xl">{community.memberCount}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
            <span className="font-black text-black text-sm">GOVERNANCE</span>
            <span className="font-black text-black text-xl">{community.governanceThreshold}%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 border-2 border-black">
            <span className="font-black text-black text-sm">TRANSFER FEE</span>
            <span className="font-black text-black text-xl">{community.transferFeeBps / 100}%</span>
          </div>
        </div>

        <div className="pt-4 border-t-4 border-black mb-4">
          <p className="text-xs font-mono font-bold text-black truncate bg-gray-100 p-2 border-2 border-black">
            {community.publicKey}
          </p>
        </div>

        {message && (
          <div className={`mb-3 p-3 border-4 border-black font-bold ${
            message.includes("Error") 
              ? "bg-red-400 text-black" 
              : "bg-lime-400 text-black"
          }`}>
            {message}
          </div>
        )}

        {isMember ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/communities/${community.publicKey}`);
            }}
            className="w-full py-3 bg-black text-cyan-400 font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
          >
            VIEW DASHBOARD →
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowJoinModal(true);
            }}
            disabled={joining}
            className="w-full py-3 bg-cyan-400 text-black font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
          >
            {joining ? "JOINING..." : "JOIN COMMUNITY"}
          </button>
        )}
        
        <JoinCommunityModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onJoin={joinCommunity}
          communityName={community.name}
          loading={joining}
        />
      </div>
    </div>
  );
}