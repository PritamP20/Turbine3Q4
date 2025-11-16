use anchor_lang::prelude::*;

#[account]
pub struct RewardClaim {
    pub community: Pubkey,
    pub member: Pubkey,
    pub period: i64,
    pub amount: u64,
    pub rank: u8,
    pub claimed_at: i64,
    pub bump: u8,
}

impl RewardClaim {
    pub const LEN: usize = 8 +
        32 + // community
        32 + // member
        8 +  // period
        8 +  // amount
        1 +  // rank
        8 +  // claimed_at
        1;   // bump
}
