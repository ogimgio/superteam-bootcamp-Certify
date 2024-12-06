use anchor_lang::prelude::*;
use crate::state::feedback::Feedback;

#[derive(Accounts)]
pub struct SubmitFeedback<'info> {
    #[account(init, payer = user, space = Feedback::SPACE, seeds = [b"feedback", user.key().as_ref()], bump)]
    pub feedback: Account<'info, Feedback>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn submit_feedback(ctx: Context<SubmitFeedback>, stars: u8, comment: String) -> Result<()> {
    let feedback = &mut ctx.accounts.feedback;

    feedback.wallet = *ctx.accounts.user.key;
    feedback.stars = stars;
    feedback.comment = comment;

    // add msg feeedback with stars and comment
    msg!("Feedback submitted with {} stars", feedback.stars);
    msg!("Comment: {}", feedback.comment);

    Ok(())
}