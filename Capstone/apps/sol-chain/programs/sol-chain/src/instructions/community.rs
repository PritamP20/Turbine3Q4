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

    let community = &mut ctx.accounts.community;
    let clock = Clock::get()?;

    community.admin = ctx.accounts.admin.key();
    community.name = community_name;
    community.token_mint = ctx.accounts.token_mint.key();
    community.token_symbol = token_symbol;
    community.token_decimals = token_decimals;
    community.governance_threshold = governance_threshold;
    community.transfer_fee_bps = 0;
    community.member_count = 0;
    community.treasury = ctx.accounts.treasury.key();
    community.collection_mint = ctx.accounts.collection_mint.key();
    community.created_at = clock.unix_timestamp;
    community.bump = ctx.bumps.community;

    msg!("Community initialized: {}", community.name);
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

    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
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