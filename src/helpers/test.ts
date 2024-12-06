import { fetchCandyMachine, mintV1, mplCandyMachine, safeFetchMintCounterFromSeeds } from "@metaplex-foundation/mpl-core-candy-machine";
import { base58, createSignerFromKeypair, generateSigner, publicKey, signerIdentity, some } from "@metaplex-foundation/umi";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import wallet from "../../wallet.json";


// Step 1: Initialize Umi with Devnet RPC and Irys uploader
const umi = createUmi("https://api.devnet.solana.com").use(
    irysUploader({
        address: "https://devnet.irys.xyz", // Change to mainnet address when deploying live
    })
);
let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const adminSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(adminSigner)).use(mplCandyMachine());



const createNft = async () => {

    /* 
        // We generate a signer for the NFT
        const asset = generateSigner(umi)
    
        console.log('Creating NFT...')
        const tx = await create(umi, {
            asset,
            name: 'My NFT',
            uri: "https://devnet.irys.xyz/9bXcdWPmq1zfzCnjSrF26sKmM1EeFrAnMRrG29J36Tc3",
            owner: publicKey("58hscQKoL5vJ8Vt4k4N81TC8HqsZSR7wBSL2agRYXwD3"),
        }).sendAndConfirm(umi)
    
        // Finally we can deserialize the signature that we can check on chain.
        const signature = base58.deserialize(tx.signature)[0]
    
        // Log out the signature and the links to the transaction and the NFT.
        console.log('\nNFT Created')
        console.log('View Transaction on Solana Explorer')
        console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`)
        console.log('\n')
        console.log('View NFT on Metaplex Explorer')
        console.log(`https://core.metaplex.com/explorer/${asset.publicKey}?env=devnet`)
     */

    // send nft to another wallet
    /// Fetch the Candy Machine
    const candyMachine = publicKey("FxHe7VpTB11yfcmxcK4ywcwq6QmPy34JUT1kXf3tsAX1");
    const candyMachineData = await fetchCandyMachine(umi, candyMachine);

    // lets check mint counter first!!

    const mintCounter = await safeFetchMintCounterFromSeeds(umi, {
        id: 1, // The mintLimit id you set in your guard config
        user: umi.identity.publicKey,
        candyMachine: candyMachineData.publicKey,
        candyGuard: candyMachineData.mintAuthority,
    });
    console.log(mintCounter)

    /* // if counter >= 1 return
    if (mintCounter !== null && mintCounter.count >= 1) {
        console.log("Mint Counter is greater than 1")
        return
    } */

    /// Generate the Asset KeyPair
    const asset = generateSigner(umi)

    /// Mint the Asset
    const mintIx = await mintV1(umi, {
        candyMachine,
        collection: candyMachineData.collectionMint,
        asset,
        owner: publicKey("58hscQKoL5vJ8Vt4k4N81TC8HqsZSR7wBSL2agRYXwD3"),
        mintArgs: {
            solPayment: some({ destination: umi.identity.publicKey }),
            mintLimit: some({ id: 1 })
        },
    }).sendAndConfirm(umi)

    /// Deserialize the Signature from the Transaction
    console.log(`\nAsset Minted: https://solana.fm/tx/${base58.deserialize(mintIx.signature)[0]}?cluster=devnet-alpha`);

}

createNft();