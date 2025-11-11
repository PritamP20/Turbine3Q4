use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalType {
    Transfer,      // Transfer funds
    ConfigChange,  // Change community config
    MemberAction,  // Add/remove member
    Custom,        // Custom execution
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    Active,
    Approved,
    Rejected,
    Executed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum VoteType {
    Yes,
    No,
    Abstain,
}

pub struct Proposal {
    pub community: Pubkey,
    pub proposer: Pubkey,
    pub title: String,
    pub description: String,
    pub proposal_type: ProposalType,
    pub execution_data: Vec<u8>,
    pub status: ProposalStatus,
    pub yes_votes: u64,
    pub no_votes: u64,
    pub abstain_votes: u64,
    pub total_voters: u32,
    pub voting_ends_at: i64,
    pub created_at: i64,
    pub executed_at: Option<i64>,
    pub bump: u8,
}

impl Proposal {
    pub const MAX_LEN: usize = 8 + // discriminator
        32 + // community
        32 + // proposer
        (4 + 100) + // title
        (4 + 500) + // description
        1 + // proposal_type
        (4 + 1024) + // execution_data (max 1KB)
        1 + // status
        8 + // yes_votes
        8 + // no_votes
        8 + // abstain_votes
        4 + // total_voters
        8 + // voting_ends_at
        8 + // created_at
        (1 + 8) + // executed_at (Option)
        1; // bump
}

#[account]
pub struct Vote {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub vote_type: VoteType,
    pub voting_power: u64,
    pub voted_at: i64,
    pub bump: u8,
}

impl Vote {
    pub const LEN: usize = 8 + // discriminator
        32 + // proposal
        32 + // voter
        1 + // vote_type
        8 + // voting_power
        8 + // voted_at
        1; // bump
}