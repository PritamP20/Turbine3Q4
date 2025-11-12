use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::state::*;
use crate::error::*;

pub fn create_proposal(
    ctx: Context<CreateProposal>,
    title: String,
    description: String,
    proposal_type: ProposalType,
    execution_data: Vec<u8>,
    voting_duration: i64,
) -> Result<()> {
    require!(
        title.len() >= 3 && title.len() <= 100,
        SocialChainError::InvalidProposalTitle
    );
    require!(
        description.len() >= 10 && description.len() <= 500,
        SocialChainError::InvalidProposalDescription
    );
    require!(
        voting_duration > 0 && voting_duration <= 30 * 24 * 60 * 60, // Max 30 days
        SocialChainError::InvalidVotingPeriod
    );
    require!(
        execution_data.len() <= 1024,
        SocialChainError::InvalidInput
    );

    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    proposal.community = ctx.accounts.community.key();
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.title = title.clone();
    proposal.description = description;
    proposal.proposal_type = proposal_type;
    proposal.execution_data = execution_data;
    proposal.status = ProposalStatus::Active;
    proposal.yes_votes = 0;
    proposal.no_votes = 0;
    proposal.abstain_votes = 0;
    proposal.total_voters = 0;
    proposal.voting_ends_at = clock.unix_timestamp
        .checked_add(voting_duration)
        .ok_or(SocialChainError::ArithmeticOverflow)?;
    proposal.created_at = clock.unix_timestamp;
    proposal.executed_at = None;
    proposal.bump = ctx.bumps.proposal;

    msg!("Proposal created: {}", title);
    msg!("Voting ends at: {}", proposal.voting_ends_at);

    Ok(())
}

pub fn cast_vote(
    ctx: Context<CastVote>,
    vote_type: VoteType,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let vote = &mut ctx.accounts.vote;
    let clock = Clock::get()?;

    // Verify proposal is active
    require!(
        proposal.status == ProposalStatus::Active,
        SocialChainError::ProposalNotActive
    );

    // Verify voting period hasn't ended
    require!(
        clock.unix_timestamp <= proposal.voting_ends_at,
        SocialChainError::VotingPeriodEnded
    );

    // Get voting power from token balance
    let voting_power = ctx.accounts.voter_token_account.amount;
    require!(voting_power > 0, SocialChainError::InsufficientTokens);

    // Record vote
    vote.proposal = proposal.key();
    vote.voter = ctx.accounts.voter.key();
    vote.vote_type = vote_type.clone();
    vote.voting_power = voting_power;
    vote.voted_at = clock.unix_timestamp;
    vote.bump = ctx.bumps.vote;

    // Update proposal vote counts
    match vote_type {
        VoteType::Yes => {
            proposal.yes_votes = proposal.yes_votes
                .checked_add(voting_power)
                .ok_or(SocialChainError::ArithmeticOverflow)?;
        }
        VoteType::No => {
            proposal.no_votes = proposal.no_votes
                .checked_add(voting_power)
                .ok_or(SocialChainError::ArithmeticOverflow)?;
        }
        VoteType::Abstain => {
            proposal.abstain_votes = proposal.abstain_votes
                .checked_add(voting_power)
                .ok_or(SocialChainError::ArithmeticOverflow)?;
        }
    }

    proposal.total_voters = proposal.total_voters
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;

    msg!("Vote cast: {:?} with power {}", vote_type, voting_power);
    msg!("Current tally - Yes: {}, No: {}, Abstain: {}", 
        proposal.yes_votes, proposal.no_votes, proposal.abstain_votes);

    Ok(())
}

pub fn finalize_proposal(
    ctx: Context<FinalizeProposal>,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let community = &ctx.accounts.community;
    let clock = Clock::get()?;

    // Verify proposal is active
    require!(
        proposal.status == ProposalStatus::Active,
        SocialChainError::ProposalNotActive
    );

    // Verify voting period has ended
    require!(
        clock.unix_timestamp > proposal.voting_ends_at,
        SocialChainError::VotingPeriodNotEnded
    );

    // Calculate total votes
    let total_votes = proposal.yes_votes
        .checked_add(proposal.no_votes)
        .ok_or(SocialChainError::ArithmeticOverflow)?;

    // Check if quorum is met (governance_threshold % of yes votes)
    let threshold_votes = (total_votes as u128)
        .checked_mul(community.governance_threshold as u128)
        .ok_or(SocialChainError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(SocialChainError::ArithmeticOverflow)? as u64;

    if proposal.yes_votes >= threshold_votes && proposal.yes_votes > proposal.no_votes {
        proposal.status = ProposalStatus::Approved;
        msg!("Proposal approved!");
    } else {
        proposal.status = ProposalStatus::Rejected;
        msg!("Proposal rejected");
    }

    msg!("Final tally - Yes: {}, No: {}, Abstain: {}", 
        proposal.yes_votes, proposal.no_votes, proposal.abstain_votes);

    Ok(())
}

pub fn execute_proposal(
    ctx: Context<ExecuteProposal>,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    // Verify proposal is approved
    require!(
        proposal.status == ProposalStatus::Approved,
        SocialChainError::ProposalNotApproved
    );

    // Verify not already executed
    require!(
        proposal.executed_at.is_none(),
        SocialChainError::ProposalAlreadyExecuted
    );

    // Mark as executed
    proposal.status = ProposalStatus::Executed;
    proposal.executed_at = Some(clock.unix_timestamp);

    msg!("Proposal executed: {}", proposal.title);

    Ok(())
}

pub fn cancel_proposal(
    ctx: Context<CancelProposal>,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;

    let is_proposer = proposal.proposer == ctx.accounts.authority.key();
    let is_admin = ctx.accounts.community.admin == ctx.accounts.authority.key();
    
    require!(
        is_proposer || is_admin,
        SocialChainError::Unauthorized
    );

    require!(
        proposal.status != ProposalStatus::Executed,
        SocialChainError::CannotCancelExecutedProposal
    );

    proposal.status = ProposalStatus::Cancelled;

    msg!("Proposal cancelled: {}", proposal.title);

    Ok(())
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = proposer,
        space = Proposal::MAX_LEN,
        seeds = [b"proposal", community.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(
        seeds = [b"member", community.key().as_ref(), proposer.key().as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

    #[account(mut)]
    pub proposer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.community.as_ref(), proposal.title.as_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init,
        payer = voter,
        space = Vote::LEN,
        seeds = [b"vote", proposal.key().as_ref(), voter.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, Vote>,

    #[account(
        seeds = [b"member", community.key().as_ref(), voter.key().as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(
        associated_token::mint = token_mint,
        associated_token::authority = voter
    )]
    pub voter_token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"token_mint", community.name.as_bytes()],
        bump
    )]
    pub token_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(mut)]
    pub voter: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.community.as_ref(), proposal.title.as_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.community.as_ref(), proposal.title.as_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(
        mut,
        seeds = [b"proposal", proposal.community.as_ref(), proposal.title.as_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
