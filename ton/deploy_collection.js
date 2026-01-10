// =========================================
// HUMAN — Presence Collection 2026
// DEPLOY SCRIPT (MAINNET)
// ES MODULE VERSION
// =========================================

import TonWeb from "tonweb";

const provider = new TonWeb.HttpProvider(
  "https://toncenter.com/api/v2/jsonRPC"
);

const tonweb = new TonWeb(provider);

// ENV
const PRIVATE_KEY_HEX = process.env.TON_PRIVATE_KEY;
if (!PRIVATE_KEY_HEX) {
  throw new Error("TON_PRIVATE_KEY not set");
}

// Keypair
const keyPair = TonWeb.utils.keyPairFromSeed(
  Buffer.from(PRIVATE_KEY_HEX, "hex")
);

// Wallet v4
const wallet = new tonweb.wallet.all.v4R2(provider, {
  publicKey: keyPair.publicKey
});

(async () => {
  const seqno = await wallet.methods.seqno().call();

  console.log("⏳ Deploying NFT Collection...");

  const collection = new TonWeb.token.nft.NftCollection({
    ownerAddress: wallet.address,
    royalty: 0.05,
    royaltyAddress: wallet.address,
    collectionContentUri: "ipfs://COLLECTION_METADATA",
    nftItemContentBaseUri: "ipfs://"
  });

  await wallet.methods.transfer({
    secretKey: keyPair.secretKey,
    toAddress: collection.address,
    amount: TonWeb.utils.toNano("0.3"),
    seqno: seqno,
    payload: ""
  }).send();

  console.log("\n✅ COLLECTION DEPLOYED SUCCESSFULLY");
  console.log("📦 Collection address:");
  console.log(collection.address.toString(true, true, true));
})();
