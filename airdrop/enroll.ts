import {
  address,
  appendTransactionMessageInstructions,
  assertIsTransactionWithinSizeLimit,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  devnet,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  addSignersToTransactionMessage,
  getProgramDerivedAddress,
  generateKeyPairSigner,
  getAddressEncoder
} from "@solana/kit";

import { getInitializeInstruction, getSubmitTsInstruction } from "./clients/js/src/generated/index";

import wallet from "./turbine-wallet.json";

const MPL_CORE_PROGRAM = address("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
const PROGRAM_ADDRESS = address("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM");
const SYSTEM_PROGRAM = address("11111111111111111111111111111111");
const COLLECTION = address("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2");

const keypair = await createKeyPairSignerFromBytes(new Uint8Array(wallet));
console.log(`Using wallet: ${keypair.address}`);

const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com"));
const rpcSubscriptions = createSolanaRpcSubscriptions(devnet('wss://api.devnet.solana.com'));

const addressEncoder = getAddressEncoder();

const accountSeeds = [Buffer.from("prereqs"), addressEncoder.encode(keypair.address)];
const [account] = await getProgramDerivedAddress({
  programAddress: PROGRAM_ADDRESS,
  seeds: accountSeeds
});

console.log(`Prereqs account PDA: ${account}`);

const authoritySeeds = [
  Buffer.from("collection"),
  addressEncoder.encode(COLLECTION)
];

const [authority] = await getProgramDerivedAddress({
  programAddress: PROGRAM_ADDRESS,
  seeds: authoritySeeds
});

console.log(`Authority PDA: ${authority}`);
const mintKeyPair = await generateKeyPairSigner();

console.log("\n=== Running Initialize Transaction ===");

const initializeIx = getInitializeInstruction({
  github: "PritamP20",
  user: keypair,
  account,
  systemProgram: SYSTEM_PROGRAM
});

const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const transactionMessageInit = pipe(
  createTransactionMessage({ version: 0 }),
  tx => setTransactionMessageFeePayerSigner(keypair, tx),
  tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  tx => appendTransactionMessageInstructions([initializeIx], tx)
);

const signedTxInit = await signTransactionMessageWithSigners(transactionMessageInit);
assertIsTransactionWithinSizeLimit(signedTxInit);

const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
  rpc, rpcSubscriptions
});

try {
  await sendAndConfirmTransaction(
    signedTxInit,
    { commitment: 'confirmed', skipPreflight: false }
  );
  const signatureInit = getSignatureFromTransaction(signedTxInit);
  console.log(`Success! Check out your TX here:`);
  console.log(`https://explorer.solana.com/tx/${signatureInit}?cluster=devnet`);
} catch (e) {
  console.error(`Oops, something went wrong: ${e}`);
}

console.log("\n=== Running Submit TS Transaction ===");

const submitIx = getSubmitTsInstruction({
  user: keypair,
  account,
  mint: mintKeyPair,
  collection: COLLECTION,
  authority, 
  mplCoreProgram: MPL_CORE_PROGRAM,
  systemProgram: SYSTEM_PROGRAM
});

const { value: latestBlockhash2 } = await rpc.getLatestBlockhash().send();

const transactionMessageSubmit = pipe(
  createTransactionMessage({ version: 0 }),
  tx => setTransactionMessageFeePayerSigner(keypair, tx),
  tx => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash2, tx),
  tx => appendTransactionMessageInstructions([submitIx], tx),
  tx => addSignersToTransactionMessage([mintKeyPair], tx)
);

const signedTxSubmit = await signTransactionMessageWithSigners(transactionMessageSubmit);
assertIsTransactionWithinSizeLimit(signedTxSubmit);

try {
  await sendAndConfirmTransaction(
    signedTxSubmit,
    { commitment: 'confirmed', skipPreflight: false }
  );
  const signatureSubmit = getSignatureFromTransaction(signedTxSubmit);
  console.log(`Success! Check out your TX here:`);
  console.log(`https://explorer.solana.com/tx/${signatureSubmit}?cluster=devnet`);
  console.log("\nCongratulations! You've completed the Turbin3 TypeScript prerequisites!");
} catch (e) {
  console.error(`Oops, something went wrong: ${e}`);
}