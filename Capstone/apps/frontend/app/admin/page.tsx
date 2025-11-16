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
    if (adminCommunities.length > 0 && !selectedCommunity) {
      setSelectedCommunity(adminCommunities[0]);
    }
  }, [adminCommunities, selectedCommunity]);

  if (!publicKey) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white border-8 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
          <div className="text-center">
            <div className="w-24 h-24 bg-cyan-400 border-4 border-black mx-auto mb-6 flex items-center justify-center text-5xl">
              🔐
            </div>
            <h2 className="text-3xl font-black text-black mb-4">WALLET NOT CONNECTED</h2>
            <p className="text-lg font-bold text-black mb-6">
              Please connect your wallet to access the admin panel
            </p>
            <div className="bg-cyan-100 border-4 border-black p-4">
              <p className="text-sm font-bold text-black">
                💡 ONLY COMMUNITY ADMINS CAN ACCESS THIS PANEL
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 border-8 border-black border-t-cyan-400 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl font-black text-black">LOADING YOUR COMMUNITIES...</p>
        </div>
      </div>
    );
  }

  if (adminCommunities.length === 0) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white border-8 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-400 border-4 border-black mx-auto mb-6 flex items-center justify-center text-5xl">
              🚫
            </div>
            <h2 className="text-3xl font-black text-black mb-4">NO ADMIN ACCESS</h2>
            <p className="text-lg font-bold text-black mb-8">
              You don't have admin privileges for any communities. Create a new community or ask an existing admin to transfer rights to you.
            </p>
            <a
              href="/communities"
              className="inline-flex items-center justify-center bg-cyan-400 text-black px-6 py-4 font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              BROWSE COMMUNITIES
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCommunity) {
    return (
      <div className="min-h-screen bg-yellow-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
            <h1 className="text-4xl sm:text-5xl font-black text-black mb-2">
              ADMIN DASHBOARD
            </h1>
            <p className="text-lg font-bold text-black">
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
    <div className="min-h-screen bg-yellow-50">
      <AdminHeader 
        community={selectedCommunity}
        onChangeCommunity={() => setSelectedCommunity(null)}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'events', label: 'EVENTS', icon: '📅' },
            { id: 'treasury', label: 'TREASURY', icon: '💰' },
            { id: 'community', label: 'COMMUNITY', icon: '⚙️' },
            { id: 'members', label: 'MEMBERS', icon: '👥' },
            { id: 'tokens', label: 'TOKENS', icon: '🪙' },
            { id: 'governance', label: 'GOVERNANCE', icon: '🗳️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-6 py-3 font-black whitespace-nowrap border-4 border-black transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-400 text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-black hover:bg-gray-100 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {activeTab === 'events' && <EventsManagement communityId={selectedCommunity.id} />}
          {activeTab === 'treasury' && <TreasuryManagement communityId={selectedCommunity.id} />}
          {activeTab === 'community' && <CommunityConfig community={selectedCommunity} />}
          {activeTab === 'members' && <MemberManagement communityId={selectedCommunity.id} />}
          {activeTab === 'tokens' && <TokenOperations communityId={selectedCommunity.id} />}
          {activeTab === 'governance' && <GovernanceOverview communityId={selectedCommunity.id} />}
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}