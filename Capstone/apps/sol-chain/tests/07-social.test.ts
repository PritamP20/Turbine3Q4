/**
 * Social Module Tests
 * Tests: Connections, Interactions, Reputation
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("Social Module", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  const admin = provider.wallet as anchor.Wallet;
  const member1 = Keypair.generate();
  const member2 = Keypair.generate();
  const communityName = "TestDAO";
  
  let communityPda: PublicKey;
  let member1Pda: PublicKey;
  let member2Pda: PublicKey;
  let connectionPda: PublicKey;

  before(async () => {
    [communityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("community"), Buffer.from(communityName)],
      program.programId
    );

    // Fund accounts
    for (const member of [member1, member2]) {
      try {
        const balance = await provider.connection.getBalance(member.publicKey);
        if (balance < 0.5 * anchor.web3.LAMPORTS_PER_SOL) {
          await provider.sendAndConfirm(
            new anchor.web3.Transaction().add(
              anchor.web3.SystemProgram.transfer({
                fromPubkey: provider.wallet.publicKey,
                toPubkey: member.publicKey,
                lamports: 1 * anchor.web3.LAMPORTS_PER_SOL,
              })
            )
          );
        }
      } catch (e) {
        console.log("Note: Could not fund account");
      }
    }

    // Register members
    [member1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), communityPda.toBuffer(), member1.publicKey.toBuffer()],
      program.programId
    );

    [member2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("member"), communityPda.toBuffer(), member2.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .registerMember("SocialUser1", "https://example.com/social1")
        .accountsStrict({
          member: member1Pda,
          community: communityPda,
          wallet: member1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([member1])
        .rpc();
    } catch (e) {
      console.log("Member1 may already exist");
    }

    try {
      await program.methods
        .registerMember("SocialUser2", "https://example.com/social2")
        .accountsStrict({
          member: member2Pda,
          community: communityPda,
          wallet: member2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([member2])
        .rpc();
    } catch (e) {
      console.log("Member2 may already exist");
    }
  });

  it("Create Connection", async () => {
    [connectionPda] = PublicKey.findProgramAddressSync(
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

  it("Record Interaction", async () => {
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

  it("Update Connection Metadata", async () => {
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

  it("Update Reputation", async () => {
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

  it("Remove Connection", async () => {
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
});
