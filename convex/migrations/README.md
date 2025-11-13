# Settings Migration to Convex Settings Table

## Overview
This migration syncs settings from `profiles.preferences` to the dedicated `settings` table in Convex for better visibility in the Convex dashboard.

## Why?
- Settings are currently stored in `profiles.preferences` (working fine)
- The `settings` table exists in the schema but was empty
- This migration populates the `settings` table for dashboard visibility
- Going forward, settings will be written to BOTH locations automatically

## Running the Migration

### Option 1: Via Convex CLI (Recommended)
```bash
npx convex run migrations/syncSettingsToTable:syncAllSettings
```

### Option 2: Via Convex Dashboard
1. Go to your Convex dashboard
2. Navigate to Functions → Mutations
3. Find `migrations/syncSettingsToTable:syncAllSettings`
4. Click "Run" with no arguments

## What It Does
1. Reads all profiles with preferences
2. Creates/updates corresponding entries in the `settings` table
3. Preserves all existing settings data
4. Provides a summary of synced/skipped/error counts

## After Migration
- New settings changes will write to BOTH `profiles.preferences` AND `settings` table
- You can view settings in the Convex dashboard under the `settings` table
- Primary source of truth remains `profiles.preferences`

## Rollback
If needed, you can delete all entries from the `settings` table:
```bash
# In Convex dashboard, delete all documents from settings table
```

The app will continue working since it reads from `profiles.preferences`.

## Verification
After running the migration:
1. Open Convex dashboard
2. Navigate to Tables → settings
3. Verify settings entries exist for your users
4. Check that settings match `profiles.preferences` data
