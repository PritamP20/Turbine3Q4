import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "./idl.json";

export const PROGRAM_ID = new PublicKey("69MnDd6Pk6LKMLvTXozWVbEN1SurUgg8ZixuY9bYDC1y");
export const NETWORK = "https://api.devnet.solana.com";

export function getProgram(provider: AnchorProvider) {
  return new Program(idl as Idl, provider);
}

export function getConnection() {
  return new Connection(NETWORK, "confirmed");
}
