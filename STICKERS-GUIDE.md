# Bhakti Stickers — ISKCON Hadapsar

Page: `stickers.html`. The temple homepage is unchanged.

## Add a new pack from your phone

Open one of these folders in GitHub and use **Add file → Upload files**:

- `stickers/bal-krishna/animated/pack-01/`
- `stickers/bal-krishna/static/pack-01/`
- `stickers/radha-krishna/static/pack-01/`
- `stickers/greetings/animated/pack-01/`
- `stickers/festivals/static/pack-01/`
- `stickers/prayers/static/pack-01/`
- `stickers/kirtan/animated/pack-01/`

Use any image filename, including spaces/Hindi. Upload 3–30 stickers per folder.
Make `pack-02` for another pack. Static and animated files must be in separate packs.
Every category includes both type folders. Add new categories with the same structure.
The Action generates ASCII asset names, tray icons, content versions and `packs.json`.
Do not edit generated `packs.json`; original packs live in `legacy-packs.json`.
Optional `pack.json` in the pack folder: `{"name":"Makhan Chor","emojis":["🙏","🦚"]}`.

Static PNG/JPG/WebP is fitted to 512×512 and compressed to <=100 KB. Solid backgrounds
are not removed. Animated input must already be real animated WebP, 512×512,
<=500 KB, <=10 seconds, with each frame >=8 ms. GIF/MP4 is rejected.
Invalid new packs fail the build without replacing the previous catalog.
Keep source filenames/folders stable once published to preserve identifiers.

## Automatic publishing

After upload, check **Actions → Build sticker catalog**. A successful run commits
`packs.json` and `generated/` back to `main`. If GitHub rejects that push, enable
Settings → Actions → General → Workflow permissions → Read and write permissions,
subject to repository policy. Then rerun. Protected branches may need a bot exception.
The workflow rebuilds on latest main before each push retry, avoiding stale catalogs
when more images arrive while another build is running.

The page reads packs.json directly from this repo's raw main URL, so new sticker\ncontent does not require a Pages rebuild after the bot commit.\n\nYour existing hosting must serve `stickers.html` from the repo root. If the hosting
provider does not deploy the Action's bot commit, redeploy latest main manually.
This change does not create or change hosting settings.

## Existing pack files missing at installation

Static: `img2276.webp`, `img3589.webp`, `img9010.webp`.
Animated: `bahi_animated_whatsapp.webp`, `bahi_an_whatsapp.webp`.

Restore these exact original files to the root to retain the original pack IDs.
The two other animated paths exist, but refer to the same blob (duplicate artwork).
Missing legacy files are shown as unavailable instead of promising a working import.
Legacy presence is checked; legacy byte-level dimensions/timing are not validated.
Alternatively upload new complete packs in category folders for full validation.

## Android integration

Open the hosted page inside the Android WebView that exposes `StickerBridge`.
The compatible dynamic payload keeps `id,name,publisher,category,animated,baseUrl,
files,emojis`; optional `tray` and `image_data_version` are also supplied.
Native code must download, validate and expose the pack through its ContentProvider.
The old `addStickerPack(id,name)` method only supports packs registered natively.
Browser-only installation is not supported by this page.

`window.onNativeStatus('message')` displays progress for existing apps.
For immediate completion/unlock use:
`window.onNativeStatus({packId:'pack-id',state:'success',message:'Added'})`.
States: progress, success, error, cancelled. Only report success after confirmed import.
Without structured completion a 60-second timeout unlocks with an unconfirmed message.
Do not expose the bridge on untrusted hosts; native code must enforce its own URL,
file-size and decoded-image validation. This repository does not include the sticker
ContentProvider implementation, so real Android/WhatsApp import needs device testing.

Local checks cover conversion, validation, catalog preservation and bridge failures.
Official requirements: https://github.com/WhatsApp/stickers/blob/main/Android/README.md
