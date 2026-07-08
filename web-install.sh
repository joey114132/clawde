#!/usr/bin/env bash
# One-line web installer for Clawde (the GNOME Shell extension):
#
#   curl -fsSL https://raw.githubusercontent.com/joey114132/clawde/main/web-install.sh | bash
#
# Downloads the latest Clawde, installs the extension, and pre-enables it so he
# shows up on his own after you log out and back in.
set -euo pipefail

REPO="joey114132/clawde"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "🧡 fetching Clawde…"
curl -fsSL "https://codeload.github.com/$REPO/tar.gz/refs/heads/main" | tar -xz -C "$TMP"

INSTALL="$(find "$TMP" -maxdepth 3 -path '*gnome-extension/install.sh' | head -1)"
[ -n "$INSTALL" ] || { echo "✗ couldn't find the extension in the download"; exit 1; }
bash "$INSTALL"
