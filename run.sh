#!/usr/bin/env bash
# Start the Excalidraw dev server (http://localhost:3001)
set -euo pipefail
cd "$(dirname "$0")"

# yarn is installed via nvm; load it if it's not already on PATH
if ! command -v yarn >/dev/null; then
  source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
fi

[ -d node_modules ] || yarn install
exec yarn start "$@"
