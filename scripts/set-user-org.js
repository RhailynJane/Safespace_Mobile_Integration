/*
  Script: scripts/set-user-org.js
  Purpose: Set a user's org via the Convex admin mutation users.setOrgByEmail
  Usage:
    1. Start convex dev: npx convex dev
    2. In a new shell, set CONVEX_URL to the deployment shown by convex dev (or rely on default):
       PowerShell: $env:CONVEX_URL="https://your-dev-url.convex.cloud"
       CMD: set CONVEX_URL=https://your-dev-url.convex.cloud
    3. Run the script:
       node scripts/set-user-org.js "rhailynjane.cona@edu.sait.ca" "sait"

  Notes: This is an alternative to using `npx convex run` and avoids PowerShell JSON quoting issues.
*/

import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.CONVEX_URL || "https://your-deployment.convex.cloud";

async function main() {
  const email = process.argv[2];
  const orgId = process.argv[3];

  if (!email || !orgId) {
    console.error("Usage: node scripts/set-user-org.js <email> <orgId>");
    process.exit(1);
  }

  if (CONVEX_URL.includes("your-deployment")) {
    console.error("Please set CONVEX_URL to your local Convex dev deployment URL (run 'npx convex dev' to get it)");
    process.exit(1);
  }

  const client = new ConvexHttpClient(CONVEX_URL);
  try {
    console.log(`Calling users.setOrgByEmail for email=${email} orgId=${orgId} ...`);
    const result = await client.mutation("users:setOrgByEmail", { email, orgId });
    console.log("Success:", result);
  } catch (err) {
    console.error("Convex call failed:", err);
    process.exit(1);
  }
}

main();
