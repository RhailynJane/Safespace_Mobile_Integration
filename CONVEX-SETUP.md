# Convex Setup for Mobile App

## ⚠️ IMPORTANT: Do NOT run `npx convex dev` in this folder!

The mobile and web apps share the same Convex backend deployment: `dev:wandering-partridge-43`

**The web app's `convex/` folder is the source of truth** and contains ALL functions for both mobile and web.

## How to Run

### For Development:

1. **In the WEB folder** (`c:\safespace-integration\SafeSpaceApp_Web`):
   ```powershell
   npx convex dev
   ```

2. **In the MOBILE folder** (this folder):
   ```powershell
   # Just run your mobile app - it will connect to the deployment
   npx expo start
   ```

### Why?

- The web `convex/` folder has **all functions**: organizations, clients, roles, auditLogs, etc.
- The mobile `convex/` folder is **incomplete** and outdated
- Running `convex dev` in both places causes them to **overwrite each other**
- This results in missing function errors like:
  - `Could not find public function for 'organizations:getBySlug'`
  - `Could not find public function for 'users:getByClerkId'`

## Shared Configuration

Both apps use:
- **Convex Deployment**: `dev:wandering-partridge-43`
- **Convex URL**: `https://wandering-partridge-43.convex.cloud`
- **Clerk Auth**: `live-sawfly-17.clerk.accounts.dev`

## Mobile convex/ Folder

The `convex/` folder in this mobile directory is kept for:
- TypeScript types generation (`_generated/`)
- Schema reference
- Local development convenience

But it should **NOT** be deployed via `npx convex dev`.
