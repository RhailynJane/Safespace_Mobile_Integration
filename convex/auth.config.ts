// convex/auth.config.ts
// Convex authentication configuration for Clerk.
// NOTE: We wrap the configuration with authConfig to ensure Convex picks it up correctly.
// If this was previously a plain object, Convex may have ignored it resulting in missing identities.

import type { AuthConfig } from "convex/server";

const config: AuthConfig = {
  providers: [
    {
      domain: "https://live-sawfly-17.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

export default config;
