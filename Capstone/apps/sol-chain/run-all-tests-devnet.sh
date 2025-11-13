#!/bin/bash

# Script to run all modular tests on devnet together (preserves state between tests)

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Running All Tests on Devnet${NC}\n"

# Set environment variables for devnet
export ANCHOR_PROVIDER_URL="https://api.devnet.solana.com"
export ANCHOR_WALLET="$HOME/.config/solana/bolt.json"

# Run all tests together so state persists between test files
npx ts-mocha -p ./tsconfig.json -t 60000 'tests/**/*.test.ts'

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed${NC}"
    exit 1
fi
