use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ConnectionType {
    Friend,
    Colleague,
    Vendor,
    Custom,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum InteractionType {
    Payment,
    EventMeetup,
    Message,
    Collaboration,
}

#[account]
pub struct Connection {
    pub community: Pubkey,
    pub member_a: Pubkey,
    pub member_b: Pubkey,
    pub connection_type: ConnectionType,
    pub metadata: Option<String>,
    pub interaction_count: u32,
    pub last_interaction: i64,
    pub created_at: i64,
    pub bump: u8,
}

impl Connection {
    pub const LEN: usize = 8 + // discriminator
        32 + // community
        32 + // member_a
        32 + // member_b
        1 + // connection_type
        (1 + 4 + 200) + // metadata (Option<String>)
        4 + // interaction_count
        8 + // last_interaction
        8 + // created_at
        1; // bump
}