import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { FeedbackProgram } from "./target/types/feedback_program";

(async () => {
    // Configure provider
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    // Load the deployed program
    const programId = new PublicKey("AH23xrNu1n679Wy4FjCFEaxkWeMDWvE5GQWS2ih16Ure");
    const program = new anchor.Program<FeedbackProgram>(
        require("../target/idl/feedback_program.json"),
        provider,
    );

    const user = provider.wallet;

    // Derive the PDA for feedback
    const [feedbackPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("feedback"), user.publicKey.toBuffer()],
        programId
    );

    try {
        // Call the submitFeedback method
        const tx = await program.methods
            .submitFeedback(5, "Great experience!")
            .accounts([
                { pubkey: feedbackPDA, isSigner: false, isWritable: true },  // Feedback account (PDA)
                { pubkey: user.publicKey, isSigner: false, isWritable: true },  // User account
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },  // System program
            ])
            .rpc();

        console.log("Feedback submitted! Transaction ID:", tx);
    } catch (error) {
        console.error("Error submitting feedback:", error);
    }
})();
