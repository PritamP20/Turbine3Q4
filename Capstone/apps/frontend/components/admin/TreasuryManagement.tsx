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
    // TODO: Integrate with contract
    console.log('Withdrawing from community:', communityId, { amount, recipient });
    setShowWithdrawForm(false);
    setAmount('');
    setRecipient('');
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with contract
    console.log('Depositing to community:', communityId, amount);
    setShowDepositForm(false);
    setAmount('');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Treasury Management</h2>

      {/* Treasury Balance */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-purple-200 text-sm mb-1">Total Treasury Balance</p>
            <p className="text-4xl font-bold text-white">{treasuryBalance.toLocaleString()} SOL</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDepositForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              + Deposit
            </button>
            <button
              onClick={() => setShowWithdrawForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Withdraw Form */}
      {showWithdrawForm && (
        <form onSubmit={handleWithdraw} className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">Withdraw from Treasury</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (SOL) *
              </label>
              <input
                type="number"
                step="0.000000001"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="0.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Address *
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono text-sm"
                placeholder="Solana address..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Withdraw
            </button>
            <button
              type="button"
              onClick={() => setShowWithdrawForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Deposit Form */}
      {showDepositForm && (
        <form onSubmit={handleDeposit} className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">Deposit to Treasury</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (SOL) *
            </label>
            <input
              type="number"
              step="0.000000001"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="0.0"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setShowDepositForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Transaction History */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Transaction History</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'deposit' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {tx.type === 'deposit' ? '↓' : '↑'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{tx.description}</p>
                    <p className="text-gray-400 text-sm">{tx.timestamp.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'deposit' ? '+' : '-'}{tx.amount} SOL
                  </p>
                  <a
                    href={`https://explorer.solana.com/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 text-sm hover:underline"
                  >
                    View TX
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
