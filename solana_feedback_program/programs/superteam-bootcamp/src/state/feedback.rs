use anchor_lang::prelude::*;

// Define the Feedback account.
#[account]
pub struct Feedback {
    pub wallet: Pubkey,       // The wallet that provided the feedback.
    pub stars: u8,            // Star rating (1-5).
    pub comment: String,      // The feedback comment.
}

impl Feedback {
    pub const MAX_COMMENT_LENGTH: usize = 256; // Limit comment size.
    pub const SPACE: usize = 8 + 32 + 1 + 4 + Self::MAX_COMMENT_LENGTH; // Size of account.
}
