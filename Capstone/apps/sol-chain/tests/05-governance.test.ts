/**
 * Governance Module Tests
 * Tests: Create Proposal, Cancel Proposal
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("Governance Module", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  const member1 = Keypair.generate();
  const communityName = "TestDAO";
  const proposalTitle = `Proposal${Date.now()}`;
  
  let communityPda: PublicKey;
  let member1Pda: PublicKey;
  let proposalPda: PublicKey;

  before(async () => {
    [communityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("community"), Buffer.from(communityName)],
      program.programId
    );

    // Fund account
    try {
      const balance = await provider.connection.getBalance(member1.publicKey);
      if (balance < 0.5 * anchor.web3.LAMPORTS_PER_SOL) {
        await provider.sendAndConfirm(
          new anchor.web3.Transaction().add(
            anchor.web3.SystemProgram.transfer({
              fromPubkey: provider.wallet.publicKey,
              toPubkey: member1.publicKey,
              lamports: 1 * anchor.web3.LAMPORTS_PER_SOL,
            })
          )
        );
      }
    } catch (e) {
      console.log("Note: Could not fund account");
    }

    // Register member
    [member1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), communityPda.toBuffer(), member1.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .registerMember("Proposer", "https://example.com/proposer")
        .accountsStrict({
          member: member1Pda,
          community: communityPda,
          wallet: member1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([member1])
        .rpc();
    } catch (e) {
      console.log("Member may already exist");
    }
  });

  it("Create Proposal", async () => {
    [proposalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), communityPda.toBuffer(), Buffer.from(proposalTitle)],
      program.programId
    );

    const votingDuration = new anchor.BN(7 * 24 * 60 * 60);
    const executionData = Buffer.from("test data");

    await program.methods
      .createProposal(
        proposalTitle,
        "This is a test proposal for governance",
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
    console.log("✓ Proposal created:", proposalTitle);
  });

  it("Cancel Proposal", async () => {
    const cancelTitle = `CancelTest${Date.now()}`;
    const [cancelProposalPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("proposal"), communityPda.toBuffer(), Buffer.from(cancelTitle)],
      program.programId
    );

    await program.methods
      .createProposal(
        cancelTitle,
        "This will be cancelled",
        { custom: {} },
        Buffer.from([]),
        new anchor.BN(7 * 24 * 60 * 60)
      )
      .accountsStrict({
        proposal: cancelProposalPda,
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
        proposal: cancelProposalPda,
        community: communityPda,
        authority: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    console.log("✓ Proposal cancelled");
  });
});
