import { Keypair, Connection, Commitment } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import wallet from "./turbine-wallet.json"

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

(async () => {
  try {
    console.log("🚀 Creating new token mint...");

    const mint = await createMint(
      connection,      
      keypair,         
      keypair.publicKey,  
      keypair.publicKey,  
      6               
    );

    console.log(`✅ Mint created successfully! Mint address: ${mint.toBase58()}`);
  } catch (error) {
    console.error(`❌ Oops, something went wrong: ${error}`);
  }
})();
