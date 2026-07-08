// Clawde — a Claude Code mascot that wanders inside your terminal windows with moods,
// a diverse gait, the odd dance and meme, and teleports between terminals. Runs inside
// GNOME Shell (a desktop overlay), so it floats above every window and auto-starts at login.
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// palette as cairo rgb (0..1)
const ORANGE = [0.82, 0.46, 0.32], E = [0.08, 0.08, 0.08], R = [0.88, 0.28, 0.36],
      PK = [0.94, 0.49, 0.59], BL = [0.37, 0.69, 0.91], GOLD = [0.96, 0.77, 0.26];
const BODY = ["011000110", "111111111", "111111111", "111111111",
              "111111111", "111111111", "111111111", "000000000", "000000000"];
// each mood = pixel edits over the plain body (eyes/brows/cheeks/mouth/tears) + an emote
const EMO = {
  neutral:  { px: [[3,2,E],[3,3,E],[4,2,E],[4,3,E],[3,5,E],[3,6,E],[4,5,E],[4,6,E]], tag: "" },
  happy:    { px: [[3,2,E],[3,3,E],[3,5,E],[3,6,E],[6,3,E],[6,4,E],[6,5,E]], tag: "✨" },
  love:     { px: [[3,2,R],[3,3,R],[4,2,R],[4,3,R],[3,5,R],[3,6,R],[4,5,R],[4,6,R],[5,1,PK],[5,7,PK],[6,4,E]], tag: "❤️" },
  surprise: { px: [[3,2,E],[3,3,E],[4,2,E],[4,3,E],[3,5,E],[3,6,E],[4,5,E],[4,6,E],[6,4,E]], tag: "❗" },
  sad:      { px: [[4,2,E],[4,3,E],[4,5,E],[4,6,E],[2,3,E],[2,5,E],[5,2,BL],[6,2,BL]], tag: "💧" },
  angry:    { px: [[2,2,E],[3,3,E],[2,6,E],[3,5,E],[4,2,E],[4,3,E],[4,5,E],[4,6,E]], tag: "💢" },
  sleepy:   { px: [[4,2,E],[4,3,E],[4,5,E],[4,6,E]], tag: "💤" },
  dizzy:    { px: [[3,2,E],[4,3,E],[3,6,E],[4,5,E]], tag: "😵" },
  curious:  { px: [[3,2,E],[3,3,E],[4,2,E],[4,3,E],[3,5,E],[3,6,E],[4,5,E],[4,6,E],[2,5,E]], tag: "❓" },
  excited:  { px: [[3,2,GOLD],[3,3,GOLD],[4,2,GOLD],[4,3,GOLD],[3,5,GOLD],[3,6,GOLD],[4,5,GOLD],[4,6,GOLD],[6,3,E],[6,4,E],[6,5,E]], tag: "🤩" },
  wink:     { px: [[4,2,E],[4,3,E],[3,5,E],[3,6,E],[4,5,E],[4,6,E],[6,4,E]], tag: "😉" },
  laugh:    { px: [[3,2,E],[3,3,E],[3,5,E],[3,6,E],[5,4,E],[6,3,E],[6,4,E],[6,5,E]], tag: "😆" },
  cool:     { px: [[3,2,E],[3,3,E],[3,4,E],[3,5,E],[3,6,E],[4,2,E],[4,3,E],[4,4,E],[4,5,E],[4,6,E]], tag: "😎" },
  deadpan:  { px: [[4,2,E],[4,3,E],[4,5,E],[4,6,E]], tag: "🗿" },
  dead:     { px: [[3,2,E],[4,3,E],[3,6,E],[4,5,E]], tag: "💀" },
  sus:      { px: [[4,3,E],[4,6,E],[2,6,E]], tag: "👀" },
};
const FLAVORS = ["cool", "wink", "laugh", "curious", "happy"];
const MEMES = ["yeet!", "stonks 📈", "such wow", "gg", "this is fine", "no thoughts",
  "404: nap not found", "sudo pet me", "it works?!", "vibing~", "💀💀💀", "rm -rf feelings"];
