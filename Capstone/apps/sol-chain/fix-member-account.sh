#!/bin/bash

# Fix Member Account Deserialization Error
# This script helps you close old member accounts and redeploy

set -e

echo "🔧 Fixing Member Account Deserialization Error..."
echo ""

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/sol_chain-keypair.json)
echo "📋 Program ID: $PROGRAM_ID"
echo ""

# Option 1: Close and redeploy program
echo "Option 1: Close program and redeploy (RECOMMENDED)"
echo "This will:"
echo "  - Close the old program"
echo "  - Recover SOL"
echo "  - Redeploy with new structure"
echo "  - You'll need to rejoin communities"
echo ""

read -p "Do you want to close and redeploy? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Closing old program..."
    solana program close $PROGRAM_ID --url devnet --bypass-warning || echo "Program might not exist yet"
    echo ""
    
    echo "🔨 Building program..."
    anchor build
    echo ""
    
    echo "🚀 Deploying to devnet..."
    anchor deploy --provider.cluster devnet
    echo ""
    
    echo "✅ Program redeployed!"
    echo ""
    echo "📝 IMPORTANT: You must now:"
    echo "1. Go to your app"
    echo "2. Find your community"
    echo "3. Click 'Join Community' again"
    echo "4. This will create a new member account with NFT support"
    echo ""
else
    echo ""
    echo "Alternative: Manually close member accounts"
    echo ""
    echo "To find your member account address:"
    echo "1. Get your wallet address"
    echo "2. Get community address"
    echo "3. Derive member PDA:"
    echo "   seeds = ['member', community_pubkey, wallet_pubkey]"
    echo ""
    echo "Then close it with:"
    echo "solana program close <MEMBER_ACCOUNT_ADDRESS> --url devnet"
    echo ""
fi

echo "Done! 🎉"
