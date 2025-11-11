use anchor_lang::prelude::*;

#[account]
pub struct NfcCard{
    pub community: Pubkey,
    pub owner: Pubkey,
    pub card_id: String,
    pub asset_id: String,
    pub is_active: bool,
    pub last_used: i64,
    pub total_uses: i64,
    pub created_at: i64,
    pub bump: u8,
}   

impl NfcCard {
    pub const LEN: usize = 8 +
        32 + // community
        32 + // owner
        (4 + 32) + // card_id
        (4 + 32) + // asset_id
        1 + // is_active
        8 + // last_used
        8 + // total_uses
        8 + // created_at
        1; // bump
}