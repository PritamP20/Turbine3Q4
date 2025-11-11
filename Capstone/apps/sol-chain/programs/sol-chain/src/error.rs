// errors.rs
use anchor_lang::prelude::*;

#[error_code]
pub enum SocialChainError {
    // ========== COMMUNITY ERRORS ==========
    #[msg("Unauthorized: Only admin can perform this action")]
    Unauthorized,
    
    #[msg("Invalid community name: must be 3-50 characters")]
    InvalidCommunityName,
    
    #[msg("Community already exists")]
    CommunityAlreadyExists,
    
    #[msg("Invalid governance threshold: must be 1-100")]
    InvalidGovernanceThreshold,
    
    #[msg("Invalid transfer fee: must be 0-1000 basis points")]
    InvalidTransferFee,
    
    // ========== MEMBER ERRORS ==========
    #[msg("Member already registered")]
    MemberAlreadyRegistered,
    
    #[msg("Member not found")]
    MemberNotFound,
    
    #[msg("Invalid member name: must be 1-50 characters")]
    InvalidMemberName,
    
    #[msg("Invalid metadata URI")]
    InvalidMetadataUri,
    
    // ========== TOKEN ERRORS ==========
    #[msg("Insufficient tokens")]
    InsufficientTokens,
    
    #[msg("Invalid token amount")]
    InvalidTokenAmount,
    
    #[msg("Token transfer failed")]
    TokenTransferFailed,
    
    #[msg("Token mint failed")]
    TokenMintFailed,
    
    #[msg("Token burn failed")]
    TokenBurnFailed,
    
    #[msg("Invalid decimals: must be 0-9")]
    InvalidDecimals,
    
    #[msg("Batch transfer array mismatch")]
    BatchTransferMismatch,
    
    // ========== NFC CARD ERRORS ==========
    #[msg("Invalid NFC card")]
    InvalidNfcCard,
    
    #[msg("NFC card already exists")]
    NfcCardAlreadyExists,
    
    #[msg("NFC card not active")]
    NfcCardNotActive,
    
    #[msg("NFC card not found")]
    NfcCardNotFound,
    
    #[msg("Invalid card ID")]
    InvalidCardId,
    
    #[msg("NFC authentication failed")]
    NfcAuthenticationFailed,
    
    #[msg("Cannot transfer card to same owner")]
    CannotTransferToSameOwner,
    
    // ========== GOVERNANCE ERRORS ==========
    #[msg("Proposal voting period has ended")]
    VotingPeriodEnded,
    
    #[msg("Proposal not approved")]
    ProposalNotApproved,
    
    #[msg("Proposal already executed")]
    ProposalAlreadyExecuted,
    
    #[msg("Proposal not active")]
    ProposalNotActive,
    
    #[msg("Already voted on this proposal")]
    AlreadyVoted,
    
    #[msg("Invalid voting period")]
    InvalidVotingPeriod,
    
    #[msg("Invalid proposal title")]
    InvalidProposalTitle,
    
    #[msg("Invalid proposal description")]
    InvalidProposalDescription,
    
    #[msg("Cannot cancel executed proposal")]
    CannotCancelExecutedProposal,
    
    #[msg("Voting period not ended")]
    VotingPeriodNotEnded,
    
    // ========== EVENT ERRORS ==========
    #[msg("Event already closed")]
    EventClosed,
    
    #[msg("Event not started yet")]
    EventNotStarted,
    
    #[msg("Event already ended")]
    EventEnded,
    
    #[msg("Maximum attendees reached")]
    MaxAttendeesReached,
    
    #[msg("Already registered for event")]
    AlreadyRegistered,
    
    #[msg("Invalid event time")]
    InvalidEventTime,
    
    #[msg("Event not found")]
    EventNotFound,
    
    #[msg("Invalid event name")]
    InvalidEventName,
    
    #[msg("Event cancelled")]
    EventCancelled,
    
    // ========== CONNECTION ERRORS ==========
    #[msg("Invalid connection")]
    InvalidConnection,
    
    #[msg("Connection already exists")]
    ConnectionAlreadyExists,
    
    #[msg("Cannot connect to self")]
    CannotConnectToSelf,
    
    #[msg("Connection not found")]
    ConnectionNotFound,
    
    #[msg("Invalid connection metadata")]
    InvalidConnectionMetadata,
    
    // ========== PAYMENT ERRORS ==========
    #[msg("Payment failed")]
    PaymentFailed,
    
    #[msg("Invalid payment amount")]
    InvalidPaymentAmount,
    
    #[msg("Payment request expired")]
    PaymentRequestExpired,
    
    #[msg("Payment request not found")]
    PaymentRequestNotFound,
    
    #[msg("Payment request already settled")]
    PaymentRequestAlreadySettled,
    
    #[msg("Invalid payment memo")]
    InvalidPaymentMemo,
    
    #[msg("Cannot pay self")]
    CannotPaySelf,
    
    // ========== TREASURY ERRORS ==========
    #[msg("Insufficient treasury balance")]
    InsufficientTreasuryBalance,
    
    #[msg("Invalid withdrawal amount")]
    InvalidWithdrawalAmount,
    
    #[msg("Withdrawal requires approved proposal")]
    WithdrawalRequiresProposal,
    
    #[msg("Invalid deposit amount")]
    InvalidDepositAmount,
    
    // ========== REPUTATION ERRORS ==========
    #[msg("Invalid reputation delta")]
    InvalidReputationDelta,
    
    #[msg("Reputation reason required")]
    ReputationReasonRequired,
    
    // ========== GENERAL ERRORS ==========
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow,
    
    #[msg("Invalid timestamp")]
    InvalidTimestamp,
    
    #[msg("String too long")]
    StringTooLong,
    
    #[msg("Invalid input")]
    InvalidInput,
    
    #[msg("Operation not allowed")]
    OperationNotAllowed,
    
    #[msg("Account mismatch")]
    AccountMismatch,
    
    #[msg("Invalid signer")]
    InvalidSigner,
}