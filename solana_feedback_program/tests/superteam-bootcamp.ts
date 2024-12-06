/* import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SuperteamBootcamp } from "../target/types/superteam_bootcamp";
import { PublicKey } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, createMint, getAssociatedTokenAddressSync, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";

describe("superteam-bootcamp", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SuperteamBootcamp as Program<SuperteamBootcamp>;

  const payer = provider.wallet as NodeWallet;

  const vaultPDA = anchor.web3.PublicKey.findProgramAddressSync([Buffer.from("vault"), provider.publicKey.toBytes()], program.programId);

  let mint: PublicKey;
  let userAta: PublicKey;
  let vault: PublicKey;

  it("Initialize Vault", async () => {
    mint = await createMint(provider.connection, payer.payer, provider.publicKey, null, 6);
    userAta = (await getOrCreateAssociatedTokenAccount(provider.connection, payer.payer, mint, provider.publicKey)).address;

    await mintTo(provider.connection, payer.payer, mint, userAta, provider.publicKey, 1000000000);

    vault = getAssociatedTokenAddressSync(mint, vaultPDA[0], true);

    const tx = await program.methods.initialize()
    .accountsPartial ({
      user: provider.publicKey,
      mint,
      vaultData: vaultPDA[0],
      vault: vault,
      systemProgram: SYSTEM_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    }).rpc();
    console.log("\nVault Initialization successfull");
    console.log("Your transaction signature", tx);
  });

  it("Deposit", async () => {
    const tx = await program.methods.deposit(new anchor.BN(1000000))
    .accountsPartial({
      user: provider.publicKey,
      mint,
      vault,
      userAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).rpc();
    console.log("\nDeposit successfull");
    console.log("Your transaction signature", tx);
  });
}); */


import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { FeedbackProgram } from "../target/types/feedback_program";

describe("feedback-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FeedbackProgram as Program<FeedbackProgram>;
  const user = provider.wallet;

  const [feedbackPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("feedback"), user.publicKey.toBuffer()],
    program.programId
  );

  it("Submit Feedback", async () => {
    const tx = await program.methods
      .submitFeedback(5, "Great experience!")
      .accounts(
        [
          { pubkey: feedbackPDA, isSigner: false, isWritable: true },  // Feedback account (PDA)
          { pubkey: user.publicKey, isSigner: false, isWritable: true },  // User account
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },  // System program
        ])
      .rpc();

    console.log("Feedback submitted! Tx:", tx);
  });
});
