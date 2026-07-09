#!/usr/bin/env bash
# Install Clawde as a GNOME Shell extension (GNOME 45–48, Wayland or X11) and
# pre-enable it, so he shows up automatically the next time you log in.
set -euo pipefail

UUID="clawde@joey114132.github.io"
SRC="$(cd "$(dirname "$0")" && pwd)/$UUID"
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
cp -r "$SRC" "$DEST"
command -v glib-compile-schemas >/dev/null 2>&1 && glib-compile-schemas "$DEST/schemas" 2>/dev/null || true
echo "✓ installed → $DEST"

# Pre-enable via gsettings. gnome-extensions enable fails until the shell rescans
# (a Wayland relogin), but writing enabled-extensions directly takes effect on next login.
if command -v gsettings >/dev/null 2>&1; then
  set +e                                                                       # headless/SSH/sudo has no D-Bus — a failed pre-enable must not abort the script
  cur="$(gsettings get org.gnome.shell enabled-extensions 2>/dev/null || echo '@as []')"
  case "$cur" in
    *"$UUID"*)       : ;;                                                        # already enabled
    "@as []" | "[]") gsettings set org.gnome.shell enabled-extensions "['$UUID']" ;;
    *)               gsettings set org.gnome.shell enabled-extensions "${cur%]}, '$UUID']" ;;
  esac
  set -e
  echo "✓ pre-enabled (if it didn't take, run after login: gnome-extensions enable $UUID)"
fi

echo
echo "🧡 Almost there — LOG OUT and back in (Wayland must rescan the shell)."
echo "   Clawde then appears on his own. Turn him off any time with:"
echo "       gnome-extensions disable $UUID"
