use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Mint, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::{
    create_metadata_accounts_v3,
    CreateMetadataAccountsV3,
    Metadata as MetadataProgram,
};
use mpl_token_metadata::types::DataV2;
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

    let clock = Clock::get()?;
    
    // Collect data we need before mutable borrows
    let community_key = ctx.accounts.community.key();
    let community_name = ctx.accounts.community.name.clone();
    let community_bump = ctx.accounts.community.bump;
    let member_count = ctx.accounts.community.member_count;
    let token_symbol = ctx.accounts.community.token_symbol.clone();
    let collection_mint = ctx.accounts.community.collection_mint;

    // Set member data
    let member = &mut ctx.accounts.member;
    member.community = community_key;
    member.wallet = ctx.accounts.wallet.key();
    member.name = name.clone();
    member.metadata_uri = metadata_uri.clone();
    member.reputation_score = 0;
    member.total_events_attended = 0;
    member.total_connections = 0;
    member.total_transactions = 0;
    member.nfc_card = None;
    member.membership_nft = Some(ctx.accounts.membership_nft_mint.key());
    member.joined_at = clock.unix_timestamp;
    member.bump = ctx.bumps.member;

    // Mint membership NFT (1 token with 0 decimals)
    let community_name_bytes = community_name.as_bytes();
    let seeds = &[
        b"community",
        community_name_bytes,
        &[community_bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.membership_nft_mint.to_account_info(),
        to: ctx.accounts.member_nft_token_account.to_account_info(),
        authority: ctx.accounts.community.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::mint_to(cpi_ctx, 1)?;

    // Create NFT metadata
    let data_v2 = DataV2 {
        name: format!("{} Member #{}", community_name, member_count + 1),
        symbol: format!("{}MEM", token_symbol),
        uri: metadata_uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: Some(mpl_token_metadata::types::Collection {
            verified: false,
            key: collection_mint,
        }),
        uses: None,
    };

    let metadata_ctx = CpiContext::new_with_signer(
        ctx.accounts.metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
            metadata: ctx.accounts.nft_metadata.to_account_info(),
            mint: ctx.accounts.membership_nft_mint.to_account_info(),
            mint_authority: ctx.accounts.community.to_account_info(),
            update_authority: ctx.accounts.community.to_account_info(),
            payer: ctx.accounts.wallet.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
        signer,
    );

    create_metadata_accounts_v3(
        metadata_ctx,
        data_v2,
        true, // is_mutable
        true, // update_authority_is_signer
        None, // collection_details
    )?;

    // Increment member count
    let community = &mut ctx.accounts.community;
    community.member_count = community.member_count
        .checked_add(1)
        .ok_or(SocialChainError::ArithmeticOverflow)?;

    msg!("Member registered: {}", name);
    msg!("Membership NFT minted: {}", ctx.accounts.membership_nft_mint.key());
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

    // Membership NFT mint (unique per member)
    #[account(
        init,
        payer = wallet,
        mint::decimals = 0,
        mint::authority = community,
        seeds = [b"membership_nft", community.key().as_ref(), wallet.key().as_ref()],
        bump
    )]
    pub membership_nft_mint: Account<'info, Mint>,

    // Member's token account to receive the NFT
    #[account(
        init_if_needed,
        payer = wallet,
        associated_token::mint = membership_nft_mint,
        associated_token::authority = wallet
    )]
    pub member_nft_token_account: Account<'info, token::TokenAccount>,

    /// CHECK: Metadata account for the NFT
    #[account(mut)]
    pub nft_metadata: UncheckedAccount<'info>,

    #[account(mut)]
    pub wallet: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub metadata_program: Program<'info, MetadataProgram>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
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
