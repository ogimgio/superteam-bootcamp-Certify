import { createCollection, mplCore } from '@metaplex-foundation/mpl-core';
import { addConfigLines, create, fetchCandyMachine, mplCandyMachine } from '@metaplex-foundation/mpl-core-candy-machine';
import { createSignerFromKeypair, generateSigner, signerIdentity, sol, some } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { base58 } from '@metaplex-foundation/umi/serializers';
import fs from 'fs';
import path from "path";

/// Create a Umi instance with the devnet endpoint and finalized commitment
const umi = createUmi("https://api.devnet.solana.com", "finalized");

/// Read the wallet.json file
let wallet = JSON.parse(fs.readFileSync("./wallet.json", "utf8"));

/// Use the newly generated wallet to create a signer and use it as the identity and payer for Umi
const signer = createSignerFromKeypair(umi, umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet)));
umi.use(signerIdentity(signer)).use(mplCore()).use(mplCandyMachine());


(async () => {
    console.log(umi.identity.publicKey.toString());
    console.log('Current balance is: ', (await umi.rpc.getBalance(umi.identity.publicKey)).basisPoints.toString());
    if ((await umi.rpc.getBalance(umi.identity.publicKey)).basisPoints < sol(2).basisPoints) {
        // Airdrop some SOL to the new wallet
        console.log("Airdropping 2 SOL to the wallet...");
        await umi.rpc.airdrop(umi.identity.publicKey, sol(2))
    }

    const metadataUriCollection = "3tDPxNYAZBEoP5Qbvcm3bmZckrZ6FbxPDb95MftgA4GD";
    /// Generate the Collection KeyPair
    const collection = generateSigner(umi)
    console.log("\nCollection Address: ", collection.publicKey.toString())

    /// Generate the collection
    const createCollectionTx = await createCollection(umi, {
        collection,
        name: 'Collection',
        uri: `https://devnet.irys.xyz/${metadataUriCollection}`,
    }).sendAndConfirm(umi)

    /// Deserialize the Signature from the Transaction
    console.log(`\nCollection Created: https://solana.fm/tx/${base58.deserialize(createCollectionTx.signature)[0]}?cluster=devnet-alpha`);

    /// Generate the Candy Machine KeyPair
    const candyMachine = generateSigner(umi)
    console.log("\nCandy Machine Address: ", candyMachine.publicKey.toString())

    /// Generate the Candy Machine with the Collection
    const createIx = await create(umi, {
        candyMachine,
        collection: collection.publicKey,
        collectionUpdateAuthority: umi.identity,
        itemsAvailable: 2, // change this to the number of NFTs we want to sell
        configLineSettings: some({
            prefixName: 'Certificate #',
            nameLength: 7,
            prefixUri: 'https://devnet.irys.xyz/',
            uriLength: 44,
            isSequential: false,
        }),
        guards: {
            botTax: some({ lamports: sol(0.01), lastInstruction: true }),
            solPayment: some({ lamports: sol(0.0), destination: umi.identity.publicKey }),
            mintLimit: some({ id: 1, limit: 1 }),
        },
    })

    /// Send and Confirm the Transaction
    await createIx.sendAndConfirm(umi)
    console.log("\nCandy Machine Created: ", await fetchCandyMachine(umi, candyMachine.publicKey))


    // read configlines from a json which contains the metadata uris (and set name to be i.toString())
    const configLines = JSON.parse(fs.readFileSync(path.join(__dirname, "configlines.json"), "utf8")).map((uriObj: { uri: string }, i: number) => ({
        uri: uriObj.uri,  // Extract the URI from the nested object
        name: i.toString(),
    }))
    console.log(configLines)

    /// Add Config Line Settings to the Candy Machine    
    const addConfigLinesIx = await addConfigLines(umi, {
        candyMachine: candyMachine.publicKey,
        index: 0,
        configLines: configLines,
    }).sendAndConfirm(umi)

    /// Deserialize the Signature from the Transaction
    console.log(`\nConfig Lines Added: https://solana.fm/tx/${base58.deserialize(addConfigLinesIx.signature)[0]}?cluster=devnet-alpha`);
})();