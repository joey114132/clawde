#!/usr/bin/env bash
# Install Clawde as a GNOME Shell extension (GNOME 45–48, Wayland or X11).
set -euo pipefail

UUID="clawde@joey114132.github.io"
SRC="$(cd "$(dirname "$0")" && pwd)/$UUID"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -r "$SRC" "$DEST"
echo "Installed → $DEST"
echo
echo "Next:"
echo "  1. Wayland can't hot-reload the shell, so LOG OUT and back in."
echo "     (On X11 you can instead press Alt+F2, type 'r', Enter.)"
echo "  2. Enable it:  gnome-extensions enable $UUID"
echo "  3. Clawde starts wandering. Disable with:"
echo "         gnome-extensions disable $UUID"
