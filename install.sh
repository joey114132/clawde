#!/usr/bin/env bash
# Clawde — one-line installer for macOS & Linux.
#   curl -fsSL https://raw.githubusercontent.com/joey114132/clawde/main/install.sh | bash
# Downloads the latest desktop app from the GitHub Release, installs it, clears the
# quarantine/permission bits, launches Clawde, and sets him to start at every login.
set -euo pipefail
REPO="joey114132/clawde"

# find the download URL of the latest-release asset whose name ends in $1 (a regex)
url_for() {
  curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
    | grep -oE '"browser_download_url": *"[^"]+"' | grep -oE 'https[^"]+' \
    | grep -iE "$1"'$' | head -1
}

echo "🧡 installing Clawde…"
case "$(uname -s)" in
  Darwin)
    url="$(url_for '\.dmg')"; [ -n "$url" ] || { echo "✗ no macOS build in the latest release"; exit 1; }
    tmp="$(mktemp -d)"; curl -fsSL "$url" -o "$tmp/Clawde.dmg"
    mnt="$(hdiutil attach "$tmp/Clawde.dmg" -nobrowse -quiet | grep '/Volumes/' | tail -1 | awk -F'\t' '{print $NF}')"
    mkdir -p "$HOME/Applications"
    rm -rf "$HOME/Applications/Clawde.app"
    cp -R "$mnt/Clawde.app" "$HOME/Applications/"
    hdiutil detach "$mnt" -quiet; rm -rf "$tmp"
    xattr -dr com.apple.quarantine "$HOME/Applications/Clawde.app" 2>/dev/null || true
    open "$HOME/Applications/Clawde.app"
    echo "✓ Clawde is wandering 🧡  — and he'll be back at every login."
    ;;
  Linux)
    url="$(url_for '\.AppImage')"; [ -n "$url" ] || { echo "✗ no Linux build in the latest release"; exit 1; }
    mkdir -p "$HOME/.local/bin" "$HOME/.config/autostart"
    dest="$HOME/.local/bin/Clawde.AppImage"
    curl -fsSL "$url" -o "$dest"; chmod +x "$dest"
    cat > "$HOME/.config/autostart/clawde.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Clawde
Exec=env APPIMAGE_EXTRACT_AND_RUN=1 "$dest"
X-GNOME-Autostart-enabled=true
EOF
    APPIMAGE_EXTRACT_AND_RUN=1 nohup "$dest" >/dev/null 2>&1 &
    echo "✓ Clawde is wandering 🧡  — and he'll be back at every login."
    echo "  (On GNOME, the Shell extension integrates more cleanly — see the README.)"
    ;;
  *) echo "✗ unsupported OS: $(uname -s)"; exit 1 ;;
esac
