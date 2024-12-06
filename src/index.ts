import { fetchCandyMachine, mintV1, mplCandyMachine } from '@metaplex-foundation/mpl-core-candy-machine';
import { createNoopSigner, createSignerFromKeypair, generateSigner, publicKey, signerIdentity, some } from '@metaplex-foundation/umi';
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

  console.log('Transaction', transaction);

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
  umi.use(signerIdentity(createNoopSigner(publicKey(user)))).use(mplCandyMachine());

  const candyMachine = publicKey("pNo5tq9gW5maP7novAEyuMz9GUwxyV8hwHsuwvGvig9");
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



  /* // Generate the Asset KeyPair
  const asset = generateSigner(umi);
  console.log("This is your asset address", asset.publicKey.toString());

   // Pass and Fetch the Collection
  const collection = await fetchCollection(umi, publicKey("83HKBCJFGfL6NDGbRDhgaVVRMPMjut9KGmjMtGfyuR5k"))
  console.log(collection);

  Generate the Asset
  const tx = await create(umi, {
    asset,
    collection,
    name: "My Asset",
    uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFSEpBr5S0U6q_kBgiFm1flKIiFxhmqGmfAw&s",
    authority: adminSigner,
  }).buildAndSign(umi);

  return umi.transactions.serialize(tx); */


}

export default app;
