// Community Dashboard Data Models

export interface CommunityStats {
  totalMembers: number;
  totalProposals: number;
  totalEvents: number;
  treasuryBalance: number;
}

export interface Member {
  publicKey: string;
  wallet: string;
  name: string;
  metadataUri: string;
  joinedAt: number;
  reputation: number;
  activityCount: number;
}

export interface Activity {
  id: string;
  type: 'member_joined' | 'proposal_created' | 'vote_cast' | 
        'event_created' | 'token_transfer' | 'treasury_deposit';
  actor: string; // wallet address
  actorName?: string;
  timestamp: number;
  details: ActivityDetails;
}

export type ActivityDetails = 
  | { type: 'member_joined'; memberName: string }
  | { type: 'proposal_created'; proposalTitle: string; proposalId: string }
  | { type: 'vote_cast'; proposalId: string; vote: 'yes' | 'no' }
  | { type: 'event_created'; eventName: string; eventId: string }
  | { type: 'token_transfer'; amount: number; recipient: string }
  | { type: 'treasury_deposit'; amount: number };

export interface LeaderboardEntry {
  rank: number;
  member: Member;
  reputation: number;
  activityCount: number;
  rewardEligible: boolean;
  potentialReward?: number;
}

export interface CommunityEvent {
  publicKey: string;
  eventId: string;
  name: string;
  description: string;
  location: string;
  startTime: number;
  maxAttendees: number;
  currentAttendees: number;
  organizer: string;
  hasRSVPd: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderName?: string;
  message: string;
  timestamp: number;
}

export interface CommunityDashboardData {
  community: {
    name: string;
    tokenSymbol: string;
    publicKey: string;
  };
  members: Member[];
  activities: Activity[];
  events: CommunityEvent[];
  leaderboard: LeaderboardEntry[];
  chatMessages: ChatMessage[];
  userMembership: Member;
  stats: CommunityStats;
}

export type TabType = 'activity' | 'members' | 'leaderboard' | 'events' | 'chat';
