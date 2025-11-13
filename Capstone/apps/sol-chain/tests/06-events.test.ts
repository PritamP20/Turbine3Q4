/**
 * Events Module Tests
 * Tests: Create Event
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("Events Module", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  const member1 = Keypair.generate();
  const communityName = "TestDAO";
  const eventName = `Event${Date.now()}`;
  const tokenDecimals = 9;
  
  let communityPda: PublicKey;
  let member1Pda: PublicKey;
  let eventPda: PublicKey;

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
        .registerMember("EventOrganizer", "https://example.com/organizer")
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

  it("Create Event", async () => {
    [eventPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("event"), communityPda.toBuffer(), Buffer.from(eventName)],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const startTime = new anchor.BN(now - 3600);
    const endTime = new anchor.BN(now + 3600);
    const maxAttendees = 100;
    const tokenReward = new anchor.BN(10 * 10 ** tokenDecimals);

    await program.methods
      .createEvent(
        eventName,
        "A test event for the community",
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
    assert.equal(event.currentAttendees, 0);
    console.log("✓ Event created:", eventName);
  });
});