const DANCE_FACES = ["happy", "excited", "cool", "laugh"];
const HELLOS = ["hi! ◕ᴥ◕", "coding? ☕", "boop!", "keep going!", "wheee!", "found me!", "✨"];
const LEG = {
  walk:   [["010101010","010101010"],["010101010","000101010"],["010101010","010001010"],
           ["010101010","010100010"],["010101010","010101000"]],
  scurry: [["010101010","000100010"],["010101010","010001000"],["010101010","000101000"],["010101010","010000010"]],
  hop:    [["010101010","010101010"],["000000000","010101010"]],
  stand:  [["010101010","010101010"]],
};
const TERMINALS = ["terminal", "terminator", "ghostty", "kitty", "alacritty",
  "konsole", "xterm", "wezterm", "foot", "tilix", "rio", "contour"];

const PX = 3, S = PX * 9;              // sprite pixel size, 27px
const TICK_MS = 80, SPEED = 5;
const TP_MIN = 6000, TP_MAX = 13000, BUBBLE_MS = 1800;
const pick = a => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);

function buildGrid(mood, legRows) {
  const g = BODY.map(row => [...row].map(ch => ch === "1" ? ORANGE : null));
  if (legRows) for (let i = 0; i < 2; i++) for (let c = 0; c < 9; c++)
    if (legRows[i][c] === "1") g[7 + i][c] = ORANGE;
  for (const [r, c, col] of EMO[mood].px) g[r][c] = col;
  return g;
}

