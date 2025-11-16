# Membership NFT System

## Overview

When a user joins a community, a unique membership NFT is automatically minted and sent to their wallet. This NFT represents their membership and is displayed in their profile.

## How It Works

### 1. NFT Minting on Join

When a user clicks "Join Community":

```typescript
// Frontend derives NFT mint PDA
const [membershipNftMint] = PublicKey.findProgramAddressSync(
  [Buffer.from("membership_nft"), communityPda.toBuffer(), wallet.publicKey.toBuffer()],
  program.programId
);

// Contract mints NFT with metadata
program.methods.registerMember(name, metadataUri)
  .accounts({
    membershipNftMint,  // Unique NFT for this member
    memberNftTokenAccount,  // Member's token account
    nftMetadata,  // Metaplex metadata account
    // ...
  })
```

### 2. NFT Properties

Each membership NFT has:
- **Unique Mint**: One per member per community
- **Name**: "{Community Name} Member #{number}"
- **Symbol**: "{TokenSymbol}MEM" (e.g., "DAOMEM")
- **Supply**: 1 (non-fungible)
- **Decimals**: 0
- **Collection**: Linked to community collection mint
- **Metadata URI**: Stored on-chain, points to JSON metadata

### 3. Metadata Structure

The NFT metadata follows Metaplex standard:

```json
{
  "name": "DevDAO Member #1",
  "symbol": "DEVMEM",
  "description": "Membership NFT for DevDAO community",
  "image": "https://arweave.net/...",
  "attributes": [
    {
      "trait_type": "Community",
      "value": "DevDAO"
    },
    {
      "trait_type": "Member Number",
      "value": "1"
    },
    {
      "trait_type": "Join Date",
      "value": "2024-11-16"
    }
  ]
}
```

## Contract Implementation

### State Changes

**Member struct updated:**
```rust
pub struct Member {
    // ... existing fields
    pub membership_nft: Option<Pubkey>,  // NEW: NFT mint address
    // ...
}
```

### Registration Flow

```rust
pub fn register_member(
    ctx: Context<RegisterMember>,
    name: String,
    metadata_uri: String,
) -> Result<()> {
    // 1. Create member account
    member.membership_nft = Some(ctx.accounts.membership_nft_mint.key());
    
    // 2. Mint NFT (1 token with 0 decimals)
    token::mint_to(cpi_ctx, 1)?;
    
    // 3. Create Metaplex metadata
    create_metadata_accounts_v3(
        metadata_ctx,
        data_v2,  // Name, symbol, URI, collection
        true,  // is_mutable
        true,  // update_authority_is_signer
        None,  // collection_details
    )?;
    
    Ok(())
}
```

### Required Accounts

```rust
pub struct RegisterMember<'info> {
    #[account(init, ...)]
    pub member: Account<'info, Member>,
    
    #[account(mut)]
    pub community: Account<'info, Community>,
    
    // NFT mint (unique per member)
    #[account(
        init,
        mint::decimals = 0,
        mint::authority = community,
        seeds = [b"membership_nft", community.key(), wallet.key()],
        bump
    )]
    pub membership_nft_mint: Account<'info, Mint>,
    
    // Member's token account for NFT
    #[account(
        init_if_needed,
        associated_token::mint = membership_nft_mint,
        associated_token::authority = wallet
    )]
    pub member_nft_token_account: Account<'info, TokenAccount>,
    
    // Metaplex metadata account
    #[account(mut)]
    pub nft_metadata: UncheckedAccount<'info>,
    
    pub metadata_program: Program<'info, MetadataProgram>,
    // ... other programs
}
```

## Frontend Implementation

### 1. Minting (Join Community)

**File**: `apps/frontend/app/communities/page.tsx`

```typescript
const joinCommunity = async () => {
  // Derive NFT mint PDA
  const [membershipNftMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("membership_nft"), communityPda.toBuffer(), wallet.publicKey.toBuffer()],
    program.programId
  );

  // Derive associated token account
  const [memberNftTokenAccount] = PublicKey.findProgramAddressSync(
    [wallet.publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), membershipNftMint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  // Derive metadata account
  const [nftMetadata] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), membershipNftMint.toBuffer()],
    METADATA_PROGRAM_ID
  );

  // Call contract
  await program.methods
    .registerMember(name, metadataUri)
    .accounts({
      membershipNftMint,
      memberNftTokenAccount,
      nftMetadata,
      metadataProgram: METADATA_PROGRAM_ID,
      // ...
    })
    .rpc();
};
```

### 2. Fetching NFT Data

**File**: `apps/frontend/hooks/useMembershipNFT.ts`

