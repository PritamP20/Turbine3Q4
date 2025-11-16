// AdminHeader.tsx
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
    <div className="bg-black border-b-8 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-16 h-16 bg-cyan-400 border-4 border-black flex items-center justify-center text-3xl font-black text-black">
                {community.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white">{community.name}</h1>
                <p className="text-lg font-bold text-cyan-400">ADMIN DASHBOARD</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-cyan-400 border-4 border-black px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-xs font-black text-black mb-0.5">TOKEN</div>
              <div className="text-black font-black flex items-center gap-1">
                <span>🪙</span>
                ${community.tokenSymbol}
              </div>
            </div>
            {community.memberCount !== undefined && (
              <div className="bg-yellow-400 border-4 border-black px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs font-black text-black mb-0.5">MEMBERS</div>
                <div className="text-black font-black">{community.memberCount}</div>
              </div>
            )}
            {community.governanceThreshold !== undefined && (
              <div className="bg-pink-400 border-4 border-black px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="text-xs font-black text-black mb-0.5">THRESHOLD</div>
                <div className="text-black font-black">{community.governanceThreshold}%</div>
              </div>
            )}
            <button
              onClick={onChangeCommunity}
              className="bg-lime-400 text-black px-6 py-3 font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] transition-all whitespace-nowrap"
            >
              SWITCH
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// CommunitySelector.tsx
interface CommunitySelectorProps {
  communities: Community[];
  onSelect: (community: Community) => void;
}

export function CommunitySelector({ communities, onSelect }: CommunitySelectorProps) {
  const cardColors = ['bg-cyan-400', 'bg-yellow-400', 'bg-pink-400', 'bg-lime-400'];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {communities.map((community, index) => {
        const bgColor = cardColors[index % cardColors.length];
        
        return (
          <button
            key={community.id}
            onClick={() => onSelect(community)}
            className="group bg-white border-4 border-black text-left transition-all hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className={`${bgColor} border-b-4 border-black p-6 flex items-start justify-between`}>
              <div className="w-16 h-16 bg-black border-4 border-black flex items-center justify-center text-3xl font-black text-white">
                {community.name.charAt(0).toUpperCase()}
              </div>
              <span className="bg-black text-lime-400 px-3 py-1 font-black text-xs border-2 border-black">
                ADMIN
              </span>
            </div>
            
            <div className="p-6">
              <h3 className="text-2xl font-black text-black mb-4 group-hover:text-cyan-600 transition-colors break-words">
                {community.name}
              </h3>
              
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 border-2 border-black">
                  <span className="font-black text-black text-sm">TOKEN</span>
                  <span className="text-cyan-600 font-black text-lg">${community.tokenSymbol}</span>
                </div>
                {community.memberCount !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 border-2 border-black">
                    <span className="font-black text-black text-sm">MEMBERS</span>
                    <span className="text-black font-black text-lg">{community.memberCount}</span>
                  </div>
                )}
                {community.governanceThreshold !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 border-2 border-black">
                    <span className="font-black text-black text-sm">THRESHOLD</span>
                    <span className="text-black font-black text-lg">{community.governanceThreshold}%</span>
                  </div>
                )}
              </div>
              
              <div className="pt-3 border-t-4 border-black mb-4">
                <p className="text-xs font-mono font-bold text-black truncate bg-gray-100 p-2 border-2 border-black">
                  {community.address}
                </p>
              </div>
              
              <div className="flex items-center text-black text-sm font-black">
                <span>MANAGE COMMUNITY</span>
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}