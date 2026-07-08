// Clawde for VS Code — a mascot that wanders inside a webview panel and reacts to clicks.
// A VS Code extension is sandboxed: it cannot paint over the editor itself, so Clawde
// lives in its own panel (open beside your code) and roams inside that box.
const vscode = require('vscode');

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('clawde.show', () => {
      const panel = vscode.window.createWebviewPanel(
        'clawde',
        'Clawde',
        { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
        { enableScripts: true, retainContextWhenHidden: true }
      );
      panel.webview.html = getHtml();
    })
  );
}

function deactivate() {}

function getHtml() {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0; height: 100%; overflow: hidden; background: transparent; }
  #clawde {
    position: fixed; font-size: 30px; font-weight: bold; color: #D97757;
    cursor: pointer; user-select: none; white-space: nowrap; will-change: left, top;
  }
  #bubble {
    position: fixed; background: rgba(20,20,20,0.9); color: #fff; border-radius: 10px;
    padding: 3px 9px; font-size: 13px; white-space: nowrap; opacity: 0;
    transition: opacity .15s; pointer-events: none;
  }
</style>
</head>
<body>
<div id="clawde">(◕ᴥ◕)</div>
<div id="bubble"></div>
<script>
  const el = document.getElementById('clawde');
  const bubble = document.getElementById('bubble');
  const F = { walk: ['(◕ᴥ◕)', '(>ᴥ<)'], idle: ['(-ᴥ-)', '(．ᴥ．)'], dart: ['=(◔ᴥ◔)', '(◔ᴥ◔)='] };
  const HELLOS = ['hi! ◕ᴥ◕', 'coding? ☕', 'boop!', 'keep going!', 'wheee!', 'found me!', '(≧ᴥ≦)', '✨'];
  let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, state = 'walk', phase = 0, idle = 0, bubbleUntil = 0;
  const clampW = () => Math.max(1, innerWidth - 80);
  const clampH = () => Math.max(1, innerHeight - 44);
  function pick() { tx = Math.random() * clampW(); ty = Math.random() * clampH(); }
  pick();

  function say(text) {
    bubble.textContent = text;
    bubble.style.opacity = '1';
    bubbleUntil = Date.now() + 1800;
  }
  el.addEventListener('click', () => {                 // poke Clawde
    say(HELLOS[Math.floor(Math.random() * HELLOS.length)]);
    if (Math.random() < 0.45) { state = 'dart'; pick(); }
    else { state = 'idle'; idle = 8; }
  });

  function step() {
    if (state !== 'dart' && Math.random() < 0.02) { state = 'dart'; pick(); }
    if (Math.abs(x - tx) < 6 && Math.abs(y - ty) < 6) {
      if (state === 'dart') state = 'walk';
      else if (Math.random() < 0.25) { state = 'idle'; idle = 10 + (Math.random() * 20 | 0); }
      pick();
    }
    if (state === 'idle') { if (--idle <= 0) { state = 'walk'; pick(); } }
    else {
      const s = state === 'dart' ? 12 : 4;
      x += Math.sign(tx - x) * Math.min(s, Math.abs(tx - x));
      y += Math.sign(ty - y) * Math.min(s, Math.abs(ty - y));
    }
    phase ^= 1;
    const f = F[state];
    el.textContent = f[phase % f.length];
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    if (bubbleUntil) {
      bubble.style.left = x + 'px';
      bubble.style.top = Math.max(0, y - 24) + 'px';
      if (Date.now() > bubbleUntil) { bubble.style.opacity = '0'; bubbleUntil = 0; }
    }
  }
  setInterval(step, 90);
  addEventListener('resize', pick);
</script>
</body>
</html>`;
}

module.exports = { activate, deactivate };
