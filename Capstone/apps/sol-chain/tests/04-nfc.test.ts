/**
 * NFC Module Tests
 * Tests: Create, Authenticate, Transfer, Revoke NFC Cards
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("NFC Module", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  const member1 = Keypair.generate();
  const member2 = Keypair.generate();
  const communityName = "TestDAO";
  const cardId1 = `NFC${Date.now()}`;
  
  let communityPda: PublicKey;
  let member1Pda: PublicKey;
  let member2Pda: PublicKey;
  let nfcCard1Pda: PublicKey;

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

    // Register members first
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
        .registerMember("NFCUser1", "https://example.com/nfc1")
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
        .registerMember("NFCUser2", "https://example.com/nfc2")
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

  it("Create NFC Card", async () => {
    [nfcCard1Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("nfc_card"), communityPda.toBuffer(), Buffer.from(cardId1)],
      program.programId
    );

    await program.methods
      .createNfcCard(cardId1, "https://example.com/nfc-card")
      .accountsStrict({
        nfcCard: nfcCard1Pda,
        member: member1Pda,
        community: communityPda,
        payer: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const nfcCard = await program.account.nfcCard.fetch(nfcCard1Pda);
    assert.equal(nfcCard.cardId, cardId1);
    assert.isTrue(nfcCard.isActive);
    console.log("✓ NFC card created:", cardId1);
  });

  it("Authenticate NFC Card", async () => {
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

  it("Transfer NFC Card", async () => {
    await program.methods
      .transferNfcCard(cardId1)
      .accountsStrict({
        nfcCard: nfcCard1Pda,
        oldMember: member1Pda,
        newMember: member2Pda,
        community: communityPda,
        authority: member1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member1])
      .rpc();

    const nfcCard = await program.account.nfcCard.fetch(nfcCard1Pda);
    assert.equal(nfcCard.owner.toString(), member2.publicKey.toString());
    console.log("✓ NFC card transferred");
  });

  it("Revoke NFC Card", async () => {
    await program.methods
      .revokeNfcCard(cardId1)
      .accountsStrict({
        nfcCard: nfcCard1Pda,
        member: member2Pda,
        community: communityPda,
        authority: member2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([member2])
      .rpc();

    const nfcCard = await program.account.nfcCard.fetch(nfcCard1Pda);
    assert.isFalse(nfcCard.isActive);
    console.log("✓ NFC card revoked");
  });
});
