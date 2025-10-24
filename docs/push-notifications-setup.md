# Push Notifications Setup Guide

## Issue Fixed
The error `No "projectId" found` has been resolved with better error handling. The app will now work without push notifications until you set up an Expo project.

## Current Status
✅ Database issue fixed - `clerk_user_id` is now properly included in user_settings creation
✅ Push notification error is now gracefully handled
⚠️ Push notifications require Expo project setup (optional for development)

## To Enable Push Notifications (Optional)

### Step 1: Initialize Expo Project
```bash
# Install EAS CLI globally (if not already installed)
npm install -g eas-cli

# Login to your Expo account (create one if needed at expo.dev)
eas login

# Initialize your project
eas init
```

### Step 2: Update app.json
The `eas init` command will automatically update your `app.json` with the correct `projectId`.

Alternatively, you can manually update the `extra.eas.projectId` field in `app.json`:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-actual-project-id"
      }
    }
  }
}
```

### Step 3: Build and Test
```bash
# For development build
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

## For Development Without Push Notifications
The app will work perfectly fine without push notifications. The error is now silently handled and won't affect other functionality.

## Database Fix Details
Fixed the `user_settings` creation in `/api/sync-user` endpoint:
- Added `clerk_user_id` to both INSERT columns and SELECT query
- Added reminder-related default values (mood/journal reminder settings)
- Changed conflict resolution from `user_id` to `clerk_user_id`

## Testing
After these changes, new user signup should:
1. Create user record ✅
2. Create client_profiles record ✅
3. Create user_settings record with all defaults ✅
4. Gracefully skip push notification registration if no projectId ✅
