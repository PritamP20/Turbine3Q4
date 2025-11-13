# Sol-Chain Test Suite

Comprehensive test suite for all Solana smart contract instructions.

## Test Files

- `sol-chain-simple.test.ts` - Complete test coverage for all 20+ instructions

## Instructions Tested

### Community (2 tests)
1. ✓ Initialize Community
2. ✓ Update Community Config

### Member (2 tests)
3. ✓ Register Members
4. ✓ Update Member Metadata

### Token (1 test)
5. ✓ Create Community Token

### NFC (4 tests)
6. ✓ Create NFC Cards
7. ✓ Authenticate NFC Card
8. ✓ Transfer NFC Card
9. ✓ Revoke NFC Card

### Governance (2 tests)
10. ✓ Create Proposal
11. ✓ Cancel Proposal

### Events (1 test)
12. ✓ Create Event

### Social (4 tests)
13. ✓ Create Connection
14. ✓ Record Interaction
15. ✓ Update Connection Metadata
16. ✓ Update Reputation
17. ✓ Remove Connection

### Payment (2 tests)
18. ✓ Create Payment Request
19. ✓ Cancel Payment Request

### Treasury (1 test)
20. ✓ Deposit to Treasury

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Ensure Solana CLI is installed
solana --version
```

### Option 1: Full Test Suite (Recommended for first run)

This will start a local validator, build, deploy, and run tests:

```bash
./test-local.sh
```

### Option 2: Quick Test (When already deployed)

If your program is already deployed and you just want to run tests:

```bash
./test-only.sh
```

Or manually:

```bash
anchor test --skip-build --skip-deploy
```

### Option 3: Complete Fresh Test

Build, deploy, and test everything:

```bash
anchor test
```

### Testing on Different Networks

**Localnet (Recommended for testing):**
```bash
anchor test --provider.cluster localnet
```

**Devnet:**
```bash
anchor test --provider.cluster devnet
```

Note: Devnet has airdrop rate limits. You may need to manually fund test accounts.

## Test Structure

Each test:
1. Sets up necessary PDAs (Program Derived Addresses)
2. Calls the instruction with proper accounts
3. Verifies the state changes
4. Logs success message

## Notes

- Tests run on a local validator
- Each test is independent but runs in sequence
- Some tests depend on previous test state (e.g., members must be registered before creating connections)
- The test suite uses `accountsStrict` to ensure all required accounts are provided

## Troubleshooting

### "Account not found" errors
- Make sure to run `anchor build` before testing
- Ensure the local validator is running: `solana-test-validator`
- Check if program is deployed: `solana program show <PROGRAM_ID>`

### "429 Too Many Requests" (Airdrop limit)
- This happens on devnet when you hit rate limits
- Solution: Use localnet for testing
- Or manually fund test accounts on devnet

### Type errors
- Run `npm install` to ensure all dependencies are installed
- Check that `@types/mocha` and `@types/chai` are in devDependencies
- Rebuild: `anchor build`

### Transaction failures
- Check program logs with `anchor test --skip-build`
- Verify account PDAs are derived correctly
- Ensure signers are properly configured
- Check account has sufficient SOL for rent

### "Program not deployed" errors
- Deploy first: `anchor deploy --provider.cluster localnet`
- Or run full test: `anchor test`

### Validator issues
- Stop existing validator: `pkill solana-test-validator`
- Start fresh: `solana-test-validator --reset`
- Check validator logs: `solana logs`

### Test hangs or times out
- Increase timeout in test: `.timeout(60000)` after `it()`
- Check if validator is responsive: `solana cluster-version`
- Restart validator
