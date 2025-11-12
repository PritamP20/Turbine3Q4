use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::*;

pub fn create_connection(
    ctx: Context<CreateConnection>,
    connection_type: ConnectionType,
    metadata: Option<String>,
) -> Result<()> {
    if let Some(ref meta) = metadata {
        require!(
            meta.len() <= 200,
            SocialChainError::InvalidConnectionMetadata
        );
    }

    let connection = &mut ctx.accounts.connection;
    let member_a = &mut ctx.accounts.member_a;
    let member_b = &mut ctx.accounts.member_b;
    let clock = Clock::get()?;

    // Verify both members are in the same community
    require!(
        member_a.community == member_b.community,
        SocialChainError::InvalidConnection
    );

    // Verify not connecting to self
    require!(
        member_a.wallet != member_b.wallet,
        SocialChainError::CannotConnectToSelf
    );

    connection.community = ctx.accounts.community.key();
    connection.member_a = member_a.key();
    connection.member_b = member_b.key();
    connection.connection_type = connection_type;
    connection.metadata = metadata;
    connection.interaction_count = 0;
    connection.last_interaction = clock.unix_timestamp;
    connection.created_at = clock.unix_timestamp;
    connection.bump = ctx.bumps.connection;

    // Update member connection counts
    member_a.total_connections = member_a.total_connections
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;
    
    member_b.total_connections = member_b.total_connections
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;

    msg!("Connection created between {} and {}", 
        member_a.name, member_b.name);

    Ok(())
}

pub fn record_interaction(
    ctx: Context<RecordInteraction>,
    interaction_type: InteractionType,
) -> Result<()> {
    let connection = &mut ctx.accounts.connection;
    let clock = Clock::get()?;

    // Verify signer is one of the connected members
    let is_member_a = connection.member_a == ctx.accounts.member.key();
    let is_member_b = connection.member_b == ctx.accounts.member.key();
    
    require!(
        is_member_a || is_member_b,
        SocialChainError::Unauthorized
    );

    connection.interaction_count = connection.interaction_count
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;
    
    connection.last_interaction = clock.unix_timestamp;

    msg!("Interaction recorded: {:?}", interaction_type);
    msg!("Total interactions: {}", connection.interaction_count);

    Ok(())
}

pub fn update_connection_metadata(
    ctx: Context<UpdateConnectionMetadata>,
    new_metadata: Option<String>,
) -> Result<()> {
    if let Some(ref meta) = new_metadata {
        require!(
            meta.len() <= 200,
            SocialChainError::InvalidConnectionMetadata
        );
    }

    let connection = &mut ctx.accounts.connection;

    // Verify signer is one of the connected members
    let is_member_a = connection.member_a == ctx.accounts.member.key();
    let is_member_b = connection.member_b == ctx.accounts.member.key();
    
    require!(
        is_member_a || is_member_b,
        SocialChainError::Unauthorized
    );

    connection.metadata = new_metadata;

    msg!("Connection metadata updated");

    Ok(())
}

pub fn remove_connection(
    ctx: Context<RemoveConnection>,
) -> Result<()> {
    let connection = &ctx.accounts.connection;
    let member_a = &mut ctx.accounts.member_a;
    let member_b = &mut ctx.accounts.member_b;

    // Verify signer is one of the connected members
    let is_member_a = connection.member_a == member_a.key();
    let is_member_b = connection.member_b == member_b.key();
    
    require!(
        is_member_a || is_member_b,
        SocialChainError::Unauthorized
    );

    // Update member connection counts
    member_a.total_connections = member_a.total_connections
        .checked_sub(1)
        .ok_or(SocialChainError::ArithmeticUnderflow)?;
    
    member_b.total_connections = member_b.total_connections
        .checked_sub(1)
        .ok_or(SocialChainError::ArithmeticUnderflow)?;

    msg!("Connection removed");

    Ok(())
}

pub fn update_reputation(
    ctx: Context<UpdateReputation>,
    delta: i64,
    reason: String,
) -> Result<()> {
    require!(
        reason.len() >= 3 && reason.len() <= 200,
        SocialChainError::ReputationReasonRequired
    );
    require!(
        delta.abs() <= 100,
        SocialChainError::InvalidReputationDelta
    );

    let member = &mut ctx.accounts.member;
    let community = &ctx.accounts.community;

    // Verify admin
    require!(
        community.admin == ctx.accounts.authority.key(),
        SocialChainError::Unauthorized
    );

    // Update reputation score
    if delta >= 0 {
        member.reputation_score = member.reputation_score
            .checked_add(delta)
            .ok_or(SocialChainError::ArithmeticOverflow)?;
    } else {
        member.reputation_score = member.reputation_score
            .checked_sub(delta.abs())
            .ok_or(SocialChainError::ArithmeticUnderflow)?;
    }

    msg!("Reputation updated for {}: {} ({})", 
        member.name, delta, reason);
    msg!("New reputation score: {}", member.reputation_score);

    Ok(())
}

#[derive(Accounts)]
pub struct CreateConnection<'info> {
    #[account(
        init,
        payer = initiator,
        space = Connection::LEN,
        seeds = [
            b"connection",
            community.key().as_ref(),
            member_a.key().as_ref(),
            member_b.key().as_ref()
        ],
        bump
    )]
    pub connection: Account<'info, Connection>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), member_a.wallet.as_ref()],
        bump = member_a.bump
    )]
    pub member_a: Account<'info, Member>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), member_b.wallet.as_ref()],
        bump = member_b.bump
    )]
    pub member_b: Account<'info, Member>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    #[account(mut)]
    pub initiator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordInteraction<'info> {
    #[account(
        mut,
        seeds = [
            b"connection",
            connection.community.as_ref(),
            connection.member_a.as_ref(),
            connection.member_b.as_ref()
        ],
        bump = connection.bump
    )]
    pub connection: Account<'info, Connection>,

    #[account(
        seeds = [b"member", community.key().as_ref(), member.wallet.as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConnectionMetadata<'info> {
    #[account(
        mut,
        seeds = [
            b"connection",
            connection.community.as_ref(),
            connection.member_a.as_ref(),
            connection.member_b.as_ref()
        ],
        bump = connection.bump
    )]
    pub connection: Account<'info, Connection>,

    #[account(
        seeds = [b"member", community.key().as_ref(), member.wallet.as_ref()],
        bump = member.bump
    )]
    pub member: Account<'info, Member>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub signer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveConnection<'info> {
    #[account(
        mut,
        close = refund_receiver,
        seeds = [
            b"connection",
            connection.community.as_ref(),
            connection.member_a.as_ref(),
            connection.member_b.as_ref()
        ],
        bump = connection.bump
    )]
    pub connection: Account<'info, Connection>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), member_a.wallet.as_ref()],
        bump = member_a.bump
    )]
    pub member_a: Account<'info, Member>,

    #[account(
        mut,
        seeds = [b"member", community.key().as_ref(), member_b.wallet.as_ref()],
        bump = member_b.bump
    )]
    pub member_b: Account<'info, Member>,

    #[account(
        seeds = [b"community", community.name.as_bytes()],
        bump = community.bump
    )]
    pub community: Account<'info, Community>,

    pub signer: Signer<'info>,

    /// CHECK: Receives refunded rent
    #[account(mut)]
    pub refund_receiver: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
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
