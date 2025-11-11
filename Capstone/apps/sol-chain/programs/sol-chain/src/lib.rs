use anchor_lang::prelude::*;

declare_id!("5Ph2W7hrJ3NMGu1z3vVSTknetg25x8EqJdkz2s2g8BVP");

#[program]
pub mod sol_chain {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
