"use client";

import { useState } from "react";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getProgram, getConnection } from "@/lib/anchor-setup";

export default function GovernancePage() {
  const { connected } = useWallet();
  const wallet = useAnchorWallet();
  const [communityName, setCommunityName] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [votingPeriod, setVotingPeriod] = useState(7);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const createProposal = async () => {
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

      const proposalId = `Proposal${Date.now()}`;
      const [proposalPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), communityPda.toBuffer(), Buffer.from(proposalId)],
        program.programId
      );

      const votingPeriodSeconds = new BN(votingPeriod * 24 * 60 * 60);

      const tx = await program.methods
        .createProposal(proposalId, proposalTitle, proposalDescription, votingPeriodSeconds)
        .accountsStrict({
          proposal: proposalPda,
          community: communityPda,
          member: memberPda,
          proposer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setMessage(`Proposal created! TX: ${tx}`);
      setProposalTitle("");
      setProposalDescription("");
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="bg-yellow-300 border-6 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md text-center">
          <span className="text-6xl mb-4 block">🔒</span>
          <p className="text-xl font-black text-black uppercase">
            Connect Wallet to Create Proposals
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-black text-black uppercase mb-4" style={{ textShadow: '5px 5px 0px #FFD700' }}>
            Create Proposal
          </h1>
          <p className="text-lg font-bold text-black">
            Submit your ideas to the community for voting
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-cyan-200 border-6 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-6">
            {/* Community Name */}
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Community Name
              </label>
              <input
                type="text"
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                placeholder="TestDAO"
              />
            </div>

            {/* Proposal Title */}
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Proposal Title
              </label>
              <input
                type="text"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                placeholder="Increase treasury allocation"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Description
              </label>
              <textarea
                value={proposalDescription}
                onChange={(e) => setProposalDescription(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none resize-none"
                rows={5}
                placeholder="Detailed description of the proposal..."
              />
            </div>

            {/* Voting Period */}
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Voting Period (Days)
              </label>
              <input
                type="number"
                value={votingPeriod}
                onChange={(e) => setVotingPeriod(Number(e.target.value))}
                className="w-full px-4 py-3 border-4 border-black bg-white text-black font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                min={1}
                max={30}
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={createProposal}
              disabled={loading || !communityName || !proposalTitle || !proposalDescription}
              className="w-full bg-black text-white border-4 border-black py-4 font-black text-lg uppercase hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1"
            >
              {loading ? "Creating..." : "Create Proposal"}
            </button>

            {/* Message Display */}
            {message && (
              <div
                className={`p-4 border-4 border-black font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
                  message.includes("Error")
                    ? "bg-red-300 text-black"
                    : "bg-green-300 text-black"
                }`}
              >
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}