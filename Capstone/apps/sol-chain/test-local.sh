#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting local test environment...${NC}\n"

# Check if solana-test-validator is running
if pgrep -x "solana-test-validator" > /dev/null; then
    echo -e "${GREEN}✓ Solana test validator is already running${NC}"
else
    echo -e "${YELLOW}Starting Solana test validator...${NC}"
    solana-test-validator --reset > /dev/null 2>&1 &
    VALIDATOR_PID=$!
    echo -e "${GREEN}✓ Validator started (PID: $VALIDATOR_PID)${NC}"
    
    # Wait for validator to be ready
    echo -e "${YELLOW}Waiting for validator to be ready...${NC}"
    sleep 5
fi

# Set Solana config to localhost
echo -e "${YELLOW}Configuring Solana CLI for localhost...${NC}"
solana config set --url localhost > /dev/null 2>&1
echo -e "${GREEN}✓ Solana CLI configured${NC}\n"

# Build the program
echo -e "${YELLOW}Building program...${NC}"
anchor build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}\n"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Deploy the program
echo -e "${YELLOW}Deploying program to localnet...${NC}"
anchor deploy --provider.cluster localnet
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment successful${NC}\n"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    exit 1
fi

# Run tests
echo -e "${YELLOW}Running tests...${NC}\n"
anchor test --skip-build --skip-deploy --provider.cluster localnet

# Capture test result
TEST_RESULT=$?

echo ""
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
fi

# Ask if user wants to stop the validator
if [ ! -z "$VALIDATOR_PID" ]; then
    echo ""
    read -p "Stop the test validator? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill $VALIDATOR_PID 2>/dev/null
        echo -e "${GREEN}✓ Validator stopped${NC}"
    else
        echo -e "${YELLOW}Validator still running (PID: $VALIDATOR_PID)${NC}"
        echo -e "${YELLOW}To stop it later, run: kill $VALIDATOR_PID${NC}"
    fi
fi

exit $TEST_RESULT
