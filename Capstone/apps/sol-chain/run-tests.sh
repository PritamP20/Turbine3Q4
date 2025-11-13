#!/bin/bash

# Script to run tests on localnet

echo "Starting Solana test validator..."
solana-test-validator > /dev/null 2>&1 &
VALIDATOR_PID=$!

# Wait for validator to start
sleep 5

echo "Deploying program to localnet..."
anchor deploy --provider.cluster localnet

echo "Running tests..."
anchor test --skip-build --skip-deploy --provider.cluster localnet

# Cleanup
echo "Stopping validator..."
kill $VALIDATOR_PID

echo "Done!"
