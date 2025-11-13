# SafeSpace Notification System

## Two Types of Notifications

### 1. Local Reminders (Scheduled on Device)
These are **scheduled locally** using `expo-notifications` and work even when the app is closed:

- **Mood Tracking** - Daily or custom schedule reminders
- **Journaling** - Daily or custom schedule reminders

**Requirements:**
- Master "Notifications" toggle must be ON
- Category toggle (e.g., "Mood Tracking") must be ON
- Reminder is auto-enabled when you turn on the category
- Time must be set (defaults: Mood 9:00 AM, Journal 8:00 PM)

**How to enable:**
1. Go to Settings → Notifications
2. Turn ON "Notifications" master toggle
3. Turn ON "Mood Tracking" or "Journaling"
4. Set your preferred time
5. The reminder will schedule automatically

**Testing:**
- Set a time 2-3 minutes in the future
- You should see logs: `🗓️ Scheduling MOOD/JOURNAL reminders...`
- Then: `🔔 Scheduled daily notification...`
- Notification will appear at the set time

---

### 2. Push Notifications (Sent from Backend)
These are **sent by the backend** when events occur and require:
- Dev client built with FCM credentials
- Push token registered

**Features with push notifications:**
- **Messages** - New message from support worker
- **Post Reactions** - Someone reacts to your forum post
- **Appointments** - Appointment confirmations/reminders
- **Self-Assessment** - Assessment due reminders

**Requirements:**
- EAS dev client with FCM configured
- Backend running and connected
- Category toggles ON in settings

**Status:** Backend checks user settings before sending push notifications. If a category is disabled, push for that type is suppressed.

---

## Current Implementation Status

✅ **Working:**
- Local reminders for Mood & Journaling (fully implemented)
- Push notification backend integration (checks user settings)
- Auto-enable reminder when category is toggled ON
- Debounced auto-save (500ms) to prevent rapid reschedules

❌ **Not Implemented:**
- Self-assessment, Messages, Appointments, Forum posts do NOT have local reminders
- These only use push notifications from backend when events occur

---

## Troubleshooting

### "I'm not getting mood/journal reminders"

1. Check Settings → Notifications:
   - [ ] "Notifications" master toggle is ON
   - [ ] "Mood Tracking" or "Journaling" category is ON
   - [ ] Time is set (not blank)

2. Check device notification permissions:
   - Android: Settings → Apps → SafeSpace → Notifications → Allow
   - iOS: Settings → SafeSpace → Notifications → Allow

3. Check logs for scheduling messages:
   ```
   🗓️ Scheduling MOOD reminders: freq=Daily, time=09:00
   🔔 Scheduled daily notification 'Mood check-in' at 09:00
   ```

4. Test with near-future time:
   - Set time to 2-3 minutes from now
   - Save and wait
   - Should see notification appear

### "I'm not getting message/appointment push notifications"

These require:
1. EAS dev client built with FCM credentials uploaded
2. Push token registered (see logs: `✅ Registered Expo push token`)
3. Backend running and sending notifications
4. Category toggle ON in settings

If you haven't uploaded FCM credentials yet, these won't work. See `android/app/README.md` for setup.

---

## Next Steps for FCM Push Setup

1. Upload service account JSON:
   ```bash
   eas credentials -p android
   ```
   - Select: development profile
   - Choose: "Push Notifications (V1): Manage your Google Service Account Key For FCM V1"
   - Upload: `C:\Users\User\Downloads\safespace-e08cd-firebase-adminsdk-fbsvc-61bdab1814.json`

2. Rebuild dev client:
   ```bash
   eas build --profile development --platform android
   ```

3. Install APK and test push token registration

4. Test backend push endpoints once token is registered
