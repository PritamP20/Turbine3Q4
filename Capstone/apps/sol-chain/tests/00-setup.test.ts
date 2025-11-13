/**
 * Setup Test - Run this first to initialize shared test data
 * Creates community and members that other tests depend on
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
 
describe("Setup", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  const admin = provider.wallet as anchor.Wallet;
  const communityName = "TestDAO";
  const tokenSymbol = "TEST";
  const tokenDecimals = 9;
  const governanceThreshold = 51;
  
  let communityPda: PublicKey;
  let tokenMintPda: PublicKey;
  let collectionMintPda: PublicKey;
  let treasuryPda: PublicKey;

  it("Initialize Community", async () => {
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

    try {
      // Check if community already exists
      await program.account.community.fetch(communityPda);
      console.log("✓ Community already exists:", communityName);
    } catch (e) {
      // Community doesn't exist, create it
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
      console.log("✓ Community initialized:", communityName);
    }
  });
});
