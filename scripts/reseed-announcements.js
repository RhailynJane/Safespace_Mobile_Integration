/*
  Script: scripts/reseed-announcements.js
  Purpose: Call announcements.clearAndReseed with an orgId to seed org-specific announcements
  Usage:
    1. Start convex dev: npx convex dev
    2. In a new shell, set CONVEX_URL to the deployment shown by convex dev (or rely on default):
       PowerShell: $env:CONVEX_URL="https://your-dev-url.convex.cloud"
       CMD: set CONVEX_URL=https://your-dev-url.convex.cloud
    3. Run:
       node scripts/reseed-announcements.js sait

*/

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://your-deployment.convex.cloud";

async function main() {
  const orgId = process.argv[2];

  if (!orgId) {
    console.error("Usage: node scripts/reseed-announcements.js <orgId>");
    process.exit(1);
  }

  if (CONVEX_URL.includes("your-deployment")) {
    console.error("Please set CONVEX_URL to your local Convex dev deployment URL (run 'npx convex dev' to get it)");
    process.exit(1);
  }

  const client = new ConvexHttpClient(CONVEX_URL);
  try {
    console.log(`Calling announcements.clearAndReseed with orgId=${orgId} ...`);
    const result = await client.mutation("announcements:clearAndReseed", { orgId });
    console.log("Success:", result);
  } catch (err) {
    console.error("Convex call failed:", err);
    process.exit(1);
  }
}

main();
