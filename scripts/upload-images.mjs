#!/usr/bin/env node
/**
 * One-time migration script: uploads local images to Supabase Storage.
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/upload-images.mjs
 *
 * Requires VITE_SUPABASE_URL in .env (or pass as env var SUPABASE_URL).
 */

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// --------------- config ---------------

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  (() => {
    try {
      const env = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
      const match = env.match(/VITE_SUPABASE_URL=(.+)/);
      return match?.[1]?.trim();
    } catch {
      return undefined;
    }
  })();

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Set SUPABASE_URL (or VITE_SUPABASE_URL in .env) and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// --------------- helpers ---------------

const MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

async function uploadFile(bucket, storagePath, localPath) {
  const ext = path.extname(localPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const fileBuffer = fs.readFileSync(localPath);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`  FAIL ${bucket}/${storagePath}: ${error.message}`);
    return false;
  }
  console.log(`  OK   ${bucket}/${storagePath}`);
  return true;
}

// --------------- upload jobs ---------------

async function uploadGeneratedImages() {
  console.log("\n--- generated-images bucket ---");
  const baseDir = path.resolve("public/images");
  const folders = ["flux_2_pro", "gptimage15", "nano_banana_pro"];
  let count = 0;

  for (const folder of folders) {
    const dir = path.join(baseDir, folder);
    const files = walkDir(dir);
    for (const file of files) {
      const rel = path.relative(baseDir, file); // e.g. flux_2_pro/generated_001.png
      const ok = await uploadFile("generated-images", rel, file);
      if (ok) count++;
    }
  }
  console.log(`Uploaded ${count} generated images.\n`);
}

async function uploadMemImages() {
  console.log("\n--- mem-images bucket ---");
  const baseDir = path.resolve("public/mem_images");
  const files = walkDir(baseDir);
  let count = 0;

  for (const file of files) {
    const rel = path.relative(baseDir, file); // e.g. target_000000.jpg
    const ok = await uploadFile("mem-images", rel, file);
    if (ok) count++;
  }
  console.log(`Uploaded ${count} memorability images.\n`);
}

async function uploadDemoImages() {
  console.log("\n--- demo-images bucket ---");
  const baseDir = path.resolve("src/images");
  const files = walkDir(baseDir);
  let count = 0;

  for (const file of files) {
    const rel = path.relative(baseDir, file); // e.g. GPTMoonFlags.png
    const ok = await uploadFile("demo-images", rel, file);
    if (ok) count++;
  }
  console.log(`Uploaded ${count} demo images.\n`);
}

// --------------- main ---------------

async function main() {
  console.log("Uploading images to Supabase Storage...");
  console.log(`URL: ${SUPABASE_URL}\n`);

  await uploadGeneratedImages();
  await uploadMemImages();
  await uploadDemoImages();

  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
