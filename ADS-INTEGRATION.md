# Temple native ads — app v19+

Import the v19 SWB, build and install/update the APK. The web bridge requires that native update. Old APKs and ordinary browsers show an update/unavailable message, never a fake completed reward.

## Add a premium page

Include `<script defer src="temple-ads.js"></script>` (adjust relative path in subfolders).
Add a placement to `ads-config.json`:

```json
"premium_book_01": {
  "enabled": true,
  "type": "rewarded",
  "reward": "Unlock this book for 24 hours",
  "ttlSeconds": 86400,
  "target": "premium-book.html"
}
```

Button: `<button data-temple-reward="premium_book_01">Watch ad to unlock for 24 hours</button>`

On the target page, keep content hidden initially. After DOMContentLoaded, call `await TempleAds.status('premium_book_01')` and reveal only if `result.unlocked`. See daily-reflection.html. Marking only a link is not a page guard.

Limits: ttlSeconds=0 grants a single event (game life/hint); positive values persist locally up to 604800 seconds (7 days). Use a fresh placement ID if changing the meaning of an existing unlock. App data clearing/reinstall removes unlocks. Local clock/storage is not a payment-grade entitlement system. Public GitHub HTML remains publicly accessible; confidential premium content needs a backend and server-side verification.

## Game reward

```js
// Called only from the player's explicit Extra Life button.
const result = await TempleAds.reward('game_extra_life');
if (result.status === 'earned') giveOneExtraLife();
else TempleAds.message(result);
```

For a reusable reward, use ttlSeconds=0, and apply exactly once per resolved call. The native manager rejects concurrent requests. No reward on close, timeout, no-fill or failure. Never replace a failed rewarded ad with an ordinary interstitial and pretend a reward was earned.

## Interstitial at a natural break

```js
// Call after completing a level, never during play or app exit.
await TempleAds.interstitial('game_level_complete');
openNextLevel(); // Continue even when ad unavailable/cancelled/disabled.
```

Optional preload: `TempleAds.preload('game_extra_life')`. Do not repeatedly poll; the native manager deduplicates loads, expires cached ads, and has a 30-second retry backoff. Native minimum gaps are 40 seconds for rewarded and 120 seconds for interstitial. Only one full-screen ad can own the screen, including App Open.

## Remote controls

Edit ads-config.json for placement enabled/type/reward/target/ttlSeconds. `enabled:false` disables new requests globally. Changes apply on a fresh page or `TempleAds.refresh()`; in-progress ads are allowed to finish. Keep JSON valid. Native SDK changes and new native formats still need an APK update.

Current production units:
- Rewarded: ca-app-pub-1663130037566399/7179259238
- Interstitial: ca-app-pub-1663130037566399/7964207386
- App Open: ca-app-pub-1663130037566399/3551005414
- Banner: ca-app-pub-1663130037566399/9277289058

Rewarded Interstitial is not included: no ID for that format was supplied. The SDK dependency installed in Sketchware remains the build environment's responsibility.

Before release, use an AdMob test device to exercise success, early close, no-fill, offline, double taps, background/return and process restart. Do not click your own live ads. This source was syntax/logic checked; APK compilation, real AdMob delivery and device UI are not verified by these checks.



## Colourful reward popup (v20 / bridge v2)

`TempleAds.reward(id)` and `TempleAds.open(id)` show the shared web popup automatically. v19 retains its native confirmation, so there is never a web-plus-native double popup. v20 sends userConfirmed only after the user presses Watch ad; dismissing the popup never starts a native ad request. Existing stored unlocks bypass the popup.

Configure each rewarded placement's `ui`: `title` and `rewardText` accept a string or an object with `en`, `hi`, `mr`; `icon` is a short emoji/text; `accent` and `accentEnd` must be six-digit hex colours. The rewardText must accurately describe the actual configured reward and duration. The script renders strings as text, not HTML. You can edit this shared JS for entirely different layouts without changing the APK. Camera/SDK ad creatives cannot be styled by this popup.

The language follows localStorage.lang. Reduced-motion settings disable the entrance animation. Cancellation, backgrounding and Escape close the prompt without an ad. Native reward decisions, cooldowns and the full-screen ad lock remain active. Any custom replacement must retain a clear reward explanation, an explicit Watch ad button and an easy cancel option.
