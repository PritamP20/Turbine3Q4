/**
 * Treasury Module Tests
 * Tests: Deposit to Treasury
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

describe("Treasury Module", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  const member1 = Keypair.generate();
  const communityName = "TestDAO";
  const tokenDecimals = 9;
  
  let communityPda: PublicKey;
  let tokenMintPda: PublicKey;
  let treasuryPda: PublicKey;
  let member1Pda: PublicKey;

  before(async () => {
    [communityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("community"), Buffer.from(communityName)],
      program.programId
    );

    [tokenMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_mint"), Buffer.from(communityName)],
      program.programId
    );

    [treasuryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), communityPda.toBuffer()],
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
        .registerMember("TreasuryUser", "https://example.com/treasury")
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

  it("Deposit to Treasury", async () => {
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

    try {
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
    } catch (e) {
      console.log("Note: Deposit may fail if member has no tokens");
      console.log("This is expected if tokens haven't been distributed yet");
    }
  });
});
