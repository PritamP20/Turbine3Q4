use anchor_lang::prelude::*;

declare_id!("5Ph2W7hrJ3NMGu1z3vVSTknetg25x8EqJdkz2s2g8BVP");

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod sol_chain {
    use super::*;

    // Community instructions
    pub fn initialize_community(
        ctx: Context<InitializeCommunity>,
        community_name: String,
        token_symbol: String,
        token_decimals: u8,
        governance_threshold: u8,
    ) -> Result<()> {
        instructions::community::initialize_community(
            ctx,
            community_name,
            token_symbol,
            token_decimals,
            governance_threshold,
        )
    }

    pub fn update_community_config(
        ctx: Context<UpdateCommunityConfig>,
        new_admin: Option<Pubkey>,
        governance_threshold: Option<u8>,
        transfer_fee_bps: Option<u16>,
    ) -> Result<()> {
        instructions::community::update_community_config(
            ctx,
            new_admin,
            governance_threshold,
            transfer_fee_bps,
        )
    }

    // Member instructions
    pub fn register_member(
        ctx: Context<RegisterMember>,
        name: String,
        metadata_uri: String,
    ) -> Result<()> {
        instructions::member::register_member(ctx, name, metadata_uri)
    }

    pub fn update_member_metadata(
        ctx: Context<UpdateMemberMetadata>,
        new_metadata_uri: String,
    ) -> Result<()> {
        instructions::member::update_member_metadata(ctx, new_metadata_uri)
    }

    // Token instructions
    pub fn create_community_token(
        ctx: Context<CreateCommunityToken>,
        name: String,
        symbol: String,
        decimals: u8,
        initial_supply: u64,
    ) -> Result<()> {
        instructions::token::create_community_token(ctx, name, symbol, decimals, initial_supply)
    }

    pub fn transfer_tokens(
        ctx: Context<TransferTokens>,
        amount: u64,
        memo: Option<String>,
    ) -> Result<()> {
        instructions::token::transfer_tokens(ctx, amount, memo)
    }

    pub fn batch_transfer(ctx: Context<BatchTransfer>, amounts: Vec<u64>) -> Result<()> {
        instructions::token::batch_transfer(ctx, amounts)
    }

    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        instructions::token::burn_tokens(ctx, amount)
    }

    // NFC instructions
    pub fn create_nfc_card(
        ctx: Context<CreateNfcCard>,
        card_id: String,
        metadata_uri: String,
    ) -> Result<()> {
        instructions::nfc::create_nfc_card(ctx, card_id, metadata_uri)
    }

    pub fn authenticate_nfc(ctx: Context<AuthenticateNfc>, card_id: String) -> Result<()> {
        instructions::nfc::authenticate_nfc(ctx, card_id)
    }

    pub fn transfer_nfc_card(ctx: Context<TransferNfcCard>, card_id: String) -> Result<()> {
        instructions::nfc::transfer_nfc_card(ctx, card_id)
    }

    pub fn revoke_nfc_card(ctx: Context<RevokeNfcCard>, card_id: String) -> Result<()> {
        instructions::nfc::revoke_nfc_card(ctx, card_id)
    }

    // Governance instructions
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        proposal_type: state::ProposalType,
        execution_data: Vec<u8>,
        voting_duration: i64,
    ) -> Result<()> {
        instructions::governance::create_proposal(
            ctx,
            title,
            description,
            proposal_type,
            execution_data,
            voting_duration,
        )
    }

    pub fn cast_vote(ctx: Context<CastVote>, vote_type: state::VoteType) -> Result<()> {
        instructions::governance::cast_vote(ctx, vote_type)
    }

    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> {
        instructions::governance::finalize_proposal(ctx)
    }

    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        instructions::governance::execute_proposal(ctx)
    }

    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        instructions::governance::cancel_proposal(ctx)
    }

    // Event instructions
    pub fn create_event(
        ctx: Context<CreateEvent>,
        name: String,
        description: String,
        start_time: i64,
        end_time: i64,
        max_attendees: Option<u32>,
        token_reward: Option<u64>,
    ) -> Result<()> {
        instructions::events::create_event(
            ctx,
            name,
            description,
            start_time,
            end_time,
            max_attendees,
            token_reward,
        )
    }

    pub fn record_attendance(ctx: Context<RecordAttendance>, card_id: String) -> Result<()> {
        instructions::events::record_attendance(ctx, card_id)
    }

    pub fn close_event(ctx: Context<CloseEvent>) -> Result<()> {
        instructions::events::close_event(ctx)
    }

    // Social instructions
    pub fn create_connection(
        ctx: Context<CreateConnection>,
        connection_type: state::ConnectionType,
        metadata: Option<String>,
    ) -> Result<()> {
        instructions::social::create_connection(ctx, connection_type, metadata)
    }

    pub fn record_interaction(
        ctx: Context<RecordInteraction>,
        interaction_type: state::InteractionType,
    ) -> Result<()> {
        instructions::social::record_interaction(ctx, interaction_type)
    }

    pub fn update_connection_metadata(
        ctx: Context<UpdateConnectionMetadata>,
        new_metadata: Option<String>,
    ) -> Result<()> {
        instructions::social::update_connection_metadata(ctx, new_metadata)
    }

    pub fn remove_connection(ctx: Context<RemoveConnection>) -> Result<()> {
        instructions::social::remove_connection(ctx)
    }

    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        delta: i64,
        reason: String,
    ) -> Result<()> {
        instructions::social::update_reputation(ctx, delta, reason)
    }

    // Payment instructions
    pub fn create_payment_request(
        ctx: Context<CreatePaymentRequest>,
        amount: u64,
        description: String,
        expires_in: i64,
    ) -> Result<()> {
        instructions::payment::create_payment_request(ctx, amount, description, expires_in)
    }

    pub fn settle_payment_request(ctx: Context<SettlePaymentRequest>) -> Result<()> {
        instructions::payment::settle_payment_request(ctx)
    }

    pub fn cancel_payment_request(ctx: Context<CancelPaymentRequest>) -> Result<()> {
        instructions::payment::cancel_payment_request(ctx)
    }

    // Treasury instructions
    pub fn withdraw_from_treasury(
        ctx: Context<WithdrawFromTreasury>,
        amount: u64,
    ) -> Result<()> {
        instructions::treasury::withdraw_from_treasury(ctx, amount)
    }

    pub fn deposit_to_treasury(ctx: Context<DepositToTreasury>, amount: u64) -> Result<()> {
        instructions::treasury::deposit_to_treasury(ctx, amount)
    }
}
