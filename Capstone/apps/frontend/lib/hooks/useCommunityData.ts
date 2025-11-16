import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getProgram, getConnection } from "@/lib/anchor-setup";
import type { Member, Activity, 
CommunityStats } from "@/types/dashboard";

interface Community {
  publicKey: string;
  name: string;
  tokenSymbol: string;
  governanceThreshold: number;
  admin: string;
  memberCount: number;
  transferFeeBps: number;
}

// Query keys for cache management
export const queryKeys = {
  community: (id: string) => ["community", id] as const,
  member: (communityId: string, wallet: string) => ["member", communityId, wallet] as const,
  members: (communityId: string) => ["members", communityId] as const,
  activities: (communityId: string) => ["activities", communityId] as const,
  events: (communityId: string) => ["events", communityId] as const,
  proposals: (communityId: string) => ["proposals", communityId] as const,
  stats: (communityId: string) => ["stats", communityId] as const,
  chatMessages: (communityId: string) => ["chatMessages", communityId] as const,
};

// Fetch community data
export function useCommunity(communityId: string) {
  const wallet = useAnchorWallet();

  return useQuery({
    queryKey: queryKeys.community(communityId),
    queryFn: async (): Promise<Community> => {
      if (!wallet) throw new Error("Wallet not connected");

      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPubkey = new PublicKey(communityId);
      const communityAccount = await (program.account as any).community.fetch(communityPubkey);

      return {
        publicKey: communityPubkey.toString(),
        name: communityAccount.name,
        tokenSymbol: communityAccount.tokenSymbol,
        governanceThreshold: communityAccount.governanceThreshold,
        admin: communityAccount.admin.toString(),
        memberCount: communityAccount.memberCount,
        transferFeeBps: communityAccount.transferFeeBps,
      };
    },
    enabled: !!wallet && !!communityId,
    staleTime: 60 * 1000, // 1 minute - community data changes infrequently
  });
}

// Check user membership
export function useMembership(communityId: string) {
  const wallet = useAnchorWallet();

  return useQuery({
    queryKey: wallet ? queryKeys.member(communityId, wallet.publicKey.toString()) : ["member-disabled"],
    queryFn: async (): Promise<Member | null> => {
      if (!wallet) return null;

      try {
        const connection = getConnection();
        const provider = new AnchorProvider(connection, wallet, {});
        const program = getProgram(provider);

        const communityPda = new PublicKey(communityId);
        const [memberPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("member"), communityPda.toBuffer(), wallet.publicKey.toBuffer()],
          program.programId
        );

        const memberAccount = await (program.account as any).member.fetch(memberPda);

        return {
          publicKey: memberPda.toString(),
          wallet: memberAccount.wallet.toString(),
          name: memberAccount.name,
          metadataUri: memberAccount.metadataUri,
          joinedAt: memberAccount.joinedAt.toNumber(),
          reputation: memberAccount.reputation,
          activityCount: 0,
        };
      } catch (error) {
        console.error("Error checking membership:", error);
        return null;
      }
    },
    enabled: !!wallet && !!communityId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Fetch all community members
export function useMembers(communityId: string) {
  const wallet = useAnchorWallet();

  return useQuery({
    queryKey: queryKeys.members(communityId),
    queryFn: async (): Promise<Member[]> => {
      if (!wallet) throw new Error("Wallet not connected");

      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPubkey = new PublicKey(communityId);

      const memberAccounts = await (program.account as any).member.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityPubkey.toBase58(),
          },
        },
      ]);

      return memberAccounts.map((account: any) => ({
        publicKey: account.publicKey.toString(),
        wallet: account.account.wallet.toString(),
        name: account.account.name,
        metadataUri: account.account.metadataUri,
        joinedAt: account.account.joinedAt.toNumber(),
        reputation: account.account.reputation,
        activityCount: 0,
      }));
    },
    enabled: !!wallet && !!communityId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

// Fetch community activities
export function useActivities(communityId: string) {
  const wallet = useAnchorWallet();

  return useQuery({
    queryKey: queryKeys.activities(communityId),
    queryFn: async (): Promise<Activity[]> => {
      if (!wallet) throw new Error("Wallet not connected");

      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);
      const communityPubkey = new PublicKey(communityId);

      const allActivities: Activity[] = [];

      // Fetch members
      const members = await (program.account as any).member.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityPubkey.toBase58(),
          },
        },
      ]);

      for (const member of members) {
        allActivities.push({
          id: `member-${member.publicKey.toString()}`,
          type: "member_joined",
          actor: member.account.wallet.toString(),
          actorName: member.account.name,
          timestamp: member.account.joinedAt.toNumber(),
          details: {
            type: "member_joined",
            memberName: member.account.name,
          },
        });
      }

      // Fetch proposals
      const proposals = await (program.account as any).proposal.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityPubkey.toBase58(),
          },
        },
      ]);

      for (const proposal of proposals) {
        allActivities.push({
          id: `proposal-${proposal.publicKey.toString()}`,
          type: "proposal_created",
          actor: proposal.account.proposer.toString(),
          timestamp: proposal.account.createdAt.toNumber(),
          details: {
            type: "proposal_created",
            proposalTitle: proposal.account.title,
            proposalId: proposal.publicKey.toString(),
          },
        });
      }

      // Fetch votes
      for (const proposal of proposals) {
        const votes = await (program.account as any).vote.all([
          {
            memcmp: {
              offset: 8,
              bytes: proposal.publicKey.toBase58(),
            },
          },
        ]);

        for (const vote of votes) {
          const voteType = Object.keys(vote.account.voteType)[0].toLowerCase() as "yes" | "no";
          allActivities.push({
            id: `vote-${vote.publicKey.toString()}`,
            type: "vote_cast",
            actor: vote.account.voter.toString(),
            timestamp: vote.account.votedAt.toNumber(),
            details: {
              type: "vote_cast",
              proposalId: proposal.publicKey.toString(),
              vote: voteType,
            },
          });
        }
      }

      // Fetch events
      const events = await (program.account as any).event.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityPubkey.toBase58(),
          },
        },
      ]);

      for (const event of events) {
        allActivities.push({
          id: `event-${event.publicKey.toString()}`,
          type: "event_created",
          actor: event.account.organizer.toString(),
          timestamp: event.account.createdAt.toNumber(),
          details: {
            type: "event_created",
            eventName: event.account.name,
            eventId: event.publicKey.toString(),
          },
        });
      }

      // Sort by timestamp (newest first)
      allActivities.sort((a, b) => b.timestamp - a.timestamp);

      return allActivities;
    },
    enabled: !!wallet && !!communityId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

