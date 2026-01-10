// =========================================
// HUMAN 2026 — IPFS Service (nft.storage)
// Upload images + metadata
// =========================================

import { NFTStorage, File, Blob } from "nft.storage";
import fs from "fs";
import path from "path";

// =========================
// CONFIG
// =========================
const NFT_STORAGE_KEY = process.env.NFT_STORAGE_KEY;

if (!NFT_STORAGE_KEY) {
  throw new Error("NFT_STORAGE_KEY not set");
}

const client = new NFTStorage({ token: NFT_STORAGE_KEY });

// =========================
// HELPERS
// =========================
function assetPath(filename) {
  return path.join(process.cwd(), "assets", filename);
}

function tierConfig(type) {
  return {
    bronze: {
      name: "HUMAN — NFT Bronze",
      description: "Presença humana validada por continuidade.",
      image: "bronze.png"
    },
    prata: {
      name: "HUMAN — NFT Prata",
      description: "Continuidade humana sustentada.",
      image: "prata.png"
    },
    ouro: {
      name: "HUMAN — NFT Ouro",
      description: "Lealdade humana rara.",
      image: "ouro.png"
    },
    diamante: {
      name: "HUMAN — NFT Diamante",
      description: "Presença humana excecional.",
      image: "diamante.png"
    }
  }[type];
}

// =========================
// UPLOAD IMAGE AS DIRECTORY
// =========================
export async function uploadImage(type) {
  const config = tierConfig(type);
  if (!config) throw new Error("Invalid NFT type");

  const filePath = assetPath(config.image);
  const content = fs.readFileSync(filePath);

  const cid = await client.storeDirectory([
    new File([content], config.image, { type: "image/png" })
  ]);

  return `ipfs://${cid}/${config.image}`;
}

// =========================
// UPLOAD METADATA AS DIRECTORY
// =========================
export async function uploadMetadata({ type, source, image_ipfs }) {
  const config = tierConfig(type);

  const metadata = {
    name: config.name,
    description: config.description,
    image: image_ipfs,
    attributes: [
      { trait_type: "Tier", value: type },
      { trait_type: "Source", value: source },
      { trait_type: "Year", value: "2026" },
      { trait_type: "Project", value: "HUMAN" }
    ]
  };

  const cid = await client.storeDirectory([
    new File(
      [JSON.stringify(metadata, null, 2)],
      "metadata.json",
      { type: "application/json" }
    )
  ]);

  return `ipfs://${cid}/metadata.json`;
}
