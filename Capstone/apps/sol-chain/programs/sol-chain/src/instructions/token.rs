use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer, MintTo, Burn};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;
use crate::error::*;

pub fn create_community_token(
    ctx: Context<CreateCommunityToken>,
    name: String,
    symbol: String,
    decimals: u8,
    initial_supply: u64,
) -> Result<()> {
    let community = &ctx.accounts.community;
    
    require!(
        community.admin == ctx.accounts.admin.key(),
        SocialChainError::Unauthorized
    );

    if initial_supply > 0 {
        let community_name = community.name.as_bytes();
        let seeds = &[b"community", community_name, &[community.bump]];
        let signer = &[&seeds[..]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.token_mint.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.community.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::mint_to(cpi_ctx, initial_supply)?;
        msg!("Minted {} initial supply to treasury", initial_supply);
    }

    Ok(())
}

pub fn transfer_tokens(
    ctx: Context<TransferTokens>,
    amount: u64,
    memo: Option<String>,
) -> Result<()> {
    require!(amount > 0, SocialChainError::InvalidTokenAmount);

    let sender_member = &mut ctx.accounts.sender_member;
    let recipient_member = &mut ctx.accounts.recipient_member;

    let fee_bps = ctx.accounts.community.transfer_fee_bps;
    let fee_amount = (amount as u128)
        .checked_mul(fee_bps as u128)
        .and_then(|v| v.checked_div(10000))
        .ok_or(SocialChainError::ArithmeticOverflow)? as u64;
    
    let transfer_amount = amount
        .checked_sub(fee_amount)
        .ok_or(SocialChainError::ArithmeticUnderflow)?;

    let cpi_accounts = Transfer {
        from: ctx.accounts.sender_token_account.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),
        authority: ctx.accounts.sender.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::transfer(cpi_ctx, transfer_amount)?;

    if fee_amount > 0 {
        let fee_cpi_accounts = Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.treasury_token_account.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let fee_cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            fee_cpi_accounts
        );
        token::transfer(fee_cpi_ctx, fee_amount)?;
    }

    sender_member.total_transactions = sender_member.total_transactions
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;
    
    recipient_member.total_transactions = recipient_member.total_transactions
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;

    msg!("Transferred {} tokens (fee: {})", transfer_amount, fee_amount);
    if let Some(memo_text) = memo {
        msg!("Memo: {}", memo_text);
    }

    Ok(())
}

pub fn batch_transfer(
    ctx: Context<BatchTransfer>,
    amounts: Vec<u64>,
) -> Result<()> {
    require!(amounts.len() > 0, SocialChainError::InvalidInput);
    msg!("Batch transfer initiated for {} recipients", amounts.len());
    Ok(())
}

pub fn burn_tokens(
    ctx: Context<BurnTokens>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, SocialChainError::InvalidTokenAmount);

    let cpi_accounts = Burn {
        mint: ctx.accounts.token_mint.to_account_info(),
        from: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

    token::burn(cpi_ctx, amount)?;

    msg!("Burned {} tokens", amount);
    Ok(())
}

#[derive(Accounts)]
pub struct CreateCommunityToken<'info> {
    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(
        mut,
        seeds = [b"token_mint", community.name.as_bytes()],
        bump
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = admin,
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

    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), sender.key().as_ref()],
        bump = sender_member.bump
    )]
    pub sender_member: Account<'info, Member>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), recipient_member.wallet.as_ref()],
        bump = recipient_member.bump
    )]
    pub recipient_member: Account<'info, Member>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = sender
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = token_mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: Recipient wallet address
    pub recipient: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = sender,
        associated_token::mint = token_mint,
        associated_token::authority = treasury
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"token_mint", community.name.as_bytes()],
        bump
    )]
    pub token_mint: Account<'info, Mint>,

    /// CHECK: Treasury PDA
    #[account(
        seeds = [b"treasury", community.key().as_ref()],
        bump
    )]
    pub treasury: UncheckedAccount<'info>,

    #[account(mut)]
    pub sender: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BatchTransfer<'info> {
    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(mut)]
    pub sender: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(
        mut,
        seeds = [b"token_mint", community.name.as_bytes()],
        bump
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = authority
    )]
    pub token_account: Account<'info, TokenAccount>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
}
