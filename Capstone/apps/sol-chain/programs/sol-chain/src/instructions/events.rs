// instructions/events.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use crate::state::*;
use crate::errors::*;

pub fn create_event(
    ctx: Context<CreateEvent>,
    name: String,
    description: String,
    start_time: i64,
    end_time: i64,
    max_attendees: Option<u32>,
    token_reward: Option<u64>,
) -> Result<()> {
    require!(
        name.len() >= 3 && name.len() <= 100,
        SocialChainError::InvalidEventName
    );
    require!(
        description.len() <= 500,
        SocialChainError::InvalidInput
    );
    require!(
        end_time > start_time,
        SocialChainError::InvalidEventTime
    );

    let event = &mut ctx.accounts.event;
    let clock = Clock::get()?;

    event.community = ctx.accounts.community.key();
    event.organizer = ctx.accounts.organizer.key();
    event.name = name.clone();
    event.description = description;
    event.start_time = start_time;
    event.end_time = end_time;
    event.max_attendees = max_attendees;
    event.current_attendees = 0;
    event.token_reward = token_reward;
    event.status = if start_time > clock.unix_timestamp {
        EventStatus::Upcoming
    } else {
        EventStatus::Active
    };
    event.created_at = clock.unix_timestamp;
    event.bump = ctx.bumps.event;

    msg!("Event created: {}", name);
    msg!("Start time: {}, End time: {}", start_time, end_time);
    if let Some(reward) = token_reward {
        msg!("Token reward per attendee: {}", reward);
    }

    Ok(())
}

pub fn record_attendance(
    ctx: Context<RecordAttendance>,
    card_id: String,
) -> Result<()> {
    let event = &mut ctx.accounts.event;
    let member = &mut ctx.accounts.member;
    let nfc_card = &mut ctx.accounts.nfc_card;
    let attendance = &mut ctx.accounts.attendance;
    let clock = Clock::get()?;

    // Verify event is active
    require!(
        event.status == EventStatus::Active || 
        (event.status == EventStatus::Upcoming && clock.unix_timestamp >= event.start_time),
        SocialChainError::EventNotStarted
    );

    require!(
        clock.unix_timestamp <= event.end_time,
        SocialChainError::EventEnded
    );

    // Check max attendees
    if let Some(max) = event.max_attendees {
        require!(
            event.current_attendees < max,
            SocialChainError::MaxAttendeesReached
        );
    }

    // Verify NFC card
    require!(
        nfc_card.is_active,
        SocialChainError::NfcCardNotActive
    );
    require!(
        nfc_card.card_id == card_id,
        SocialChainError::InvalidNfcCard
    );
    require!(
        nfc_card.owner == member.wallet,
        SocialChainError::Unauthorized
    );

    // Record attendance
    attendance.event = event.key();
    attendance.member = member.key();
    attendance.nfc_card = nfc_card.key();
    attendance.checked_in_at = clock.unix_timestamp;
    attendance.reward_claimed = false;
    attendance.bump = ctx.bumps.attendance;

    // Update counters
    event.current_attendees = event.current_attendees
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;

    member.total_events_attended = member.total_events_attended
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;

    // Update NFC card stats
    nfc_card.last_used = clock.unix_timestamp;
    nfc_card.total_uses = nfc_card.total_uses
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;

    // Update event status if needed
    if event.status == EventStatus::Upcoming {
        event.status = EventStatus::Active;
    }

    msg!("Attendance recorded for member: {}", member.wallet);
    msg!("Event: {}, Current attendees: {}", event.name, event.current_attendees);

    // Mint reward tokens if applicable
    if let Some(reward) = event.token_reward {
        if !attendance.reward_claimed {
            let community = &ctx.accounts.community;
            let community_name = community.name.as_bytes();
            let seeds = &[
                b"community",
                community_name,
                &[community.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = MintTo {
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.member_token_account.to_account_info(),
                authority: ctx.accounts.community.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

            token::mint_to(cpi_ctx, reward)?;

            attendance.reward_claimed = true;
            msg!("Reward of {} tokens minted to attendee", reward);
        }
    }

    Ok(())
}

pub fn close_event(
    ctx: Context<CloseEvent>,
) -> Result<()> {
    let event = &mut ctx.accounts.event;
    let clock = Clock::get()?;

    // Verify organizer or admin
    let is_organizer = event.organizer == ctx.accounts.authority.key();
    let is_admin = ctx.accounts.community.admin == ctx.accounts.authority.key();
    
    require!(
        is_organizer || is_admin,
        SocialChainError::Unauthorized
    );

    // Check if event has ended
    require!(
        clock.unix_timestamp > event.end_time,
        SocialChainError::EventNotStarted
    );

    event.status = EventStatus::Closed;

    msg!("Event closed: {}", event.name);
    msg!("Total attendees: {}", event.current_attendees);

    Ok(())
}

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateEvent<'info> {
    #[account(
        init,
        payer = organizer,
        space = Event::MAX_LEN,
        seeds = [b"event", community.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub event: Account<'info, Event>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(
        seeds = [b"member", community.key().as_ref(), organizer.key().as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

    #[account(mut)]
    pub organizer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(card_id: String)]
pub struct RecordAttendance<'info> {
    #[account(
        mut,
        seeds = [b"event", event.community.as_ref(), event.name.as_bytes()],
        bump = event.bump
    )]
    pub event: Account<'info, Event>,

    #[account(
        init,
        payer = payer,
        space = Attendance::LEN,
        seeds = [b"attendance", event.key().as_ref(), member.key().as_ref()],
        bump
    )]
    pub attendance: Account<'info, Attendance>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), member.wallet.as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

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

    #[account(
        mut,
        seeds = [b"token_mint", community.name.as_bytes()],
        bump
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = token_mint,
        associated_token::authority = member.wallet
    )]
    pub member_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseEvent<'info> {
    #[account(
        mut,
        seeds = [b"event", event.community.as_ref(), event.name.as_bytes()],
        bump = event.bump
    )]
    pub event: Account<'info, Event>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}