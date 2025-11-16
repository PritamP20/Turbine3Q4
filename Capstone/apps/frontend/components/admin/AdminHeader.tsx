'use client';

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

interface AdminHeaderProps {
  community: Community;
  onChangeCommunity: () => void;
}

export function AdminHeader({ community, onChangeCommunity }: AdminHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl font-bold text-white">
                {community.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{community.name}</h1>
                <p className="text-blue-100 text-sm">Admin Dashboard</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <div className="text-xs text-blue-100 mb-0.5">Community Token</div>
              <div className="text-white font-bold flex items-center gap-1">
                <span className="text-yellow-300">🪙</span>
                ${community.tokenSymbol}
              </div>
            </div>
            {community.memberCount !== undefined && (
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <div className="text-xs text-blue-100 mb-0.5">Members</div>
                <div className="text-white font-bold">{community.memberCount}</div>
              </div>
            )}
            {community.governanceThreshold !== undefined && (
              <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <div className="text-xs text-blue-100 mb-0.5">Threshold</div>
                <div className="text-white font-bold">{community.governanceThreshold}%</div>
              </div>
            )}
            <button
              onClick={onChangeCommunity}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all text-sm font-medium border border-white/20 hover:border-white/40"
            >
              Switch Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
