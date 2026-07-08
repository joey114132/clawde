# Clawde — VS Code panel mascot

A Clawde that wanders inside a VS Code **webview panel**, opened beside your code.

## Honest scope

A VS Code extension is sandboxed — it **cannot** paint a sprite over the editor
itself or over other apps. So Clawde lives in its own panel and roams inside that
box. If you want Clawde over *everything* (the editor, terminals, the desktop), use
the [GNOME Shell extension](../gnome-extension/) instead; on GNOME that's the only
thing that can.

The upside: this version is OS-independent — it works anywhere VS Code runs.

## Run it (development)

```bash
cd vscode-extension
code .
# press F5 to launch an Extension Development Host, then:
#   Ctrl/Cmd+Shift+P → "Clawde: Show Mascot"
```

No build step, no dependencies — plain CommonJS + a self-contained webview.

## Package / install

```bash
npm install -g @vscode/vsce
vsce package                 # produces clawde-0.0.1.vsix
code --install-extension clawde-0.0.1.vsix
```

Then run **Clawde: Show Mascot** from the command palette.

## Roadmap

- Auto-open on startup (activation event)
- Status-bar toggle
- Shared sprite/behavior with the terminal + GNOME versions
