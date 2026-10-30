# ISKCON Hadapsar — Global Japa in-app broadcast

## Existing pages and behavior

- `index.html` links to `global_jap.html`.
- `global_jap.html` preserves the existing digital japa counter, saved devotee names, three-language support, and three Zoom meeting fallback buttons.
- `global-japa-live.js` and `global-japa-live.css` provide an inline audio/video player without opening another app.
- `global-japa-live.json` is the small control file used to activate an **authorized** live broadcast.

The player is currently intentionally inactive. No verified media feed for H.H. Lokanath Swami Maharaj was present in this repository. Do not label an unrelated stream as his live session.

## Activate an actual live broadcast

The event organizer / authorized host must supply an HTTPS **media stream URL**, not a Zoom meeting join link. Use an appropriately provisioned streaming service/CDN for large audiences. Hosting a GitHub Pages site does **not** host the live media broadcast.

Edit `global-japa-live.json` to use these fields:

```json
{
  "enabled": true,
  "title": "Global Japa • Live with Lokanath Swami Maharaj",
  "mediaType": "audio",
  "streamUrl": "https://YOUR_AUTHORIZED_STREAMING_HOST/live/audio.mp3",
  "audioFallbackUrl": "",
  "expiresAt": "2026-11-01T04:00:00+05:30",
  "note": "Session source supplied by the authorized host."
}
```

Use `mediaType: "video"` with an HTTPS video stream if the Android player supports its format. The optional `audioFallbackUrl` provides a lower-data listening option. MP3/AAC audio is generally simpler to deploy; HLS playback compatibility depends on the Android WebView/device. For universal HLS support and reliable background playback, a **native Android Media3/ExoPlayer implementation** with real-device testing is preferable.

Every session should get a refreshed `expiresAt` so an expired or stale broadcast is no longer offered as live. Turn `enabled` off when the event is cancelled. No login/password/host API token should go into this public JSON file.

## What the update fixes

- The schedule badge now indicates a **scheduled Japa time**, not a claim that a meeting is confirmed live.
- The inline player stays inactive if an approved source is not configured, the expiry has passed, or the config is inaccessible.
- The existing Zoom meeting choices are available as explicit **fallbacks** rather than silently loading Zoom into the privileged main WebView.
- `temple-runtime.js` is loaded on Global Japa for safer external-link routing.
- The Global Japa page restricts frame/plugin embedding with a Content Security Policy.

## Android / Google Play caveats

The SWB security source patch is a separate deliverable. Website changes alone do not remove Google Play Console security warnings. Build a new AAB from a corrected SWB with a greater versionCode, test on physical Android devices (Android System WebView versions included), and submit it to affected release tracks for policy review.

Official guidance:
- https://support.google.com/faqs/answer/9084685
- https://support.google.com/faqs/answer/7071387
- https://developer.android.com/reference/android/webkit/WebViewClient
- https://developers.zoom.us/docs/meeting-sdk/android/get-started/

**Current status:** Website code and parser/simulation checks performed. No authorized live media source configured; no on-device stream or Google Play approval verified.
