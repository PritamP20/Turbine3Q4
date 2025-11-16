import { PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { getProgram } from "./anchor-setup";
import type { Member } from "@/types/dashboard";

/**
 * Reward calculation configuration
 */
export const REWARD_CONFIG = {
  // Reward amounts for each rank (in tokens)
  RANK_1_REWARD: 100,
  RANK_2_REWARD: 50,
  RANK_3_REWARD: 25,
  
  // Minimum reputation required to be eligible
  MIN_REPUTATION: 10,
  
  // Reward period in seconds (e.g., 7 days)
  REWARD_PERIOD: 7 * 24 * 60 * 60,
};

/**
 * Calculate reward amount based on rank
 */
export function calculateRewardAmount(rank: number): number {
  if (rank === 1) return REWARD_CONFIG.RANK_1_REWARD;
  if (rank === 2) return REWARD_CONFIG.RANK_2_REWARD;
  if (rank === 3) return REWARD_CONFIG.RANK_3_REWARD;
  return 0;
}

/**
 * Check if a member is eligible for rewards
 */
export function isEligibleForReward(rank: number, reputation: number): boolean {
  return rank <= 3 && reputation >= REWARD_CONFIG.MIN_REPUTATION;
}

/**
 * Get the current reward period timestamp
 * Returns the start of the current week (Monday 00:00:00 UTC)
 */
export function getCurrentRewardPeriod(): number {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysToMonday = (dayOfWeek + 6) % 7; // Days since last Monday
  
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - daysToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  
  return Math.floor(monday.getTime() / 1000);
}

/**
 * Check if treasury has sufficient balance for reward
 */
export async function checkTreasuryBalance(
  provider: AnchorProvider,
  communityId: string,
  rewardAmount: number
): Promise<{ sufficient: boolean; balance: number }> {
  try {
    const program = getProgram(provider);
    const communityPubkey = new PublicKey(communityId);
    
    // Get community account to find token mint
    const community = await (program.account as any).community.fetch(communityPubkey);
    const tokenMint = community.tokenMint;
    
    // Derive treasury PDA
    const [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), communityPubkey.toBuffer()],
      program.programId
    );
    
    // Get treasury token account
    const treasuryTokenAccount = await provider.connection.getTokenAccountBalance(
      await getAssociatedTokenAddress(tokenMint, treasuryPda, true)
    );
    
    const balance = treasuryTokenAccount.value.uiAmount || 0;
    const sufficient = balance >= rewardAmount;
    
    return { sufficient, balance };
  } catch (error) {
    console.error("Error checking treasury balance:", error);
    return { sufficient: false, balance: 0 };
  }
}

/**
 * Helper to get associated token address
 */
async function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve: boolean = false
): Promise<PublicKey> {
  const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
  return getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve);
}

/**
 * Calculate leaderboard rankings from members
 */
export function calculateLeaderboard(members: Member[]): Array<{
  rank: number;
  member: Member;
  rewardAmount: number;
  eligible: boolean;
}> {
  // Sort members by reputation (descending), then by activity count (descending), then by join date (ascending)
  const sorted = [...members].sort((a, b) => {
    if (b.reputation !== a.reputation) {
      return b.reputation - a.reputation;
    }
    if (b.activityCount !== a.activityCount) {
      return b.activityCount - a.activityCount;
    }
    return a.joinedAt - b.joinedAt;
  });
  
  // Create leaderboard entries with rankings
  return sorted.map((member, index) => {
    const rank = index + 1;
    const rewardAmount = calculateRewardAmount(rank);
    const eligible = isEligibleForReward(rank, member.reputation);
    
    return {
      rank,
      member,
      rewardAmount,
      eligible,
    };
  });
}

/**
 * Execute claim reward transaction
 */
export async function claimReward(
  provider: AnchorProvider,
  communityId: string,
  rank: number,
  amount: number
): Promise<{ success: boolean; signature?: string; error?: string }> {
  try {
    const program = getProgram(provider);
    const communityPubkey = new PublicKey(communityId);
    
    // Get community account
    const community = await (program.account as any).community.fetch(communityPubkey);
    const tokenMint = community.tokenMint;
    
    // Get current reward period
    const period = getCurrentRewardPeriod();
    
    // Derive PDAs
    const [memberPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("member"),
        communityPubkey.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    const [rewardClaimPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("reward_claim"),
        communityPubkey.toBuffer(),
        memberPda.toBuffer(),
        Buffer.from(new BigInt64Array([BigInt(period)]).buffer),
      ],
      program.programId
    );
    
    const [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), communityPubkey.toBuffer()],
      program.programId
    );
    
    // Get token accounts
    const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
    
    const treasuryTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      treasuryPda,
      true
    );
    
    const memberTokenAccount = getAssociatedTokenAddressSync(
      tokenMint,
      provider.wallet.publicKey,
      false
    );
    
    // Convert amount to token units (assuming decimals from community)
    const tokenDecimals = community.tokenDecimals;
    const amountInTokenUnits = amount * Math.pow(10, tokenDecimals);
    
    // Execute claim reward transaction
    const tx = await (program.methods as any)
      .claimReward(
        new (await import("bn.js")).default(period),
        rank,
        new (await import("bn.js")).default(amountInTokenUnits)
      )
      .accounts({
        community: communityPubkey,
        member: memberPda,
        rewardClaim: rewardClaimPda,
        treasuryTokenAccount,
        memberTokenAccount,
        treasury: treasuryPda,
        tokenMint,
        claimer: provider.wallet.publicKey,
      })
      .rpc();
    
    return { success: true, signature: tx };
  } catch (error: any) {
    console.error("Error claiming reward:", error);
    
    // Parse error message
    let errorMessage = "Failed to claim reward";
    if (error.message) {
      if (error.message.includes("already in use")) {
        errorMessage = "You have already claimed rewards for this period";
      } else if (error.message.includes("InsufficientTreasuryBalance")) {
        errorMessage = "Treasury has insufficient balance";
      } else if (error.message.includes("InsufficientReputation")) {
        errorMessage = "You don't have enough reputation to claim rewards";
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * Check if member has already claimed reward for current period
 */
export async function hasClaimedReward(
  provider: AnchorProvider,
  communityId: string
): Promise<boolean> {
  try {
    const program = getProgram(provider);
    const communityPubkey = new PublicKey(communityId);
    const period = getCurrentRewardPeriod();
    
    // Derive member PDA
    const [memberPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("member"),
        communityPubkey.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    // Derive reward claim PDA
    const [rewardClaimPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("reward_claim"),
        communityPubkey.toBuffer(),
        memberPda.toBuffer(),
        Buffer.from(new BigInt64Array([BigInt(period)]).buffer),
      ],
      program.programId
    );
    
    // Try to fetch reward claim account
    const rewardClaim = await (program.account as any).rewardClaim.fetchNullable(rewardClaimPda);
    
    return rewardClaim !== null;
  } catch (error) {
    console.error("Error checking reward claim:", error);
    return false;
  }
}
