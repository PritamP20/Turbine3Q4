# Community Token System

## Overview

Each community automatically gets its own custom SPL token when created. This token is used for governance, rewards, and community engagement.

## Token Creation

### Automatic Creation
When a community is initialized, the contract automatically creates:

1. **Token Mint** - SPL token with 9 decimals
   - Seed: `["token_mint", community_name]`
   - Authority: Community PDA
   - Symbol: User-defined (e.g., "DAO", "COMM")

2. **Collection Mint** - NFT collection with 0 decimals
   - Seed: `["collection_mint", community_name]`
   - Authority: Community PDA
   - Used for NFC cards and membership NFTs

3. **Treasury** - Community treasury account
   - Seed: `["treasury", community_pda]`
   - Holds community funds

### Frontend Implementation

```typescript
// Already implemented in communities/page.tsx
const [tokenMintPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_mint"), Buffer.from(communityName)],
  program.programId
);

await program.methods
  .initializeCommunity(communityName, tokenSymbol, 9, governanceThreshold)
  .accounts({
    tokenMint: tokenMintPda,
    // ... other accounts
  })
  .rpc();
```

## Token Use Cases

### 1. Governance
- Token holders can vote on proposals
- Voting power = token balance
- Threshold set by community (e.g., 51%)

### 2. Rewards
- Event attendance rewards
- Contribution rewards
- Reputation-based rewards

### 3. Transfers
- P2P transfers between members
- Batch transfers (airdrops)
- Optional transfer fees (set by admin)

### 4. Treasury Management
- Community funds held in treasury
- Admin can withdraw for expenses
- Members can deposit to support community

## Token Operations

### Admin Operations (via Admin Panel)

#### 1. Transfer Tokens
```typescript
await program.methods
  .transferTokens(amount, memo)
  .accounts({
    community: communityPda,
    from: adminTokenAccount,
    to: recipientTokenAccount,
    // ...
  })
  .rpc();
```

#### 2. Batch Transfer
```typescript
await program.methods
  .batchTransfer(amounts)
  .accounts({
    community: communityPda,
    // ...
  })
  .rpc();
```

#### 3. Burn Tokens
```typescript
await program.methods
  .burnTokens(amount)
  .accounts({
    community: communityPda,
    tokenAccount: adminTokenAccount,
    // ...
  })
  .rpc();
```

### Member Operations

#### Claim Rewards
```typescript
await program.methods
  .claimReward(period, rank, amount)
  .accounts({
    community: communityPda,
    member: memberPda,
    // ...
  })
  .rpc();
```

## Token Economics

### Supply Management
- **Initial Supply**: 0 (no pre-mine)
- **Minting**: Only through program (rewards, etc.)
- **Burning**: Admin can burn to reduce supply
- **Max Supply**: No hard cap (controlled by governance)

### Transfer Fees
- Set by admin (in basis points)
- Default: 0 bps (0%)
- Max: 1000 bps (10%)
- Fees go to treasury

### Distribution Methods
1. **Event Rewards** - Attend events, earn tokens
2. **Reputation Rewards** - High reputation earns tokens
3. **Governance Participation** - Vote on proposals
4. **Admin Airdrops** - Batch transfers to members

## Token Metadata

### On-Chain Data
- Mint address (PDA)
- Decimals: 9
- Authority: Community PDA
- Symbol: User-defined

### Display
- Symbol shown in UI (e.g., "$DAO")
- Balance shown with decimals
- Transactions on Solana Explorer

## Integration Status

### ✅ Already Implemented
- Token creation on community init
- Token mint PDA derivation
- Display in community cards
- Admin panel token operations UI

### 🔄 Ready for Integration
- Actual token transfers
- Reward distribution
- Balance fetching
- Transaction history

## Example: Complete Token Flow

### 1. Create Community
```typescript
// User creates "DevDAO" with symbol "DEV"
initializeCommunity("DevDAO", "DEV", 9, 51)
// → Creates token mint at PDA
// → Symbol: DEV
// → Decimals: 9
```

### 2. Member Joins
```typescript
// Member registers
registerMember("Alice", "metadata_uri")
// → Creates member account
// → Creates associated token account for DEV tokens
```

### 3. Earn Tokens
```typescript
// Alice attends event
recordAttendance(cardId)
// → If event has token_reward
// → Mints tokens to Alice's account
```

### 4. Use Tokens
```typescript
// Alice votes on proposal
castVote(voteType)
// → Voting power = Alice's DEV token balance
```

### 5. Transfer Tokens
```typescript
// Alice sends tokens to Bob
transferTokens(amount, "Thanks for helping!")
// → Transfers DEV tokens
// → Optional fee to treasury
```

## Admin Panel Integration

The admin panel already has UI for:
- ✅ Viewing token symbol
- ✅ Transfer tokens (single)
- ✅ Batch transfer (multiple recipients)
- ✅ Burn tokens
- ✅ View supply statistics

To complete integration, implement the contract calls in:
- `apps/frontend/components/admin/TokenOperations.tsx`

## Security Considerations

1. **Mint Authority**: Only community PDA can mint
2. **Admin Controls**: Only admin can burn/transfer from treasury
3. **Transfer Fees**: Capped at 10% maximum
4. **Governance**: Token holders control community decisions

## Resources

- Contract: `apps/sol-chain/programs/sol-chain/src/instructions/token.rs`
- Frontend: `apps/frontend/app/communities/page.tsx`
- Admin Panel: `apps/frontend/components/admin/TokenOperations.tsx`
- State: `apps/sol-chain/programs/sol-chain/src/state/mod.rs`
