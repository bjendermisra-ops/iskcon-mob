# Connection and app update release

The current Sketchware backup is version code 14, package `com.iskcon.hadapsar.santosh.in`. Import it into Sketchware Plus, build and sign with the existing app's signing key. The website changes alone cannot replace native Android code in already installed APKs.

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
2. Increase Sketchware's **version code** for each APK release, e.g. 15 after this version 14.
3. Edit root `version.json`: `latestVersionCode: 15`, `latestVersionName: "15"`, `updateUrl` pointing to the available app, and the title/message.
4. Keep `forceUpdate: false` for a dismissible update; set `true` only when that new APK is downloadable and must be installed.

Existing root manifest already advertises version 13 and has been preserved. Version 12 should see its update page after website deployment; the current version 14 backup should not prompt for version 13. Future higher codes show the update again. Checks run on page open, reconnection, foreground return, and once per minute while visible. Later dismissal lasts for the web session and only for that version.

Do not increase only `latestVersionName`: comparisons use integer `latestVersionCode`.

## Validation and limitations

- `node --test tests/*.test.cjs`: version comparison, malformed/unsafe manifest, optional/forced updates, native versus browser, offline/reconnect, HTTP errors, and failed requests.
- Java syntax parsed with the JDK compiler; SWB ZIP integrity, AES decrypt/encrypt round-trip, member list, and unchanged resource bytes verified.
- Android SDK/Sketchware build and real-device execution were not available. Java syntax checking is not an Android build. No claim of zero issues or physical-device white-flash elimination is made.

Before releasing: restore/import SWB, compile, install over the previous app using the same key, open Home → Developer → Back repeatedly, test airplane mode at startup and during navigation, Wi-Fi without internet, mobile-data switch, Retry, offline books, Maps/WhatsApp/UPI, and update 12→13 / same-version / future forced-update cases. Check the new APK package/version in the installed app info. An update prompt directs the user to the APK source; it cannot silently install an APK.

`native/TempleConnection.java.inc` is the matching MainActivity helper embedded in the supplied SWB. It is not a standalone Java class.

## Version 14: social, Play Store and notification routing correction

Use `radha_krishna_v14_routing_fix.swb` for this revision. Its installed APK code is **14**. The live manifest remains at 13 until the APK is actually published; then set `latestVersionCode` to 14. Future APK releases must use 15 and higher.

This revision directly changes `index.html`: YouTube/Instagram links use normal HTTPS plus the existing native bridge; Maps and WhatsApp hand off externally; the missing `chanting.html`/`man.html` links now lead to the available global japa/mantra pages. Removed homepage AOS visibility animations and the unsupported cached-content banner. The remaining carousel/theme effects are preserved.

The shared runtime now sends external link clicks, popup links and Update-button clicks to the native `openExternal` bridge. That bridge already exists in the uploaded version 12 project, so these web-side fixes do not depend on installing v14. The new v14 Android router additionally prefers installed YouTube, Instagram, WhatsApp and Play Store apps, falling back to an external handler/browser. Main WebView navigation and popup windows use the same policy. No external website is intentionally navigated in the main WebView.

### Notification payloads

Send the destination in FCM **custom data**, not merely in the notification body. A URL printed only in body text is not a configured destination.

| Desired tap action | Custom data example |
| --- | --- |
| Open YouTube outside temple app | `{"url":"https://www.youtube.com/watch?v=VIDEO_ID"}` |
| Open Instagram outside | `{"url":"https://www.instagram.com/shri_shri_radhakrishna_chandra/"}` |
| Open temple schedule inside | `{"target_page":"schedule.html"}` |
| Open internal darshan page | `{"target_page":"https://bjendermisra-ops.github.io/iskcon-mob/darshan.html"}` |
| Deliberately open even a temple page externally | `{"url":"https://bjendermisra-ops.github.io/iskcon-mob/schedule.html","open_in_app":"false"}` |

Recognized destination keys: `target_page`, `targetUrl`, `target_url`, `OPEN_URL`, `url`, `page`, `link`. Use **one** destination key per message. `target_type:"external"` is another explicit external option. `open_in_app:"true"` cannot bypass the trusted-origin rule: YouTube or an unknown website stays external. Only HTTPS paths inside `bjendermisra-ops.github.io/iskcon-mob/` are eligible to load internally. Query strings and fragments are retained. Invalid executable/file URLs are rejected.

Data-message notifications created by MyFCMService point directly at an external Activity for external URLs, avoiding a MainActivity trampoline. Internal notification taps use MainActivity. Launcher intents from background notification+data messages and new intents received by an already running app are consumed using the same policy. An installed app without this native revision cannot acquire these notification changes just by updating GitHub.

### Additional validation

16 Node tests exercise the shared runtime, including actual Update/social-click callback calls to a mocked legacy native bridge and unchanged WebView location, plus older WebViews without AbortController; 23 compiled Java assertions exercise URL routing, host boundaries, encoded traversal and invalid schemes. All eight inline homepage scripts pass JavaScript syntax checks; every static local homepage link exists. Java syntax checks include MainActivity snippets, MyFCMService, TempleLinkRouter and TempleUrlPolicy. These checks are not an Android APK build or physical-device test.

Restore this v14 backup, compile on Sketchware Plus, sign with the existing signing key, install and confirm app version 14. Test social/footer links, update tap, notifications with app closed/background/foreground, offline mode and Back. Current project minimum SDK is 26 (Android 8.0); behavior on unsupported Android versions, missing third-party apps and OEM-restricted notification delivery cannot be guaranteed.
