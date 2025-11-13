# Testing Resources Index

Complete index of all testing files and documentation.

## 📋 Quick Reference

| What You Need | File to Check |
|---------------|---------------|
| Quick start guide | `../QUICKSTART_TESTING.md` |
| Complete testing guide | `../TESTING.md` |
| Test summary & status | `../TEST_SUMMARY.md` |
| Detailed test docs | `README.md` (this directory) |
| Environment check | Run `../check-test-env.sh` |

## 🧪 Test Files

### Main Test Suite
- **`sol-chain-simple.test.ts`** - Complete test suite with all 20 instructions
  - Tests all modules: Community, Member, Token, NFC, Governance, Events, Social, Payment, Treasury
  - Uses `accountsStrict` for type safety
  - Comprehensive assertions and state verification

### Test Utilities
- **`README.md`** - Detailed testing documentation
  - Test structure explanation
  - Running instructions
  - Troubleshooting guide

## 🛠️ Helper Scripts

Located in parent directory (`../`):

### Testing Scripts
- **`test-local.sh`** - Full automated test (recommended)
  - Starts validator
  - Builds program
  - Deploys to localnet
  - Runs all tests
  
- **`test-only.sh`** - Quick test (skip build/deploy)
  - For when program is already deployed
  - Faster iteration

- **`run-tests.sh`** - Alternative test runner
  - Similar to test-local.sh
  - Different cleanup options

### Diagnostic Scripts
- **`check-test-env.sh`** - Environment verification
  - Checks all dependencies
  - Verifies installation
  - Shows configuration

## 📚 Documentation Files

Located in parent directory (`../`):

### Guides
- **`QUICKSTART_TESTING.md`** - 3-step quick start
  - Fastest way to get started
  - Essential commands only

- **`TESTING.md`** - Complete testing guide
  - Detailed instructions
  - All testing scenarios
  - Best practices
  - CI/CD integration

- **`TEST_SUMMARY.md`** - Test suite summary
  - What was fixed
  - Test coverage breakdown
  - Expected output
  - Troubleshooting quick reference

### This File
- **`INDEX.md`** - You are here!
  - Navigation guide
  - File descriptions

## 🎯 Common Tasks

### First Time Testing
1. Read: `../QUICKSTART_TESTING.md`
2. Run: `../check-test-env.sh`
3. Run: `../test-local.sh`

### Regular Testing
```bash
# Quick test
../test-only.sh

# Or with npm
npm test
```

### Debugging Failed Tests
1. Check error message in test output
2. Review: `README.md` troubleshooting section
3. Check: `../TESTING.md` for detailed solutions
4. Run: `solana logs` in another terminal

### Adding New Tests
1. Open: `sol-chain-simple.test.ts`
2. Follow existing test patterns
3. Use `accountsStrict` for accounts
4. Add assertions for state changes
5. Update documentation

## 📊 Test Coverage

Current coverage: **20 instructions** across **9 modules**

| Module | Instructions | File Location |
|--------|-------------|---------------|
| Community | 2 | `sol-chain-simple.test.ts` lines 60-120 |
| Member | 2 | `sol-chain-simple.test.ts` lines 122-195 |
| Token | 1 | `sol-chain-simple.test.ts` lines 197-220 |
| NFC | 4 | `sol-chain-simple.test.ts` lines 222-340 |
| Governance | 2 | `sol-chain-simple.test.ts` lines 342-410 |
| Events | 1 | `sol-chain-simple.test.ts` lines 412-445 |
| Social | 5 | `sol-chain-simple.test.ts` lines 447-560 |
| Payment | 2 | `sol-chain-simple.test.ts` lines 562-650 |
| Treasury | 1 | `sol-chain-simple.test.ts` lines 652-680 |

## 🔗 External Resources

- [Anchor Testing Docs](https://www.anchor-lang.com/docs/testing)
- [Solana CLI Docs](https://docs.solana.com/cli)
- [Solana Test Validator](https://docs.solana.com/developing/test-validator)

## 🆘 Getting Help

1. **Environment issues:** Run `../check-test-env.sh`
2. **Test failures:** Check `README.md` troubleshooting
3. **General questions:** See `../TESTING.md`
4. **Quick reference:** See `../TEST_SUMMARY.md`

## 📝 File Tree

```
apps/sol-chain/
├── tests/
│   ├── sol-chain-simple.test.ts  ← Main test suite
│   ├── README.md                  ← Test documentation
│   └── INDEX.md                   ← This file
├── test-local.sh                  ← Full test script
├── test-only.sh                   ← Quick test script
├── run-tests.sh                   ← Alternative test script
├── check-test-env.sh              ← Environment checker
├── QUICKSTART_TESTING.md          ← Quick start guide
├── TESTING.md                     ← Complete guide
└── TEST_SUMMARY.md                ← Summary & status
```

## ✅ Next Steps

1. If you haven't tested yet: Read `../QUICKSTART_TESTING.md`
2. For detailed info: Read `../TESTING.md`
3. To run tests: Execute `../test-local.sh`
4. For quick tests: Execute `../test-only.sh`

---

**Need help?** Start with `../QUICKSTART_TESTING.md` for the fastest path to testing!
