# Sol-Chain Program Architecture

## Overview
Sol-Chain is a Solana program for managing community-based social networks with custom tokens, NFT memberships, governance, events, and NFC card integration.

**Program ID:** `69MnDd6Pk6LKMLvTXozWVbEN1SurUgg8ZixuY9bYDC1y`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SOL-CHAIN PROGRAM                                   │
│                   (69MnDd6Pk6LKMLvTXozWVbEN1SurUgg8ZixuY9bYDC1y)            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
        ┌───────────▼──────────┐      ┌────────────▼─────────┐
        │   EXTERNAL PROGRAMS  │      │   ACCOUNT STRUCTURE  │
        └──────────────────────┘      └──────────────────────┘
                    │                               │
        ┌───────────┴───────────┐      ┌────────────┴─────────────┐
        │                       │      │                          │
        ▼                       ▼      ▼                          ▼
┌──────────────┐    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ SPL Token    │    │ SPL Assoc.   │  │ Custom PDAs  │  │ SPL Token    │
│ Program      │    │ Token        │  │ (11 types)   │  │ Accounts     │
└──────────────┘    └──────────────┘  └──────────────┘  └──────────────┘
```

---

## 1. Program Data Accounts (PDAs)

### Total PDAs: **11 Account Types**

#### 1.1 Community PDA
```
Seeds: ["community", community_name]
Size: ~200 bytes
Fields:
  - admin: Pubkey
  - name: String (max 32 chars)
  - token_mint: Pubkey
  - token_symbol: String (max 10 chars)
  - token_decimals: u8
  - governance_threshold: u8
  - member_count: u32
  - transfer_fee_bps: u16
  - treasury: Pubkey
  - collection_mint: Pubkey
  - created_at: i64
  - bump: u8
```

#### 1.2 Member PDA
```
Seeds: ["member", community_pubkey, wallet_pubkey]
Size: ~400 bytes
Fields:
  - community: Pubkey
  - wallet: Pubkey
  - name: String (max 50 chars)
  - metadata_uri: String (max 200 chars)
  - reputation_score: i64
  - total_events_attended: u32
  - total_connections: u32
  - total_transactions: u32
  - nfc_card: Option<Pubkey>
  - membership_nft: Option<Pubkey>
  - joined_at: i64
  - bump: u8
```

#### 1.3 NFC Card PDA
```
Seeds: ["nfc_card", community_pubkey, card_id]
Size: ~150 bytes
Fields:
  - community: Pubkey
  - owner: Pubkey
  - card_id: String (max 32 chars)
  - asset_id: String (max 32 chars)
  - is_active: bool
  - last_used: i64
  - total_uses: i64
  - created_at: i64
  - bump: u8
```

#### 1.4 Proposal PDA
```
Seeds: ["proposal", community_pubkey, proposal_id]
Size: ~1800 bytes (max)
Fields:
  - community: Pubkey
  - proposer: Pubkey
  - title: String (max 100 chars)
  - description: String (max 500 chars)
  - proposal_type: enum (Transfer/ConfigChange/MemberAction/Custom)
  - execution_data: Vec<u8> (max 1KB)
  - status: enum (Active/Approved/Rejected/Executed/Cancelled)
  - yes_votes: u64
  - no_votes: u64
  - abstain_votes: u64
  - total_voters: u32
  - voting_ends_at: i64
  - created_at: i64
  - executed_at: Option<i64>
  - bump: u8
```

#### 1.5 Vote PDA
```
Seeds: ["vote", proposal_pubkey, voter_pubkey]
Size: ~100 bytes
Fields:
  - proposal: Pubkey
  - voter: Pubkey
  - vote_type: enum (Yes/No/Abstain)
  - voting_power: u64
  - voted_at: i64
  - bump: u8
```

#### 1.6 Event PDA
```
Seeds: ["event", community_pubkey, event_id]
Size: ~800 bytes (max)
Fields:
  - community: Pubkey
  - organizer: Pubkey
  - name: String (max 100 chars)
  - description: String (max 500 chars)
  - start_time: i64
  - end_time: i64
  - max_attendees: Option<u32>
  - current_attendees: u32
  - token_reward: Option<u64>
  - status: enum (Upcoming/Active/Closed/Cancelled)
  - created_at: i64
  - bump: u8
```

#### 1.7 Attendance PDA
```
Seeds: ["attendance", event_pubkey, member_pubkey]
Size: ~120 bytes
Fields:
  - event: Pubkey
  - member: Pubkey
  - nfc_card: Pubkey
  - checked_in_at: i64
  - reward_claimed: bool
  - bump: u8
