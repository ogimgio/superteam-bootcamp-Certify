import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import wallet from "../wallet.json";
import { FeedbackProgram } from "./target/types/feedback_program";

(async () => {
    // connection to
    const connection = new Connection("https://api.devnet.solana.com");
    const provider = new anchor.AnchorProvider(
        connection,
        new anchor.Wallet(anchor.web3.Keypair.fromSecretKey(new Uint8Array(wallet))),
        { commitment: 'confirmed' }
    );

    anchor.setProvider(provider);
    const programId = new PublicKey("AH23xrNu1n679Wy4FjCFEaxkWeMDWvE5GQWS2ih16Ure");
    const program = new anchor.Program<FeedbackProgram>(
        require("./target/idl/feedback_program.json"),
        provider,
    );

    console.log("oo")
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
