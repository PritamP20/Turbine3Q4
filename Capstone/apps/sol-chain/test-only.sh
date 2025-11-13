#!/bin/bash

# Simple script to run tests without building or deploying
# Use this when your program is already deployed

echo "Running tests (skipping build and deploy)..."
echo ""

anchor test --skip-build --skip-deploy

echo ""
if [ $? -eq 0 ]; then
    echo "✓ All tests passed!"
else
    echo "✗ Some tests failed"
    exit 1
fi
