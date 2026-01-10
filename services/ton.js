// =========================================
// HUMAN 2026 — TON Service (ESM)
// NFT mint básico via NftCollection
// =========================================

import TonWeb from "tonweb";

const PROVIDER =
  process.env.TON_RPC ||
  "https://toncenter.com/api/v2/jsonRPC";

const provider = new TonWeb.HttpProvider(PROVIDER);
const tonweb = new TonWeb(provider);

// ENV
const PRIVATE_KEY_HEX = process.env.TON_PRIVATE_KEY;
if (!PRIVATE_KEY_HEX) {
  throw new Error("TON_PRIVATE_KEY not set in .env");
}

const COLLECTION_ADDRESS = process.env.TON_COLLECTION_ADDRESS;
if (!COLLECTION_ADDRESS) {
  throw new Error("TON_COLLECTION_ADDRESS not set in .env");
}

// Keypair
const keyPair = TonWeb.utils.keyPairFromSeed(
  Buffer.from(PRIVATE_KEY_HEX, "hex")
);

// Wallet v4
const wallet = new tonweb.wallet.all.v4R2(provider, {
  publicKey: keyPair.publicKey,
});

// =========================================
// MINT NFT (ownerAddress + IPFS metadata)
// =========================================
export async function mintNFT(metadataIpfs, ownerAddress) {
  try {
    const seqno = await wallet.methods.seqno().call();

    // payload como bytes (TON não aceita string crua)
    const payload = TonWeb.utils.stringToBytes(metadataIpfs);

    const transfer = wallet.methods.transfer({
      secretKey: keyPair.secretKey,
      toAddress: COLLECTION_ADDRESS,
      amount: TonWeb.utils.toNano("0.05"),
      seqno,
      payload,
    });

    const result = await transfer.send();

    return {
      ok: true,
      tx_hash: result,
    };

  } catch (err) {
    console.error("❌ mintNFT erro:", err.message);
    return { ok: false, error: err.message };
  }
}
