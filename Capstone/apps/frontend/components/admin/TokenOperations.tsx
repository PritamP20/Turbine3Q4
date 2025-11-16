// TokenOperations.tsx - FULL VERSION with Neo Brutalism
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
    console.log('Transferring tokens for community:', communityId, transferData);
    setActiveOperation(null);
    setTransferData({ recipient: '', amount: '', memo: '' });
  };

  const handleBatchTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Batch transfer for community:', communityId, batchTransfers);
    setActiveOperation(null);
    setBatchTransfers([{ recipient: '', amount: '' }]);
  };

  const handleBurn = async (e: React.FormEvent) => {
    e.preventDefault();
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
          <h2 className="text-3xl font-black text-black mb-2">TOKEN OPERATIONS</h2>
          <p className="text-lg font-bold text-black">
            Manage your community's custom SPL token
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-cyan-100 border-4 border-black p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-start gap-4">
          <span className="text-4xl">ℹ️</span>
          <div>
            <h3 className="font-black text-black text-lg mb-2">
              COMMUNITY TOKEN SYSTEM
            </h3>
            <p className="font-bold text-black">
              Each community has its own custom SPL token created automatically. Use these operations to manage token distribution, rewards, and supply.
            </p>
          </div>
        </div>
      </div>

      {/* Operation Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setActiveOperation('transfer')}
          className="bg-cyan-400 border-4 border-black p-6 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
        >
          <div className="text-5xl mb-3">💸</div>
          <h3 className="text-xl font-black text-black mb-2">TRANSFER TOKENS</h3>
          <p className="text-black font-bold text-sm">Send tokens to a single recipient</p>
        </button>

        <button
          onClick={() => setActiveOperation('batch')}
          className="bg-yellow-400 border-4 border-black p-6 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
        >
          <div className="text-5xl mb-3">📦</div>
          <h3 className="text-xl font-black text-black mb-2">BATCH TRANSFER</h3>
          <p className="text-black font-bold text-sm">Send tokens to multiple recipients</p>
        </button>

        <button
          onClick={() => setActiveOperation('burn')}
          className="bg-red-400 border-4 border-black p-6 text-left shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
        >
          <div className="text-5xl mb-3">🔥</div>
          <h3 className="text-xl font-black text-black mb-2">BURN TOKENS</h3>
          <p className="text-black font-bold text-sm">Permanently remove tokens from supply</p>
        </button>
      </div>

      {/* Single Transfer Form */}
      {activeOperation === 'transfer' && (
        <form onSubmit={handleTransfer} className="bg-cyan-50 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-black">
            <h3 className="text-2xl font-black text-black">TRANSFER TOKENS</h3>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="text-black hover:bg-black hover:text-cyan-400 p-2 border-2 border-black font-black text-xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Recipient Address *
              </label>
              <input
                type="text"
                required
                value={transferData.recipient}
                onChange={(e) => setTransferData({ ...transferData, recipient: e.target.value })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-mono font-bold text-sm focus:outline-none focus:border-cyan-400"
                placeholder="Solana address..."
              />
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Amount *
              </label>
              <input
                type="number"
                required
                value={transferData.amount}
                onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-cyan-400"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Memo (optional)
              </label>
              <input
                type="text"
                value={transferData.memo}
                onChange={(e) => setTransferData({ ...transferData, memo: e.target.value })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-cyan-400"
                placeholder="Transfer note..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-cyan-400 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              TRANSFER
            </button>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="bg-gray-200 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* Batch Transfer Form */}
      {activeOperation === 'batch' && (
        <form onSubmit={handleBatchTransfer} className="bg-yellow-50 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-black">
            <h3 className="text-2xl font-black text-black">BATCH TRANSFER</h3>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="text-black hover:bg-black hover:text-yellow-400 p-2 border-2 border-black font-black text-xl"
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
                    className="bg-white border-4 border-black px-4 py-3 text-black font-mono font-bold text-sm focus:outline-none focus:border-yellow-400"
                    placeholder="Recipient address..."
                  />
                  <input
                    type="number"
                    required
                    value={transfer.amount}
                    onChange={(e) => updateBatchRecipient(index, 'amount', e.target.value)}
                    className="bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-yellow-400"
                    placeholder="Amount"
                  />
                </div>
                {batchTransfers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBatchRecipient(index)}
                    className="bg-red-400 text-black px-4 py-3 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
            className="mt-4 text-black font-black text-sm bg-yellow-200 border-2 border-black px-4 py-2 hover:bg-yellow-300 transition-colors"
          >
            + ADD RECIPIENT
          </button>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-yellow-400 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              BATCH TRANSFER
            </button>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="bg-gray-200 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* Burn Form */}
      {activeOperation === 'burn' && (
        <form onSubmit={handleBurn} className="bg-red-50 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center mb-6 pb-4 border-b-4 border-black">
            <h3 className="text-2xl font-black text-black">BURN TOKENS</h3>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="text-black hover:bg-black hover:text-red-400 p-2 border-2 border-black font-black text-xl"
            >
              ✕
            </button>
          </div>

          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase">
              Amount to Burn *
            </label>
            <input
              type="number"
              required
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
              className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold focus:outline-none focus:border-red-400"
              placeholder="0"
            />
            <p className="text-black text-xs mt-3 font-black bg-yellow-300 border-2 border-black p-3">
              ⚠️ WARNING: BURNED TOKENS ARE PERMANENTLY REMOVED AND CANNOT BE RECOVERED
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="bg-red-400 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              BURN TOKENS
            </button>
            <button
              type="button"
              onClick={() => setActiveOperation(null)}
              className="bg-gray-200 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              CANCEL
            </button>
          </div>
        </form>
      )}

      {/* Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-cyan-400 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL SUPPLY</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
        <div className="bg-yellow-400 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">CIRCULATING SUPPLY</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
        <div className="bg-pink-400 border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL BURNED</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
      </div>
    </div>
  );
}