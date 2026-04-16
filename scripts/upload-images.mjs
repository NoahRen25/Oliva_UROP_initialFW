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
import { fileURLToPath } from "node:url";

// --------------- resolve project root ---------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, ".."); // scripts/ -> project root

// --------------- config ---------------

function cleanEnvValue(val) {
  if (!val) return undefined;
  // Strip quotes, whitespace, trailing slashes
  return val.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "").trim();
}

const SUPABASE_URL =
  cleanEnvValue(process.env.SUPABASE_URL) ||
  cleanEnvValue(process.env.VITE_SUPABASE_URL) ||
  (() => {
    try {
      const env = fs.readFileSync(path.join(PROJECT_ROOT, ".env"), "utf8");
      const match = env.match(/VITE_SUPABASE_URL=(.+)/);
      return cleanEnvValue(match?.[1]);
    } catch {
      return undefined;
    }
  })();

const SERVICE_ROLE_KEY = cleanEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Set SUPABASE_URL (or VITE_SUPABASE_URL in .env) and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

// Sanity check the URL
if (!SUPABASE_URL.startsWith("https://")) {
  console.error(`Invalid SUPABASE_URL: "${SUPABASE_URL}"`);
  console.error("It should look like: https://your-project-id.supabase.co");
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
  if (!fs.existsSync(dir)) {
    console.warn(`  WARNING: directory not found — ${dir}`);
    return results;
  }
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

// --------------- ensure buckets exist ---------------

const BUCKETS = [
  { name: "generated-images", public: true },
  { name: "mem-images", public: true },
  { name: "demo-images", public: true },
];

async function ensureBuckets() {
  console.log("Ensuring buckets exist...");

  for (const bucket of BUCKETS) {
    // Try to create each bucket; if it already exists, that's fine
    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
    });

    if (error) {
      if (error.message.includes("already exists")) {
        console.log(`  EXISTS  ${bucket.name}`);
      } else {
        console.error(
          `  FAIL creating ${bucket.name}: ${error.message}`
        );
        console.error(
          "\n  Check that your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct."
        );
        console.error(`  URL being used: "${SUPABASE_URL}"`);
        console.error(
          `  Key being used: "${SERVICE_ROLE_KEY.slice(0, 10)}...${SERVICE_ROLE_KEY.slice(-4)}"\n`
        );
        process.exit(1);
      }
    } else {
      console.log(`  CREATED ${bucket.name}`);
    }
  }
  console.log("");
}

// --------------- upload jobs ---------------

async function uploadGeneratedImages() {
  console.log("\n--- generated-images bucket ---");
  const baseDir = path.join(PROJECT_ROOT, "public", "images");
  const folders = ["flux_2_pro", "gptimage15", "nano_banana_pro"];
  let count = 0;

  for (const folder of folders) {
    const dir = path.join(baseDir, folder);
    const files = walkDir(dir);
    for (const file of files) {
      const rel = path.relative(baseDir, file);
      const ok = await uploadFile("generated-images", rel, file);
      if (ok) count++;
    }
  }
  console.log(`Uploaded ${count} generated images.\n`);
}

async function uploadMemImages() {
  console.log("\n--- mem-images bucket ---");
  const baseDir = path.join(PROJECT_ROOT, "public", "mem_images");
  const files = walkDir(baseDir);
  let count = 0;

  for (const file of files) {
    const rel = path.relative(baseDir, file);
    const ok = await uploadFile("mem-images", rel, file);
    if (ok) count++;
  }
  console.log(`Uploaded ${count} memorability images.\n`);
}

async function uploadDemoImages() {
  console.log("\n--- demo-images bucket ---");
  const baseDir = path.join(PROJECT_ROOT, "src", "images");
  const files = walkDir(baseDir);
  let count = 0;

  for (const file of files) {
    const rel = path.relative(baseDir, file);
    const ok = await uploadFile("demo-images", rel, file);
    if (ok) count++;
  }
  console.log(`Uploaded ${count} demo images.\n`);
}

// --------------- main ---------------

async function main() {
  console.log("Uploading images to Supabase Storage...");
  console.log(`URL: ${SUPABASE_URL}`);
  console.log(`Key: ${SERVICE_ROLE_KEY.slice(0, 10)}...${SERVICE_ROLE_KEY.slice(-4)}`);
  console.log(`Project root: ${PROJECT_ROOT}\n`);

  await ensureBuckets();

  await uploadGeneratedImages();
  await uploadMemImages();
  await uploadDemoImages();

  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});