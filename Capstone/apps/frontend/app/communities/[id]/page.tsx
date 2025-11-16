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

  // Extract community ID from URL params
  const communityId = params.id as string;

  // Use React Query hooks for data fetching
  const { data: community, isLoading: communityLoading, error: communityError } = useCommunity(communityId);
  const { data: userMembership, isLoading: membershipLoading } = useMembership(communityId);
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useCommunityStats(communityId);
  const { invalidateAll } = useInvalidateQueries();

  const loading = communityLoading || membershipLoading || statsLoading;
  const error = communityError ? "Failed to load community data" : "";

  // Initialize tab from URL query params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get('tab') as TabType | null;
      
      // Validate tab parameter
      const validTabs: TabType[] = ['activity', 'members', 'leaderboard', 'events', 'chat'];
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // Redirect if not connected
  useEffect(() => {
    if (!connected) {
      router.push("/communities");
    }
  }, [connected, router]);

  // Check membership and redirect if not a member
  useEffect(() => {
    if (!loading && !userMembership && connected) {
      setRefreshError("You must be a member to view this dashboard");
      setTimeout(() => router.push("/communities"), 2000);
    }
  }, [userMembership, loading, connected, router]);

  const handleManualRefresh = async () => {
    setRefreshError(null);
    
    try {
      // Invalidate all queries to trigger refetch
      await invalidateAll(communityId);
      
      // Show success feedback briefly
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error("Error during manual refresh:", error);
      setRefreshError("Failed to refresh dashboard. Please check your connection and try again.");
      
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setRefreshError(null), 5000);
    }
  };

  const handleBack = () => {
    router.push("/communities");
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    // Update URL query params without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url.toString());
  };

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-12 border border-zinc-200 dark:border-zinc-800">
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Please connect your wallet to view the dashboard
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 dark:bg-red-950 rounded-lg p-12 border border-red-200 dark:border-red-800">
          <p className="text-xl text-red-900 dark:text-red-100 mb-4">{error}</p>
          <p className="text-red-700 dark:text-red-300">Redirecting to communities...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Dashboard Header */}
      <DashboardHeader
        community={{
          name: community.name,
          tokenSymbol: community.tokenSymbol,
        }}
        stats={stats || {
          totalMembers: 0,
          totalProposals: 0,
          totalEvents: 0,
          treasuryBalance: 0,
        }}
        onBack={handleBack}
        onRefresh={handleManualRefresh}
        isRefreshing={statsLoading}
      />

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Refresh Error Message */}
      {refreshError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3 sm:p-4 border border-red-200 dark:border-red-800 flex items-center justify-between animate-slideDown">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm sm:text-base text-red-900 dark:text-red-100 font-medium truncate">{refreshError}</p>
            </div>
            <button
              onClick={() => setRefreshError(null)}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 shrink-0 ml-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
              className="bg-white dark:bg-zinc-900 rounded-lg p-4 sm:p-6 lg:p-8 border border-zinc-200 dark:border-zinc-800 animate-fadeIn"
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
              <MembershipNFTCard communityId={communityId} />
            </DashboardSectionErrorBoundary>

            {/* Member Stats Card */}
            {userMembership && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                  Your Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Reputation</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {userMembership.reputation || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Events Attended</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {(userMembership as any).totalEventsAttended || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">Connections</span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {(userMembership as any).totalConnections || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
