import { Keypair, PublicKey, Connection, Commitment } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import wallet from "./turbine-wallet.json"

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const mint = new PublicKey("FynZJuJZhhCDmgU2whxWmDp1ZA9fxtaaxiHKabZTv2PR");

const amount = 100n * 1_000_000n; 
(async () => {
  try {
    console.log("🪙 Creating Associated Token Account...");

    const ata = await getOrCreateAssociatedTokenAccount(
      connection, 
      keypair,    
      mint,       
      keypair.publicKey 
    );

    console.log(`ATA created: ${ata.address.toBase58()}`);

    const mintTx = await mintTo(
      connection,
      keypair,         
      mint,           
      ata.address,     
      keypair,         
      amount           
    );

    console.log(`✅ Successfully minted tokens! TXID: ${mintTx}`);
  } catch (error) {
    console.error(`❌ Oops, something went wrong: ${error}`);
  }
})();
