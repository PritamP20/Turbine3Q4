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

interface CommunitySelectorProps {
  communities: Community[];
  onSelect: (community: Community) => void;
}

export function CommunitySelector({ communities, onSelect }: CommunitySelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {communities.map((community) => (
        <button
          key={community.id}
          onClick={() => onSelect(community)}
          className="group bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl p-6 text-left transition-all hover:scale-[1.02] border-2 border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              {community.name.charAt(0).toUpperCase()}
            </div>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
              Admin
            </span>
          </div>
          
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {community.name}
          </h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Token:</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">${community.tokenSymbol}</span>
            </div>
            {community.memberCount !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Members:</span>
                <span className="text-zinc-900 dark:text-zinc-50 font-semibold">{community.memberCount}</span>
              </div>
            )}
            {community.governanceThreshold !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Threshold:</span>
                <span className="text-zinc-900 dark:text-zinc-50 font-semibold">{community.governanceThreshold}%</span>
              </div>
            )}
          </div>
          
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-500 font-mono truncate">
              {community.address}
            </p>
          </div>
          
          <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
            <span>Manage Community</span>
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
}
