/**
 * Token Module Tests
 * Tests: Create Token, Transfer, Burn
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { assert } from "chai";

describe("Token Module", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  const admin = provider.wallet as anchor.Wallet;
  const communityName = "TestDAO";
  const tokenSymbol = "TEST";
  const tokenDecimals = 9;
  
  let communityPda: PublicKey;
  let tokenMintPda: PublicKey;
  let treasuryPda: PublicKey;
  let treasuryTokenAccount: PublicKey;

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

    treasuryTokenAccount = await getAssociatedTokenAddress(
      tokenMintPda,
      treasuryPda,
      true
    );
  });

  it("Create Community Token", async () => {
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

    const tokenAccount = await provider.connection.getTokenAccountBalance(treasuryTokenAccount);
    assert.equal(tokenAccount.value.amount, initialSupply.toString());
    console.log("✓ Community token created with supply:", initialSupply.toString());
  });
});
