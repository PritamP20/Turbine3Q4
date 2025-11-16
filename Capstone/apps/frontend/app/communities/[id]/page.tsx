"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCommunity, useMembership, useCommunityStats, useInvalidateQueries } from "@/lib/hooks/useCommunityData";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import TabNavigation from "@/components/dashboard/TabNavigation";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import MembersDirectory from "@/components/dashboard/MembersDirectory";
import Leaderboard from "@/components/dashboard/Leaderboard";
import EventsSection from "@/components/dashboard/EventsSection";
import ChatSection from "@/components/dashboard/ChatSection";
import { MembershipNFTCard } from "@/components/MembershipNFT";
import { DashboardSectionErrorBoundary } from "@/components/ErrorBoundary";
import type { TabType } from "@/components/dashboard/TabNavigation";

export default function CommunityDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const { connected } = useWallet();
  
  const [activeTab, setActiveTab] = useState<TabType>('activity');
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const communityId = params.id as string;

  const { data: community, isLoading: communityLoading, error: communityError } = useCommunity(communityId);
  const { data: userMembership, isLoading: membershipLoading } = useMembership(communityId);
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useCommunityStats(communityId);
  const { invalidateAll } = useInvalidateQueries();

  const loading = communityLoading || membershipLoading || statsLoading;
  const error = communityError ? "Failed to load community data" : "";

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab') as TabType | null;
      
      const validTabs: TabType[] = ['activity', 'members', 'leaderboard', 'events', 'chat'];
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  useEffect(() => {
    if (!connected) {
      router.push("/communities");
    }
  }, [connected, router]);

  useEffect(() => {
    if (!loading && !userMembership && connected) {
      setRefreshError("You must be a member to view this dashboard");
      setTimeout(() => router.push("/communities"), 2000);
    }
  }, [userMembership, loading, connected, router]);

  const handleManualRefresh = async () => {
    setRefreshError(null);
    
    try {
      await invalidateAll(communityId);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error("Error during manual refresh:", error);
      setRefreshError("Failed to refresh dashboard. Please check your connection and try again.");
      setTimeout(() => setRefreshError(null), 5000);
    }
  };

  const handleBack = () => {
    router.push("/communities");
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white border-8 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-cyan-400 border-4 border-black mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-black mb-4">WALLET NOT CONNECTED</h2>
            <p className="text-lg font-bold text-black">
              Please connect your wallet to view the dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 border-8 border-black border-t-cyan-400 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl font-black text-black">LOADING DASHBOARD...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-red-400 border-8 border-black p-12 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-white border-4 border-black mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-black mb-4">{error}</h2>
            <p className="text-lg font-bold text-black">Redirecting to communities...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return null;
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Dashboard Header with Neo Brutalism styling */}
      <div className="bg-black border-b-8 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 bg-cyan-400 text-black px-4 sm:px-6 py-3 font-black text-sm sm:text-base border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">BACK</span>
            </button>
            <button 
              onClick={handleManualRefresh}
              disabled={statsLoading}
              className="flex items-center gap-2 bg-pink-400 text-black px-4 sm:px-6 py-3 font-black text-sm sm:text-base border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all active:shadow-none active:translate-x-[6px] active:translate-y-[6px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className={`w-5 h-5 ${statsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">REFRESH</span>
            </button>
          </div>

          <div className="bg-white border-4 border-black p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-3xl sm:text-5xl font-black text-black mb-2 break-words">{community.name}</h1>
            <p className="text-xl sm:text-2xl font-black text-black">${community.tokenSymbol}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
            <div className="bg-cyan-400 border-4 border-black p-3 sm:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs sm:text-sm font-black text-black mb-1">MEMBERS</div>
              <div className="text-2xl sm:text-4xl font-black text-black">{stats?.totalMembers || 0}</div>
            </div>
            <div className="bg-yellow-400 border-4 border-black p-3 sm:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs sm:text-sm font-black text-black mb-1">PROPOSALS</div>
              <div className="text-2xl sm:text-4xl font-black text-black">{stats?.totalProposals || 0}</div>
            </div>
            <div className="bg-pink-400 border-4 border-black p-3 sm:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs sm:text-sm font-black text-black mb-1">EVENTS</div>
              <div className="text-2xl sm:text-4xl font-black text-black">{stats?.totalEvents || 0}</div>
            </div>
            <div className="bg-lime-400 border-4 border-black p-3 sm:p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs sm:text-sm font-black text-black mb-1">TREASURY</div>
              <div className="text-2xl sm:text-4xl font-black text-black">${((stats?.treasuryBalance || 0) / 1000).toFixed(0)}K</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation with Neo Brutalism */}
      <div className="bg-white border-b-4 border-black sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex overflow-x-auto scrollbar-hide">
            {['activity', 'members', 'leaderboard', 'events', 'chat'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab as TabType)}
                className={`px-4 sm:px-8 py-4 font-black text-sm sm:text-base whitespace-nowrap border-r-4 border-black transition-all ${
                  activeTab === tab
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Refresh Error Message */}
      {refreshError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-red-400 border-4 border-black p-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <svg className="w-6 h-6 text-black shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm sm:text-base text-black font-bold truncate">{refreshError}</p>
            </div>
            <button
              onClick={() => setRefreshError(null)}
              className="text-black hover:bg-black hover:text-red-400 shrink-0 ml-2 p-1 border-2 border-black transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div 
              key={activeTab}
              className="bg-white border-4 border-black p-4 sm:p-6 lg:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
            >
              {activeTab === 'activity' && (
                <DashboardSectionErrorBoundary>
                  <ActivityFeed communityId={communityId} />
                </DashboardSectionErrorBoundary>
              )}
          
              {activeTab === 'members' && (
                <DashboardSectionErrorBoundary>
                  <MembersDirectory communityId={communityId} />
                </DashboardSectionErrorBoundary>
              )}
          
              {activeTab === 'leaderboard' && (
                <DashboardSectionErrorBoundary>
                  <Leaderboard communityId={communityId} />
                </DashboardSectionErrorBoundary>
              )}
          
              {activeTab === 'events' && (
                <DashboardSectionErrorBoundary>
                  <EventsSection communityId={communityId} />
                </DashboardSectionErrorBoundary>
              )}
          
              {activeTab === 'chat' && (
                <DashboardSectionErrorBoundary>
                  <ChatSection communityId={communityId} />
                </DashboardSectionErrorBoundary>
              )}
            </div>
          </div>

          {/* Sidebar - Profile & NFT */}
          <div className="lg:col-span-1 space-y-6">
            {/* Membership NFT Card */}
            <DashboardSectionErrorBoundary>
              <div className="bg-cyan-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <MembershipNFTCard communityId={communityId} />
              </div>
            </DashboardSectionErrorBoundary>

            {/* Member Stats Card */}
            {userMembership && (
              <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-xl sm:text-2xl font-black text-black mb-6 pb-3 border-b-4 border-black">
                  YOUR STATS
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 border-2 border-black">
                    <span className="font-bold text-black">REPUTATION</span>
                    <span className="font-black text-2xl text-black">
                      {userMembership.reputation || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-pink-50 border-2 border-black">
                    <span className="font-bold text-black">EVENTS ATTENDED</span>
                    <span className="font-black text-2xl text-black">
                      {(userMembership as any).totalEventsAttended || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-lime-50 border-2 border-black">
                    <span className="font-bold text-black">CONNECTIONS</span>
                    <span className="font-black text-2xl text-black">
                      {(userMembership as any).totalConnections || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
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