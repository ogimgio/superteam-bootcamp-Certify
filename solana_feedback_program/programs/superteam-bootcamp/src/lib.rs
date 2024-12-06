use anchor_lang::prelude::*;

declare_id!("2w9CcfuCJAY3ZmA2SG5WeN2V6T3zHHZppwoxPqcEp4G3");

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
