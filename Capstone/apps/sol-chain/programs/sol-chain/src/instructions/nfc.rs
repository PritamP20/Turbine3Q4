use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

pub fn create_nfc_card(
    ctx: Context<CreateNfcCard>,
    card_id: String,
    metadata_uri: String,
) -> Result<()> {
    require!(
        card_id.len() >= 8 && card_id.len() <= 64,
        SocialChainError::InvalidCardId
    );

    let nfc_card = &mut ctx.accounts.nfc_card;
    let member = &mut ctx.accounts.member;
    let clock = Clock::get()?;

    require!(
        member.nfc_card.is_none(),
        SocialChainError::NfcCardAlreadyExists
    );

    nfc_card.community = ctx.accounts.community.key();
    nfc_card.owner = member.wallet;
    nfc_card.card_id = card_id.clone();
    nfc_card.asset_id = Pubkey::default().to_string();
    nfc_card.is_active = true;
    nfc_card.last_used = clock.unix_timestamp;
    nfc_card.total_uses = 0;
    nfc_card.created_at = clock.unix_timestamp;
    nfc_card.bump = ctx.bumps.nfc_card;

    member.nfc_card = Some(nfc_card.key());

    msg!("NFC card created: {}", card_id);
    Ok(())
}

pub fn authenticate_nfc(
    ctx: Context<AuthenticateNfc>,
    card_id: String,
) -> Result<()> {
    let nfc_card = &mut ctx.accounts.nfc_card;
    let clock = Clock::get()?;

    require!(nfc_card.is_active, SocialChainError::NfcCardNotActive);
    require!(nfc_card.card_id == card_id, SocialChainError::InvalidNfcCard);

    nfc_card.last_used = clock.unix_timestamp;
    nfc_card.total_uses = nfc_card.total_uses
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;

    msg!("NFC card authenticated: {}", card_id);
    Ok(())
}

pub fn transfer_nfc_card(
    ctx: Context<TransferNfcCard>,
    card_id: String,
) -> Result<()> {
    let nfc_card = &mut ctx.accounts.nfc_card;
    let old_member = &mut ctx.accounts.old_member;
    let new_member = &mut ctx.accounts.new_member;

    require!(
        nfc_card.owner == old_member.wallet,
        SocialChainError::Unauthorized
    );
    require!(nfc_card.is_active, SocialChainError::NfcCardNotActive);
    require!(
        new_member.nfc_card.is_none(),
        SocialChainError::NfcCardAlreadyExists
    );

    nfc_card.owner = new_member.wallet;
    old_member.nfc_card = None;
    new_member.nfc_card = Some(nfc_card.key());

    msg!("NFC card transferred");
    Ok(())
}

pub fn revoke_nfc_card(
    ctx: Context<RevokeNfcCard>,
    card_id: String,
) -> Result<()> {
    let nfc_card = &mut ctx.accounts.nfc_card;
    let member = &mut ctx.accounts.member;

    let is_owner = nfc_card.owner == ctx.accounts.authority.key();
    let is_admin = ctx.accounts.community.admin == ctx.accounts.authority.key();
    
    require!(is_owner || is_admin, SocialChainError::Unauthorized);

    nfc_card.is_active = false;
    member.nfc_card = None;

    msg!("NFC card revoked: {}", card_id);
    Ok(())
}

#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct CreateNfcCard<'info> {
    #[account(
        init,
        payer = payer,
        space = NfcCard::LEN,
        seeds = [b"nfc_card", community.key().as_ref(), card_id.as_bytes()],
        bump
    )]
    pub nfc_card: Account<'info, NfcCard>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), member.wallet.as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct AuthenticateNfc<'info> {
    #[account(
        mut,
        seeds = [b"nfc_card", community.key().as_ref(), card_id.as_bytes()],
        bump = nfc_card.bump
    )]
    pub nfc_card: Account<'info, NfcCard>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct TransferNfcCard<'info> {
    #[account(
        mut,
        seeds = [b"nfc_card", community.key().as_ref(), card_id.as_bytes()],
        bump = nfc_card.bump
    )]
    pub nfc_card: Account<'info, NfcCard>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), old_member.wallet.as_ref()],
        bump = old_member.bump
    )]
    pub old_member: Account<'info, Member>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), new_member.wallet.as_ref()],
        bump = new_member.bump
    )]
    pub new_member: Account<'info, Member>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct RevokeNfcCard<'info> {
    #[account(
        mut,
        seeds = [b"nfc_card", community.key().as_ref(), card_id.as_bytes()],
        bump = nfc_card.bump
    )]
    pub nfc_card: Account<'info, NfcCard>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), member.wallet.as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}