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
    // TODO: Integrate with contract
    console.log('Finalizing proposal for community:', communityId, proposalId);
  };

  const handleCancelProposal = async (proposalId: string) => {
    // TODO: Integrate with contract
    console.log('Cancelling proposal for community:', communityId, proposalId);
  };

  const handleExecuteProposal = async (proposalId: string) => {
    // TODO: Integrate with contract
    console.log('Executing proposal for community:', communityId, proposalId);
  };

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-900 text-blue-300';
      case 'passed':
        return 'bg-green-900 text-green-300';
      case 'rejected':
        return 'bg-red-900 text-red-300';
      case 'executed':
        return 'bg-purple-900 text-purple-300';
      case 'cancelled':
        return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Governance Overview</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Proposals</p>
          <p className="text-2xl font-bold text-white">{proposals.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Active</p>
          <p className="text-2xl font-bold text-white">
            {proposals.filter(p => p.status === 'active').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Passed</p>
          <p className="text-2xl font-bold text-white">
            {proposals.filter(p => p.status === 'passed').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Executed</p>
          <p className="text-2xl font-bold text-white">
            {proposals.filter(p => p.status === 'executed').length}
          </p>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {proposals.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-800 rounded-lg">
            <p className="text-lg">No proposals yet</p>
            <p className="text-sm mt-2">Proposals created by members will appear here</p>
          </div>
        ) : (
          proposals.map((proposal) => (
            <div key={proposal.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{proposal.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                      {proposal.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                      {proposal.type}
                    </span>
                  </div>
                  <p className="text-gray-400 mb-3">{proposal.description}</p>
                  <p className="text-gray-500 text-sm">
                    Proposed by: <span className="font-mono">{proposal.proposer.slice(0, 8)}...</span>
                  </p>
                </div>
              </div>

              {/* Voting Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">For</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain)) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-white font-semibold">{proposal.votesFor}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Against</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{
                          width: `${(proposal.votesAgainst / (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain)) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-white font-semibold">{proposal.votesAgainst}</span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Abstain</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gray-500 h-2 rounded-full"
                        style={{
                          width: `${(proposal.votesAbstain / (proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain)) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-white font-semibold">{proposal.votesAbstain}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <span>Created: {proposal.createdAt.toLocaleDateString()}</span>
                <span>•</span>
                <span>Ends: {proposal.endsAt.toLocaleDateString()}</span>
              </div>

              {/* Admin Actions */}
              <div className="flex gap-2">
                {proposal.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleFinalizeProposal(proposal.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Finalize
                    </button>
                    <button
                      onClick={() => handleCancelProposal(proposal.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {proposal.status === 'passed' && (
                  <button
                    onClick={() => handleExecuteProposal(proposal.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Execute
                  </button>
                )}
                <button
                  onClick={() => setSelectedProposal(proposal)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Proposal Details Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-white">{selectedProposal.title}</h3>
              <button
                onClick={() => setSelectedProposal(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Description</p>
                <p className="text-white">{selectedProposal.description}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Proposer</p>
                <p className="text-white font-mono text-sm">{selectedProposal.proposer}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Type</p>
                <p className="text-white">{selectedProposal.type}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProposal.status)}`}>
                  {selectedProposal.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
