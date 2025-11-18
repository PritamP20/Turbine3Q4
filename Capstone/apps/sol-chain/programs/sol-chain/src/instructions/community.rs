use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Mint, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;
use crate::error::*;

pub fn initialize_community(
    ctx: Context<InitializeCommunity>,
    community_name: String,
    token_symbol: String,
    token_decimals: u8,
    governance_threshold: u8,
) -> Result<()> {
    require!(
        community_name.len() >= 3 && community_name.len() <= 50,
        SocialChainError::InvalidCommunityName
    );
    require!(
        token_symbol.len() >= 2 && token_symbol.len() <= 10,
        SocialChainError::InvalidInput
    );
    require!(
        token_decimals <= 9,
        SocialChainError::InvalidDecimals
    );
    require!(
        governance_threshold > 0 && governance_threshold <= 100,
        SocialChainError::InvalidGovernanceThreshold
    );

    let clock = Clock::get()?;
    let community_bump = ctx.bumps.community;
    let community_name_clone = community_name.clone();
    
    // Set community fields
    {
        let community = &mut ctx.accounts.community;
        community.admin = ctx.accounts.admin.key();
        community.name = community_name.clone();
        community.token_mint = ctx.accounts.token_mint.key();
        community.token_symbol = token_symbol;
        community.token_decimals = token_decimals;
        community.governance_threshold = governance_threshold;
        community.transfer_fee_bps = 0;
        community.member_count = 0;
        community.treasury = ctx.accounts.treasury.key();
        community.collection_mint = ctx.accounts.collection_mint.key();
        community.created_at = clock.unix_timestamp;
        community.bump = community_bump;
    }

    // Mint initial supply of 1000 tokens to treasury
    let initial_supply = 1000u64 * 10u64.pow(token_decimals as u32);
    let community_name_bytes = community_name.as_bytes();
    let seeds = &[b"community", community_name_bytes, &[community_bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.token_mint.to_account_info(),
        to: ctx.accounts.treasury_token_account.to_account_info(),
        authority: ctx.accounts.community.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::mint_to(cpi_ctx, initial_supply)?;

    msg!("Community initialized: {}", community_name_clone);
    msg!("Minted {} tokens to treasury", initial_supply);
    Ok(())
}

pub fn update_community_config(
    ctx: Context<UpdateCommunityConfig>,
    new_admin: Option<Pubkey>,
    governance_threshold: Option<u8>,
    transfer_fee_bps: Option<u16>,
) -> Result<()> {
    let community = &mut ctx.accounts.community;

    require!(
        community.admin == ctx.accounts.admin.key(),
        SocialChainError::Unauthorized
    );

    if let Some(new_admin_key) = new_admin {
        community.admin = new_admin_key;
    }

    if let Some(threshold) = governance_threshold {
        require!(
            threshold > 0 && threshold <= 100,
            SocialChainError::InvalidGovernanceThreshold
        );
        community.governance_threshold = threshold;
    }

    if let Some(fee) = transfer_fee_bps {
        require!(fee <= 1000, SocialChainError::InvalidTransferFee);
        community.transfer_fee_bps = fee;
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(community_name: String)]
pub struct InitializeCommunity<'info> {
    #[account(
        init,
        payer = admin,
        space = Community::LEN,
        seeds = [b"community", community_name.as_bytes()],
        bump
    )]
    pub community: Account<'info, Community>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 9,
        mint::authority = community,
        seeds = [b"token_mint", community_name.as_bytes()],
        bump
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = admin,
        mint::decimals = 0,
        mint::authority = community,
        seeds = [b"collection_mint", community_name.as_bytes()],
        bump
    )]
    pub collection_mint: Account<'info, Mint>,

    /// CHECK: Treasury PDA
    #[account(
        seeds = [b"treasury", community.key().as_ref()],
        bump
    )]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        associated_token::mint = token_mint,
        associated_token::authority = treasury
    )]
    pub treasury_token_account: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateCommunityConfig<'info> {
    #[account(
        mut,
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn
 mint_community_tokens(
    ctx: Context<MintCommunityTokens>,
    amount: u64,
) -> Result<()> {
    let community = &ctx.accounts.community;

    require!(
        community.admin == ctx.accounts.admin.key(),
        SocialChainError::Unauthorized
    );

    require!(amount > 0, SocialChainError::InvalidTokenAmount);

    // Mint tokens to treasury
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

    token::mint_to(cpi_ctx, amount)?;

    msg!("Minted {} tokens to treasury", amount);
    Ok(())
}

#[derive(Accounts)]
pub struct MintCommunityTokens<'info> {
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

    /// CHECK: Treasury PDA
    #[account(
        seeds = [b"treasury", community.key().as_ref()],
        bump
    )]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = treasury
    )]
    pub treasury_token_account: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
