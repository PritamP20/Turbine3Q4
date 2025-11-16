# NFT Image Upload Feature

## Overview

When joining a community, users can now upload a custom image that will be used for their membership NFT. This creates a personalized NFT that appears in their wallet and profile.

## User Flow

### 1. Click "Join Community"
- User clicks the "Join Community" button on any community card

### 2. Modal Opens
- Beautiful modal appears with:
  - Name input field
  - Image upload area (drag & drop or click)
  - Preview of selected image
  - Information about what happens next

### 3. Upload Image (Optional)
- User can:
  - Click to browse files
  - Drag and drop an image
  - See instant preview
  - Remove and change image
- Supported formats: PNG, JPG, GIF
- Max size: 10MB

### 4. Submit
- User enters name and clicks "Join Community"
- Image is uploaded and processed
- NFT is minted with the custom image
- NFT appears in wallet

## Implementation

### Components

**JoinCommunityModal** (`components/JoinCommunityModal.tsx`)
- Beautiful modal UI
- Image upload with drag & drop
- Image preview
- Form validation
- Loading states

**uploadImage** (`lib/uploadImage.ts`)
- Image upload utilities
- Metadata creation
- Base64 encoding (for now)
- Ready for IPFS/Arweave integration

### Features

✅ **Drag & Drop**: Drag images directly into the upload area
✅ **Click to Upload**: Traditional file picker
✅ **Image Preview**: See image before submitting
✅ **Remove Image**: Change your mind and remove
✅ **Optional**: Can skip image and use default
✅ **Validation**: Only accepts image files
✅ **Loading States**: Shows progress during upload
✅ **Error Handling**: Clear error messages

## Technical Details

### Image Processing

**Current Implementation (Base64):**
```typescript
// Image is converted to base64 data URL
const base64String = await uploadImageToBase64(file);

// Metadata is created with embedded image
const metadata = {
  name: "DevDAO Member #1",
  symbol: "DEVMEM",
  description: "Membership NFT",
  image: base64String,  // Base64 data URL
};

// Metadata is encoded and stored on-chain
const metadataURI = createMetadataURI(metadata);
```

**Future Implementation (IPFS/Arweave):**
```typescript
// Upload image to IPFS
const imageUrl = await uploadImageToIPFS(file);
// Returns: "https://ipfs.io/ipfs/Qm..."

// Upload metadata JSON to IPFS
const metadataUrl = await uploadMetadataToIPFS({
  name: "DevDAO Member #1",
  image: imageUrl,
  // ...
});
// Returns: "https://ipfs.io/ipfs/Qm..."

// Store metadata URL on-chain
```

### Metadata Structure

```json
{
  "name": "DevDAO Member #1",
  "symbol": "DEVMEM",
  "description": "Membership NFT for DevDAO community",
  "image": "data:image/png;base64,iVBORw0KG...",
  "attributes": [
    {
      "trait_type": "Community",
      "value": "DevDAO"
    },
    {
      "trait_type": "Member Number",
      "value": 1
    },
    {
      "trait_type": "Join Date",
      "value": "2024-11-16"
    }
  ]
}
```

### Storage Options

**1. Base64 (Current)**
- ✅ Pros: Simple, no external dependencies, works immediately
- ❌ Cons: Large data size, stored on-chain, expensive

**2. IPFS (Recommended for Production)**
- ✅ Pros: Decentralized, permanent, standard
- ✅ Services: Pinata, NFT.Storage, Web3.Storage
- ❌ Cons: Requires API keys, external service

**3. Arweave (Alternative)**
- ✅ Pros: Permanent storage, pay once
- ✅ Service: Bundlr Network
- ❌ Cons: Requires AR tokens, more complex

**4. Shadow Drive (Solana Native)**
- ✅ Pros: Solana native, fast, cheap
- ✅ Service: GenesysGo Shadow Drive
- ❌ Cons: Newer, less tooling

## Upgrading to IPFS

To upgrade to IPFS storage:

### 1. Get Pinata API Key

```bash
# Sign up at https://pinata.cloud
# Get your JWT token
```

### 2. Add Environment Variable

```bash
# .env.local
NEXT_PUBLIC_PINATA_JWT=your_jwt_token_here
```

### 3. Update uploadImage.ts

```typescript
export async function uploadImageToIPFS(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
    },
    body: formData,
  });
  
  const data = await response.json();
  
  return {
    url: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
    type: 'ipfs',
  };
}

export async function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
  const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });
  
  const data = await response.json();
  
  return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
}
```

### 4. Update Join Flow

```typescript
// In joinCommunity function
if (imageFile) {
  // Upload image to IPFS
  const imageUrl = await uploadImageToIPFS(imageFile);
  
  // Create metadata
  const metadata = {
    name: `${communityName} Member #${memberNumber}`,
    image: imageUrl,  // IPFS URL
    // ...
  };
  
  // Upload metadata to IPFS
  const metadataUri = await uploadMetadataToIPFS(metadata);
}
```

## UI/UX Features

### Modal Design
- Clean, modern interface
- Dark mode support
- Responsive (mobile-friendly)
- Smooth animations
- Clear instructions

### Upload Area
- Large drop zone
- Visual feedback on drag
- Icon and text instructions
- File type hints

### Image Preview
- Full preview before submit
- Remove button overlay
- Maintains aspect ratio
- Rounded corners

### Loading States
- Spinner during upload
- "Uploading & Minting..." text
- Disabled buttons
- Progress indication

### Error Handling
- File type validation
- Size validation
- Upload error messages
- Transaction error messages

## Testing

### Test Cases

1. **Upload PNG Image**
   - Select PNG file
   - Verify preview shows
   - Submit and verify NFT

2. **Upload JPG Image**
   - Select JPG file
   - Verify preview shows
   - Submit and verify NFT

3. **Drag & Drop**
   - Drag image file
   - Drop on upload area
   - Verify preview shows

4. **Remove Image**
   - Upload image
   - Click remove button
   - Verify image cleared

5. **Skip Image**
   - Don't upload image
   - Submit with name only
   - Verify default NFT created

6. **Invalid File**
   - Try to upload PDF
   - Verify error message
   - Verify no preview

7. **Cancel**
   - Open modal
   - Click cancel
   - Verify modal closes

## Benefits

### For Users
- ✅ Personalized NFTs
- ✅ Custom profile pictures
- ✅ Unique identity
- ✅ Easy upload process
- ✅ Instant preview

### For Communities
- ✅ More engaging onboarding
- ✅ Better member profiles
- ✅ Unique NFT collection
- ✅ Professional appearance
- ✅ Member customization

## Summary

The NFT image upload feature is **fully implemented** and ready to use!

**Current Status:**
- ✅ Modal UI complete
- ✅ Image upload working
- ✅ Drag & drop functional
- ✅ Preview working
- ✅ NFT minting with image
- ✅ Base64 encoding working

**Next Steps (Optional):**
- Upgrade to IPFS for production
- Add image compression
- Add image cropping
- Add more file formats
- Add size optimization

Users can now create personalized membership NFTs with their own images! 🎨
