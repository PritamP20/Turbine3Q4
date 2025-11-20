// Token state
//
// This module intentionally has no custom state structs.
// Token operations use the standard SPL Token program's Mint and TokenAccount types.
// All token-related state is managed through:
// - Community struct (stores token_mint, token_symbol, token_decimals, transfer_fee_bps)
// - SPL Token Mint account (stores total supply, decimals, mint authority)
// - SPL Token TokenAccount (stores individual token balances)
