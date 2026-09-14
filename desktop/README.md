# Excalidraw desktop

Electron wrapper around the `excalidraw-app` build in this repo, so the fork's features run as a normal macOS app with native open/save of `.excalidraw` files.

## Build

    ./desktop/build.sh

Produces `desktop/dist/Excalidraw-<version>-arm64.dmg`. Open the dmg and drag Excalidraw to Applications.

The app is signed with a local development certificate, not notarised. If macOS refuses to open it on another machine, run once:

    xattr -cr /Applications/Excalidraw.app

## Updating an installed copy

There is no auto-update. To ship a new version:

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
