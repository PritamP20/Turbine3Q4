# Admin Panel

The admin panel provides comprehensive management tools for community administrators.

## Features

### 1. Events Management
- Create new events with customizable parameters
- Set event dates, max attendees, and token rewards
- Close events when completed
- View event attendance statistics

### 2. Treasury Management
- View total treasury balance
- Deposit SOL to treasury
- Withdraw SOL from treasury to specific addresses
- View transaction history with blockchain explorer links

### 3. Community Configuration
- Update community name and token symbol
- Adjust governance threshold percentage
- Configure transfer fees (in basis points)
- Transfer admin rights to another wallet
- View community statistics

### 4. Member Management
- Search and filter members
- View member details (balance, reputation, NFC cards)
- Update member reputation scores
- View member activity status
- Access member statistics

### 5. Token Operations
- **Single Transfer**: Send tokens to one recipient with optional memo
- **Batch Transfer**: Send tokens to multiple recipients at once
- **Burn Tokens**: Permanently remove tokens from circulation
- View token supply statistics

### 6. Governance Overview
- View all proposals (active, passed, rejected, executed)
- Finalize active proposals
- Execute passed proposals
- Cancel proposals (admin override)
- View voting statistics and timelines

## Access Control

The admin panel is community-specific and requires:
- Connected wallet
- Admin privileges on at least one community contract

### How it works:
1. User connects wallet
2. System queries blockchain for communities where user is admin
3. User selects which community to manage
4. All admin actions are scoped to the selected community
5. User can switch between communities they admin

### Access States:
- **No Wallet**: Shows "Connect Wallet" message
- **Loading**: Shows loading spinner while fetching communities
- **No Admin Access**: Shows message with link to browse communities
- **Has Admin Access**: Shows community selector or admin dashboard

## Integration Status

All components are UI-ready with placeholder functions marked with `// TODO: Integrate with contract`.

To integrate with your Solana program:
1. Import the program IDL
2. Use Anchor's program methods
3. Replace TODO comments with actual contract calls
4. Add transaction signing and confirmation
5. Implement error handling and loading states

## Contract Methods Used

- `create_event`
- `close_event`
- `withdraw_from_treasury`
- `deposit_to_treasury`
- `update_community_config`
- `transfer_tokens`
- `batch_transfer`
- `burn_tokens`
- `finalize_proposal`
- `execute_proposal`
- `cancel_proposal`
- `update_reputation`
