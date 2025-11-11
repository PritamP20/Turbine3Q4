use anchor_lang::prelude::*;

#[account]
pub struct Member{
    pub community: Pubkey,
    pub wallet: Pubkey,
    pub name: String,
    pub metadata_uri: String,
    pub reputation_score: u64,
    pub total_event_attended: u32,
    pub total_connections: u32,
    pub total_transactions: u32,
    pub nfc_card: Option<Pubkey>,
    pub joined_at: i64,
    pub bump: u8,
}

impl Member {
    pub const LEN: usize = 8 +
        32 + // community
        32 + // wallet
        (4 + 32) + // name
        (4 + 200) + // metadata_uri
        8 + // reputation_score
        4 + // total_event_attended
        4 + // total_connections
        4 + // total_transactions
        1 + 32 + // nfc_card (Option<Pubkey>)
        8 + // joined_at
        1; // bump
}