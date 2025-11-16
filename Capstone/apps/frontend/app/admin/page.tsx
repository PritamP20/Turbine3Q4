'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  CommunitySelector,
  AdminHeader,
  EventsManagement,
  TreasuryManagement,
  CommunityConfig,
  MemberManagement,
  TokenOperations,
  GovernanceOverview,
} from '@/components/admin';
import { useAdminCommunities, type Community } from '@/hooks/useAdminCommunities';

type AdminTab = 'events' | 'treasury' | 'community' | 'members' | 'tokens' | 'governance';

export default function AdminPage() {
  const { publicKey } = useWallet();
  const { communities: adminCommunities, loading } = useAdminCommunities();
  const [activeTab, setActiveTab] = useState<AdminTab>('events');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

  useEffect(() => {
    // Auto-select first community if available
    if (adminCommunities.length > 0 && !selectedCommunity) {
      setSelectedCommunity(adminCommunities[0]);
    }
  }, [adminCommunities, selectedCommunity]);

  if (!publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl">
            🔐
          </div>
          <h2 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">Connect Your Wallet</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            Please connect your wallet to access the admin panel and manage your communities
          </p>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 Only community admins can access this panel
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">Loading your communities...</p>
        </div>
      </div>
    );
  }

  if (adminCommunities.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center max-w-lg mx-auto px-4">
          <div className="w-20 h-20 bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-800 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-6">
            🚫
          </div>
          <h2 className="text-3xl font-bold mb-4 text-zinc-900 dark:text-zinc-50">No Admin Access</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            You don't have admin privileges for any communities. Create a new community or ask an existing admin to transfer rights to you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/communities"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Browse Communities
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCommunity) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Select a community to manage
            </p>
          </div>
          <CommunitySelector
            communities={adminCommunities}
            onSelect={setSelectedCommunity}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AdminHeader 
        community={selectedCommunity}
        onChangeCommunity={() => setSelectedCommunity(null)}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'events', label: 'Events', icon: '📅' },
            { id: 'treasury', label: 'Treasury', icon: '💰' },
            { id: 'community', label: 'Community', icon: '⚙️' },
            { id: 'members', label: 'Members', icon: '👥' },
            { id: 'tokens', label: 'Tokens', icon: '🪙' },
            { id: 'governance', label: 'Governance', icon: '🗳️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          {activeTab === 'events' && <EventsManagement communityId={selectedCommunity.id} />}
          {activeTab === 'treasury' && <TreasuryManagement communityId={selectedCommunity.id} />}
          {activeTab === 'community' && <CommunityConfig community={selectedCommunity} />}
          {activeTab === 'members' && <MemberManagement communityId={selectedCommunity.id} />}
          {activeTab === 'tokens' && <TokenOperations communityId={selectedCommunity.id} />}
          {activeTab === 'governance' && <GovernanceOverview communityId={selectedCommunity.id} />}
        </div>
      </div>
    </div>
  );
}
