export interface Community {
  id: string;
  name: string;
  address: string;
  tokenSymbol: string;
  isAdmin: boolean;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  maxAttendees?: number;
  tokenReward?: number;
  attendees: number;
  status: 'upcoming' | 'active' | 'closed';
}

export interface Member {
  id: string;
  address: string;
  name: string;
  joinedAt: Date;
  tokenBalance: number;
  reputation: number;
  nfcCards: number;
  isActive: boolean;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  createdAt: Date;
  endsAt: Date;
  type: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  timestamp: Date;
  description: string;
  txHash: string;
}

export type AdminTab = 'events' | 'treasury' | 'community' | 'members' | 'tokens' | 'governance';
