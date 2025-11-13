/**
 * Community Module Tests
 * Tests: Initialize Community, Update Config
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolChain } from "../target/types/sol_chain";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";
import {describe, it} from "mocha"

describe("Community Module", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.SolChain as Program<SolChain>;
  
  const admin = provider.wallet as anchor.Wallet;
  const communityName = "TestDAO"; // Shared across all tests
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
      const community = await program.account.community.fetch(communityPda);
      console.log("✓ Community already exists:", communityName);
      assert.equal(community.name, communityName);
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

      const community = await program.account.community.fetch(communityPda);
      assert.equal(community.name, communityName);
      assert.equal(community.tokenSymbol, tokenSymbol);
      assert.equal(community.governanceThreshold, governanceThreshold);
      console.log("✓ Community initialized:", communityName);
    }
  });

  it("Update Community Config", async () => {
    const newThreshold = 60;
    const newFeeBps = 100;

    await program.methods
      .updateCommunityConfig(null, newThreshold, newFeeBps)
      .accountsStrict({
        community: communityPda,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const community = await program.account.community.fetch(communityPda);
    assert.equal(community.governanceThreshold, newThreshold);
    assert.equal(community.transferFeeBps, newFeeBps);
    console.log("✓ Community config updated");
  });
});
