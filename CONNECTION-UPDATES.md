# Connection and app update release

The accompanying Sketchware backup is version code 13, package `com.iskcon.hadapsar.santosh.in`. Import it into Sketchware Plus, build and sign with the existing app's signing key. The website changes alone cannot replace native Android code in already installed APKs.

## Changes

- Native recovery stays in the same Activity and preserves the failed URL. No `about:blank`, missing `no_internet.html`, animated Nonet loop, or unrelated-site polling.
- A cream loading cover stays above the WebView until its visual-state callback after page completion. A 20-second watchdog offers Retry and offline books instead of leaving an indefinite loading screen.
- Main-document failures alone trigger recovery. HTTP and certificate failures have separate messages; certificate errors remain blocked.
- Android validated-network events recover failed pages and are unregistered when the Activity is destroyed. Active pages are not force-reloaded on every network change.
- Trusted temple pages remain internal. External websites, Maps, WhatsApp, payment links and Zoom links open through Android intents, with safe HTTPS intent fallbacks. This means Zoom now opens externally rather than in the privileged temple WebView.
- `temple-runtime.js` is loaded on 44 HTML pages. It checks a fresh same-site `version.json`, uses the installed APK's bridge version, and shows an accessible update screen. Ordinary browsers receive no APK gate. Network failures preserve current content; the old unsupported “showing cached contents” banner is suppressed.
- Corrected the native Play Store package and home link; camera/microphone WebView requests are denied until Android permission is granted (retry the page action after granting).

## Publish the next app update

1. Build and make the signed APK available in Play Store (or your HTTPS download URL).
2. Increase Sketchware's **version code** for each APK release, e.g. 14 after this version 13.
3. Edit root `version.json`: `latestVersionCode: 14`, `latestVersionName: "14"`, `updateUrl` pointing to the available app, and the title/message.
4. Keep `forceUpdate: false` for a dismissible update; set `true` only when that new APK is downloadable and must be installed.

Existing root manifest already advertises version 13 and has been preserved. Version 12 should see its update page after website deployment; this version 13 backup should not prompt for itself. Future higher codes show the update again. Checks run on page open, reconnection, foreground return, and once per minute while visible. Later dismissal lasts for the web session and only for that version.

Do not increase only `latestVersionName`: comparisons use integer `latestVersionCode`.

## Validation and limitations

- `node --test tests/*.test.cjs`: version comparison, malformed/unsafe manifest, optional/forced updates, native versus browser, offline/reconnect, HTTP errors, and failed requests.
- Java syntax parsed with the JDK compiler; SWB ZIP integrity, AES decrypt/encrypt round-trip, member list, and unchanged resource bytes verified.
- Android SDK/Sketchware build and real-device execution were not available. Java syntax checking is not an Android build. No claim of zero issues or physical-device white-flash elimination is made.

Before releasing: restore/import SWB, compile, install over the previous app using the same key, open Home → Developer → Back repeatedly, test airplane mode at startup and during navigation, Wi-Fi without internet, mobile-data switch, Retry, offline books, Maps/WhatsApp/UPI, and update 12→13 / same-version / future forced-update cases. Check the new APK package/version in the installed app info. An update prompt directs the user to the APK source; it cannot silently install an APK.

`native/TempleConnection.java.inc` is the matching MainActivity helper embedded in the supplied SWB. It is not a standalone Java class.
