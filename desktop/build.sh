#!/usr/bin/env bash
# Build the web app, then package it as an unsigned macOS .dmg in desktop/dist
set -euo pipefail
cd "$(dirname "$0")"

command -v yarn >/dev/null || source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"

(cd .. && yarn build:app:docker)
[ -d node_modules ] || yarn install
yarn electron-builder --mac dmg
echo "Built: $(ls dist/*.dmg)"
