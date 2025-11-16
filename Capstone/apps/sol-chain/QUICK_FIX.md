# Quick Fix for AccountDidNotDeserialize Error

## The Problem

You added a new field (`membership_nft`) to the Member struct, but existing member accounts on devnet still have the old structure. When you try to create an event, it can't deserialize the old member account.

## The Solution (2 Steps)

### Step 1: Close Old Program & Redeploy

Run this command in the `apps/sol-chain` directory:

```bash
./reset-devnet.sh
```

Or manually:

```bash
# Get your program ID
solana address -k target/deploy/sol_chain-keypair.json

# Close it (get SOL back)
solana program close <PROGRAM_ID> --url devnet --bypass-warning

# Redeploy with new structure
anchor build
anchor deploy --provider.cluster devnet
```

### Step 2: Rejoin Communities

1. Go to your app
2. Find the community you were in
3. Click "Join Community" again
4. This will create a new member account with the NFT field
5. Now you can create events!

## Why This Works

- **Old member account**: Didn't have `membership_nft` field
- **New member account**: Has `membership_nft` field + mints NFT
- **Event creation**: Now works because member account has correct structure

## What You'll Get

After rejoining:
- ✅ New member account with correct structure
- ✅ Membership NFT minted to your wallet
- ✅ NFT visible on dashboard
- ✅ Can create events without errors
- ✅ All admin features work

## Alternative: Manual Steps

If the script doesn't work:

```bash
# 1. Get program ID
PROGRAM_ID=$(solana address -k target/deploy/sol_chain-keypair.json)
echo $PROGRAM_ID

# 2. Close program
solana program close $PROGRAM_ID --url devnet --bypass-warning

# 3. Rebuild
anchor build

# 4. Redeploy
anchor deploy --provider.cluster devnet

# 5. Rejoin communities in the app
```

## Verification

After rejoining, test:

1. **Check member account**:
   - Should have `membership_nft` field
   - Should have NFT mint address

2. **Check wallet**:
   - Should see membership NFT
   - In Phantom/Solflare collectibles

3. **Create event**:
   - Go to Admin Panel
   - Events tab
   - Create event
   - Should work! ✅

## Summary

**Problem**: Old member accounts don't have new field
**Solution**: Close program → Redeploy → Rejoin
**Result**: Everything works with NFT support! 🎉

This is normal in development when changing account structures!