```

#### 1.8 Connection PDA
```
Seeds: ["connection", community_pubkey, member_a_pubkey, member_b_pubkey]
Size: ~350 bytes
Fields:
  - community: Pubkey
  - member_a: Pubkey
  - member_b: Pubkey
  - connection_type: enum (Friend/Colleague/Vendor/Custom)
  - metadata: Option<String> (max 200 chars)
  - interaction_count: u32
  - last_interaction: i64
  - created_at: i64
  - bump: u8
```

#### 1.9 Payment Request PDA
```
Seeds: ["payment_request", community_pubkey, from_pubkey, to_pubkey, timestamp]
Size: ~350 bytes
Fields:
  - community: Pubkey
  - from: Pubkey
  - to: Pubkey
  - amount: u64
  - description: String (max 200 chars)
  - status: enum (Pending/Completed/Expired/Cancelled)
  - created_at: i64
  - expires_at: i64
  - settled_at: Option<i64>
  - bump: u8
```

#### 1.10 Reward Claim PDA
```
Seeds: ["reward_claim", community_pubkey, member_pubkey, period]
Size: ~100 bytes
Fields:
  - community: Pubkey
  - member: Pubkey
  - period: i64
  - amount: u64
  - rank: u8
  - claimed_at: i64
  - bump: u8
```

#### 1.11 Treasury PDA
```
Seeds: ["treasury", community_pubkey]
Size: N/A (UncheckedAccount - just a PDA for authority)
Purpose: Authority for community token operations
```

---

## 2. SPL Token Accounts

### 2.1 Token Mint PDA
```
Seeds: ["token_mint", community_name]
Program: SPL Token Program
Type: Mint Account
Authority: Community PDA
Fields:
  - mint_authority: Community PDA
  - supply: u64
  - decimals: u8 (typically 9)
  - is_initialized: bool
  - freeze_authority: Option<Pubkey>
```

### 2.2 Collection Mint PDA
```
Seeds: ["collection_mint", community_name]
Program: SPL Token Program
Type: Mint Account (NFT)
Authority: Community PDA
Decimals: 0 (NFT)
Purpose: Membership NFT collection
```

### 2.3 Treasury Token Account
```
Type: Associated Token Account
Owner: Treasury PDA
Mint: Token Mint PDA
Purpose: Holds community tokens for rewards, airdrops, etc.
```

### 2.4 Member Token Accounts
```
Type: Associated Token Account
Owner: Member Wallet
Mint: Token Mint PDA
Purpose: Individual member token balances
```

---

## 3. External Programs Used

### 3.1 SPL Token Program
```
Program ID: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
Used for:
  - Minting tokens
  - Transferring tokens
  - Burning tokens
  - Managing token accounts
```

### 3.2 SPL Associated Token Program
```
Program ID: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL
Used for:
  - Creating associated token accounts
  - Deriving ATA addresses
```

### 3.3 System Program
```
Program ID: 11111111111111111111111111111111
Used for:
  - Creating accounts
  - Transferring SOL
  - Allocating space
```

---

## 4. Instruction Categories

### Total Instructions: **32**

#### 4.1 Community Instructions (3)
1. `initialize_community` - Create new community with custom token
2. `update_community_config` - Update admin, governance, fees
3. `mint_community_tokens` - Mint tokens to treasury

#### 4.2 Member Instructions (2)
4. `register_member` - Register new member with NFT
5. `update_member_metadata` - Update member profile

#### 4.3 Token Instructions (4)
6. `create_community_token` - Initialize token (legacy)
7. `transfer_tokens` - Transfer with fees
8. `batch_transfer` - Multi-recipient transfer
9. `burn_tokens` - Burn tokens from supply

#### 4.4 NFC Instructions (4)
10. `create_nfc_card` - Issue NFC card to member
11. `authenticate_nfc` - Verify NFC card
12. `transfer_nfc_card` - Transfer ownership
13. `revoke_nfc_card` - Deactivate card

#### 4.5 Governance Instructions (5)
14. `create_proposal` - Create governance proposal
15. `cast_vote` - Vote on proposal
16. `finalize_proposal` - Close voting period
17. `execute_proposal` - Execute approved proposal
18. `cancel_proposal` - Cancel proposal

#### 4.6 Event Instructions (3)
19. `create_event` - Create community event
20. `record_attendance` - Check-in with NFC
21. `close_event` - End event and distribute rewards

#### 4.7 Social Instructions (5)
22. `create_connection` - Connect two members
23. `record_interaction` - Log interaction
24. `update_connection_metadata` - Update connection info
25. `remove_connection` - Delete connection
26. `update_reputation` - Modify reputation score

#### 4.8 Payment Instructions (3)
27. `create_payment_request` - Request payment
28. `settle_payment_request` - Complete payment
29. `cancel_payment_request` - Cancel request

#### 4.9 Treasury Instructions (2)
30. `withdraw_from_treasury` - Admin withdraw
31. `deposit_to_treasury` - Deposit to treasury

#### 4.10 Reward Instructions (1)
32. `claim_reward` - Claim leaderboard rewards

---

## 5. Data Flow Diagram

```
┌─────────────┐
│   ADMIN     │
└──────┬──────┘
       │
       │ initialize_community
       ▼
