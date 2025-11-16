// CommunityConfig.tsx
'use client';

import { useState } from 'react';

interface Community {
  id: string;
  name: string;
  address: string;
  tokenSymbol: string;
  isAdmin: boolean;
  memberCount: number;
  governanceThreshold: number;
  transferFeeBps: number;
}

interface CommunityConfigProps {
  community: Community;
}

export function CommunityConfig({ community }: CommunityConfigProps) {
  const [config, setConfig] = useState({
    communityName: community.name,
    tokenSymbol: community.tokenSymbol,
    governanceThreshold: community.governanceThreshold,
    transferFeeBps: community.transferFeeBps,
    newAdmin: '',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Updating config for community:', community.id, config);
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-black text-black">COMMUNITY CONFIGURATION</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-cyan-400 text-black px-6 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
        >
          {isEditing ? '✕ CANCEL' : '✎ EDIT CONFIG'}
        </button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Basic Settings */}
        <div className="bg-yellow-50 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-2xl font-black text-black mb-6 pb-3 border-b-4 border-black">BASIC SETTINGS</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Community Name
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={config.communityName}
                onChange={(e) => setConfig({ ...config, communityName: e.target.value })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold disabled:opacity-50 disabled:bg-gray-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Token Symbol
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={config.tokenSymbol}
                onChange={(e) => setConfig({ ...config, tokenSymbol: e.target.value })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold disabled:opacity-50 disabled:bg-gray-100 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Governance Threshold (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                disabled={!isEditing}
                value={config.governanceThreshold}
                onChange={(e) => setConfig({ ...config, governanceThreshold: parseInt(e.target.value) })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold disabled:opacity-50 disabled:bg-gray-100 focus:outline-none focus:border-cyan-400"
              />
              <p className="text-black text-xs mt-2 font-bold bg-cyan-100 border-2 border-black p-2">
                Percentage of votes required to pass proposals
              </p>
            </div>

            <div>
              <label className="block text-sm font-black text-black mb-2 uppercase">
                Transfer Fee (basis points)
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                disabled={!isEditing}
                value={config.transferFeeBps}
                onChange={(e) => setConfig({ ...config, transferFeeBps: parseInt(e.target.value) })}
                className="w-full bg-white border-4 border-black px-4 py-3 text-black font-bold disabled:opacity-50 disabled:bg-gray-100 focus:outline-none focus:border-cyan-400"
              />
              <p className="text-black text-xs mt-2 font-bold bg-cyan-100 border-2 border-black p-2">
                100 bps = 1% (current: {(config.transferFeeBps / 100).toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Admin Transfer */}
        <div className="bg-red-50 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="text-2xl font-black text-black mb-6 pb-3 border-b-4 border-black">ADMIN MANAGEMENT</h3>
          
          <div>
            <label className="block text-sm font-black text-black mb-2 uppercase">
              Transfer Admin Rights
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={config.newAdmin}
              onChange={(e) => setConfig({ ...config, newAdmin: e.target.value })}
              className="w-full bg-white border-4 border-black px-4 py-3 text-black font-mono text-sm disabled:opacity-50 disabled:bg-gray-100 focus:outline-none focus:border-red-400"
              placeholder="New admin wallet address..."
            />
            <p className="text-black text-xs mt-2 font-black bg-yellow-300 border-2 border-black p-3">
              ⚠️ WARNING: TRANSFERRING ADMIN RIGHTS IS PERMANENT AND CANNOT BE UNDONE
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-cyan-400 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              SAVE CHANGES
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-gray-200 text-black px-8 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              CANCEL
            </button>
          </div>
        )}
      </form>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-cyan-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL MEMBERS</p>
          <p className="text-3xl font-black text-black">{community.memberCount}</p>
        </div>
        <div className="bg-yellow-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">ACTIVE PROPOSALS</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
        <div className="bg-pink-400 border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-black text-sm font-black mb-1">TOTAL EVENTS</p>
          <p className="text-3xl font-black text-black">0</p>
        </div>
      </div>
    </div>
  );
}