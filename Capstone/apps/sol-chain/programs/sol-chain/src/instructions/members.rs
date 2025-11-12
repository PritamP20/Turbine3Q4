use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;
use crate::errors::*;

pub fn register_member(
    ctx: Context<RegisterMember>,
    member_name: String,
    metadata_uri: String,
) -> Result<()> {
    require!(
        member_name.len() >= 1 && member_name.len() <= 50,
        SocialChainError::InvalidMemberName
    );
    require!(
        metadata_uri.len() <= 200,
        SocialChainError::InvalidMetadataUri
    );

    let member = &mut ctx.accounts.member;
    let community = &mut ctx.accounts.community;
    let clock = Clock::get()?;

    member.community = community.key();
    member.wallet = ctx.accounts.wallet.key();
    member.name = member_name.clone();
    member.metadata_uri = metadata_uri;
    member.reputation_score = 0;
    member.total_events_attended = 0;
    member.total_connections = 0;
    member.total_transactions = 0;
    member.nfc_card = None;
    member.joined_at = clock.unix_timestamp;
    member.bump = ctx.bumps.member;

    community.member_count = community.member_count
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;

    msg!("Member registered: {}", member_name);
    Ok(())
}

pub fn update_member_profile(
    ctx: Context<UpdateMemberProfile>,
    new_name: Option<String>,
    new_metadata_uri: Option<String>,
) -> Result<()> {
    let member = &mut ctx.accounts.member;

    require!(
        member.wallet == ctx.accounts.wallet.key(),
        SocialChainError::Unauthorized
    );

    if let Some(name) = new_name {
        require!(
            name.len() >= 1 && name.len() <= 50,
            SocialChainError::InvalidMemberName
        );
        member.name = name;
    }

    if let Some(uri) = new_metadata_uri {
        require!(uri.len() <= 200, SocialChainError::InvalidMetadataUri);
        member.metadata_uri = uri;
    }

    Ok(())
}

pub fn mint_tokens_to_member(
    ctx: Context<MintTokensToMember>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, SocialChainError::InvalidTokenAmount);

    let community = &ctx.accounts.community;
    
    require!(
        community.admin == ctx.accounts.admin.key(),
        SocialChainError::Unauthorized
    );

    let community_name = community.name.as_bytes();
    let seeds = &[b"community", community_name, &[community.bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.token_mint.to_account_info(),
        to: ctx.accounts.member_token_account.to_account_info(),
        authority: ctx.accounts.community.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::mint_to(cpi_ctx, amount)?;

    msg!("Minted {} tokens to member", amount);
    Ok(())
}

#[derive(Accounts)]
#[instruction(member_name: String)]
pub struct RegisterMember<'info> {
    #[account(
        init,
        payer = wallet,
        space = Member::LEN,
        seeds = [b"member", community.key().as_ref(), wallet.key().as_ref()],
        bump
    )]
    pub member: Account<'info, Member>,

    #[account(
        mut,
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(mut)]
    pub wallet: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMemberProfile<'info> {
    #[account(
        mut,
        seeds = [b"member", member.community.as_ref(), wallet.key().as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

    #[account(mut)]
    pub wallet: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintTokensToMember<'info> {
    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(
        seeds = [b"member", community.key().as_ref(), member.wallet.as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

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
        associated_token::authority = member.wallet
    )]
    pub member_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}