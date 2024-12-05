import { create, fetchCollection } from '@metaplex-foundation/mpl-core';
import { createNoopSigner, createSignerFromKeypair, generateSigner, publicKey, signerIdentity } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
} from "@solana/actions";
import {
  Connection,
  PublicKey
} from "@solana/web3.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Buffer } from "node:buffer";
import wallet from "../wallet.json";

if (globalThis.Buffer === undefined) {
  globalThis.Buffer = Buffer;
}

// you should use a private RPC here
// use devnet
const connection = new Connection("https://api.devnet.solana.com");

const app = new Hono();

// see https://solana.com/docs/advanced/actions#options-response
app.use(
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "Accept-Encoding"],
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
  })
);

app.get("/", (c) => {
  const response: ActionGetResponse = {
    title: "Mint your certificate for SuperTeam Bootcamp",
    description: "Blink to mint NFT certificate ",
    icon: "https://img.fotofolio.xyz/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FSo11111111111111111111111111111111111111112%2Flogo.png",
    label: "Mint NFT",
  };

  return c.json(response);
});

app.post("/", async (c) => {
  const req = await c.req.json<ActionPostRequest>();

  const transaction = await prepareTransaction(new PublicKey(req.account));

  const response: ActionPostResponse = {
    type: 'transaction',
    transaction: Buffer.from(transaction).toString("base64"),
  };

  return c.json(response);
});

async function prepareTransaction(user: PublicKey) {
  const umi = createUmi("https://api.devnet.solana.com", "confirmed");

  let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
  const adminSigner = createSignerFromKeypair(umi, keypair);
  umi.use(signerIdentity(createNoopSigner(publicKey(user))));

  // Generate the Asset KeyPair
  const asset = generateSigner(umi);
  console.log("This is your asset address", asset.publicKey.toString());

  // Pass and Fetch the Collection
  const collection = await fetchCollection(umi, publicKey("83HKBCJFGfL6NDGbRDhgaVVRMPMjut9KGmjMtGfyuR5k"))
  console.log(collection);

  // Generate the Asset
  const tx = await create(umi, {
    asset,
    collection,
    name: "My Asset",
    uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFSEpBr5S0U6q_kBgiFm1flKIiFxhmqGmfAw&s",
    authority: adminSigner,
  }).buildAndSign(umi);

  return umi.transactions.serialize(tx);

  /* // Deserialize the Signature from the Transaction
  console.log("Asset Created: https://solana.fm/tx/" + base58.deserialize(tx.signature)[0] + "?cluster=devnet-alpha");





  const transferIx = SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: new PublicKey("58hscQKoL5vJ8Vt4k4N81TC8HqsZSR7wBSL2agRYXwD3"),
    lamports: 10000000, // 0.1 sol
  });

  const blockhash = await connection
    .getLatestBlockhash({ commitment: "max" })
    .then((res) => res.blockhash);
  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions: [transferIx],
  }).compileToV0Message();
  return new VersionedTransaction(messageV0); */
}

export default app;
