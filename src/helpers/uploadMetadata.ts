import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import fs from "fs";
import path from "path";
import wallet from "../../wallet.json";


// Step 1: Initialize Umi with Devnet RPC and Irys uploader
const umi = createUmi("https://api.devnet.solana.com").use(
    irysUploader({
        address: "https://devnet.irys.xyz", // Change to mainnet address when deploying live
    })
);
let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const adminSigner = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(adminSigner));

// Function to upload an image and its metadata
const uploadItem = async (index: number) => {
    // Step 2: Read the image file
    const imageFile = fs.readFileSync(path.join(__dirname, `../../assets/${index}.png`));

    // Step 3: Convert the image to a Umi-compatible format
    const umiImageFile = createGenericFile(imageFile, `${index}.png`, {
        tags: [{ name: "Content-Type", value: "image/png" }],
    });

    console.log(`Uploading image ${index}...`);

    // Step 4: Upload image to Arweave
    const imageUri = await umi.uploader.upload([umiImageFile]).catch((err) => {
        throw new Error(`Image upload failed for item ${index}: ${err}`);
    });

    console.log(`Image ${index} uploaded successfully:`, imageUri[0]);

    // Only take after last "/": https://arweave.net/3iHab1z3Uk1FkApDkAAzTME8oguWkvcMYaYPyrkhxTL7
    const encodedUri = imageUri[0].split("/").pop();

    // Step 5: Read and modify the metadata
    const metadataFile = fs.readFileSync(path.join(__dirname, `../../assets/${index}.json`));
    const metadata = JSON.parse(metadataFile.toString());
    metadata.properties.files[0].uri = `https://devnet.irys.xyz/${encodedUri}`;
    metadata.image = `https://devnet.irys.xyz/${encodedUri}`;

    console.log(`Uploading metadata for item ${index}...`);

    // Step 6: Upload metadata to Arweave
    const metadataUri = await umi.uploader.uploadJson(metadata).catch((err) => {
        throw new Error(`Metadata upload failed for item ${index}: ${err}`);
    });

    console.log(`Metadata for item ${index} uploaded successfully:`, metadataUri);

    console.log(`\nMetadata URI for item ${index}: ${metadataUri}\n`);

    return { uri: metadataUri.split("/").pop() };
};

// Step 7: Upload the collection metadata (collection.png and collection.json)
const uploadCollectionMetadata = async () => {
    // Step 2: Read the collection image file
    const collectionImageFile = fs.readFileSync(path.join(__dirname, "../../assets/collection.png"));

    // Step 3: Convert the collection image to a Umi-compatible format
    const umiCollectionImageFile = createGenericFile(collectionImageFile, "collection.png", {
        tags: [{ name: "Content-Type", value: "image/png" }],
    });

    console.log("Uploading collection image...");

    // Step 4: Upload collection image to Arweave
    const collectionImageUri = await umi.uploader.upload([umiCollectionImageFile]).catch((err) => {
        throw new Error(`Collection image upload failed: ${err}`);
    });

    console.log("Collection image uploaded successfully:", collectionImageUri[0]);

    // Only take after last "/": https://arweave.net/3iHab1z3Uk1FkApDkAAzTME8oguWkvcMYaYPyrkhxTL7
    const encodedCollectionUri = collectionImageUri[0].split("/").pop();

    // Step 5: Read and modify the collection metadata
    const collectionMetadataFile = fs.readFileSync(path.join(__dirname, "../../assets/collection.json"));
    const collectionMetadata = JSON.parse(collectionMetadataFile.toString());
    collectionMetadata.properties.files[0].uri = `https://devnet.irys.xyz/${encodedCollectionUri}`;
    collectionMetadata.image = `https://devnet.irys.xyz/${encodedCollectionUri}`;

    console.log("Uploading collection metadata...");

    // Step 6: Upload collection metadata to Arweave
    const collectionMetadataUri = await umi.uploader.uploadJson(collectionMetadata).catch((err) => {
        throw new Error(`Collection metadata upload failed: ${err}`);
    });

    console.log("Collection metadata uploaded successfully:", collectionMetadataUri);

    console.log(`\nCollection Metadata URI: ${collectionMetadataUri}\n`);
};

// Step 8: Iterate over the 50 items and upload their images and metadata
const uploadMetadata = async () => {
    // Check balance before starting
    console.log(`Balance of ${umi.identity.publicKey}: ${(await umi.rpc.getBalance(umi.identity.publicKey)).basisPoints}`);

    // Upload collection metadata first
    await uploadCollectionMetadata();

    const itemUris = [];
    const num_items = 2;

    // Iterate over 50 items (0 to 49)
    for (let i = 0; i < num_items; i++) {
        const itemUri = await uploadItem(i);
        itemUris.push(itemUri);
    }
    fs.writeFileSync(path.join(__dirname, "configlines.json"), JSON.stringify(itemUris, null, 2));
};

// create function tu upload Image
const uploadImageBlink = async () => {
    const imageFile = fs.readFileSync(path.join(__dirname, `../../assets/blink.png`));
    const umiImageFile = createGenericFile(imageFile, `blink.png`, {
        tags: [{ name: "Content-Type", value: "image/png" }],
    });
    console.log(`Uploading image blink...`);
    const imageUri = await umi.uploader.upload([umiImageFile]).catch((err) => {
        throw new Error(`Image upload failed for item blink: ${err}`);
    });
    console.log(`Image blink uploaded successfully:`, imageUri[0]);
    const encodedUri = imageUri[0].split("/").pop();
    console.log(encodedUri)
    return
}

uploadImageBlink();
//uploadMetadata();

