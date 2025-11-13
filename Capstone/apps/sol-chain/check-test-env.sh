#!/bin/bash

# Test Environment Diagnostic Script
# Run this to check if your environment is ready for testing

echo "🔍 Sol-Chain Test Environment Check"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Check Solana CLI
echo -n "Checking Solana CLI... "
if command -v solana &> /dev/null; then
    VERSION=$(solana --version | cut -d' ' -f2)
    echo -e "${GREEN}✓ Installed (v$VERSION)${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    echo "  Install: https://docs.solana.com/cli/install-solana-cli-tools"
    ERRORS=$((ERRORS+1))
fi

# Check Anchor CLI
echo -n "Checking Anchor CLI... "
if command -v anchor &> /dev/null; then
    VERSION=$(anchor --version | cut -d' ' -f2)
    echo -e "${GREEN}✓ Installed (v$VERSION)${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    echo "  Install: cargo install --git https://github.com/coral-xyz/anchor --tag v0.31.1 anchor-cli"
    ERRORS=$((ERRORS+1))
fi

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    VERSION=$(node --version)
    echo -e "${GREEN}✓ Installed ($VERSION)${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    echo "  Install: https://nodejs.org/"
    ERRORS=$((ERRORS+1))
fi

# Check npm
echo -n "Checking npm... "
if command -v npm &> /dev/null; then
    VERSION=$(npm --version)
    echo -e "${GREEN}✓ Installed (v$VERSION)${NC}"
else
    echo -e "${RED}✗ Not found${NC}"
    ERRORS=$((ERRORS+1))
fi

# Check if dependencies are installed
echo -n "Checking node_modules... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${YELLOW}⚠ Not found${NC}"
    echo "  Run: npm install"
fi

# Check if program is built
echo -n "Checking program build... "
if [ -f "target/deploy/sol_chain.so" ]; then
    echo -e "${GREEN}✓ Built${NC}"
else
    echo -e "${YELLOW}⚠ Not built${NC}"
    echo "  Run: anchor build"
fi

# Check if IDL exists
echo -n "Checking IDL... "
if [ -f "target/idl/sol_chain.json" ]; then
    echo -e "${GREEN}✓ Generated${NC}"
else
    echo -e "${YELLOW}⚠ Not found${NC}"
    echo "  Run: anchor build"
fi

# Check if types are generated
echo -n "Checking TypeScript types... "
if [ -f "target/types/sol_chain.ts" ]; then
    echo -e "${GREEN}✓ Generated${NC}"
else
    echo -e "${YELLOW}⚠ Not found${NC}"
    echo "  Run: anchor build"
fi

# Check Solana config
echo -n "Checking Solana config... "
if command -v solana &> /dev/null; then
    CLUSTER=$(solana config get | grep "RPC URL" | awk '{print $3}')
    echo -e "${GREEN}✓ $CLUSTER${NC}"
else
    echo -e "${YELLOW}⚠ Cannot check${NC}"
fi

# Check if validator is running
echo -n "Checking local validator... "
if pgrep -x "solana-test-validator" > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${YELLOW}⚠ Not running${NC}"
    echo "  Start: solana-test-validator"
fi

# Check wallet
echo -n "Checking wallet... "
if [ -f "$HOME/.config/solana/id.json" ]; then
    PUBKEY=$(solana-keygen pubkey ~/.config/solana/id.json 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Found ($PUBKEY)${NC}"
    else
        echo -e "${YELLOW}⚠ Found but cannot read${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Not found${NC}"
    echo "  Generate: solana-keygen new"
fi

echo ""
echo "===================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Environment looks good!${NC}"
    echo ""
    echo "Ready to test. Run:"
    echo "  ./test-local.sh"
else
    echo -e "${RED}✗ Found $ERRORS critical issue(s)${NC}"
    echo ""
    echo "Please fix the issues above before testing."
fi

echo ""
