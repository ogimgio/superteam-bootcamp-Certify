import { Program } from '@coral-xyz/anchor';
import { fetchCandyMachine, mintV1, mplCandyMachine } from '@metaplex-foundation/mpl-core-candy-machine';
import { createNoopSigner, generateSigner, publicKey, signerIdentity, some } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  Action,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse
} from "@solana/actions";
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Buffer } from "node:buffer";
import { FeedbackProgram } from '../solana_feedback_program/target/types/feedback_program';

const IDL = require("../solana_feedback_program/target/idl/feedback_program.json");

if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}

const LOGO = "https://devnet.irys.xyz/GMQqjjNJT6p764sfKypeNyuScsFLs4WY7FsGueSoeUe9";

// you should use a private RPC here
// use devnet

const app = new Hono();

// CORS configuration
app.use(
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "Accept-Encoding"],
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
  })
);

// Initial GET route for feedback and mint
app.get("/", (c) => {
  const response: ActionGetResponse = {
    type: 'action',
    icon: LOGO,
    title: "Superteam Bootcamp Feedback and NFT Mint",
    label: "Provide Feedback and Mint NFT",
    description: "Submit your feedback and receive an NFT certificate",
    links: {
      actions: [
        {
          type: 'post',
          label: 'Start Feedback',
          href: "/?stars={stars}&feedback={feedback}",
          parameters: [
            {
              type: "select",
              name: "stars",
              label: "Rate the event",
              required: true,
              options: [
                { label: "1", value: "1" },
                { label: "2", value: "2" },
                { label: "3", value: "3" },
                { label: "4", value: "4" },
                { label: "5", value: "5" },
              ],
            },
            {
              type: "textarea",
              name: "feedback",
              label: "Give a small feedback",
              required: true,
            },
          ]
        }
      ]
    }
  };

  return c.json(response);
});

// First POST route - Submit Feedback
app.post("/", async (c) => {
  const req = await c.req.json<ActionPostRequest>();
  const stars = parseInt(c.req.query("stars") || "5");
  const feedbackText = c.req.query("feedback") || "Great experience!";

  const transaction = await prepareFeedbackTransaction(
    new PublicKey(req.account),
    stars,
    feedbackText
  );

  const response: ActionPostResponse = {
    transaction: Buffer.from(transaction).toString("base64"),
    links: {
      next: {
        type: 'post',
        href: `/mint`
      }
    }
  };

  return c.json(response);
});

app.post('/mint', async (c) => {
  const req = await c.req.json<ActionPostRequest>();

  // This route will return an Action object that describes the next step
  const response: Action = {
    type: 'action',
    icon: LOGO,
    title: "Mint NFT Certificate",
    label: "Mint NFT",
    description: "Mint your Superteam Bootcamp NFT certificate",
    links: {
      actions: [
        {
          type: 'transaction',
          label: 'Mint NFT Certificate',
          href: `/mint/transaction`  // Points to the actual transaction
        }
      ]
    }
  };

  return c.json(response);
});
app.post('/mint/transaction', async (c) => {
  const req = await c.req.json<ActionPostRequest>();

  const transaction = await prepareMintTransaction(new PublicKey(req.account));

  const response: ActionPostResponse = {
    type: 'transaction',
    transaction: Buffer.from(transaction).toString("base64"),
    links: {
      next: {
        type: 'completed',
        action: {
          type: 'completed',
          icon: LOGO,
          title: "NFT Certificate Minted",
          label: "Completed",
          description: "You have successfully submitted feedback and minted your NFT certificate!"
        }
      }
    }
  };

  return c.json(response);
});

async function prepareFeedbackTransaction(
  user: PublicKey,
  stars: number,
  feedbackText: string
) {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  //const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const program: Program<FeedbackProgram> = new Program(IDL, { connection });

  // Generate feedback PDA
  const [feedbackPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("feedback"), user.toBuffer()],
    program.programId
  );

  // Prepare feedback transaction
  const instruction = await program.methods
    .submitFeedback(stars, feedbackText)
    .accounts({
      feedback: feedbackPDA,
      user: user,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const blockhash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: user,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(instruction);

  // Serialize and return the transaction for signing
  return transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });
}

async function prepareMintTransaction(user: PublicKey) {
  const umi = createUmi("https://api.devnet.solana.com", "confirmed");
  umi.use(signerIdentity(createNoopSigner(publicKey(user)))).use(mplCandyMachine());

  const candyMachine = publicKey("GybyK2QsyR8xmadmaoFq64M6jLS76oMTK2waJgNfkLUw");
  const candyMachineData = await fetchCandyMachine(umi, candyMachine);

  /// Generate the Asset KeyPair
  const asset = generateSigner(umi)
  console.log("This is your asset address", asset.publicKey.toString());

  /// Mint the Asset
  const mintIx = await mintV1(umi, {
    candyMachine,
    collection: candyMachineData.collectionMint,
    asset,
    owner: publicKey(user),
    mintArgs: {
      //solPayment: some({ destination: publicKey("5Rsa6WxedsNLzRKp3G7CvNbL3ohCjJ8gymaN157CzNdP") }),
      mintLimit: some({ id: 1 })
    },
  }).buildAndSign(umi);

  console.log(mintIx);

  return umi.transactions.serialize(mintIx);
}

export default app;