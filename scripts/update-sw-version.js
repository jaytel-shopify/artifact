#!/usr/bin/env node
/**
 * Updates the service worker cache version with a timestamp.
 * This ensures every deploy has a fresh cache version.
 * Run this as part of the build process.
 */

const fs = require("fs");
const path = require("path");

const swPath = path.join(__dirname, "..", "dist", "sw.js");

if (!fs.existsSync(swPath)) {
  console.log("⚠️  sw.js not found in dist/, skipping version update");
  process.exit(0);
}

const timestamp = Date.now();
const version = `v${timestamp}`;

let content = fs.readFileSync(swPath, "utf8");

// Replace the version string
content = content.replace(
  /const CACHE_VERSION = "[^"]+";/,
  `const CACHE_VERSION = "${version}";`
);

fs.writeFileSync(swPath, content);

console.log(`✅ Updated sw.js cache version to ${version}`);