// Fetch community statistics
export function useCommunityStats(communityId: string) {
  const wallet = useAnchorWallet();

  return useQuery({
    queryKey: queryKeys.stats(communityId),
    queryFn: async (): Promise<CommunityStats> => {
      if (!wallet) throw new Error("Wallet not connected");

      const connection = getConnection();
      const provider = new AnchorProvider(connection, wallet, {});
      const program = getProgram(provider);

      const communityPda = new PublicKey(communityId);

      // Fetch fresh community data
      const communityAccount = await (program.account as any).community.fetch(communityPda);

      // Fetch proposals
      const proposals = await (program.account as any).proposal.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityPda.toBase58(),
          },
        },
      ]);

      // Fetch events
      const events = await (program.account as any).event.all([
        {
          memcmp: {
            offset: 8,
            bytes: communityPda.toBase58(),
          },
        },
      ]);

      // Fetch treasury balance
      const [treasuryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury"), communityPda.toBuffer()],
        program.programId
      );

      const treasuryBalance = await connection.getBalance(treasuryPda);

      return {
        totalMembers: communityAccount.memberCount,
        totalProposals: proposals.length,
        totalEvents: events.length,
        treasuryBalance: treasuryBalance / 1e9,
      };
    },
    enabled: !!wallet && !!communityId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

// Mutation for invalidating queries after actions
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateCommunity: (communityId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.community(communityId) });
    },
    invalidateMembers: (communityId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(communityId) });
    },
    invalidateActivities: (communityId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities(communityId) });
    },
    invalidateStats: (communityId: string) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stats(communityId) });
    },
    invalidateAll: (communityId: string) => {
      queryClient.invalidateQueries({ queryKey: ["community", communityId] });
      queryClient.invalidateQueries({ queryKey: ["members", communityId] });
      queryClient.invalidateQueries({ queryKey: ["activities", communityId] });
      queryClient.invalidateQueries({ queryKey: ["stats", communityId] });
      queryClient.invalidateQueries({ queryKey: ["events", communityId] });
      queryClient.invalidateQueries({ queryKey: ["chatMessages", communityId] });
    },
  };
}
