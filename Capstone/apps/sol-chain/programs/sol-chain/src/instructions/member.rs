use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

pub fn register_member(
    ctx: Context<RegisterMember>,
    name: String,
    metadata_uri: String,
) -> Result<()> {
    require!(
        name.len() >= 1 && name.len() <= 50,
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
    member.name = name.clone();
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

    msg!("Member registered: {}", name);
    Ok(())
}

pub fn update_member_metadata(
    ctx: Context<UpdateMemberMetadata>,
    new_metadata_uri: String,
) -> Result<()> {
    require!(
        new_metadata_uri.len() <= 200,
        SocialChainError::InvalidMetadataUri
    );

    let member = &mut ctx.accounts.member;
    
    require!(
        member.wallet == ctx.accounts.wallet.key(),
        SocialChainError::Unauthorized
    );

    member.metadata_uri = new_metadata_uri;

    msg!("Member metadata updated");
    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String)]
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
pub struct UpdateMemberMetadata<'info> {
    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), wallet.key().as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub wallet: Signer<'info>,

    pub system_program: Program<'info, System>,
}
