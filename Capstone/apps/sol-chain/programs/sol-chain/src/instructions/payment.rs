use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;
use crate::error::*;

pub fn create_payment_request(
    ctx: Context<CreatePaymentRequest>,
    amount: u64,
    description: String,
    expires_in: i64,
    timestamp: i64,
) -> Result<()> {
    require!(
        amount > 0,
        SocialChainError::InvalidPaymentAmount
    );
    require!(
        description.len() >= 3 && description.len() <= 200,
        SocialChainError::InvalidPaymentMemo
    );
    require!(
        expires_in > 0 && expires_in <= 30 * 24 * 60 * 60, // Max 30 days
        SocialChainError::InvalidInput
    );

    let payment_request = &mut ctx.accounts.payment_request;
    let clock = Clock::get()?;

    require!(
        ctx.accounts.from_member.wallet != ctx.accounts.to_member.wallet,
        SocialChainError::CannotPaySelf
    );

    payment_request.community = ctx.accounts.community.key();
    payment_request.from = ctx.accounts.from_member.wallet;
    payment_request.to = ctx.accounts.to_member.wallet;
    payment_request.amount = amount;
    payment_request.description = description;
    payment_request.status = PaymentRequestStatus::Pending;
    payment_request.created_at = clock.unix_timestamp;
    payment_request.expires_at = clock.unix_timestamp
        .checked_add(expires_in)
        .ok_or(SocialChainError::ArithmeticOverflow)?;
    payment_request.settled_at = None;
    payment_request.bump = ctx.bumps.payment_request;

    msg!("Payment request created: {} tokens", amount);
    Ok(())
}

pub fn settle_payment_request(
    ctx: Context<SettlePaymentRequest>,
) -> Result<()> {
    let payment_request = &mut ctx.accounts.payment_request;
    let clock = Clock::get()?;

    require!(
        payment_request.status == PaymentRequestStatus::Pending,
        SocialChainError::PaymentRequestAlreadySettled
    );

    require!(
        clock.unix_timestamp <= payment_request.expires_at,
        SocialChainError::PaymentRequestExpired
    );

    require!(
        payment_request.from == ctx.accounts.payer.key(),
        SocialChainError::Unauthorized
    );

    let cpi_accounts = Transfer {
        from: ctx.accounts.payer_token_account.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, payment_request.amount)?;

    payment_request.status = PaymentRequestStatus::Completed;
    payment_request.settled_at = Some(clock.unix_timestamp);

    msg!("Payment request settled: {} tokens", payment_request.amount);
    Ok(())
}

pub fn cancel_payment_request(
    ctx: Context<CancelPaymentRequest>,
) -> Result<()> {
    let payment_request = &mut ctx.accounts.payment_request;

    require!(
        payment_request.status == PaymentRequestStatus::Pending,
        SocialChainError::PaymentRequestAlreadySettled
    );

    let is_creator = payment_request.to == ctx.accounts.authority.key();
    let is_payer = payment_request.from == ctx.accounts.authority.key();
    
    require!(
        is_creator || is_payer,
        SocialChainError::Unauthorized
    );

    payment_request.status = PaymentRequestStatus::Cancelled;

    msg!("Payment request cancelled");
    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, description: String, expires_in: i64, timestamp: i64)]
pub struct CreatePaymentRequest<'info> {
    #[account(
        init,
        payer = creator,
        space = PaymentRequest::MAX_LEN,
        seeds = [
            b"payment_request",
            community.key().as_ref(),
            from_member.key().as_ref(),
            to_member.key().as_ref(),
            &timestamp.to_le_bytes()
        ],
        bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,

    #[account(
        seeds = [b"member", community.key().as_ref(), from_member.wallet.as_ref()],
        bump = from_member.bump
    )]
    pub from_member: Account<'info, Member>,

    #[account(
        seeds = [b"member", community.key().as_ref(), to_member.wallet.as_ref()],
        bump = to_member.bump
    )]
    pub to_member: Account<'info, Member>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettlePaymentRequest<'info> {
    #[account(
        mut,
        seeds = [
            b"payment_request",
            payment_request.community.as_ref(),
            payment_request.from.as_ref(),
            payment_request.to.as_ref(),
            &payment_request.created_at.to_le_bytes()
        ],
        bump = payment_request.bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = payer
    )]
    pub payer_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = token_mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: Recipient wallet address
    pub recipient: UncheckedAccount<'info>,

    #[account(
        seeds = [b"token_mint", community.name.as_bytes()],
        bump
    )]
    pub token_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelPaymentRequest<'info> {
    #[account(
        mut,
        seeds = [
            b"payment_request",
            payment_request.community.as_ref(),
            payment_request.from.as_ref(),
            payment_request.to.as_ref(),
            &payment_request.created_at.to_le_bytes()
        ],
        bump = payment_request.bump
    )]
    pub payment_request: Account<'info, PaymentRequest>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}
