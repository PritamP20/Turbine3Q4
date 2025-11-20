# Sol-Chain

A blockchain-based community management platform built on Solana. Sol-Chain enables communities to create custom tokens, manage memberships with NFTs, implement on-chain governance, organize events, and facilitate peer-to-peer interactions with NFC card integration.

## Overview

Sol-Chain is a full-stack decentralized application consisting of a Solana smart contract (program) and a Next.js web interface. It provides communities with tools to manage their own tokenized ecosystems, complete with governance, events, reputation systems, and physical NFC card authentication.

**Program ID (Devnet):** `69MnDd6Pk6LKMLvTXozWVbEN1SurUgg8ZixuY9bYDC1y`

## Key Features

- **Custom SPL Tokens** - Each community has its own fungible token
- **NFT Memberships** - Membership represented as NFTs from a collection
- **NFC Integration** - Physical card authentication for events and interactions
- **On-chain Governance** - Token-weighted voting on proposals
- **Event Management** - Create events, track attendance, distribute rewards
- **Social Graph** - Member connections and interaction tracking
- **Payment Requests** - Peer-to-peer payment system within communities
- **Reputation System** - On-chain reputation scores based on participation
- **Treasury Management** - Community-controlled token treasury
- **Reward Distribution** - Automated reward claims for active members

## Project Structure

This is a Turborepo monorepo containing the following workspaces:

```
sol-chain/
├── apps/
│   ├── frontend/          # Next.js web application
│   └── sol-chain/         # Solana program (Anchor)
├── packages/
│   ├── eslint-config/     # Shared ESLint configurations
│   ├── typescript-config/ # Shared TypeScript configurations
│   └── ui/                # Shared React component library
├── test-ledger/           # Local Solana test validator data
└── ARCHITECTURE.md        # Detailed program architecture
```

### Apps

#### `apps/frontend`
Next.js 16 web application providing the user interface for Sol-Chain.

**Tech Stack:**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Solana Web3.js
- Anchor Framework
- Wallet Adapter (Phantom, Solflare, etc.)
- TanStack Query (React Query)

**Features:**
- Wallet connection and authentication
- Community creation and management
- Member registration and profiles
- Token transfers and balance tracking
- Governance proposal creation and voting
- Event creation and attendance tracking
- NFC card management
- Payment request system

#### `apps/sol-chain`
Solana program (smart contract) written in Rust using the Anchor framework.

**Tech Stack:**
- Rust
- Anchor Framework 0.31.1
- SPL Token Program
- Solana SDK

**Program Features:**
- 32 instructions across 10 categories
- 11 PDA account types
- Custom token minting and management
- NFT membership system
- Governance with voting
- Event and attendance tracking
- NFC card authentication
- Social connections and reputation
- Payment requests and settlements
- Treasury operations

### Packages

#### `packages/ui`
Shared React component library used across frontend applications.

#### `packages/eslint-config`
Shared ESLint configurations for consistent code style.

#### `packages/typescript-config`
Shared TypeScript configurations for type checking.

## Prerequisites

- Node.js >= 18
- npm 11.5.1 or later
- Rust and Cargo (for Solana program development)
- Solana CLI tools
- Anchor CLI 0.31.1

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd sol-chain
npm install
```

### Development

Run all apps in development mode:

```bash
npm run dev
```

Run a specific app:

```bash
# Frontend only
npm run dev --filter=frontend

# Solana program tests
npm run test --filter=sol-chain
```

### Building

Build all apps and packages:

```bash
npm run build
```

Build a specific app:

```bash
npm run build --filter=frontend
```

### Linting and Formatting

```bash
# Lint all packages
npm run lint

# Format code
npm run format

# Type checking
npm run check-types
```

## Working with the Solana Program

### Testing

The Solana program includes comprehensive test suites:

```bash
cd apps/sol-chain

# Run tests on local validator
npm run test:local

# Run tests on devnet
npm run test:devnet

# Run all test suites on devnet
npm run test:devnet:all

# Full test with build and deploy
npm run test:full
```

### Deployment

The program is currently deployed on Solana Devnet. To deploy updates:

```bash
cd apps/sol-chain
anchor build
anchor deploy --provider.cluster devnet
```

### Local Development

Start a local Solana test validator:

```bash
solana-test-validator
```

The `test-ledger/` directory contains the local validator state and logs.

## Working with the Frontend

### Running Locally

```bash
cd apps/frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Environment Configuration

Create a `.env.local` file in `apps/frontend/`:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=69MnDd6Pk6LKMLvTXozWVbEN1SurUgg8ZixuY9bYDC1y
```

### Building for Production

```bash
cd apps/frontend
npm run build
npm run start
```

## Architecture

For detailed information about the Solana program architecture, including:
- Account structures (11 PDA types)
- Instruction set (32 instructions)
- Token economics
- Data flow diagrams
- Security features

See [ARCHITECTURE.md](./ARCHITECTURE.md)

## Technology Stack

**Blockchain:**
- Solana (Devnet)
- Anchor Framework
- SPL Token Program
- Rust

**Frontend:**
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Solana Web3.js

**Development:**
- Turborepo (monorepo management)
- ESLint (linting)
- Prettier (formatting)
- TypeScript (type safety)

## Project Scripts

From the root directory:

```bash
npm run dev          # Start all apps in development mode
npm run build        # Build all apps and packages
npm run lint         # Lint all packages
npm run format       # Format code with Prettier
npm run check-types  # Run TypeScript type checking
```

## Deployment

**Frontend:** Deployed on Vercel (configuration in `vercel.json`)

**Solana Program:** Deployed on Solana Devnet
- Program ID: `69MnDd6Pk6LKMLvTXozWVbEN1SurUgg8ZixuY9bYDC1y`
- Explorer: [View on Solana Explorer](https://explorer.solana.com/address/69MnDd6Pk6LKMLvTXozWVbEN1SurUgg8ZixuY9bYDC1y?cluster=devnet)

## Contributing

This is a monorepo managed by Turborepo. When contributing:

1. Make changes in the appropriate workspace (`apps/*` or `packages/*`)
2. Run tests and linting before committing
3. Follow the existing code style and conventions
4. Update documentation as needed

## Resources

- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Turborepo Documentation](https://turborepo.com/docs)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

## License

ISC
