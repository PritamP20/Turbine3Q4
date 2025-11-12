import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { assert } from "chai";

describe("sol-chain", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  // Test accounts
  const admin = provider.wallet as anchor.Wallet;
  const member1 = Keypair.generate();
  const member2 = Keypair.generate();
  
  // Community details
  const communityName = "TestCommunity";
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

  before(async () => {
    // Airdrop SOL to test accounts
    const airdropSig1 = await provider.connection.requestAirdrop(
      member1.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig1);

    const airdropSig2 = await provider.connection.requestAirdrop(
      member2.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig2);

    // Derive PDAs
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

    [member1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), communityPda.toBuffer(), member1.publicKey.toBuffer()],
      program.programId
    );

    [member2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), communityPda.toBuffer(), member2.publicKey.toBuffer()],
      program.programId
    );
  });

  describe("Community Management", () => {
    it("Initializes a community", async () => {
      const tx = await program.methods
        .initializeCommunity(
          communityName,
          tokenSymbol,
          tokenDecimals,
          governanceThreshold
        )
        .accounts({
          community: communityPda,
          tokenMint: tokenMintPda,
          collectionMint: collectionMintPda,
          treasury: treasuryPda,
          admin: admin.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("Community initialized:", tx);

      const community = await program.account.community.fetch(communityPda);
      assert.equal(community.name, communityName);
      assert.equal(community.tokenSymbol, tokenSymbol);
      assert.equal(community.tokenDecimals, tokenDecimals);
      assert.equal(community.governanceThreshold, governanceThreshold);
      assert.equal(community.memberCount, 0);
    });

    it("Updates community config", async () => {
      const newThreshold = 60;
      const newFee = 100; // 1%

      await program.methods
        .updateCommunityConfig(null, newThreshold, newFee)
        .accounts({
          community: communityPda,
          admin: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const community = await program.account.community.fetch(communityPda);
      assert.equal(community.governanceThreshold, newThreshold);
      assert.equal(community.transferFeeBps, newFee);
    });
  });

  describe("Member Management", () => {
    it("Registers member 1", async () => {
      const memberName = "Alice";
      const metadataUri = "https://example.com/alice";

      await program.methods
        .registerMember(memberName, metadataUri)
        .accounts({
          member: member1Pda,
          community: communityPda,
          wallet: member1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([member1])
        .rpc();

      const member = await program.account.member.fetch(member1Pda);
      assert.equal(member.name, memberName);
      assert.equal(member.metadataUri, metadataUri);
      assert.equal(member.reputationScore.toNumber(), 0);

      const community = await program.account.community.fetch(communityPda);
      assert.equal(community.memberCount, 1);
    });

    it("Registers member 2", async () => {
      const memberName = "Bob";
      const metadataUri = "https://example.com/bob";

      await program.methods
        .registerMember(memberName, metadataUri)
        .accounts({
          member: member2Pda,
          community: communityPda,
          wallet: member2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([member2])
        .rpc();

      const member = await program.account.member.fetch(member2Pda);
      assert.equal(member.name, memberName);

      const community = await program.account.community.fetch(communityPda);
      assert.equal(community.memberCount, 2);
    });

    it("Updates member metadata", async () => {
      const newMetadataUri = "https://example.com/alice-updated";

      await program.methods
        .updateMemberMetadata(newMetadataUri)
        .accounts({
          member: member1Pda,
          community: communityPda,
          wallet: member1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([member1])
        .rpc();

      const member = await program.account.member.fetch(member1Pda);
      assert.equal(member.metadataUri, newMetadataUri);
    });
  });

  describe("Token Operations", () => {
    it("Creates community token with initial supply", async () => {
      const initialSupply = new anchor.BN(1_000_000 * 10 ** tokenDecimals);
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        tokenMintPda,
        treasuryPda,
        true
      );

      await program.methods
        .createCommunityToken(
          "Test Token",
          tokenSymbol,
          tokenDecimals,
          initialSupply
        )
        .accounts({
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

      console.log("Community token created");
    });

    it("Transfers tokens between members", async () => {
      const amount = new anchor.BN(1000 * 10 ** tokenDecimals);
      
      const senderTokenAccount = await getAssociatedTokenAddress(
        tokenMintPda,
        member1.publicKey
      );
      const recipientTokenAccount = await getAssociatedTokenAddress(
        tokenMintPda,
        member2.publicKey
      );
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        tokenMintPda,
        treasuryPda,
        true
      );

      // First, mint some tokens to member1 for testing
      // (In production, this would be done through proper token distribution)

      await program.methods
        .transferTokens(amount, "Test transfer")
        .accounts({
          community: communityPda,
          senderMember: member1Pda,
          recipientMember: member2Pda,
          senderTokenAccount,
          recipientTokenAccount,
          recipient: member2.publicKey,
          treasuryTokenAccount,
          tokenMint: tokenMintPda,
          treasury: treasuryPda,
          sender: member1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([member1])
        .rpc();

      console.log("Tokens transferred");
    });
  });

  describe("NFC Card Management", () => {
    const cardId = "NFC-TEST-001";
    let nfcCardPda: PublicKey;

    before(() => {
      [nfcCardPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("nfc_card"), communityPda.toBuffer(), Buffer.from(cardId)],
        program.programId
      );
    });

    it("Creates an NFC card", async () => {
      const metadataUri = "https://example.com/nfc/001";

      await program.methods
        .createNfcCard(cardId, metadataUri)
        .accounts({
          nfcCard: nfcCardPda,
          member: member1Pda,
          community: communityPda,
          payer: member1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([member1])
        .rpc();

      const nfcCard = await program.account.nfcCard.fetch(nfcCardPda);
      assert.equal(nfcCard.cardId, cardId);
      assert.equal(nfcCard.isActive, true);
      assert.equal(nfcCard.totalUses.toNumber(), 0);
    });

    it("Authenticates NFC card", async () => {
      await program.methods
        .authenticateNfc(cardId)
        .accounts({
          nfcCard: nfcCardPda,
          community: communityPda,
          authority: member1.publicKey,
        })
        .signers([member1])
        .rpc();

      const nfcCard = await program.account.nfcCard.fetch(nfcCardPda);
      assert.equal(nfcCard.totalUses.toNumber(), 1);
    });

    it("Revokes NFC card", async () => {
      await program.methods
        .revokeNfcCard(cardId)
        .accounts({
          nfcCard: nfcCardPda,
          member: member1Pda,
          community: communityPda,
          authority: member1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([member1])
        .rpc();

      const nfcCard = await program.account.nfcCard.fetch(nfcCardPda);
      assert.equal(nfcCard.isActive, false);
    });
  });

  describe("Governance", () => {
    const proposalTitle = "Test Proposal";
    let proposalPda: PublicKey;

    before(() => {
      [proposalPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), communityPda.toBuffer(), Buffer.from(proposalTitle)],
        program.programId
      );
    });

    it("Creates a proposal", async () => {
      const description = "This is a test proposal for governance";
      const votingDuration = new anchor.BN(7 * 24 * 60 * 60); // 7 days

      await program.methods
        .createProposal(
          proposalTitle,
          description,
          { transfer: {} },
          Buffer.from([]),
          votingDuration
        )
        .accounts({
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
      assert.equal(proposal.description, description);
      assert.equal(proposal.yesVotes.toNumber(), 0);
      assert.equal(proposal.noVotes.toNumber(), 0);
    });

    it("Casts a vote on proposal", async () => {
      const [votePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), proposalPda.toBuffer(), member1.publicKey.toBuffer()],
        program.programId
      );

      const voterTokenAccount = await getAssociatedTokenAddress(
        tokenMintPda,
        member1.publicKey
      );

      await program.methods
        .castVote({ yes: {} })
        .accounts({
          proposal: proposalPda,
          vote: votePda,
          member: member1Pda,
          community: communityPda,
          voterTokenAccount,
          tokenMint: tokenMintPda,
          voter: member1.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([member1])
        .rpc();

      const proposal = await program.account.proposal.fetch(proposalPda);
      assert.isTrue(proposal.yesVotes.toNumber() > 0);
    });
  });

  describe("Events", () => {
    const eventName = "Community Meetup";
    let eventPda: PublicKey;

    before(() => {
      [eventPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("event"), communityPda.toBuffer(), Buffer.from(eventName)],
        program.programId
      );
    });

    it("Creates an event", async () => {
      const description = "Monthly community meetup";
      const now = Math.floor(Date.now() / 1000);
      const startTime = new anchor.BN(now + 3600); // 1 hour from now
      const endTime = new anchor.BN(now + 7200); // 2 hours from now
      const maxAttendees = 50;
      const tokenReward = new anchor.BN(100 * 10 ** tokenDecimals);

      await program.methods
        .createEvent(
          eventName,
          description,
          startTime,
          endTime,
          maxAttendees,
          tokenReward
        )
        .accounts({
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
      assert.equal(event.currentAttendees, 0);
    });
  });

  describe("Social Connections", () => {
    let connectionPda: PublicKey;

    before(() => {
      [connectionPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("connection"),
          communityPda.toBuffer(),
          member1Pda.toBuffer(),
          member2Pda.toBuffer(),
        ],
        program.programId
      );
    });

    it("Creates a connection between members", async () => {
      await program.methods
        .createConnection({ friend: {} }, "Best friends")
        .accounts({
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
      assert.equal(connection.interactionCount, 0);
    });

    it("Records an interaction", async () => {
      await program.methods
        .recordInteraction({ message: {} })
        .accounts({
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
    });

    it("Updates reputation", async () => {
      const delta = new anchor.BN(10);
      const reason = "Helpful community member";

      await program.methods
        .updateReputation(delta, reason)
        .accounts({
          member: member1Pda,
          community: communityPda,
          authority: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const member = await program.account.member.fetch(member1Pda);
      assert.equal(member.reputationScore.toNumber(), 10);
    });
  });

  describe("Payment Requests", () => {
    let paymentRequestPda: PublicKey;
    const amount = new anchor.BN(500 * 10 ** tokenDecimals);
    const description = "Payment for services";
    const expiresIn = new anchor.BN(24 * 60 * 60); // 24 hours

    it("Creates a payment request", async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      
      [paymentRequestPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("payment_request"),
          communityPda.toBuffer(),
          member1.publicKey.toBuffer(),
          member2.publicKey.toBuffer(),
          Buffer.from(new anchor.BN(timestamp).toArray("le", 8)),
        ],
        program.programId
      );

      await program.methods
        .createPaymentRequest(amount, description, expiresIn)
        .accounts({
          paymentRequest: paymentRequestPda,
          fromMember: member1Pda,
          toMember: member2Pda,
          community: communityPda,
          creator: member2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([member2])
        .rpc();

      const paymentRequest = await program.account.paymentRequest.fetch(paymentRequestPda);
      assert.equal(paymentRequest.amount.toString(), amount.toString());
      assert.equal(paymentRequest.description, description);
    });
  });

  describe("Treasury Operations", () => {
    it("Deposits to treasury", async () => {
      const amount = new anchor.BN(1000 * 10 ** tokenDecimals);
      
      const depositorTokenAccount = await getAssociatedTokenAddress(
        tokenMintPda,
        admin.publicKey
      );
      const treasuryTokenAccount = await getAssociatedTokenAddress(
        tokenMintPda,
        treasuryPda,
        true
      );

      await program.methods
        .depositToTreasury(amount)
        .accounts({
          community: communityPda,
          depositorTokenAccount,
          treasuryTokenAccount,
          treasury: treasuryPda,
          tokenMint: tokenMintPda,
          depositor: admin.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Deposited to treasury");
    });
  });
});
