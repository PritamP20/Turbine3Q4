// GovernanceOverview.tsx - FULL VERSION with Neo Brutalism
'use client';

import { useState } from 'react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  createdAt: Date;
  endsAt: Date;
  type: string;
}

interface GovernanceOverviewProps {
  communityId: string;
}

export function GovernanceOverview({ communityId }: GovernanceOverviewProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const handleFinalizeProposal = async (proposalId: string) => {
    console.log('Finalizing proposal for community:', communityId, proposalId);
  };

  const handleCancelProposal = async (proposalId: string) => {
    console.log('Cancelling proposal for community:', communityId, proposalId);
  };

  const handleExecuteProposal = async (proposalId: string) => {
    console.log('Executing proposal for community:', communityId, proposalId);
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return 'bg-cyan-400 text-black border-2 border-black';
      case 'passed':
        return 'bg-lime-400 text-black border-2 border-black';
      case 'rejected':
        return 'bg-red-400 text-black border-2 border-black';
      case 'executed':
        return 'bg-pink-400 text-black border-2 border-black';
      case 'cancelled':
        return 'bg-gray-300 text-black border-2 border-black';
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-black text-black mb-6">GOVERNANCE OVERVIEW</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-cyan-400 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL PROPOSALS</p>
          <p className="text-3xl font-black text-black">{proposals.length}</p>
        </div>
        <div className="bg-yellow-400 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">ACTIVE</p>
          <p className="text-3xl font-black text-black">
            {proposals.filter(p => p.status === 'active').length}
          </p>
        </div>
        <div className="bg-pink-400 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">PASSED</p>
          <p className="text-3xl font-black text-black">
            {proposals.filter(p => p.status === 'passed').length}
          </p>
        </div>
        <div className="bg-lime-400 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">EXECUTED</p>
          <p className="text-3xl font-black text-black">
            {proposals.filter(p => p.status === 'executed').length}
          </p>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div className="text-center py-12 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-20 h-20 bg-yellow-400 border-4 border-black mx-auto mb-4 flex items-center justify-center text-4xl">
              🗳️
            </div>
            <p className="text-xl font-black text-black mb-2">NO PROPOSALS YET</p>
            <p className="text-sm font-bold text-black">Proposals created by members will appear here</p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <div key={proposal.id} className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <h3 className="text-2xl font-black text-black">{proposal.title}</h3>
                    <span className={`px-3 py-1 text-xs font-black ${getStatusColor(proposal.status)}`}>
                      {proposal.status.toUpperCase()}
                    </span>
                    <span className="px-3 py-1 text-xs font-black bg-gray-200 text-black border-2 border-black">
                      {proposal.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-black font-bold mb-3">{proposal.description}</p>
                  <p className="text-black text-sm font-bold bg-gray-100 p-2 border-2 border-black inline-block">
                    PROPOSED BY: <span className="font-mono">{proposal.proposer.slice(0, 8)}...</span>
                  </p>
                </div>
              </div>

              {/* Voting Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-lime-50 border-4 border-black p-3">
                  <p className="text-black text-sm font-black mb-2">FOR</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 border-2 border-black h-4">
                      <div
                        className="bg-lime-400 h-full border-r-2 border-black"
                        style={{
                          width: `${proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain > 0 ? (proposal.votesFor / (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain)) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-black font-black text-lg min-w-[3ch]">{proposal.votesFor}</span>
                  </div>
                </div>
                <div className="bg-red-50 border-4 border-black p-3">
                  <p className="text-black text-sm font-black mb-2">AGAINST</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 border-2 border-black h-4">
                      <div
                        className="bg-red-400 h-full border-r-2 border-black"
                        style={{
                          width: `${proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain > 0 ? (proposal.votesAgainst / (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain)) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-black font-black text-lg min-w-[3ch]">{proposal.votesAgainst}</span>
                  </div>
                </div>
                <div className="bg-gray-100 border-4 border-black p-3">
                  <p className="text-black text-sm font-black mb-2">ABSTAIN</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 border-2 border-black h-4">
                      <div
                        className="bg-gray-400 h-full border-r-2 border-black"
                        style={{
                          width: `${proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain > 0 ? (proposal.votesAbstain / (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain)) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-black font-black text-lg min-w-[3ch]">{proposal.votesAbstain}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-4 text-sm font-bold text-black mb-4 bg-gray-50 p-3 border-2 border-black">
                <span>CREATED: {proposal.createdAt.toLocaleDateString()}</span>
                <span className="font-black">•</span>
                <span>ENDS: {proposal.endsAt.toLocaleDateString()}</span>
              </div>

              {/* Admin Actions */}
              <div className="flex flex-wrap gap-2">
                {proposal.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleFinalizeProposal(proposal.id)}
                      className="bg-pink-400 text-black px-4 py-2 font-black text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      FINALIZE
                    </button>
                    <button
                      onClick={() => handleCancelProposal(proposal.id)}
                      className="bg-red-400 text-black px-4 py-2 font-black text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      CANCEL
                    </button>
                  </>
                )}
                {proposal.status === 'passed' && (
                  <button
                    onClick={() => handleExecuteProposal(proposal.id)}
                    className="bg-lime-400 text-black px-4 py-2 font-black text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    EXECUTE
                  </button>
                )}
                <button
                  onClick={() => setSelectedProposal(proposal)}
                  className="bg-gray-200 text-black px-4 py-2 font-black text-sm border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  VIEW DETAILS
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Proposal Details Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-8 border-black p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start mb-6 pb-4 border-b-4 border-black">
              <h3 className="text-3xl font-black text-black pr-4">{selectedProposal.title}</h3>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-black hover:bg-black hover:text-white p-2 border-4 border-black font-black text-2xl shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-sm font-black text-black mb-2 uppercase">DESCRIPTION</p>
                <p className="text-black font-bold bg-gray-50 p-4 border-4 border-black">{selectedProposal.description}</p>
              </div>
              <div>
                <p className="text-sm font-black text-black mb-2 uppercase">PROPOSER</p>
                <p className="text-black font-mono font-bold bg-gray-50 p-4 border-4 border-black text-sm">{selectedProposal.proposer}</p>
              </div>
              <div>
                <p className="text-sm font-black text-black mb-2 uppercase">TYPE</p>
                <p className="text-black font-bold bg-gray-50 p-4 border-4 border-black">{selectedProposal.type}</p>
              </div>
              <div>
                <p className="text-sm font-black text-black mb-2 uppercase">STATUS</p>
                <span className={`inline-block px-4 py-2 font-black ${getStatusColor(selectedProposal.status)}`}>
                  {selectedProposal.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-lime-400 border-4 border-black p-4">
                  <p className="text-xs font-black text-black mb-1">VOTES FOR</p>
                  <p className="text-3xl font-black text-black">{selectedProposal.votesFor}</p>
                </div>
                <div className="bg-red-400 border-4 border-black p-4">
                  <p className="text-xs font-black text-black mb-1">VOTES AGAINST</p>
                  <p className="text-3xl font-black text-black">{selectedProposal.votesAgainst}</p>
                </div>
                <div className="bg-gray-300 border-4 border-black p-4">
                  <p className="text-xs font-black text-black mb-1">ABSTAIN</p>
                  <p className="text-3xl font-black text-black">{selectedProposal.votesAbstain}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}