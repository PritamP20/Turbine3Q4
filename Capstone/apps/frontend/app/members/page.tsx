"use client";

import { useState } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getProgram, getConnection } from "@/lib/anchor-setup";

export default function MembersPage() {
  const { connected } = useWallet();
  const wallet = useAnchorWallet();
  const [communityName, setCommunityName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const registerMember = async () => {
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

      const tx = await program.methods
        .registerMember(memberName, metadataUri)
        .accountsStrict({
          member: memberPda,
          community: communityPda,
          wallet: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setMessage(`Member registered! TX: ${tx}`);
      setMemberName("");
      setMetadataUri("");
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
          Please connect your wallet to register as a member
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
        Register as Member
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
              Your Name
            </label>
            <input
              type="text"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              placeholder="Alice"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Profile URI (optional)
            </label>
            <input
              type="text"
              value={metadataUri}
              onChange={(e) => setMetadataUri(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
              placeholder="https://example.com/profile"
            />
          </div>

          <button
            onClick={registerMember}
            disabled={loading || !communityName || !memberName}
            className="w-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 py-3 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Register Member"}
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
