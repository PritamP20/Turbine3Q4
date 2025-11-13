/**
 * Payment Module Tests
 * Tests: Create Payment Request, Cancel Payment Request
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";

describe("Payment Module", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  const member1 = Keypair.generate();
  const member2 = Keypair.generate();
  const communityName = "TestDAO";
  const tokenDecimals = 9;
  
  let communityPda: PublicKey;
  let member1Pda: PublicKey;
  let member2Pda: PublicKey;

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
        .registerMember("PaymentUser1", "https://example.com/pay1")
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
        .registerMember("PaymentUser2", "https://example.com/pay2")
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

  let paymentRequestPda: PublicKey;
  let paymentTimestamp: number;

  it("Create Payment Request", async () => {
    paymentTimestamp = Math.floor(Date.now() / 1000);
    [paymentRequestPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("payment_request"),
        communityPda.toBuffer(),
        member2.publicKey.toBuffer(), // Use wallet address, not member PDA
        member1.publicKey.toBuffer(), // Use wallet address, not member PDA
        Buffer.from(new anchor.BN(paymentTimestamp).toArray("le", 8)),
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
        new anchor.BN(paymentTimestamp)
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

  it("Cancel Payment Request", async () => {
    // Cancel the payment request using the same PDA from create
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

    const updatedPaymentRequest = await program.account.paymentRequest.fetch(paymentRequestPda);
    assert.equal(updatedPaymentRequest.status.cancelled !== undefined, true);
    console.log("✓ Payment request cancelled");
  });
});
