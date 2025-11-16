'use client';

import { useState } from 'react';

interface TokenOperationsProps {
  communityId: string;
}

export function TokenOperations({ communityId }: TokenOperationsProps) {
  const [activeOperation, setActiveOperation] = useState<'transfer' | 'batch' | 'burn' | null>(null);
  const [transferData, setTransferData] = useState({
    recipient: '',
    amount: '',
    memo: '',
  });
  const [batchTransfers, setBatchTransfers] = useState([{ recipient: '', amount: '' }]);
  const [burnAmount, setBurnAmount] = useState('');

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with contract
    console.log('Transferring tokens for community:', communityId, transferData);
    setActiveOperation(null);
    setTransferData({ recipient: '', amount: '', memo: '' });
  };

  const handleBatchTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with contract
    console.log('Batch transfer for community:', communityId, batchTransfers);
    setActiveOperation(null);
    setBatchTransfers([{ recipient: '', amount: '' }]);
  };

  const handleBurn = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with contract
    console.log('Burning tokens for community:', communityId, burnAmount);
    setActiveOperation(null);
    setBurnAmount('');
  };

  const addBatchRecipient = () => {
    setBatchTransfers([...batchTransfers, { recipient: '', amount: '' }]);
  };

  const removeBatchRecipient = (index: number) => {
    setBatchTransfers(batchTransfers.filter((_, i) => i !== index));
  };

  const updateBatchRecipient = (index: number, field: 'recipient' | 'amount', value: string) => {
    const updated = [...batchTransfers];
    updated[index][field] = value;
    setBatchTransfers(updated);
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">Token Operations</h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Manage your community's custom SPL token
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Community Token System
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Each community has its own custom SPL token created automatically. Use these operations to manage token distribution, rewards, and supply.
            </p>
          </div>
        </div>
      </div>

      {/* Operation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setActiveOperation('transfer')}
          className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg transition-colors text-left"
        >
          <div className="text-3xl mb-2">💸</div>
          <h3 className="text-xl font-semibold mb-1">Transfer Tokens</h3>
          <p className="text-purple-200 text-sm">Send tokens to a single recipient</p>
        </button>

        <button
          onClick={() => setActiveOperation('batch')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-lg transition-colors text-left"
        >
          <div className="text-3xl mb-2">📦</div>
          <h3 className="text-xl font-semibold mb-1">Batch Transfer</h3>
          <p className="text-indigo-200 text-sm">Send tokens to multiple recipients</p>
        </button>

        <button
          onClick={() => setActiveOperation('burn')}
          className="bg-red-600 hover:bg-red-700 text-white p-6 rounded-lg transition-colors text-left"
        >
          <div className="text-3xl mb-2">🔥</div>
          <h3 className="text-xl font-semibold mb-1">Burn Tokens</h3>
          <p className="text-red-200 text-sm">Permanently remove tokens from supply</p>
        </button>
      </div>

      {/* Single Transfer Form */}
      {activeOperation === 'transfer' && (
        <form onSubmit={handleTransfer} className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Transfer Tokens</h3>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Address *
              </label>
              <input
                type="text"
                required
                value={transferData.recipient}
                onChange={(e) => setTransferData({ ...transferData, recipient: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono text-sm"
                placeholder="Solana address..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount *
              </label>
              <input
                type="number"
                required
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Memo (optional)
              </label>
              <input
                type="text"
                value={transferData.memo}
                onChange={(e) => setTransferData({ ...transferData, memo: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="Transfer note..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Transfer
            </button>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Batch Transfer Form */}
      {activeOperation === 'batch' && (
        <form onSubmit={handleBatchTransfer} className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Batch Transfer</h3>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {batchTransfers.map((transfer, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={transfer.recipient}
                    onChange={(e) => updateBatchRecipient(index, 'recipient', e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white font-mono text-sm"
                    placeholder="Recipient address..."
                  />
                  <input
                    type="number"
                    required
                    value={transfer.amount}
                    onChange={(e) => updateBatchRecipient(index, 'amount', e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="Amount"
                  />
                </div>
                {batchTransfers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBatchRecipient(index)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addBatchRecipient}
            className="mt-4 text-purple-400 hover:text-purple-300 text-sm"
          >
            + Add Recipient
          </button>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Batch Transfer
            </button>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Burn Form */}
      {activeOperation === 'burn' && (
        <form onSubmit={handleBurn} className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Burn Tokens</h3>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount to Burn *
            </label>
            <input
              type="number"
              required
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="0"
            />
            <p className="text-yellow-500 text-xs mt-2">
              ⚠️ Warning: Burned tokens are permanently removed and cannot be recovered
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Burn Tokens
            </button>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Supply</p>
          <p className="text-2xl font-bold text-white">0</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Circulating Supply</p>
          <p className="text-2xl font-bold text-white">0</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Total Burned</p>
          <p className="text-2xl font-bold text-white">0</p>
        </div>
      </div>
    </div>
  );
}
