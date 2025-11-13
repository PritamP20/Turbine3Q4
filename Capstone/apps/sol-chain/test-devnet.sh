#!/bin/bash

# Fund Test Accounts Script
# This script reads keypair files and funds them using Solana devnet faucet

set -e

echo "🚀 Sol-Chain Test Account Funding Script"
echo "=========================================="
echo ""

# Check if .test-keys directory exists
if [ ! -d "tests/.test-keys" ]; then
    echo "⚠️  No .test-keys directory found. Run the tests first to generate keypairs."
    echo "   Command: anchor test"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to get public key from keypair file
get_pubkey() {
    local keypair_file=$1
    solana-keygen pubkey "$keypair_file"
}

# Function to check balance
check_balance() {
    local pubkey=$1
    solana balance "$pubkey" --url devnet 2>/dev/null | awk '{print $1}'
}

# Function to fund account
fund_account() {
    local name=$1
    local keypair_file=$2
    
    if [ ! -f "$keypair_file" ]; then
        echo "⚠️  $name keypair not found: $keypair_file"
        return 1
    fi
    
    local pubkey=$(get_pubkey "$keypair_file")
    local balance=$(check_balance "$pubkey")
    
    echo ""
    echo "📋 $name"
    echo "   Address: $pubkey"
    echo "   Current Balance: $balance SOL"
    
    if (( $(echo "$balance < 0.5" | bc -l) )); then
        echo "   💰 Requesting airdrop..."
        
        # Try airdrop with retry logic
        local max_attempts=3
        local attempt=1
        
        while [ $attempt -le $max_attempts ]; do
            if solana airdrop 2 "$pubkey" --url devnet 2>/dev/null; then
                echo -e "   ${GREEN}✓${NC} Funded successfully!"
                sleep 2  # Wait for confirmation
                local new_balance=$(check_balance "$pubkey")
                echo "   New Balance: $new_balance SOL"
                return 0
            else
                if [ $attempt -lt $max_attempts ]; then
                    echo "   ⏳ Attempt $attempt failed, retrying in 5 seconds..."
                    sleep 5
                else
                    echo -e "   ${YELLOW}⚠️  Airdrop failed after $max_attempts attempts${NC}"
                    echo "   Please use the web faucet: https://faucet.solana.com"
                    echo "   Or try again later (rate limits apply)"
                fi
            fi
            ((attempt++))
        done
    else
        echo -e "   ${GREEN}✓${NC} Already funded"
    fi
}

echo "Checking and funding test accounts..."

# Fund all test accounts
fund_account "Member 1" "tests/.test-keys/member1.json"
fund_account "Member 2" "tests/.test-keys/member2.json"
fund_account "Member 3" "tests/.test-keys/member3.json"

echo ""
echo "=========================================="
echo "✅ Funding process complete!"
echo ""
echo "💡 If any accounts failed to fund, you can:"
echo "   1. Wait a few minutes and run this script again"
echo "   2. Use the web faucet: https://faucet.solana.com"
echo "   3. Use: solana airdrop 2 <ADDRESS> --url devnet"
echo ""
echo "🧪 Ready to run tests:"
echo "   anchor test --skip-local-validator"
echo "=========================================="