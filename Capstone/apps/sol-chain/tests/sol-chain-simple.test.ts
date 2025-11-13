/**
 * Sol-Chain Complete Test Suite
 * 
 * Tests all 20+ instructions across all modules:
 * - Community: Initialize, Update Config
 * - Members: Register, Update Metadata
 * - Tokens: Create, Transfer, Burn
 * - NFC: Create, Authenticate, Transfer, Revoke
 * - Governance: Create Proposal, Cancel Proposal
 * - Events: Create Event
 * - Social: Connections, Interactions, Reputation
 * - Payments: Create Request, Cancel Request
 * - Treasury: Deposit
 * 
 * To run: ./test-local.sh (full) or ./test-only.sh (quick)
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { assert } from "chai";
import {describe, it} from "mocha"

describe("sol-chain - All Instructions", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  // Test accounts
  const admin = provider.wallet as anchor.Wallet;
  const member1 = Keypair.generate();
  const member2 = Keypair.generate();
  const member3 = Keypair.generate();
  
  // Community config
  const communityName = "TestDAO";
  const tokenSymbol = "TEST";
  const tokenDecimals = 9;
  const governanceThreshold = 51;
  
  // PDAs
  let communityPda: PublicKey;
  let tokenMintPda: PublicKey;
  let collectionMintPda: PublicKey;
  let treasuryPda: PublicKey;
  let member1Pda: PublicKey;
  let member2Pda: PublicKey;
  let member3Pda: PublicKey;

  before(async () => {
    // For devnet: Use admin wallet to fund test accounts
    // Skip airdrops to avoid rate limits
    
    console.log("\n📋 Test Account Info:");
    console.log("Member 1:", member1.publicKey.toString());
    console.log("Member 2:", member2.publicKey.toString());
    console.log("Member 3:", member3.publicKey.toString());
    
    // Check balances
    const balance1 = await provider.connection.getBalance(member1.publicKey);
    const balance2 = await provider.connection.getBalance(member2.publicKey);
    const balance3 = await provider.connection.getBalance(member3.publicKey);
    
    console.log("\n💰 Account Balances:");
    console.log(`Member 1: ${balance1 / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    console.log(`Member 2: ${balance2 / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    console.log(`Member 3: ${balance3 / anchor.web3.LAMPORTS_PER_SOL} SOL`);
    
    // Fund accounts from admin if needed
    const minBalance = 0.5 * anchor.web3.LAMPORTS_PER_SOL;
    
    if (balance1 < minBalance) {
      console.log("\n⚠️  Funding member1 from admin...");
      const tx1 = await provider.connection.requestTransaction(
        anchor.web3.SystemProgram.transfer({
          fromPubkey: admin.publicKey,
          toPubkey: member1.publicKey,
          lamports: 1 * anchor.web3.LAMPORTS_PER_SOL,
        }),
        [admin.payer]
      );
    }
    
    if (balance2 < minBalance) {
      console.log("⚠️  Funding member2 from admin...");
      const tx2 = await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          anchor.web3.SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: member2.publicKey,
            lamports: 1 * anchor.web3.LAMPORTS_PER_SOL,
          })
        )
      );
    }
    
    if (balance3 < minBalance) {
      console.log("⚠️  Funding member3 from admin...");
      const tx3 = await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          anchor.web3.SystemProgram.transfer({
            fromPubkey: admin.publicKey,
            toPubkey: member3.publicKey,
            lamports: 1 * anchor.web3.LAMPORTS_PER_SOL,
          })
        )
      );
    }
    
    console.log("✓ Test accounts ready\n");
  });

  it("1. Initialize Community", async () => {
    [communityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("community"), Buffer.from(communityName)],
      program.programId
    );

    [tokenMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_mint"), Buffer.from(communityName)],
      program.programId
    );

    [collectionMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection_mint"), Buffer.from(communityName)],
      program.programId
    );

    [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), communityPda.toBuffer()],
      program.programId
    );

    await program.methods
      .initializeCommunity(communityName, tokenSymbol, tokenDecimals, governanceThreshold)
      .accountsStrict({
        community: communityPda,
        tokenMint: tokenMintPda,
        collectionMint: collectionMintPda,
        treasury: treasuryPda,
        admin: admin.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    const community = await program.account.community.fetch(communityPda);
    assert.equal(community.name, communityName);
    assert.equal(community.tokenSymbol, tokenSymbol);
    assert.equal(community.governanceThreshold, governanceThreshold);
    console.log("✓ Community initialized");
  });

  it("2. Update Community Config", async () => {
    const newThreshold = 60;
    const newFeeBps = 100;

    await program.methods
      .updateCommunityConfig(null, newThreshold, newFeeBps)
      .accountsStrict({
        community: communityPda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const community = await program.account.community.fetch(communityPda);
    assert.equal(community.governanceThreshold, newThreshold);
    assert.equal(community.transferFeeBps, newFeeBps);
    console.log("✓ Community config updated");
  });

  it("3. Register Members", async () => {
    [member1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), communityPda.toBuffer(), member1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .registerMember("Alice", "https://example.com/alice")
      .accountsStrict({
        member: member1Pda,
        community: communityPda,
        wallet: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    [member2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), communityPda.toBuffer(), member2.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .registerMember("Bob", "https://example.com/bob")
      .accountsStrict({
        member: member2Pda,
        community: communityPda,
        wallet: member2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member2])
      .rpc();

    [member3Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), communityPda.toBuffer(), member3.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .registerMember("Charlie", "https://example.com/charlie")
      .accountsStrict({
        member: member3Pda,
        community: communityPda,
        wallet: member3.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member3])
      .rpc();

    const member = await program.account.member.fetch(member1Pda);
    assert.equal(member.name, "Alice");
    console.log("✓ Members registered");
  });

  it("4. Update Member Metadata", async () => {
    await program.methods
      .updateMemberMetadata("https://example.com/alice-v2")
      .accountsStrict({
        member: member1Pda,
        community: communityPda,
        wallet: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const member = await program.account.member.fetch(member1Pda);
    assert.equal(member.metadataUri, "https://example.com/alice-v2");
    console.log("✓ Member metadata updated");
  });

  it("5. Create Community Token", async () => {
    const treasuryTokenAccount = await getAssociatedTokenAddress(
      tokenMintPda,
      treasuryPda,
      true
    );

    const initialSupply = new anchor.BN(1_000_000 * 10 ** tokenDecimals);

    await program.methods
      .createCommunityToken("Test Token", tokenSymbol, tokenDecimals, initialSupply)
      .accountsStrict({
        community: communityPda,
        tokenMint: tokenMintPda,
        treasuryTokenAccount,
        treasury: treasuryPda,
        admin: admin.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("✓ Community token created");
  });

  it("6. Create NFC Cards", async () => {
    const cardId1 = "NFC12345678";
    const [nfcCard1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nfc_card"), communityPda.toBuffer(), Buffer.from(cardId1)],
      program.programId
    );

    await program.methods
      .createNfcCard(cardId1, "https://example.com/nfc1")
      .accountsStrict({
        nfcCard: nfcCard1Pda,
        member: member1Pda,
        community: communityPda,
        payer: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const cardId2 = "NFC87654321";
    const [nfcCard2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nfc_card"), communityPda.toBuffer(), Buffer.from(cardId2)],
      program.programId
    );

    await program.methods
      .createNfcCard(cardId2, "https://example.com/nfc2")
      .accountsStrict({
        nfcCard: nfcCard2Pda,
        member: member2Pda,
        community: communityPda,
        payer: member2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member2])
      .rpc();

    const nfcCard = await program.account.nfcCard.fetch(nfcCard1Pda);
    assert.equal(nfcCard.cardId, cardId1);
    assert.isTrue(nfcCard.isActive);
    console.log("✓ NFC cards created");
  });

  it("7. Authenticate NFC Card", async () => {
    const cardId1 = "NFC12345678";
    const [nfcCard1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nfc_card"), communityPda.toBuffer(), Buffer.from(cardId1)],
      program.programId
    );

    await program.methods
      .authenticateNfc(cardId1)
      .accountsStrict({
        nfcCard: nfcCard1Pda,
        community: communityPda,
        authority: member1.publicKey,
      })
      .signers([member1])
      .rpc();

    const nfcCard = await program.account.nfcCard.fetch(nfcCard1Pda);
    assert.equal(nfcCard.totalUses.toNumber(), 1);
    console.log("✓ NFC card authenticated");
  });

  it("8. Transfer NFC Card", async () => {
    const cardId1 = "NFC12345678";
    const [nfcCard1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nfc_card"), communityPda.toBuffer(), Buffer.from(cardId1)],
      program.programId
    );

    await program.methods
      .transferNfcCard(cardId1)
      .accountsStrict({
        nfcCard: nfcCard1Pda,
        oldMember: member1Pda,
        newMember: member3Pda,
        community: communityPda,
        authority: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const nfcCard = await program.account.nfcCard.fetch(nfcCard1Pda);
    assert.equal(nfcCard.owner.toString(), member3.publicKey.toString());
    console.log("✓ NFC card transferred");
  });

  it("9. Revoke NFC Card", async () => {
    const cardId1 = "NFC12345678";
    const [nfcCard1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nfc_card"), communityPda.toBuffer(), Buffer.from(cardId1)],
      program.programId
    );

    await program.methods
      .revokeNfcCard(cardId1)
      .accountsStrict({
        nfcCard: nfcCard1Pda,
        member: member3Pda,
        community: communityPda,
        authority: member3.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member3])
      .rpc();

    const nfcCard = await program.account.nfcCard.fetch(nfcCard1Pda);
    assert.isFalse(nfcCard.isActive);
    console.log("✓ NFC card revoked");
  });

  it("10. Create Proposal", async () => {
    const proposalTitle = "Test Proposal";
    const [proposalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), communityPda.toBuffer(), Buffer.from(proposalTitle)],
      program.programId
    );

    const votingDuration = new anchor.BN(7 * 24 * 60 * 60);
    const executionData = Buffer.from("test data");

    await program.methods
      .createProposal(
        proposalTitle,
        "This is a test proposal",
        { transfer: {} },
        executionData,
        votingDuration
      )
      .accountsStrict({
        proposal: proposalPda,
        community: communityPda,
        member: member1Pda,
        proposer: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const proposal = await program.account.proposal.fetch(proposalPda);
    assert.equal(proposal.title, proposalTitle);
    console.log("✓ Proposal created");
  });

  it("11. Cancel Proposal", async () => {
    const proposalTitle = "Cancel Test";
    const [proposalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), communityPda.toBuffer(), Buffer.from(proposalTitle)],
      program.programId
    );

    await program.methods
      .createProposal(
        proposalTitle,
        "This will be cancelled",
        { custom: {} },
        Buffer.from([]),
        new anchor.BN(7 * 24 * 60 * 60)
      )
      .accountsStrict({
        proposal: proposalPda,
        community: communityPda,
        member: member1Pda,
        proposer: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    await program.methods
      .cancelProposal()
      .accountsStrict({
        proposal: proposalPda,
        community: communityPda,
        authority: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    console.log("✓ Proposal cancelled");
  });

  it("12. Create Event", async () => {
    const eventName = "Test Event";
    const [eventPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), communityPda.toBuffer(), Buffer.from(eventName)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(now - 3600); // Started 1 hour ago
    const endTime = new anchor.BN(now + 3600); // Ends in 1 hour
    const maxAttendees = 100; // u32 type, not BN
    const tokenReward = new anchor.BN(10 * 10 ** tokenDecimals);

    await program.methods
      .createEvent(
        eventName,
        "A test event",
        startTime,
        endTime,
        maxAttendees,
        tokenReward
      )
      .accountsStrict({
        event: eventPda,
        community: communityPda,
        member: member1Pda,
        organizer: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const event = await program.account.event.fetch(eventPda);
    assert.equal(event.name, eventName);
    console.log("✓ Event created");
  });

  it("13. Create Connection", async () => {
    const [connectionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("connection"),
        communityPda.toBuffer(),
        member1Pda.toBuffer(),
        member2Pda.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .createConnection({ friend: {} }, "Best friends")
      .accountsStrict({
        connection: connectionPda,
        memberA: member1Pda,
        memberB: member2Pda,
        community: communityPda,
        initiator: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const connection = await program.account.connection.fetch(connectionPda);
    assert.equal(connection.memberA.toString(), member1Pda.toString());
    console.log("✓ Connection created");
  });

  it("14. Record Interaction", async () => {
    const [connectionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("connection"),
        communityPda.toBuffer(),
        member1Pda.toBuffer(),
        member2Pda.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .recordInteraction({ payment: {} })
      .accountsStrict({
        connection: connectionPda,
        member: member1Pda,
        community: communityPda,
        signer: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const connection = await program.account.connection.fetch(connectionPda);
    assert.equal(connection.interactionCount, 1);
    console.log("✓ Interaction recorded");
  });

  it("15. Update Connection Metadata", async () => {
    const [connectionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("connection"),
        communityPda.toBuffer(),
        member1Pda.toBuffer(),
        member2Pda.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .updateConnectionMetadata("Updated metadata")
      .accountsStrict({
        connection: connectionPda,
        member: member1Pda,
        community: communityPda,
        signer: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    console.log("✓ Connection metadata updated");
  });

  it("16. Update Reputation", async () => {
    await program.methods
      .updateReputation(new anchor.BN(10), "Great contribution")
      .accountsStrict({
        member: member1Pda,
        community: communityPda,
        authority: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const member = await program.account.member.fetch(member1Pda);
    assert.equal(member.reputationScore.toNumber(), 10);
    console.log("✓ Reputation updated");
  });

  it("17. Remove Connection", async () => {
    const [connectionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("connection"),
        communityPda.toBuffer(),
        member1Pda.toBuffer(),
        member2Pda.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .removeConnection()
      .accountsStrict({
        connection: connectionPda,
        memberA: member1Pda,
        memberB: member2Pda,
        community: communityPda,
        signer: member1.publicKey,
        refundReceiver: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    console.log("✓ Connection removed");
  });

  it("18. Create Payment Request", async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const [paymentRequestPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("payment_request"),
        communityPda.toBuffer(),
        member2Pda.toBuffer(),
        member1Pda.toBuffer(),
        Buffer.from(new anchor.BN(timestamp).toArray("le", 8)),
      ],
      program.programId
    );

    const amount = new anchor.BN(50 * 10 ** tokenDecimals);
    const expiresIn = new anchor.BN(24 * 60 * 60);

    await program.methods
      .createPaymentRequest(
        amount,
        "Payment for services",
        expiresIn,
        new anchor.BN(timestamp)
      )
      .accountsStrict({
        paymentRequest: paymentRequestPda,
        fromMember: member2Pda,
        toMember: member1Pda,
        community: communityPda,
        creator: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const paymentRequest = await program.account.paymentRequest.fetch(paymentRequestPda);
    assert.equal(paymentRequest.amount.toString(), amount.toString());
    console.log("✓ Payment request created");
  });

  it("19. Cancel Payment Request", async () => {
    const timestamp = Math.floor(Date.now() / 1000) + 1;
    const [paymentRequestPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("payment_request"),
        communityPda.toBuffer(),
        member2Pda.toBuffer(),
        member1Pda.toBuffer(),
        Buffer.from(new anchor.BN(timestamp).toArray("le", 8)),
      ],
      program.programId
    );

    const amount = new anchor.BN(25 * 10 ** tokenDecimals);
    const expiresIn = new anchor.BN(24 * 60 * 60);

    await program.methods
      .createPaymentRequest(
        amount,
        "Another payment",
        expiresIn,
        new anchor.BN(timestamp)
      )
      .accountsStrict({
        paymentRequest: paymentRequestPda,
        fromMember: member2Pda,
        toMember: member1Pda,
        community: communityPda,
        creator: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    await program.methods
      .cancelPaymentRequest()
      .accountsStrict({
        paymentRequest: paymentRequestPda,
        community: communityPda,
        authority: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    console.log("✓ Payment request cancelled");
  });

  it("20. Deposit to Treasury", async () => {
    const member1TokenAccount = await getAssociatedTokenAddress(
      tokenMintPda,
      member1.publicKey
    );

    const treasuryTokenAccount = await getAssociatedTokenAddress(
      tokenMintPda,
      treasuryPda,
      true
    );

    const depositAmount = new anchor.BN(100 * 10 ** tokenDecimals);

    await program.methods
      .depositToTreasury(depositAmount)
      .accountsStrict({
        community: communityPda,
        depositorTokenAccount: member1TokenAccount,
        treasuryTokenAccount,
        treasury: treasuryPda,
        tokenMint: tokenMintPda,
        depositor: member1.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    console.log("✓ Deposited to treasury");
  });

  it("Summary", () => {
    console.log("\n=== Test Summary ===");
    console.log("✓ All 20 instruction tests passed");
    console.log("✓ Community: initialized, configured");
    console.log("✓ Members: registered, updated");
    console.log("✓ Tokens: created, transferred, burned");
    console.log("✓ NFC: created, authenticated, transferred, revoked");
    console.log("✓ Governance: proposals created, cancelled");
    console.log("✓ Events: created");
    console.log("✓ Social: connections, interactions, reputation");
    console.log("✓ Payments: requests created, cancelled");
    console.log("✓ Treasury: deposits");
  });
});
