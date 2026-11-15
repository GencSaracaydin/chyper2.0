import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Uploads the fal-generated assets in assets/library/generated/manifest.json to the deployment in .env.local.
// Usage, from the repo root: CONVEX_DEPLOY_KEY=<dev deploy key> bun scripts/importFalAssets.ts
// Regenerate or extend the pack with scripts/fal/generate.py first.

type Asset = { key: string; kind: "image" | "sound"; description: string; file: string; width?: number; height?: number };

const generated = join(process.cwd(), "assets", "library", "generated");
const { assets }: { assets: Asset[] } = JSON.parse(readFileSync(join(generated, "manifest.json"), "utf8"));
const client = new ConvexHttpClient(process.env.EXPO_PUBLIC_CONVEX_URL!);
(client as unknown as { setAdminAuth(key: string): void }).setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);

async function importAsset(asset: Asset) {
  const url: string = await client.mutation(anyApi.assets.generateUploadUrl, {});
  const contentType = asset.file.endsWith(".mp3") ? "audio/mpeg" : asset.file.endsWith(".jpg") ? "image/jpeg" : "image/png";
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": contentType }, body: new Uint8Array(readFileSync(join(generated, asset.file))) });
  if (!response.ok) throw new Error(`Upload failed for ${asset.key}: ${response.status}`);
  const { storageId } = (await response.json()) as { storageId: string };
  const { key, kind, description, width, height } = asset;
  await client.mutation(anyApi.assets.add, { key, kind, source: "fal", description, storageId, width, height });
  console.log(kind, key);
}

for (let i = 0; i < assets.length; i += 16) await Promise.all(assets.slice(i, i + 16).map(importAsset));
