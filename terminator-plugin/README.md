# Clawde ↔ Terminator splits

By default Clawde teleports between separate **windows** — but a **Terminator window split
into panes is one window** to the compositor, so Clawde can't tell the panes apart.

This tiny Terminator plugin fixes that. It runs *inside* Terminator (which can see its own
split layout) and publishes each pane's rectangle to `~/.cache/clawde/panes.json`. The
Clawde GNOME Shell extension reads that file and starts treating each split pane as its own
little room — wandering inside one, then **teleporting between the splits**.

## Install

```bash
mkdir -p ~/.config/terminator/plugins
cp clawde_panes.py ~/.config/terminator/plugins/
```

Then enable it: **Terminator → right-click → Preferences → Plugins → tick “ClawdePanes”**,
and restart Terminator. (The Clawde extension must also be installed — see
[`../gnome-extension/`](../gnome-extension/).)

## How it works

The plugin can only report pane rects **relative** to the window (Wayland hides absolute
screen coordinates from apps). The extension knows each window's absolute position, so it
adds the two together. It matches the right window by size, and only kicks in when a
Terminator window actually has 2+ panes — otherwise Clawde roams the whole window as usual.

## Status / rough edges

Experimental. Because the plugin reports the *content* size and the extension anchors to the
window *frame*, Clawde may sit a little low in each pane (the titlebar offset). If that looks
off, it's a fixed vertical correction — open an issue. No plugin = no harm: the extension
just roams whole windows.
