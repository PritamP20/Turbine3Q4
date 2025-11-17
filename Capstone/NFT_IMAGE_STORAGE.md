# NFT Image Storage Solution

## Problem
NFT images were only stored in localStorage and not accessible from the blockchain, making them invisible to other users and not truly on-chain.

## Solution
Images are now embedded directly in the NFT metadata URI as base64-encoded data URLs.

## How It Works

### 1. When Joining a Community (Image Upload)
- User uploads an image file
- Image is converted to a base64 data URL
- Metadata JSON is created with:
  - `name`: Member name
  - `description`: Community membership description
  - `image`: Base64 data URL of the uploaded image
  - `attributes`: Community and member traits
- The entire metadata JSON is base64-encoded and stored as a data URI
- This data URI is stored on-chain in the `metadataUri` field

### 2. When Displaying NFTs
- The `metadataUri` is fetched from the blockchain
- If it's a data URI (`data:application/json;base64,...`), it's decoded
- The image data URL is extracted from the metadata
- The image is displayed directly from the decoded data

### 3. Fallback Mechanism
- If metadata parsing fails, falls back to localStorage
- This ensures backward compatibility with existing NFTs

## Benefits
- ✅ Images are truly on-chain (embedded in metadata)
- ✅ Visible to all users who query the blockchain
- ✅ No external storage service needed
- ✅ Works immediately without additional infrastructure
- ✅ Backward compatible with existing NFTs

## Files Modified
1. `apps/frontend/app/communities/page.tsx` - Updated `joinCommunity` to embed images in metadata
2. `apps/frontend/components/dashboard/MembersDirectory.tsx` - Parse metadata URI to extract images
3. `apps/frontend/hooks/useMembershipNFT.ts` - Parse metadata URI for NFT display

## Limitations
- Image size should be reasonable (< 100KB recommended) to avoid transaction size limits
- Larger images may fail to mint due to Solana transaction size limits
- Consider compressing images before upload for best results

## Future Improvements
- Add image compression before encoding
- Implement IPFS or Arweave for larger images
- Add image size validation in the upload modal
