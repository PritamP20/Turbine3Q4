// instructions/treasury.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;
use crate::errors::*;

pub fn withdraw_from_treasury(
    ctx: Context<WithdrawFromTreasury>,
    amount: u64,
) -> Result<()> {
    require!(
        amount > 0,
        SocialChainError::InvalidWithdrawalAmount
    );

    let community = &ctx.accounts.community;
    let proposal = &ctx.accounts.proposal;

    // Verify withdrawal is approved by governance
    require!(
        proposal.status == ProposalStatus::Executed,
        SocialChainError::WithdrawalRequiresProposal
    );

    // Verify proposal is a transfer proposal
    require!(
        proposal.proposal_type == ProposalType::Transfer,
        SocialChainError::InvalidInput
    );

    // Check treasury balance
    require!(
        ctx.accounts.treasury_token_account.amount >= amount,
        SocialChainError::InsufficientTreasuryBalance
    );

    // Transfer from treasury
    let community_name = community.name.as_bytes();
    let treasury_seeds = &[
        b"treasury",
        community.key().as_ref(),
        &[ctx.bumps.treasury],
    ];
    let signer = &[&treasury_seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.treasury_token_account.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.treasury.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::transfer(cpi_ctx, amount)?;

    msg!("Withdrawn {} tokens from treasury", amount);
    msg!("Recipient: {}", ctx.accounts.recipient_token_account.owner);
    msg!("Proposal: {}", proposal.key());

    Ok(())
}

pub fn deposit_to_treasury(
    ctx: Context<DepositToTreasury>,
    amount: u64,
) -> Result<()> {
    require!(
        amount > 0,
        SocialChainError::InvalidDepositAmount
    );

    // Transfer to treasury
    let cpi_accounts = Transfer {
        from: ctx.accounts.depositor_token_account.to_account_info(),
        to: ctx.accounts.treasury_token_account.to_account_info(),
        authority: ctx.accounts.depositor.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, amount)?;

    msg!("Deposited {} tokens to treasury", amount);
    msg!("Depositor: {}", ctx.accounts.depositor.key());

    Ok(())
}

pub fn update_reputation(
    ctx: Context<UpdateReputation>,
    reputation_delta: i32,
    reason: String,
) -> Result<()> {
    require!(
        reason.len() >= 5 && reason.len() <= 200,
        SocialChainError::ReputationReasonRequired
    );

    let member = &mut ctx.accounts.member;
    let community = &ctx.accounts.community;

    // Verify admin
    require!(
        community.admin == ctx.accounts.admin.key(),
        SocialChainError::Unauthorized
    );

    // Update reputation
    if reputation_delta >= 0 {
        member.reputation_score = member.reputation_score
            .checked_add(reputation_delta as i64)
            .ok_or(SocialChainError::ArithmeticOverflow)?;
    } else {
        member.reputation_score = member.reputation_score
            .checked_sub(reputation_delta.abs() as i64)
            .ok_or(SocialChainError::ArithmeticUnderflow)?;
    }

    msg!("Reputation updated for member: {}", member.wallet);
    msg!("Delta: {}, New score: {}", reputation_delta, member.reputation_score);
    msg!("Reason: {}", reason);

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawFromTreasury<'info> {
    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(
        seeds = [b"proposal", proposal.community.as_ref(), proposal.title.as_bytes()],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = treasury
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = admin,
        associated_token::mint = token_mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: Treasury PDA
    #[account(
        mut,
        seeds = [b"treasury", community.key().as_ref()],
        bump
    )]
    pub treasury: UncheckedAccount<'info>,

    /// CHECK: Recipient address from proposal
    pub recipient: UncheckedAccount<'info>,

    #[account(
        seeds = [b"token_mint", community.name.as_bytes()],
        bump
    )]
    pub token_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositToTreasury<'info> {
    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = depositor
    )]
    pub depositor_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = depositor,
        associated_token::mint = token_mint,
        associated_token::authority = treasury
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

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
    pub depositor: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), member.wallet.as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}