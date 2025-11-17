"use client";

import { useState, useEffect } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { getProgram, getConnection } from '@/lib/anchor-setup';

interface GovernanceSectionProps {
  communityId: string;
}

interface Proposal {
  publicKey: string;
  title: string;
  description: string;
  proposer: string;
  createdAt: number;
  votesFor: number;
  votesAgainst: number;
  executed: boolean;
  userVote?: 'yes' | 'no' | null;
}

export default function GovernanceSection({ communityId }: GovernanceSectionProps) {
  const wallet = useAnchorWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (wallet && communityId) {
      fetchProposals();
    }
  }, [wallet, communityId]);

  const fetchProposals = async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPda = new PublicKey(communityId);

      // Fetch all proposals for this community
      const proposalAccounts = await (program.account as any).proposal.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityPda.toBase58(),
          },
        },
      ]);

      const proposalsData: Proposal[] = await Promise.all(
        proposalAccounts.map(async (account: any) => {
          const proposal = account.account;
          
          // Check if user has voted
          let userVote: 'yes' | 'no' | null = null;
          try {
            const [votePda] = PublicKey.findProgramAddressSync(
              [
                Buffer.from('vote'),
                account.publicKey.toBuffer(),
                wallet.publicKey.toBuffer(),
              ],
              program.programId
            );
            
            const voteAccount = await (program.account as any).vote.fetch(votePda);
            userVote = Object.keys(voteAccount.voteType)[0].toLowerCase() as 'yes' | 'no';
          } catch (error) {
            // User hasn't voted
          }

          return {
            publicKey: account.publicKey.toString(),
            title: proposal.title,
            description: proposal.description,
            proposer: proposal.proposer.toString(),
            createdAt: proposal.createdAt.toNumber(),
            votesFor: proposal.votesFor,
            votesAgainst: proposal.votesAgainst,
            executed: proposal.executed,
            userVote,
          };
        })
      );

      // Sort by creation date (newest first)
      proposalsData.sort((a, b) => b.createdAt - a.createdAt);
      setProposals(proposalsData);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProposal = async () => {
    if (!wallet || !title.trim() || !description.trim()) return;

    setCreating(true);
    setMessage('');

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPda = new PublicKey(communityId);
      
      // Generate a unique proposal PDA
      const proposalId = Date.now().toString();
      const [proposalPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('proposal'), communityPda.toBuffer(), Buffer.from(proposalId)],
        program.programId
      );

      await program.methods
        .createProposal(proposalId, title, description)
        .accountsStrict({
          proposal: proposalPda,
          community: communityPda,
          proposer: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setMessage('Proposal created successfully! 🎉');
      setTitle('');
      setDescription('');
      setShowCreateForm(false);
      
      setTimeout(() => {
        setMessage('');
        fetchProposals();
      }, 2000);
    } catch (error: any) {
      console.error('Error creating proposal:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  const vote = async (proposalKey: string, voteType: 'yes' | 'no') => {
    if (!wallet) return;

    setVoting(proposalKey);
    setMessage('');

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const proposalPda = new PublicKey(proposalKey);
      const communityPda = new PublicKey(communityId);

      const [votePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vote'), proposalPda.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
      );

      const [memberPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('member'), communityPda.toBuffer(), wallet.publicKey.toBuffer()],
        program.programId
      );

      const voteTypeEnum = voteType === 'yes' ? { yes: {} } : { no: {} };

      await program.methods
        .castVote(voteTypeEnum)
        .accountsStrict({
          vote: votePda,
          proposal: proposalPda,
          member: memberPda,
          voter: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setMessage(`Vote cast: ${voteType.toUpperCase()} ✅`);
      
      setTimeout(() => {
        setMessage('');
        fetchProposals();
      }, 2000);
    } catch (error: any) {
      console.error('Error voting:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setVoting(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVotePercentage = (votesFor: number, votesAgainst: number) => {
    const total = votesFor + votesAgainst;
    if (total === 0) return 0;
    return Math.round((votesFor / total) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-800 rounded-lg p-6 border-4 border-black animate-pulse">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-black">GOVERNANCE</h2>
          <p className="text-sm font-bold text-black mt-1">
            Create and vote on community proposals
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-lime-400 text-black px-6 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
        >
          {showCreateForm ? '✕ CANCEL' : '+ NEW PROPOSAL'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 border-4 border-black font-bold ${
          message.includes('Error') ? 'bg-red-400' : 'bg-lime-400'
        }`}>
          {message}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-xl font-black text-black mb-4 pb-3 border-b-4 border-black">
            CREATE NEW PROPOSAL
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black text-black mb-2">TITLE *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Proposal title"
                className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-0"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-black mb-2">DESCRIPTION *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your proposal..."
                rows={4}
                className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-0 resize-none"
              />
            </div>
            <button
              onClick={createProposal}
              disabled={creating || !title.trim() || !description.trim()}
              className="w-full bg-cyan-400 text-black py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'CREATING...' : 'CREATE PROPOSAL'}
            </button>
          </div>
        </div>
      )}

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <div className="bg-white border-4 border-black p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <div className="w-20 h-20 bg-yellow-400 border-4 border-black mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-black mb-2">NO PROPOSALS YET</h3>
          <p className="text-lg font-bold text-black">
            Be the first to create a proposal!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const votePercentage = getVotePercentage(proposal.votesFor, proposal.votesAgainst);
            const totalVotes = proposal.votesFor + proposal.votesAgainst;
            
            return (
              <div
                key={proposal.publicKey}
                className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-black mb-2">{proposal.title}</h3>
                    <p className="text-sm font-bold text-black mb-3">{proposal.description}</p>
                    <p className="text-xs font-bold text-black opacity-70">
                      Created {formatDate(proposal.createdAt)}
                    </p>
                  </div>
                  {proposal.executed && (
                    <span className="px-3 py-1 bg-green-400 text-black text-xs font-black border-2 border-black">
                      EXECUTED
                    </span>
                  )}
                </div>

                {/* Vote Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-black text-black mb-2">
                    <span>FOR: {proposal.votesFor}</span>
                    <span>AGAINST: {proposal.votesAgainst}</span>
                  </div>
                  <div className="w-full h-4 bg-red-400 border-2 border-black">
                    <div
                      className="h-full bg-green-400 border-r-2 border-black transition-all"
                      style={{ width: `${votePercentage}%` }}
                    />
                  </div>
                  <p className="text-xs font-bold text-black mt-1">
                    {votePercentage}% in favor ({totalVotes} total votes)
                  </p>
                </div>

                {/* Vote Buttons */}
                {proposal.userVote ? (
                  <div className="bg-yellow-50 border-2 border-black p-3 text-center">
                    <p className="text-sm font-black text-black">
                      YOU VOTED: {proposal.userVote.toUpperCase()} ✓
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => vote(proposal.publicKey, 'yes')}
                      disabled={voting === proposal.publicKey}
                      className="flex-1 bg-green-400 text-black py-3 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                    >
                      {voting === proposal.publicKey ? 'VOTING...' : '✓ VOTE FOR'}
                    </button>
                    <button
                      onClick={() => vote(proposal.publicKey, 'no')}
                      disabled={voting === proposal.publicKey}
                      className="flex-1 bg-red-400 text-black py-3 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                    >
                      {voting === proposal.publicKey ? 'VOTING...' : '✕ VOTE AGAINST'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