┌─────────────────────────────────────────┐
│         COMMUNITY ACCOUNT               │
│  ┌─────────────────────────────────┐   │
│  │ Token Mint (SPL)                │   │
│  │ Collection Mint (NFT)           │   │
│  │ Treasury PDA                    │   │
│  │ Treasury Token Account          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
       │
       │ register_member
       ▼
┌─────────────────────────────────────────┐
│         MEMBER ACCOUNT                  │
│  ┌─────────────────────────────────┐   │
│  │ Membership NFT                  │   │
│  │ Token Account (ATA)             │   │
│  │ NFC Card (optional)             │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
       │
       ├─────► PROPOSALS ──► VOTES
       │
       ├─────► EVENTS ──► ATTENDANCE
       │
       ├─────► CONNECTIONS ──► INTERACTIONS
       │
       ├─────► PAYMENT REQUESTS
       │
       └─────► REWARD CLAIMS
```

---

## 6. Token Economics

### Initial Supply
- **1000 tokens** minted to treasury on community creation
- Decimals: 9 (configurable)
- Symbol: Custom per community

### Token Distribution
1. **Treasury** - Initial supply + minted tokens
2. **Members** - Received through:
   - Event rewards
   - Reputation rewards
   - Transfers from other members
   - Admin airdrops

### Transfer Fees
- Configurable: 0-1000 basis points (0-10%)
- Fees collected to treasury
- Used for community operations

---

## 7. Security Features

### Access Control
- **Admin-only**: Community config, minting, treasury withdrawal
- **Member-only**: Voting, event attendance, connections
- **Owner-only**: NFC card operations, token transfers

### PDA Verification
- All PDAs derived with canonical bumps
- Seeds include relevant pubkeys for uniqueness
- Prevents unauthorized account access

### Token Safety
- Mint authority: Community PDA only
- Transfer fees enforced on-chain
- Burn requires token owner signature

---

## 8. Storage Requirements

### Per Community
```
Community Account:        ~200 bytes
Token Mint:              ~82 bytes
Collection Mint:         ~82 bytes
Treasury Token Account:  ~165 bytes
Total:                   ~529 bytes + rent
```

### Per Member
```
Member Account:          ~400 bytes
Token Account:           ~165 bytes
Membership NFT:          ~82 bytes (optional)
NFC Card:                ~150 bytes (optional)
Total:                   ~565-797 bytes + rent
```

### Per Proposal
```
Proposal Account:        ~1800 bytes (max)
Vote Accounts:           ~100 bytes each
```

### Per Event
```
Event Account:           ~800 bytes (max)
Attendance Records:      ~120 bytes each
```

---

## 9. Deployment Information

**Network:** Devnet  
**Program ID:** `69MnDd6Pk6LKMLvTXozWVbEN1SurUgg8ZixuY9bYDC1y`  
**Cluster:** `https://api.devnet.solana.com`  
**Explorer:** `https://explorer.solana.com/address/69MnDd6Pk6LKMLvTXozWVbEN1SurUgg8ZixuY9bYDC1y?cluster=devnet`

---

## 10. Summary Statistics

| Category | Count |
|----------|-------|
| **Total Instructions** | 32 |
| **Total PDA Types** | 11 |
| **SPL Token Accounts** | 4 types |
| **External Programs** | 3 |
| **Account State Structs** | 11 |
| **Enum Types** | 7 |
| **Max Account Size** | ~1800 bytes (Proposal) |
| **Min Account Size** | ~100 bytes (Vote, RewardClaim) |

---

## 11. Key Features

✅ **Custom SPL Tokens** - Each community has its own token  
✅ **NFT Memberships** - Membership represented as NFTs  
✅ **NFC Integration** - Physical card authentication  
✅ **On-chain Governance** - Token-weighted voting  
✅ **Event Management** - Attendance tracking with rewards  
✅ **Social Graph** - Member connections and interactions  
✅ **Payment Requests** - P2P payment system  
✅ **Reputation System** - On-chain reputation scores  
✅ **Treasury Management** - Community-controlled funds  
✅ **Reward Distribution** - Automated reward claims  

---

*Generated for Sol-Chain Program v0.1.0*
