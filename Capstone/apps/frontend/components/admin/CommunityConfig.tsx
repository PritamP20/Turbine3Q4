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
    // TODO: Integrate with contract
    console.log('Updating config for community:', community.id, config);
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Community Configuration</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
        >
          {isEditing ? 'Cancel' : 'Edit Config'}
        </button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        {/* Current Configuration */}
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Basic Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Community Name
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={config.communityName}
                onChange={(e) => setConfig({ ...config, communityName: e.target.value })}
                className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Token Symbol
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={config.tokenSymbol}
                onChange={(e) => setConfig({ ...config, tokenSymbol: e.target.value })}
                className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Governance Threshold (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                disabled={!isEditing}
                value={config.governanceThreshold}
                onChange={(e) => setConfig({ ...config, governanceThreshold: parseInt(e.target.value) })}
                className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50 disabled:opacity-50"
              />
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                Percentage of votes required to pass proposals
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Transfer Fee (basis points)
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                disabled={!isEditing}
                value={config.transferFeeBps}
                onChange={(e) => setConfig({ ...config, transferFeeBps: parseInt(e.target.value) })}
                className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50 disabled:opacity-50"
              />
              <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
                100 bps = 1% (current: {(config.transferFeeBps / 100).toFixed(2)}%)
              </p>
            </div>
          </div>
        </div>

        {/* Admin Transfer */}
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700">
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Admin Management</h3>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Transfer Admin Rights
            </label>
            <input
              type="text"
              disabled={!isEditing}
              value={config.newAdmin}
              onChange={(e) => setConfig({ ...config, newAdmin: e.target.value })}
              className="w-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2 text-zinc-900 dark:text-zinc-50 font-mono text-sm disabled:opacity-50"
              placeholder="New admin wallet address..."
            />
            <p className="text-yellow-600 dark:text-yellow-500 text-xs mt-2">
              ⚠️ Warning: Transferring admin rights is permanent and cannot be undone
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-50 px-6 py-2 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </form>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Total Members</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{community.memberCount}</p>
        </div>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Active Proposals</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">0</p>
        </div>
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-1">Total Events</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">0</p>
        </div>
      </div>
    </div>
  );
}