```typescript
export function useMembershipNFT(communityId: string) {
  const fetchMembershipNFT = async () => {
    // 1. Fetch member account
    const memberAccount = await program.account.member.fetch(memberPda);
    
    // 2. Get NFT mint from member account
    const nftMint = memberAccount.membershipNft;
    
    // 3. Fetch metadata account
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), nftMint.toBuffer()],
      METADATA_PROGRAM_ID
    );
    
    // 4. Parse metadata
    const metadataAccount = await connection.getAccountInfo(metadataPda);
    
    // 5. Optionally fetch JSON from URI
    const response = await fetch(metadata.uri);
    const json = await response.json();
    
    return { mint, name, symbol, uri, image: json.image };
  };
}
```

### 3. Displaying NFT

**File**: `apps/frontend/components/MembershipNFT.tsx`

```typescript
export function MembershipNFT({ communityId, size = 'md' }) {
  const { nft, loading } = useMembershipNFT(communityId);
  
  return (
    <div className="relative group">
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
        {nft.image ? (
          <img src={nft.image} alt={nft.name} />
        ) : (
          <div>{nft.name.charAt(0)}</div>
        )}
      </div>
      
      {/* Hover overlay with details */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100">
        <p>{nft.name}</p>
        <p>{nft.symbol}</p>
        <a href={`https://explorer.solana.com/address/${nft.mint}`}>
          View on Explorer
        </a>
      </div>
    </div>
  );
}
```

### 4. Profile Display

**File**: `apps/frontend/app/communities/[id]/page.tsx`

The NFT is displayed in a sidebar on the community dashboard:

```typescript
<div className="lg:col-span-1">
  <MembershipNFTCard communityId={communityId} />
  
  {/* Member stats */}
  <div>
    <p>Reputation: {userMembership.reputation}</p>
    <p>Events: {userMembership.eventsAttended}</p>
  </div>
</div>
```

## Features

### ✅ Implemented

1. **Automatic Minting**: NFT minted when joining community
2. **Unique Per Member**: Each member gets their own NFT
3. **Metaplex Standard**: Compatible with all Solana wallets
4. **Collection Linked**: Part of community collection
5. **On-Chain Metadata**: Name, symbol, URI stored on-chain
6. **Profile Display**: Shows in member's dashboard
7. **Hover Details**: View mint address, explorer link
8. **Responsive Design**: Works on mobile and desktop

### 🔄 Future Enhancements

1. **IPFS/Arweave Storage**: Upload metadata to decentralized storage
2. **Dynamic Images**: Generate unique images per member
3. **Traits/Attributes**: Add member-specific traits
4. **Leveling System**: Update NFT as member progresses
5. **Transferability**: Make NFTs soulbound (non-transferable)
6. **Verification**: Verify collection membership
7. **Marketplace**: Allow trading (if transferable)

## Metadata Hosting

### Current Implementation

Metadata URI is a placeholder:
```typescript
const metadataUri = `https://arweave.net/membership/${communityPda}/${wallet.publicKey}`;
```

### Recommended: Upload to Arweave

```typescript
import { bundlrStorage } from '@metaplex-foundation/js';

// Upload metadata JSON
const metadata = {
  name: `${community.name} Member #${memberCount}`,
  symbol: `${community.tokenSymbol}MEM`,
  description: `Membership NFT for ${community.name}`,
  image: imageUri,  // Upload image first
  attributes: [
    { trait_type: "Community", value: community.name },
    { trait_type: "Member Number", value: memberCount.toString() },
    { trait_type: "Join Date", value: new Date().toISOString() },
  ],
};

const uri = await bundlrStorage.upload(JSON.stringify(metadata));
```

## Testing

### 1. Join Community
```bash
# User joins community
# → NFT is minted
# → Metadata is created
# → NFT appears in wallet
```

### 2. View in Wallet
- Open Phantom/Solflare
- Go to Collectibles
- See membership NFT

### 3. View on Dashboard
- Go to community dashboard
- See NFT in sidebar
- Hover for details

### 4. Verify on Explorer
- Click "View on Explorer"
- See NFT mint address
- See metadata account
- See token account

## Benefits

1. **Proof of Membership**: NFT proves community membership
2. **Portable**: Can be viewed in any Solana wallet
3. **Tradeable**: Can be transferred (if enabled)
4. **Collectible**: Members can collect from multiple communities
5. **Verifiable**: Anyone can verify membership on-chain
6. **Programmable**: Can add utility (access, voting weight, etc.)

## Summary

The membership NFT system provides:
- ✅ Automatic minting on join
- ✅ Unique NFT per member
- ✅ Metaplex standard compliance
- ✅ On-chain metadata
- ✅ Profile display
- ✅ Wallet integration
- ✅ Explorer verification

Members now receive a beautiful, verifiable NFT when they join any community! 🎉
