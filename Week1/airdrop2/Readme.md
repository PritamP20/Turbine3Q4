# Turbin3 Q4 Builders Cohort - Rust Prerequisites

This Rust project contains the required scripts for completing the Turbin3 Q4 Builders Cohort Rust prerequisites. It demonstrates core Solana development concepts including keypair generation, airdrops, transfers, and program interactions.

## Project Structure

This is a Rust library crate with test functions that can be run individually using `cargo test`.

## Prerequisites

- Rust and Cargo installed
- Solana devnet access
- A wallet file from the TypeScript prerequisites (`turbine-wallet.json`)

## Test Functions

### 1. `keygen`
Generates a new Solana keypair and outputs the public key and private key bytes for saving to a wallet file.
```bash cargo test keygen -- --show-output ```

### 2. `claim_airdrop`
Requests 2 SOL airdrop from Solana devnet to the dev wallet.
```bash cargo test claim_airdrop -- --show-output```

### 3. `transfer_sol`
Verifies keypair signature
Transfers 0.1 SOL from dev wallet to Turbin3 wallet
Demonstrates basic token transfers on Solana
```bash cargo test transfer_sol -- --show-output```

### 4. empty_wallet
Empties the entire dev wallet balance (minus transaction fees) to the Turbin3 wallet. Demonstrates fee calculation and complete balance transfers.
```bash cargo test empty_wallet -- --show-output```

### 5. `submit_rs`
Submits Rust prerequisite completion proof to the Turbin3 on-chain program by:

Deriving the prereqs PDA (Program Derived Address)
Deriving the collection authority PDA
Constructing a raw instruction with the correct discriminator
Minting an NFT as proof of Rust prerequisite completion
```bash cargo test submit_rs -- --show-output```