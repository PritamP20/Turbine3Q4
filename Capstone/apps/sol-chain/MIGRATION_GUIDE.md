# Member Account Migration Guide

## Problem

After adding the `membership_nft` field to the Member struct, existing member accounts can't be deserialized because they have the old structure.

**Error**: `AccountDidNotDeserialize` when trying to create events or perform member operations.

## Solution Options

### Option 1: Reset Development Environment (Recommended)

Since you're in development, the easiest approach is to start fresh:

#### Step 1: Close Old Program Accounts

```bash
# Close the program and get SOL back
solana program close <PROGRAM_ID> --url devnet

# Or if you want to keep the program ID, you can:
# 1. Close all member accounts manually
# 2. Redeploy the program
```

#### Step 2: Redeploy Program

```bash
cd apps/sol-chain

# Build with new structure
anchor build

# Deploy (this will upgrade the program)
anchor deploy --provider.cluster devnet
```

#### Step 3: Rejoin Communities

All users need to rejoin their communities. The new registration will:
- Create member account with new structure
- Mint membership NFT
- Store NFT mint address

### Option 2: Add Migration Instruction (Production Approach)

For production, you'd add a migration instruction:

```rust
pub fn migrate_member_v2(ctx: Context<MigrateMember>) -> Result<()> {
    let old_member = &ctx.accounts.old_member;
    let new_member = &mut ctx.accounts.new_member;
    
    // Copy old data
    new_member.community = old_member.community;
    new_member.wallet = old_member.wallet;
    new_member.name = old_member.name.clone();
    // ... copy all old fields
    
    // Set new field
    new_member.membership_nft = None; // Or mint NFT here
    
    Ok(())
}
```

But this is complex and not needed for development.

## Quick Fix for Development

### Step 1: Get Your Program ID

```bash
solana address -k target/deploy/sol_chain-keypair.json
```

### Step 2: Close the Program (Get SOL Back)

```bash
solana program close <YOUR_PROGRAM_ID> --url devnet
```

### Step 3: Redeploy

```bash
anchor build
anchor deploy --provider.cluster devnet
```

### Step 4: Update Frontend

Update the program ID in `apps/frontend/lib/anchor-setup.ts`:

```typescript
export const PROGRAM_ID = new PublicKey("YOUR_NEW_PROGRAM_ID");
```

### Step 5: Rejoin Communities

1. Go to communities page
2. Click "Join Community" again
3. This time it will create the new member account with NFT

## Why This Happens

When you change the structure of an account:

**Old Structure:**
```rust
pub struct Member {
    // ... fields
    pub nfc_card: Option<Pubkey>,
    pub joined_at: i64,
    pub bump: u8,
}
// Total size: X bytes
```

**New Structure:**
```rust
pub struct Member {
    // ... fields
    pub nfc_card: Option<Pubkey>,
    pub membership_nft: Option<Pubkey>,  // NEW FIELD
    pub joined_at: i64,
    pub bump: u8,
}
// Total size: X + 33 bytes
```

The deserializer expects the new structure but finds the old one on-chain.

## Prevention for Future

### 1. Use Versioning

```rust
pub struct MemberV1 { ... }
pub struct MemberV2 { ... }
```

### 2. Reserve Space

```rust
pub struct Member {
    // ... fields
    pub reserved: [u8; 128],  // Reserve for future use
}
```

### 3. Use Dynamic Accounts

Use `Vec` or `String` for fields that might change.

## Current Status

After redeploying:
- ✅ New member accounts will have `membership_nft` field
- ✅ NFT will be minted on join
- ✅ Events can be created
- ✅ All features will work

## Testing After Migration

1. **Rejoin Community**:
   ```
   - Connect wallet
   - Go to communities
   - Click "Join Community"
   - Verify NFT minted
   ```

2. **Create Event**:
   ```
   - Go to Admin Panel
   - Events tab
   - Create new event
   - Should work now!
   ```

3. **Verify NFT**:
   ```
   - Check wallet (Phantom/Solflare)
   - See NFT in collectibles
   - View on dashboard
   ```

## Summary

**For Development**: Close program → Redeploy → Rejoin communities

**For Production**: Would need migration instruction, but we're not there yet.

The error will be fixed once you redeploy and rejoin! 🚀
