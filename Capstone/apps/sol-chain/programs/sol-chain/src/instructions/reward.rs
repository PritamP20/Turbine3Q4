use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;
use crate::error::*;

pub fn claim_reward(
    ctx: Context<ClaimReward>,
    period: i64,
    rank: u8,
    amount: u64,
) -> Result<()> {
    require!(rank >= 1 && rank <= 3, SocialChainError::InvalidInput);
    require!(amount > 0, SocialChainError::InvalidTokenAmount);

    let member = &ctx.accounts.member;
    
    // Verify member has sufficient reputation (minimum 10)
    require!(
        member.reputation_score >= 10,
        SocialChainError::InsufficientReputation
    );

    // Verify treasury has sufficient balance
    require!(
        ctx.accounts.treasury_token_account.amount >= amount,
        SocialChainError::InsufficientTreasuryBalance
    );

    // Initialize reward claim record
    let reward_claim = &mut ctx.accounts.reward_claim;
    reward_claim.community = ctx.accounts.community.key();
    reward_claim.member = member.key();
    reward_claim.period = period;
    reward_claim.amount = amount;
    reward_claim.rank = rank;
    reward_claim.claimed_at = Clock::get()?.unix_timestamp;
    reward_claim.bump = ctx.bumps.reward_claim;

    // Transfer tokens from treasury to member
    let community_key = ctx.accounts.community.key();
    let treasury_seeds = &[
        b"treasury",
        community_key.as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer = &[&treasury_seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.treasury_token_account.to_account_info(),
        to: ctx.accounts.member_token_account.to_account_info(),
        authority: ctx.accounts.treasury.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::transfer(cpi_ctx, amount)?;

    msg!("Reward claimed: {} tokens", amount);
    msg!("Member: {}", member.key());
    msg!("Rank: {}", rank);
    msg!("Period: {}", period);

    Ok(())
}

#[derive(Accounts)]
#[instruction(period: i64, rank: u8, amount: u64)]
pub struct ClaimReward<'info> {
    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(
        seeds = [b"member", community.key().as_ref(), claimer.key().as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

    #[account(
        init,
        payer = claimer,
        space = RewardClaim::LEN,
        seeds = [
            b"reward_claim",
            community.key().as_ref(),
            member.key().as_ref(),
            &period.to_le_bytes()
        ],
        bump
    )]
    pub reward_claim: Account<'info, RewardClaim>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = treasury
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = claimer,
        associated_token::mint = token_mint,
        associated_token::authority = claimer
    )]
    pub member_token_account: Account<'info, TokenAccount>,

    /// CHECK: Treasury PDA
    #[account(
        seeds = [b"treasury", community.key().as_ref()],
        bump
    )]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        seeds = [b"token_mint", community.name.as_bytes()],
        bump
    )]
    pub token_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(mut)]
    pub claimer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
