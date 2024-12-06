use anchor_lang::prelude::*;

declare_id!("AH23xrNu1n679Wy4FjCFEaxkWeMDWvE5GQWS2ih16Ure");

mod state;
mod instructions;

use instructions::*;

#[program]
pub mod feedback_program {
    use super::*;

    pub fn submit_feedback(ctx: Context<SubmitFeedback>, stars: u8, comment: String) -> Result<()> {
        instructions::submit_feedback(ctx, stars, comment)
    }
}
