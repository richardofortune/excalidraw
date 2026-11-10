# Excalidraw desktop

Electron wrapper around the `excalidraw-app` build in this repo, so the fork's features run as a normal macOS app with native open/save of `.excalidraw` files.

## Build

    ./desktop/build.sh

Produces `desktop/dist/Excalidraw-<version>-arm64.dmg`. Open the dmg and drag Excalidraw to Applications.

The app is signed with a local development certificate, not notarised. If macOS refuses to open it on another machine, run once:

    xattr -cr /Applications/Excalidraw.app

## Updating an installed copy

There is no auto-update. The steps below are also under Help → How to Update in the app, and Help → Fork on GitHub opens the repo. To ship a new version:

1. Bump `version` in `desktop/package.json` so the dmg filename and the About box change.
2. Run `./desktop/build.sh` on a machine with the repo checked out.
3. Copy the new dmg to the target machine, quit Excalidraw, open the dmg and drag to Applications, choosing Replace when asked.

Drawings and settings survive the replace. They live outside the app bundle in `~/Library/Application Support/excalidraw-desktop`, keyed by the package name, so keep `name` in `desktop/package.json` unchanged or the new version will start with an empty canvas. Any `.excalidraw` files saved to disk are unaffected either way.

## Develop

    ./run.sh                      # vite dev server on :3001
    yarn --cwd desktop dev        # Electron pointed at the dev server

## How it works

- `main.js` serves `excalidraw-app/build` over a custom `app://` scheme and forwards `.excalidraw` files opened from Finder to the renderer.
- `preload.js` exposes `window.desktop.onOpenFile`, consumed in `excalidraw-app/App.tsx`.
- Save / Save as use the File System Access API, which Electron's Chromium supports, so no extra wiring is needed.
- Finder icons and Quick Look: every save writes a WebP preview (up to 1024px) into the file's `thumbnail` field (`packages/excalidraw/data/json.ts`). `quicklook/` holds two extensions. The thumbnail extension shows that stored image as the Finder icon. The preview extension ignores it and draws the file live as SVG in a web view (`quicklook/web/`, a bundle of `exportToSvg` from `@excalidraw/utils`), so the Space-bar preview stays sharp when zoomed and works for any file. `quicklook/build.sh` compiles and signs them, and electron-builder copies them into `Contents/PlugIns` with `signIgnore` so their sandbox entitlement survives. The app declares the `com.richardfortune.excalidraw.drawing` file type in `extendInfo` and switches both extensions on at launch with `pluginkit`. Files without a `thumbnail` field, including ones saved before this or on excalidraw.com, keep the generic icon until re-saved. The preview bundle embeds all fonts, including CJK, so it is about 20MB. If icons look stale, run `qlmanage -r cache` and relaunch Finder.
