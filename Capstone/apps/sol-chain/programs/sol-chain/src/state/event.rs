use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EventStatus {
    Upcoming,
    Active,
    Closed,
    Cancelled,
}

#[account]
pub struct Event {
    pub community: Pubkey,
    pub organizer: Pubkey,
    pub name: String,
    pub description: String,
    pub start_time: i64,
    pub end_time: i64,
    pub max_attendees: Option<u32>,
    pub current_attendees: u32,
    pub token_reward: Option<u64>,
    pub status: EventStatus,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
pub struct Attendance {
    pub event: Pubkey,
    pub member: Pubkey,
    pub nfc_card: Pubkey,
    pub checked_in_at: i64,
    pub reward_claimed: bool,
    pub bump: u8,
}

impl Attendance {
    pub const LEN: usize = 8 + // discriminator
        32 + // event
        32 + // member
        32 + // nfc_card
        8 + // checked_in_at
        1 + // reward_claimed
        1; // bump
}
