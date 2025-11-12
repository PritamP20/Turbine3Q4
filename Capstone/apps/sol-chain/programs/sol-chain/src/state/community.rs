use anchor_lang::prelude::*;

#[account]
pub struct Community {
    pub admin: Pubkey,
    pub name: String,
    pub token_mint: Pubkey,
    pub token_symbol: String,
    pub token_decimals: u8,
    pub governance_threshold: u8,
    pub member_count: u32,
    pub transfer_fee_bps: u16,
    pub treasury: Pubkey,
    pub collection_mint: Pubkey,
    pub created_at: i64,
    pub bump: u8,
}

impl Community {
    pub const LEN: usize = 8+
        32 +
        (4 + 32) + //name
        32 + // token mint
        (4 + 10) + // token symbol
        1 + // token decimals
        1 + // governance threshold
        4 + // member count
        2 + // transfer fee bps
        32 + // treasury
        32 + // collection mint
        8 + // created at
        1; // bump
}