export default class ClawdeExtension extends Extension {
  enable() {
    this._sources = new Set();
    this._bubbles = new Set();
    this._grid = buildGrid("neutral", LEG.stand[0]);
    this._mood = "neutral"; this._moodUntil = 0;
    this._holdUntil = 0; this._actKind = null;
    this._gait = "walk"; this._walkDist = 0;
    this._bubbleUntil = 0; this._win = null;

    this._sprite = new St.DrawingArea({ width: S, height: S, reactive: true });
    this._sprite.connect("repaint", area => this._paint(area));
    this._clickId = this._sprite.connect("button-press-event", () => { this._poke(); return Clutter.EVENT_STOP; });
    Main.layoutManager.uiGroup.add_child(this._sprite);

    this._emote = new St.Label({ text: "", style: "font-size: 14px;", reactive: false });
    this._emote.opacity = 0;
    Main.layoutManager.uiGroup.add_child(this._emote);

    this._pickWindow();
    const m = Main.layoutManager.primaryMonitor;
    if (!this._win) { this._x = m.x + m.width / 2; this._y = m.y + m.height / 2; }
    this._target = this._newTarget();
    this._tpAt = Date.now() + rand(TP_MIN, TP_MAX);

    const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, TICK_MS, () => { this._tick(); return GLib.SOURCE_CONTINUE; });
    this._sources.add(id);
  }

  _paint(area) {
    const cr = area.get_context();
    const g = this._grid;
    if (g) for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      const col = g[r][c]; if (!col) continue;
      cr.setSourceRGBA(col[0], col[1], col[2], 1);
      cr.rectangle(c * PX, r * PX, PX, PX); cr.fill();
    }
    cr.$dispose();
  }

  _terminalWindows() {
    const ws = global.workspace_manager.get_active_workspace();
    const normal = global.get_window_actors().map(a => a.meta_window)
      .filter(w => w && !w.minimized && w.get_window_type() === Meta.WindowType.NORMAL && w.located_on_workspace(ws));
    const terms = normal.filter(w => { const cls = (w.get_wm_class() || "").toLowerCase();
      return TERMINALS.some(t => cls.includes(t)); });
    return terms.length ? terms : normal;
  }

  // split-pane geometry published by the Terminator plugin (relative rects + window size)
  _readPanes() {
    const now = Date.now();
    if (this._panesCache !== undefined && now - (this._panesAt || 0) < 1500) return this._panesCache;
    try {
      const path = GLib.build_filenamev([GLib.get_user_cache_dir(), "clawde", "panes.json"]);
      const [ok, bytes] = GLib.file_get_contents(path);
      this._panesCache = ok ? JSON.parse(new TextDecoder().decode(bytes)) : null;
    } catch (_) { this._panesCache = null; }
    this._panesAt = now;
    return this._panesCache;
  }

  // absolute rects of a Terminator window's split panes, or null if not split / no data
  _winPanes(win) {
    if (!win || !(win.get_wm_class() || "").toLowerCase().includes("terminator")) return null;
    const data = this._readPanes();
    if (!data || !data.windows) return null;
    const fr = win.get_frame_rect();
    const g = data.windows.find(w => Math.abs(w.w - fr.width) < 160 && Math.abs(w.h - fr.height) < 220);
    if (!g || !g.panes || g.panes.length < 2) return null;
    return g.panes.map(p => ({ x: fr.x + p.x, y: fr.y + p.y, width: p.w, height: p.h }));
  }

  _pickWindow() {
    const list = this._terminalWindows();
    if (!list.length) { this._win = null; this._sub = null; return; }
    const others = this._win ? list.filter(w => w !== this._win) : list;
    this._win = pick(others.length ? others : list);
    const panes = this._winPanes(this._win);
    this._sub = panes ? pick(panes) : null;                 // wander one split pane, if the window is split
    const t = this._newTarget(); this._x = t.x; this._y = t.y;
  }

  // inner region to wander: a split pane if we're in one, else the window content area
  _roam() {
    const r = this._sub || (this._win ? this._win.get_frame_rect() : null);
    if (!r) { const m = Main.layoutManager.primaryMonitor;
      return { x: m.x + 40, y: m.y + 40, w: m.width - 80, h: m.height - 80 }; }
    const padX = this._sub ? 14 : 26, padTop = this._sub ? 20 : 46, padBot = this._sub ? 14 : 22;
    return { x: r.x + padX, y: r.y + padTop, w: Math.max(16, r.width - 2 * padX), h: Math.max(16, r.height - padTop - padBot) };
  }

  _newTarget() {
    const rr = this._roam(), m = S / 2;
    return { x: rr.x + m + Math.random() * Math.max(1, rr.w - 2 * m),
             y: rr.y + m + Math.random() * Math.max(1, rr.h - 2 * m) };
  }

  _say(text) {
    const b = new St.Label({ text,
      style: "background-color:#fff; color:#16202b; border-radius:11px; padding:3px 8px; font-size:11px; font-weight:600;",
      reactive: false });
    Main.layoutManager.uiGroup.add_child(b);
    this._bubbles.add(b);
    let id; id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, BUBBLE_MS, () => {
      this._bubbles.delete(b); b.destroy(); this._sources.delete(id); return GLib.SOURCE_REMOVE; });
    this._sources.add(id);
    return b;
  }

  _startDance() { this._actKind = "dance"; this._holdUntil = Date.now() + 2400; }

  _poke() {
    const now = Date.now();
    const wasAsleep = now < this._holdUntil && this._actKind === "sleep";
    this._holdUntil = 0;
    if (wasAsleep) { this._setMood("surprise", 700); this._say("!!"); }
    else if (Math.random() < 0.18) { this._setMood("love", 1300); this._say("♥"); }
    else { this._setMood("happy", 900); this._say(pick(HELLOS)); }
    if (Math.random() < 0.45) this._teleport();
  }

  _setMood(m, ms) { this._mood = m; this._moodUntil = Date.now() + ms; }

  _teleport() {
    const panes = this._winPanes(this._win);
    if (panes && panes.length > 1 && Math.random() < 0.6) {
      let p; do { p = pick(panes); } while (p === this._sub && panes.length > 1);
      this._sub = p;                                        // hop to another split pane, same window
      const t = this._newTarget(); this._x = t.x; this._y = t.y;
    } else {
      this._pickWindow();                                  // hop to another window
    }
    this._mood = "neutral"; this._moodUntil = 0; this._holdUntil = 0;
    this._target = this._newTarget(); this._newGait();
    this._tpAt = Date.now() + rand(TP_MIN, TP_MAX);
  }

  _newGait() { this._gait = pick(["walk", "walk", "walk", "scurry", "hop"]); }

  _decide(now) {
    if (Math.random() < 0.42) { this._target = this._newTarget(); this._newGait(); return; }
    const r = Math.random();
    if (r < 0.12) { this._startDance(); return; }
    if (r < 0.24) { this._setMood(pick(["deadpan", "dead", "sus", "cool"]), 1100); this._say(pick(MEMES)); this._actKind = "look"; this._holdUntil = now + 1200; return; }
    if (r < 0.36) { this._setMood("surprise", 550); this._actKind = "look"; this._holdUntil = now + 750; return; }
    if (r < 0.50) { this._setMood(pick(FLAVORS), 900); this._actKind = "look"; this._holdUntil = now + 950; return; }
    this._actKind = r < 0.72 ? "look" : r < 0.88 ? "sit" : "sleep";
    this._holdUntil = now + (this._actKind === "sleep" ? 2800 : this._actKind === "look" ? 1000 : 1300);
  }

  _tick() {
    const now = Date.now();
    if (now >= this._tpAt) { this._teleport(); return; }
    if (!this._win || this._win.minimized) { this._pickWindow(); if (!this._win) { this._sprite.hide(); return; } }
    this._sprite.show();

    // oneko-style: bolt away from the cursor when it gets close
    const [ptrX, ptrY] = global.get_pointer();
    const dcx = this._x - ptrX, dcy = this._y - ptrY, dc = Math.hypot(dcx, dcy);
    if (dc < 90) {
      const rr = this._roam(), d = dc || 1, sp = 9;
      this._x = Math.min(Math.max(this._x + dcx / d * sp, rr.x + S / 2), rr.x + rr.w - S / 2);
      this._y = Math.min(Math.max(this._y + dcy / d * sp, rr.y + S / 2), rr.y + rr.h - S / 2);
      this._walkDist += sp; this._holdUntil = 0; this._moodUntil = 0;
      this._grid = buildGrid("scared", LEG.scurry[Math.floor(this._walkDist / 5) % LEG.scurry.length]);
      this._sprite.queue_repaint();
      const fx = Math.round(this._x - S / 2), fy = Math.round(this._y - S / 2);
      this._sprite.set_position(fx + Math.round(Math.sin(now / 40) * 2), fy);
      if (this._emote.text !== "😱") this._emote.set_text("😱");
      this._emote.opacity = 255; this._emote.set_position(fx + 4, fy - 16);
      this._target = this._newTarget();
      return;
    }

    const dancing = now < this._holdUntil && this._actKind === "dance";
    let walking = false, swayX = 0;
    if (dancing) {
      swayX = Math.round(Math.sin(now / 110) * 7);
    } else if (now >= this._holdUntil) {
      const dx = this._target.x - this._x, dy = this._target.y - this._y, dist = Math.hypot(dx, dy);
      if (dist < 4) { this._decide(now); }
      else { const sp = this._gait === "scurry" ? SPEED * 1.6 : SPEED;
        this._x += dx / dist * sp; this._y += dy / dist * sp; this._walkDist += sp; walking = true; }
    }

    // expression + legs
    let expr, legRows, tag, bob = 0;
    if (dancing) {
      expr = DANCE_FACES[Math.floor(now / 260) % DANCE_FACES.length];
      legRows = LEG.scurry[Math.floor(now / 90) % LEG.scurry.length];
      bob = -Math.round(Math.abs(Math.sin(now / 110)) * 5); tag = "🎵";
    } else {
      expr = now < this._moodUntil ? this._mood
        : now < this._holdUntil ? (this._actKind === "sleep" ? "sleepy" : this._actKind === "sit" ? "happy" : "curious")
        : walking && Math.floor(now / 900) % 4 === 0 ? "happy" : "neutral";
      const sitting = now < this._holdUntil && (this._actKind === "sit" || this._actKind === "sleep");
      const seq = LEG[this._gait];
      legRows = sitting ? null : (walking ? seq[Math.floor(this._walkDist / 7) % seq.length] : LEG.stand[0]);
      bob = walking && Math.floor(this._walkDist / 7) % 2 ? (this._gait === "hop" ? -4 : -2) : 0;
      tag = EMO[expr].tag;
    }

    this._grid = buildGrid(expr, legRows);
    this._sprite.queue_repaint();
    const px = Math.round(this._x - S / 2 + swayX), py = Math.round(this._y - S / 2 + bob);
    this._sprite.set_position(px, py);

    if (tag) { if (this._emote.text !== tag) this._emote.set_text(tag);
      this._emote.opacity = 255; this._emote.set_position(px + 4, py - 16); }
    else this._emote.opacity = 0;
    for (const b of this._bubbles) b.set_position(px - 8, py - 34);
  }

  disable() {
    for (const id of this._sources) GLib.source_remove(id);
    this._sources?.clear();
    for (const b of this._bubbles) b.destroy();
    this._bubbles?.clear();
    if (this._sprite) { if (this._clickId) this._sprite.disconnect(this._clickId); this._sprite.destroy(); }
    this._emote?.destroy();
    this._sprite = null; this._emote = null; this._clickId = null; this._win = null; this._grid = null;
  }
}
