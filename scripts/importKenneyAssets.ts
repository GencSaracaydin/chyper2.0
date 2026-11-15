import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import catalog from "./kenneyAssets.json";

// Uploads the curated Kenney assets in kenneyAssets.json to the deployment in .env.local.
// Usage, from the repo root: CONVEX_DEPLOY_KEY=<dev deploy key> bun scripts/importKenneyAssets.ts
// Sounds are converted from Ogg to MP3 with ffmpeg so they play in the iOS WebView.

const library = join(process.cwd(), "assets", "library");
const client = new ConvexHttpClient(process.env.EXPO_PUBLIC_CONVEX_URL!);
(client as unknown as { setAdminAuth(key: string): void }).setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);
const scratch = mkdtempSync(join(tmpdir(), "kenney-"));

async function upload(bytes: Buffer, contentType: string) {
  const url: string = await client.mutation(anyApi.assets.generateUploadUrl, {});
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": contentType }, body: new Uint8Array(bytes) });
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
  return ((await response.json()) as { storageId: string }).storageId;
}

for (const asset of catalog.images) {
  const bytes = readFileSync(join(library, asset.path));
  const storageId = await upload(bytes, "image/png");
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  await client.mutation(anyApi.assets.add, { key: asset.key, kind: "image", source: "kenney", description: asset.description, storageId, width, height });
  console.log("image", asset.key, `${width}x${height}`);
}

for (const asset of catalog.sounds) {
  const mp3 = join(scratch, asset.key + ".mp3");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", join(library, asset.path), "-codec:a", "libmp3lame", "-q:a", "4", mp3]);
  const storageId = await upload(readFileSync(mp3), "audio/mpeg");
  await client.mutation(anyApi.assets.add, { key: asset.key, kind: "sound", source: "kenney", description: asset.description, storageId });
  console.log("sound", asset.key);
}
