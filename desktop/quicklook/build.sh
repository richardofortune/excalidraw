#!/usr/bin/env bash
# Compile and sign the two Quick Look extensions into build/: Finder icons
# (ExcalidrawThumbnail) and the Space-bar preview (ExcalidrawPreview).
# electron-builder copies them into the app's Contents/PlugIns and is told not
# to re-sign them, because its own signing would drop the sandbox entitlement
# that macOS requires of extensions.
set -euo pipefail
cd "$(dirname "$0")"

IDENTITY=$(security find-identity -v -p codesigning |
  awk -F'"' '/Apple Development|Developer ID Application/ { print $2; exit }')
[ -n "$IDENTITY" ] || { echo "No code signing identity found" >&2; exit 1; }

rm -rf build

build_extension() {
  local name=$1 plist=$2 entitlements=$3 framework=$4 provider=$5
  shift 5
  local appex="build/$name.appex"
  mkdir -p "$appex/Contents/MacOS"
  cp "$plist" "$appex/Contents/Info.plist"
  if [ "$name" = ExcalidrawPreview ]; then
    mkdir -p "$appex/Contents/Resources/web"
    cp web/preview.html "$appex/Contents/Resources/web/"
    node web/build.js "$appex/Contents/Resources/web/render.js"
  fi
  xcrun swiftc -O -module-name "$name" -parse-as-library \
    -application-extension -target arm64-apple-macos13 \
    -Xlinker -e -Xlinker _NSExtensionMain \
    -framework "$framework" -framework AppKit \
    "$@" StoredPreview.swift "$provider" -o "$appex/Contents/MacOS/$name"
  codesign -f -s "$IDENTITY" -o runtime \
    --entitlements "$entitlements" "$appex"
  echo "Built: $appex"
}

build_extension ExcalidrawThumbnail Thumbnail-Info.plist Extension.entitlements QuickLookThumbnailing ThumbnailProvider.swift
build_extension ExcalidrawPreview Preview-Info.plist Preview.entitlements Quartz PreviewViewController.swift -framework WebKit
