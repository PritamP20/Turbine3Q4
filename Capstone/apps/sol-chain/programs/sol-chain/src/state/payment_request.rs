use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PaymentRequestStatus {
    Pending,
    Completed,
    Expired,
    Cancelled,
}

#[account]
pub struct PaymentRequest {
    pub community: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub description: String,
    pub status: PaymentRequestStatus,
    pub created_at: i64,
    pub expires_at: i64,
    pub settled_at: Option<i64>,
    pub bump: u8,
}

impl PaymentRequest {
    pub const MAX_LEN: usize = 8 + // discriminator
        32 + // community
        32 + // from
        32 + // to
        8 + // amount
        (4 + 200) + // description
        1 + // status
        8 + // created_at
        8 + // expires_at
        (1 + 8) + // settled_at (Option)
        1; // bump
}