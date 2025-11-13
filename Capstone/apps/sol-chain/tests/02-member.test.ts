/**
 * Member Module Tests
 * Tests: Register Member, Update Metadata
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("Member Module", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  const member1 = Keypair.generate();
  const communityName = "TestDAO"; // Must match 00-setup.test.ts
  
  let communityPda: PublicKey;
  let member1Pda: PublicKey;

  before(async () => {
    // Find existing community
    [communityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("community"), Buffer.from(communityName)],
      program.programId
    );

    // Fund test account
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
        console.log("✓ Test account funded");
      }
    } catch (e) {
      console.log("Note: Could not fund test account, may fail if insufficient balance");
    }
  });

  it("Register Member", async () => {
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

    const member = await program.account.member.fetch(member1Pda);
    assert.equal(member.name, "Alice");
    assert.equal(member.metadataUri, "https://example.com/alice");
    console.log("✓ Member registered:", member.name);
  });

  it("Update Member Metadata", async () => {
    const newMetadata = "https://example.com/alice-v2";

    await program.methods
      .updateMemberMetadata(newMetadata)
      .accountsStrict({
        member: member1Pda,
        community: communityPda,
        wallet: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const member = await program.account.member.fetch(member1Pda);
    assert.equal(member.metadataUri, newMetadata);
    console.log("✓ Member metadata updated");
  });
});
