# Community Token Creation Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER CREATES COMMUNITY                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend Form:                                                  │
│  • Community Name: "DevDAO"                                      │
│  • Token Symbol: "DEV"                                           │
│  • Governance Threshold: 51%                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Derive PDAs:                                                    │
│  • Community PDA    = ["community", "DevDAO"]                    │
│  • Token Mint PDA   = ["token_mint", "DevDAO"]  ← CUSTOM TOKEN  │
│  • Collection PDA   = ["collection_mint", "DevDAO"]              │
│  • Treasury PDA     = ["treasury", community_pda]                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Call Contract: initialize_community()                           │
│  • Creates Community account                                     │
│  • Creates Token Mint (9 decimals) ✨                           │
│  • Creates Collection Mint (0 decimals)                          │
│  • Creates Treasury account                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  RESULT: Community with Custom Token                             │
│  • Token Symbol: $DEV                                            │
│  • Mint Authority: Community PDA                                 │
│  • Initial Supply: 0                                             │
│  • Ready for: Rewards, Transfers, Governance                     │
└─────────────────────────────────────────────────────────────────┘
```

## Code Flow

### 1. Frontend (communities/page.tsx)

```typescript
// User submits form
const createCommunity = async () => {
  // Derive PDAs
  const [communityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("community"), Buffer.from("DevDAO")],
    program.programId
  );

  const [tokenMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_mint"), Buffer.from("DevDAO")],
    program.programId
  );

  // Call contract
  await program.methods
    .initializeCommunity("DevDAO", "DEV", 9, 51)
    .accounts({
      community: communityPda,
      tokenMint: tokenMintPda,  // ← Custom token created here
      // ...
    })
    .rpc();
};
```

### 2. Contract (community.rs)

```rust
pub fn initialize_community(
    ctx: Context<InitializeCommunity>,
    community_name: String,
    token_symbol: String,
    token_decimals: u8,
    governance_threshold: u8,
) -> Result<()> {
    let community = &mut ctx.accounts.community;
    
    // Store token info
    community.token_mint = ctx.accounts.token_mint.key();
    community.token_symbol = token_symbol;  // "DEV"
    community.token_decimals = token_decimals;  // 9
    
    // Token mint is automatically created by Anchor
    // through the #[account(init, mint::...)] macro
    
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeCommunity<'info> {
    // Token mint created here ✨
    #[account(
        init,
        payer = admin,
        mint::decimals = 9,
        mint::authority = community,  // Community controls minting
        seeds = [b"token_mint", community_name.as_bytes()],
        bump
    )]
    pub token_mint: Account<'info, Mint>,
    // ...
}
```

### 3. Result

After creation, the community has:

```typescript
{
  name: "DevDAO",
  tokenSymbol: "DEV",
  tokenMint: "TokenMintPDA...",  // Unique address
  tokenDecimals: 9,
  admin: "AdminPublicKey...",
  memberCount: 0,
  // ...
}
```

## Token Usage Examples

### Example 1: Event Rewards

```
User attends event
    ↓
Contract mints 100 DEV tokens
    ↓
Tokens sent to user's associated token account
    ↓
User now has 100 $DEV
```

### Example 2: Governance Voting

```
Proposal created
    ↓
User votes with 100 $DEV tokens
    ↓
Voting power = 100
    ↓
Proposal passes if threshold met
```

### Example 3: P2P Transfer

```
Alice has 100 $DEV
    ↓
Alice sends 50 $DEV to Bob
    ↓
Transfer fee: 1% = 0.5 $DEV to treasury
    ↓
Bob receives 49.5 $DEV
Alice has 50 $DEV
```

## Key Points

✅ **Automatic Creation**: Token created when community is initialized
✅ **Unique Per Community**: Each community has its own token
✅ **SPL Standard**: Standard Solana token, works with all wallets
✅ **Community Controlled**: Mint authority is the community PDA
✅ **No Pre-mine**: Initial supply is 0
✅ **Flexible**: Can be minted, transferred, burned

## Verification

To verify a community's token:

1. **Get community data**:
```typescript
const community = await program.account.community.fetch(communityPda);
console.log("Token Mint:", community.tokenMint.toString());
console.log("Token Symbol:", community.tokenSymbol);
```

2. **Check token mint**:
```typescript
const mintInfo = await getMint(connection, community.tokenMint);
console.log("Decimals:", mintInfo.decimals);  // 9
console.log("Supply:", mintInfo.supply);  // Current supply
console.log("Authority:", mintInfo.mintAuthority);  // Community PDA
```

3. **View on Explorer**:
```
https://explorer.solana.com/address/[TOKEN_MINT_ADDRESS]?cluster=devnet
```

## Admin Panel Integration

The admin panel shows:
- Token symbol in header
- Token operations tab
- Transfer/burn/batch operations
- Supply statistics

All operations use the community's custom token automatically!
