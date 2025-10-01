import * as anchor from '@coral-xyz/anchor';
import { writeFileSync } from 'fs';

const programId = new anchor.web3.PublicKey("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM");
const connection = new anchor.web3.Connection("https://api.devnet.solana.com");

async function fetchIDL() {
  try {
    const idl = await anchor.Program.fetchIdl(programId, { connection });
    if (idl) {
      writeFileSync('./programs/Turbin3_prereq.json', JSON.stringify(idl, null, 2));
      console.log('✅ IDL saved to ./programs/Turbin3_prereq.json');
    } else {
      console.log('❌ IDL not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

fetchIDL();