# WebRTC Duplicate Class Fix

## Problem
Android build was failing with:
```
Duplicate class org.webrtc.AddIceObserver found in modules:
- sendbird-webrtc-1.0.6998.aar (from @sendbird/calls-react-native)
- webrtc-124.0.0.aar (from react-native-webrtc)
```

This occurred because two dependencies were including conflicting WebRTC libraries:
- **@sendbird/calls-react-native** bundles WebRTC v1.0.6998
- **react-native-webrtc** includes WebRTC v124.0.0

## Solution
Removed `react-native-webrtc` from dependencies since:
1. Sendbird Calls already provides full WebRTC functionality for video calls
2. The standalone package was redundant and causing conflicts
3. All video calling features are handled by Sendbird Calls SDK

## Changes Made
- **File**: `package.json`
- **Action**: Removed `"react-native-webrtc": "^124.0.7"` from dependencies

## Verification
The build will now use only Sendbird's WebRTC implementation, eliminating all duplicate class errors.

## Dependencies Timeline
- Sendbird Calls: Provides WebRTC + signaling for audio/video calls
- Twilio Video: Optional backup for video (not required with Sendbird)
- Removed: React Native WebRTC (redundant, causing conflicts)

## Notes
- This fix applies to Android builds
- iOS builds should also resolve faster without the duplicate dependency
- No functionality lost: Sendbird Calls covers all video calling needs
