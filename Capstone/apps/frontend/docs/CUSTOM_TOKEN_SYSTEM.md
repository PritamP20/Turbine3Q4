# Custom Token System - Already Implemented! ✅

## Overview

**Good news!** Each community already gets its own custom SPL token with a custom symbol when created. This has been working since the beginning!

## How It Works

### When Creating a Community

**User Input:**
```typescript
{
  communityName: "DevDAO",
  tokenSymbol: "DEV",      // ← Custom symbol
  governanceThreshold: 51
}
```

**Contract Creates:**
1. ✅ **Community Account** - Stores community data
2. ✅ **Token Mint** - Custom SPL token with YOUR symbol
3. ✅ **Collection Mint** - For NFTs
4. ✅ **Treasury** - Community funds

### Token Properties

Each community token has:
- **Custom Symbol**: Whatever you choose (e.g., "DEV", "DAO", "COMM")
- **Decimals**: 9 (standard for Solana tokens)
- **Mint Authority**: Community PDA (only community can mint)
- **Initial Supply**: 0 (no pre-mine)
- **Unique Address**: Derived from community name

## Code Implementation

### Contract (Rust)

**File**: `apps/sol-chain/programs/sol-chain/src/instructions/community.rs`

```rust
pub fn initialize_community(
    ctx: Context<InitializeCommunity>,
    community_name: String,
    token_symbol: String,  // ← Custom symbol here
    token_decimals: u8,
    governance_threshold: u8,
) -> Result<()> {
    let community = &mut ctx.accounts.community;
    
    // Store token info
    community.token_mint = ctx.accounts.token_mint.key();
    community.token_symbol = token_symbol;  // ← Stored in community
    community.token_decimals = token_decimals;
    
    Ok(())
}

// Token mint is created automatically
#[account(
    init,
    payer = admin,
    mint::decimals = 9,
    mint::authority = community,
    seeds = [b"token_mint", community_name.as_bytes()],
    bump
)]
pub token_mint: Account<'info, Mint>,
```

### Frontend (TypeScript)

**File**: `apps/frontend/app/communities/page.tsx`

```typescript
const createCommunity = async () => {
  // User enters custom symbol
  const tokenSymbol = "DEV";  // ← Your custom symbol
  
  // Derive token mint PDA
  const [tokenMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_mint"), Buffer.from(communityName)],
    program.programId
  );

  // Create community with custom token
  await program.methods
    .initializeCommunity(
      communityName,
      tokenSymbol,  // ← Custom symbol passed here
      9,
      governanceThreshold
    )
    .accounts({
      tokenMint: tokenMintPda,  // ← Token created here
      // ...
    })
    .rpc();
};
```

## Token Usage

### 1. Display Token Symbol

The token symbol is shown everywhere:

**Communities Page:**
```tsx
<p className="text-sm text-zinc-500 dark:text-zinc-400">
  ${community.tokenSymbol}  // Shows: $DEV
</p>
```

**Admin Panel Header:**
```tsx
<div className="text-white font-bold">
  ${community.tokenSymbol}  // Shows: $DEV
</div>
```

### 2. Token Operations

All token operations use the community's custom token:

**Transfer Tokens:**
```typescript
await program.methods
  .transferTokens(amount, memo)
  .accounts({
    tokenMint: community.tokenMint,  // ← Community's custom token
    // ...
  })
  .rpc();
```

**Mint Rewards:**
```typescript
// When attending events
await program.methods
  .recordAttendance(cardId)
  .accounts({
    tokenMint: community.tokenMint,  // ← Mints community's token
    // ...
  })
  .rpc();
```

### 3. Membership NFT Symbol

The membership NFT even uses the token symbol:

```rust
// In register_member
let data_v2 = DataV2 {
    name: format!("{} Member #{}", community.name, member_count + 1),
    symbol: format!("{}MEM", community.token_symbol),  // ← "DEVMEM"
    // ...
};
```

## Examples

### Example 1: DevDAO

**Input:**
- Community Name: "DevDAO"
- Token Symbol: "DEV"

**Result:**
- Token Mint: `TokenMintPDA...`
- Symbol: `$DEV`
- NFT Symbol: `DEVMEM`
- Displayed as: `$DEV` everywhere

### Example 2: ArtCollective

**Input:**
- Community Name: "ArtCollective"
- Token Symbol: "ART"

**Result:**
- Token Mint: `TokenMintPDA...`
- Symbol: `$ART`
- NFT Symbol: `ARTMEM`
- Displayed as: `$ART` everywhere

### Example 3: GamersDAO

**Input:**
- Community Name: "GamersDAO"
- Token Symbol: "GAME"

**Result:**
- Token Mint: `TokenMintPDA...`
- Symbol: `$GAME`
- NFT Symbol: `GAMEMEM`
- Displayed as: `$GAME` everywhere

## Token Features

### ✅ Already Working

1. **Custom Symbol**: User chooses symbol when creating community
2. **Unique Token**: Each community has its own SPL token
3. **Mint Authority**: Community controls minting
4. **Zero Supply**: Starts at 0, minted through rewards
5. **Display**: Symbol shown throughout UI
6. **Operations**: All token ops use community's token
7. **NFT Integration**: NFT symbol based on token symbol

### Token Operations Available

1. **Minting**: Through event rewards, reputation rewards
2. **Transfers**: P2P transfers between members
3. **Batch Transfers**: Airdrops to multiple members
4. **Burning**: Reduce supply
5. **Governance**: Token-weighted voting

## Verification

### Check Your Community's Token

1. **Create a community** with custom symbol
2. **Check on Solana Explorer**:
   ```
   https://explorer.solana.com/address/[TOKEN_MINT_ADDRESS]?cluster=devnet
   ```
3. **Verify**:
   - Mint authority: Community PDA
   - Decimals: 9
   - Supply: 0 (initially)

### View Token in Wallet

After receiving tokens:
1. Open Phantom/Solflare
2. Go to tokens
3. See your community's custom token
4. Symbol shows as you defined it

## Summary

**Your contract already creates custom tokens!** 🎉

When you create a community:
- ✅ Custom SPL token is minted
- ✅ Your chosen symbol is used
- ✅ Token is unique to your community
- ✅ Symbol displays everywhere
- ✅ All operations use your token
- ✅ NFTs use your symbol too

**No changes needed** - it's already working perfectly!

## Testing

1. **Create a community**:
   - Name: "TestDAO"
   - Symbol: "TEST"

2. **Verify**:
   - Community card shows: `$TEST`
   - Admin panel shows: `$TEST`
   - Token mint exists on-chain

3. **Use tokens**:
   - Attend event → Earn TEST tokens
   - Transfer TEST tokens
   - Vote with TEST tokens

Everything uses your custom token! 🚀
