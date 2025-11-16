#!/bin/bash

# Reset Development Environment Script
# This script closes the old program and redeploys with the new structure

set -e

echo "🔄 Resetting Development Environment..."
echo ""

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/sol_chain-keypair.json)
echo "📋 Program ID: $PROGRAM_ID"
echo ""

# Check if program exists
echo "🔍 Checking if program is deployed..."
if solana program show $PROGRAM_ID --url devnet &> /dev/null; then
    echo "✅ Program found on devnet"
    echo ""
    
    # Close the program to get SOL back
    echo "🗑️  Closing old program..."
    solana program close $PROGRAM_ID --url devnet --bypass-warning
    echo "✅ Program closed, SOL recovered"
    echo ""
else
    echo "ℹ️  Program not found on devnet (first deployment)"
    echo ""
fi

# Build the program
echo "🔨 Building program with new structure..."
anchor build
echo "✅ Build complete"
echo ""

# Deploy to devnet
echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet
echo "✅ Deployment complete"
echo ""

# Get new program ID (should be the same)
NEW_PROGRAM_ID=$(solana address -k target/deploy/sol_chain-keypair.json)
echo "📋 New Program ID: $NEW_PROGRAM_ID"
echo ""

echo "✅ Reset complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update program ID in frontend if changed"
echo "2. Rejoin communities to create new member accounts"
echo "3. Test creating events"
echo ""
echo "🎉 Your program is ready with NFT support!"
