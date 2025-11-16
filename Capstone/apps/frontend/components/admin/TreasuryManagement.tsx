// TreasuryManagement.tsx
'use client';

import { useState } from 'react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  timestamp: Date;
  description: string;
  txHash: string;
}

interface TreasuryManagementProps {
  communityId: string;
}

export function TreasuryManagement({ communityId }: TreasuryManagementProps) {
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Withdrawing from community:', communityId, { amount, recipient });
    setShowWithdrawForm(false);
    setAmount('');
    setRecipient('');
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Depositing to community:', communityId, amount);
    setShowDepositForm(false);
    setAmount('');
  };

  return (
    <div>
      <h2 className="text-3xl font-black text-black mb-6">TREASURY MANAGEMENT</h2>

      {/* Treasury Balance */}
      <div className="bg-lime-400 border-4 border-black p-6 mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-sm font-black text-black mb-1">TOTAL TREASURY BALANCE</p>
            <p className="text-5xl font-black text-black">{treasuryBalance.toLocaleString()} SOL</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDepositForm(true)}
              className="bg-cyan-400 text-black px-6 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all whitespace-nowrap"
            >
              + DEPOSIT
            </button>
            <button
              onClick={() => setShowWithdrawForm(true)}
              className="bg-pink-400 text-black px-6 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all whitespace-nowrap"
            >
              WITHDRAW
            </button>
          </div>
        </div>
      </div>

      {/* Withdraw Form */}
      {showWithdrawForm && (
        <form onSubmit={handleWithdraw} className="bg-pink-50 border-4 border-black p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-2xl font-black text-black mb-6 pb-3 border-b-4 border-black">WITHDRAW FROM TREASURY</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Amount (SOL) *
              </label>
              <input
                type="number"
                step="0.000000001"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-pink-400"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Recipient Address *
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-mono font-bold text-sm focus:outline-none focus:border-pink-400"
                placeholder="Solana address..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-pink-400 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              WITHDRAW
            </button>
            <button
              type="button"
              onClick={() => setShowWithdrawForm(false)}
              className="bg-gray-200 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* Deposit Form */}
      {showDepositForm && (
        <form onSubmit={handleDeposit} className="bg-cyan-50 border-4 border-black p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-2xl font-black text-black mb-6 pb-3 border-b-4 border-black">DEPOSIT TO TREASURY</h3>
          
          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase">
              Amount (SOL) *
            </label>
            <input
              type="number"
              step="0.000000001"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-cyan-400"
              placeholder="0.0"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-cyan-400 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              DEPOSIT
            </button>
            <button
              type="button"
              onClick={() => setShowDepositForm(false)}
              className="bg-gray-200 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* Transaction History */}
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-2xl font-black text-black mb-6 pb-3 border-b-4 border-black">TRANSACTION HISTORY</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-yellow-400 border-4 border-black mx-auto mb-4 flex items-center justify-center text-4xl">
              💰
            </div>
            <p className="font-black text-black text-lg">NO TRANSACTIONS YET</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 border-4 border-black">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 border-4 border-black flex items-center justify-center text-2xl font-black ${
                    tx.type === 'deposit' ? 'bg-lime-400 text-black' : 'bg-red-400 text-black'
                  }`}>
                    {tx.type === 'deposit' ? '↓' : '↑'}
                  </div>
                  <div>
                    <p className="text-black font-black">{tx.description}</p>
                    <p className="text-black text-sm font-bold">{tx.timestamp.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black text-xl ${
                    tx.type === 'deposit' ? 'text-lime-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'deposit' ? '+' : '-'}{tx.amount} SOL
                  </p>
                  <a
                    href={`https://explorer.solana.com/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 text-sm font-bold hover:underline"
                  >
                    VIEW TX →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// MemberManagement.tsx - Shortened version with key logic
export function MemberManagement({ communityId }: { communityId: string }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  return (
    <div>
      <h2 className="text-3xl font-black text-black mb-6">MEMBER MANAGEMENT</h2>

      {/* Search and Filters */}
      <div className="bg-cyan-50 border-4 border-black p-4 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH BY NAME OR ADDRESS..."
              className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold placeholder:text-gray-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as typeof filterStatus)}
                className={`px-6 py-3 font-black uppercase border-4 border-black transition-all ${
                  filterStatus === status
                    ? 'bg-cyan-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="text-center py-12 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-20 h-20 bg-pink-400 border-4 border-black mx-auto mb-4 flex items-center justify-center text-4xl">
          👥
        </div>
        <p className="text-xl font-black text-black mb-2">NO MEMBERS FOUND</p>
        <p className="text-sm font-bold text-black">Members will appear here once they join</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-cyan-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL MEMBERS</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
        <div className="bg-yellow-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">ACTIVE MEMBERS</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
        <div className="bg-pink-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL TOKENS</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
        <div className="bg-lime-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">AVG REPUTATION</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
      </div>
    </div>
  );
}

// GovernanceOverview.tsx - Shortened version
export function GovernanceOverview({ communityId }: { communityId: string }) {
  const [proposals, setProposals] = useState([]);

  return (
    <div>
      <h2 className="text-3xl font-black text-black mb-6">GOVERNANCE OVERVIEW</h2>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-cyan-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL PROPOSALS</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
        <div className="bg-yellow-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">ACTIVE</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
        <div className="bg-pink-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">PASSED</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
        <div className="bg-lime-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">EXECUTED</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="text-center py-12 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-20 h-20 bg-yellow-400 border-4 border-black mx-auto mb-4 flex items-center justify-center text-4xl">
          🗳️
        </div>
        <p className="text-xl font-black text-black mb-2">NO PROPOSALS YET</p>
        <p className="text-sm font-bold text-black">Proposals created by members will appear here</p>
      </div>
    </div>
  );
}

// TokenOperations.tsx - Placeholder
export function TokenOperations({ communityId }: { communityId: string }) {
  return (
    <div>
      <h2 className="text-3xl font-black text-black mb-6">TOKEN OPERATIONS</h2>
      <div className="text-center py-12 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-20 h-20 bg-lime-400 border-4 border-black mx-auto mb-4 flex items-center justify-center text-4xl">
          🪙
        </div>
        <p className="text-xl font-black text-black">TOKEN OPERATIONS COMING SOON</p>
      </div>
    </div>
  );
}