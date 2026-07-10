// Clawde — a Claude Code mascot that wanders inside your terminal windows with moods,
// a diverse gait, the odd dance and meme, and teleports between terminals. Runs inside
// GNOME Shell (a desktop overlay), so it floats above your terminal windows only — never
// over other apps or the bare desktop — and auto-starts at login.
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
  wave:     { px: [[3,2,E],[3,3,E],[3,5,E],[3,6,E],[6,3,E],[6,4,E],[6,5,E]], tag: "👋" },
  yawn:     { px: [[4,2,E],[4,3,E],[4,5,E],[4,6,E],[5,4,E],[6,3,E],[6,4,E],[6,5,E]], tag: "💤" },
  spin:     { px: [[3,2,E],[3,3,E],[3,5,E],[3,6,E]], tag: "🌀" },
  blink:    { px: [[4,2,E],[4,3,E],[4,5,E],[4,6,E]], tag: "" },
  cry:      { px: [[3,2,E],[3,6,E],[4,3,E],[4,5,E],[5,3,BL],[5,6,BL],[6,4,E]], tag: "😢" },
  stars:    { px: [[3,2,GOLD],[3,3,GOLD],[3,5,GOLD],[3,6,GOLD],[6,3,E],[6,4,E],[6,5,E]], tag: "🤩" },
  scared:   { px: [[3,2,E],[3,3,E],[4,2,E],[4,3,E],[3,5,E],[3,6,E],[4,5,E],[4,6,E],[5,7,BL],[6,7,BL]], tag: "😨", shake: 1 },
};
const FLAVORS = ["cool", "wink", "laugh", "curious", "happy", "wave", "yawn", "spin", "cry", "stars"];
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
const TERMINALS = ["terminal", "gnome-terminal", "org.gnome.terminal", "org.gnome.console",
  "terminator", "ghostty", "kitty", "alacritty", "konsole", "xterm", "wezterm",
  "foot", "tilix", "rio", "contour", "hyper", "iterm", "tabby",
  "powershell", "pwsh", "windowsterminal", "windows terminal",
  "com.apple.terminal", "com.googlecode.iterm2"];

const PX = 4, S = PX * 9, AW = 11 * PX;   // 기본 스프라이트를 더 크게 (36px body)
const TICK_MS = 80, SPEED = 4;
const TP_MIN = 6000, TP_MAX = 13000, BUBBLE_MS = 1800;
const TP_OUT_MS = 420, TP_IN_MS = 480, TP_ANIM_MS = 30;  // 텔레포트는 별도 30ms 타이머로 부드럽게
const PW = 78, PH = 44;                                   // 포털 타원 크기
const pick = a => a[Math.floor(Math.random() * a.length)];
const rand = (a, b) => a + Math.random() * (b - a);
const clamp01 = u => Math.min(1, Math.max(0, u));

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
    this._tpBusy = false; this._tpPhase = null; this._tpAnimId = 0; this._portal = null;

    this._sprite = new St.DrawingArea({ width: AW, height: S, reactive: true });
    this._sprite.connect("repaint", area => this._paint(area));
    this._clickId = this._sprite.connect("button-press-event", () => { this._poke(); return Clutter.EVENT_STOP; });
    Main.layoutManager.uiGroup.add_child(this._sprite);

    this._emote = new St.Label({ text: "", style: "font-size: 18px;", reactive: false });
    this._emote.opacity = 0;
    Main.layoutManager.uiGroup.add_child(this._emote);

    this._pickWindow();
    this._x = 0; this._y = 0;
    this._target = this._newTarget();
    this._tpAt = Date.now() + rand(TP_MIN, TP_MAX);

    this._settings = this.getSettings();
    this._loadSettings();
    this._settingsId = this._settings.connect("changed", () => this._loadSettings());
    const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, TICK_MS, () => { this._tick(); return GLib.SOURCE_CONTINUE; });
    this._sources.add(id);
  }

  _loadSettings() {
    this._speedMul = this._settings.get_double("speed");
    this._sizeMul = this._settings.get_double("size");
    this._monitor = this._settings.get_int("monitor");
    if (this._sprite) { this._sprite.set_pivot_point(0.5, 0.5); this._sprite.set_scale(this._sizeMul, this._sizeMul); }
  }

  _paint(area) {
    const cr = area.get_context();
    const g = this._grid;
    if (g) for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
      const col = g[r][c]; if (!col) continue;
      cr.setSourceRGBA(col[0], col[1], col[2], 1);
      cr.rectangle((c + 1) * PX, r * PX, PX, PX); cr.fill();
    }
    const aL = this._armL ?? 5, aR = this._armR ?? 5;   // swinging arms in the outer columns
    cr.setSourceRGBA(ORANGE[0], ORANGE[1], ORANGE[2], 1);
    cr.rectangle(0, aL * PX, PX, PX * 2); cr.fill();
    cr.rectangle(10 * PX, aR * PX, PX, PX * 2); cr.fill();
    cr.$dispose();
  }

  _terminalWindows() {
    const ws = global.workspace_manager.get_active_workspace();
    const normal = global.get_window_actors().map(a => a.meta_window)
      .filter(w => w && !w.minimized && w.get_window_type() === Meta.WindowType.NORMAL && w.located_on_workspace(ws));
    let out = normal.filter(w => {
      const cls = ((w.get_wm_class() || "") + " " + (w.get_wm_class_instance() || "")).toLowerCase();
      return TERMINALS.some(t => cls.includes(t));
    });
    if (this._monitor >= 0) { const m = out.filter(w => w.get_monitor() === this._monitor); if (m.length) out = m; }
    return out;
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

  // 터미널 창(또는 Terminator 분할 pane) 안쪽만 — 데스크톱 배경은 null
  _roam() {
    const r = this._sub || (this._win ? this._win.get_frame_rect() : null);
    if (!r) return null;
    const padX = this._sub ? 14 : 26, padTop = this._sub ? 20 : 46, padBot = this._sub ? 14 : 22;
    return { x: r.x + padX, y: r.y + padTop, w: Math.max(16, r.width - 2 * padX), h: Math.max(16, r.height - padTop - padBot) };
  }

  _newTarget() {
    const rr = this._roam(), m = S / 2;
    if (!rr) return { x: 0, y: 0 };
    return { x: rr.x + m + Math.random() * Math.max(1, rr.w - 2 * m),
             y: rr.y + m + Math.random() * Math.max(1, rr.h - 2 * m) };
  }

  // 표정·말풍선을 Clawde 오른쪽 위에 배치
  _layoutChrome(px, py, tag) {
    const mul = this._sizeMul || 1, right = px + AW * mul, top = py;
    if (tag) {
      if (this._emote.text !== tag) this._emote.set_text(tag);
      this._emote.opacity = 255;
      const ew = this._emote.get_width() || 20;
      this._emote.set_position(Math.round(right - ew - 2), top - 20);
    } else this._emote.opacity = 0;
    for (const b of this._bubbles) {
      const bw = b.get_width() || 60;
      b.set_position(Math.round(right - bw - 4), top - (tag ? 44 : 32));
    }
  }

  // 데모/Electron과 같은 주황 타원 포털 — DrawingArea로 직접 그림
  _portalAt(cx, cy) {
    const p = new St.DrawingArea({ width: PW, height: PH, reactive: false, opacity: 0 });
    p.connect("repaint", area => {
      const cr = area.get_context();
      const rings = [
        [1.00, 1.00, 0.88, 0.75, 0.35],
        [0.78, 0.91, 0.59, 0.37, 0.75],
        [0.55, 0.76, 0.41, 0.25, 0.95],
        [0.28, 1.00, 0.95, 0.85, 1.00],
      ];
      for (const [s, r, g, b, a] of rings) {
        cr.save();
        cr.translate(PW / 2, PH / 2);
        cr.scale(1, 0.55);
        cr.setSourceRGBA(r, g, b, a);
        cr.arc(0, 0, (PW / 2 - 2) * s, 0, Math.PI * 2);
        cr.fill();
        cr.restore();
      }
      cr.$dispose();
    });
    Main.layoutManager.uiGroup.add_child(p);
    p.set_pivot_point(0.5, 0.5);
    p.set_scale(0, 0);
    p.set_position(Math.round(cx - PW / 2), Math.round(cy - PH / 2));
    p.queue_repaint();
    return p;
  }

  _destroyPortal() {
    if (this._portal) { this._portal.destroy(); this._portal = null; }
  }

  // 창/분할 pane으로 순간이동 (애니메이션 중간 단계)
  _relocate() {
    const panes = this._winPanes(this._win);
    if (panes && panes.length > 1 && Math.random() < 0.6) {
      let p; do { p = pick(panes); } while (p === this._sub && panes.length > 1);
      this._sub = p;
      const t = this._newTarget(); this._x = t.x; this._y = t.y;
    } else {
      this._pickWindow();
    }
    this._mood = "neutral"; this._moodUntil = 0; this._holdUntil = 0;
    this._target = this._newTarget(); this._newGait();
  }

  _say(text) {
    const b = new St.Label({ text,
      style: "background-color:#fff; color:#16202b; border-radius:11px; padding:4px 10px; font-size:12px; font-weight:600;",
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
    if (Math.random() < 0.85) this._teleport();  // 포크로 텔레포트 애니메이션을 자주 볼 수 있게
  }

  _setMood(m, ms) { this._mood = m; this._moodUntil = Date.now() + ms; }

  // 포털 텔레포트 시작 — Clutter.ease 대신 틱 기반 (GNOME에서 콜백이 안 뜨는 문제 회피)
  _teleport() {
    if (this._tpBusy) return;
    this._tpBusy = true;
    this._tpPhase = "out";
    this._tpT0 = Date.now();
    this._emote.opacity = 0;
    this._destroyPortal();
    this._portal = this._portalAt(this._x, this._y);
    this._sprite.set_pivot_point(0.5, 0.5);
    this._sprite.show();
    if (!this._tpAnimId) {
      this._tpAnimId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, TP_ANIM_MS, () => {
        if (!this._tpBusy) {
          this._sources.delete(this._tpAnimId); this._tpAnimId = 0;
          return GLib.SOURCE_REMOVE;
        }
        this._tickTeleport(Date.now());
        return GLib.SOURCE_CONTINUE;
      });
      this._sources.add(this._tpAnimId);
    }
  }

  _tickTeleport(now) {
    const mul = this._sizeMul || 1;
    const placeSprite = () => {
      const px = Math.round(this._x - AW / 2), py = Math.round(this._y - S / 2);
      this._sprite.set_position(px, py);
    };
    const placePortal = () => {
      if (!this._portal) return;
      this._portal.set_position(Math.round(this._x - PW / 2), Math.round(this._y - PH / 2));
    };

    if (this._tpPhase === "out") {
      const u = clamp01((now - this._tpT0) / TP_OUT_MS);
      const ease = u * u;
      const ps = Math.min(1, u * 1.35);
      if (this._portal) {
        this._portal.set_scale(ps, ps);
        this._portal.opacity = Math.round(Math.min(1, u * 2.2) * 255);
        placePortal();
      }
      const ss = 1 - ease;
      this._sprite.set_scale(ss * mul, ss * mul);
      this._sprite.opacity = Math.round(255 * (1 - ease * 0.9));
      this._sprite.rotation_angle_z = ease * 200;
      placeSprite();
      if (u >= 1) {
        this._destroyPortal();
        this._sprite.hide();
        this._relocate();
        if (!this._win) {
          this._sprite.opacity = 255; this._sprite.set_scale(mul, mul);
          this._sprite.rotation_angle_z = 0; this._tpBusy = false; this._tpPhase = null;
          this._tpAt = now + rand(TP_MIN, TP_MAX); return;
        }
        this._tpPhase = "in";
        this._tpT0 = now;
        this._portal = this._portalAt(this._x, this._y);
        this._sprite.set_scale(0, 0);
        this._sprite.opacity = 30;
        this._sprite.rotation_angle_z = -200;
        this._sprite.show();
        placeSprite();
      }
      return;
    }

    if (this._tpPhase === "in") {
      const u = clamp01((now - this._tpT0) / TP_IN_MS);
      const ease = 1 - (1 - u) * (1 - u);
      // 포털: 전반 열림 → 후반 닫힘
      const portalU = u < 0.45 ? clamp01(u / 0.45) : clamp01(1 - (u - 0.45) / 0.55);
      if (this._portal) {
        this._portal.set_scale(portalU, portalU);
        this._portal.opacity = Math.round(portalU * 255);
        placePortal();
      }
      // 살짝 오버슈트 후 정착
      const ss = ease < 0.82 ? (ease / 0.82) * 1.15 : 1.15 - ((ease - 0.82) / 0.18) * 0.15;
      this._sprite.set_scale(ss * mul, ss * mul);
      this._sprite.opacity = Math.round(30 + ease * 225);
      this._sprite.rotation_angle_z = -200 * (1 - ease);
      placeSprite();
      if (u >= 1) {
        this._destroyPortal();
        this._sprite.set_scale(mul, mul);
        this._sprite.opacity = 255;
        this._sprite.rotation_angle_z = 0;
        this._hopUntil = now + 360;
        this._setMood("surprise", 500);
        this._tpBusy = false;
        this._tpPhase = null;
        this._tpAt = now + rand(TP_MIN, TP_MAX);
      }
    }
  }

  _newGait() { this._gait = pick(["walk", "walk", "walk", "scurry", "hop"]); }

  _decide(now) {
    if (Math.random() < 0.42) { this._target = this._newTarget(); this._newGait(); return; }
    const r = Math.random();
    if (r < 0.14) { this._startDance(); return; }
    if (r < 0.22) { this._rollUntil = now + 520; this._hopUntil = now + 320; this._target = this._newTarget(); return; }
    if (r < 0.28) { this._setMood(pick(["deadpan", "dead", "sus", "cool"]), 1100); this._say(pick(MEMES)); this._actKind = "look"; this._holdUntil = now + 1200; return; }
    if (r < 0.40) { this._setMood("surprise", 550); this._actKind = "look"; this._holdUntil = now + 750; return; }
    if (r < 0.55) { this._setMood(pick(FLAVORS), 900); this._actKind = "look"; this._holdUntil = now + 950; return; }
    this._actKind = r < 0.72 ? "look" : r < 0.88 ? "sit" : "sleep";
    this._holdUntil = now + (this._actKind === "sleep" ? 2800 : this._actKind === "look" ? 1000 : 1300);
  }

  _tick() {
    const now = Date.now();
    if (this._tpBusy) return;
    if (now > (this._nextBlink || 0)) { this._blinkUntil = now + 110; this._nextBlink = now + 1800 + Math.random() * 3200; }
    if (now >= this._tpAt) { this._teleport(); return; }
    if (!this._win || this._win.minimized) { this._pickWindow(); }
    const rr = this._roam();
    if (!this._win || !rr) { this._sprite.hide(); this._emote.opacity = 0; return; }
    this._sprite.show();

    // oneko-style: bolt away from the cursor when it gets close
    const [ptrX, ptrY] = global.get_pointer();
    const dcx = this._x - ptrX, dcy = this._y - ptrY, dc = Math.hypot(dcx, dcy);
    if (dc < 90) {
      const d = dc || 1, sp = 6 * (this._speedMul || 1);
      this._x = Math.min(Math.max(this._x + dcx / d * sp, rr.x + S / 2), rr.x + rr.w - S / 2);
      this._y = Math.min(Math.max(this._y + dcy / d * sp, rr.y + S / 2), rr.y + rr.h - S / 2);
      this._walkDist += sp; this._holdUntil = 0; this._moodUntil = 0;
      this._grid = buildGrid("scared", LEG.scurry[Math.floor(this._walkDist / 5) % LEG.scurry.length]);
      this._armL = 2; this._armR = 2;                    // arms up, panicking
      this._sprite.queue_repaint();
      const fx = Math.round(this._x - AW / 2), fy = Math.round(this._y - S / 2);
      this._sprite.set_position(fx + Math.round(Math.sin(now / 40) * 2), fy);
      this._layoutChrome(fx, fy, "😱");
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
      else { const sp = (this._gait === "scurry" ? SPEED * 1.6 : SPEED) * (this._speedMul || 1);
        this._x += dx / dist * sp; this._y += dy / dist * sp; this._walkDist += sp; walking = true;
        this._x = Math.min(Math.max(this._x, rr.x + S / 2), rr.x + rr.w - S / 2);
        this._y = Math.min(Math.max(this._y, rr.y + S / 2), rr.y + rr.h - S / 2); }
    }

    // expression + legs
    let expr, legRows, tag, bob = 0;
    if (dancing) {
      expr = DANCE_FACES[Math.floor(now / 260) % DANCE_FACES.length];
      legRows = LEG.scurry[Math.floor(now / 90) % LEG.scurry.length];
      bob = -Math.round(Math.abs(Math.sin(now / 110)) * 5); tag = "🎵";
      const adc = Math.sin(now / 180); this._armL = Math.round(3 - adc); this._armR = Math.round(3 + adc);
    } else {
      expr = now < this._moodUntil ? this._mood
        : now < this._holdUntil ? (this._actKind === "sleep" ? "sleepy" : this._actKind === "sit" ? "happy" : "curious")
        : walking && Math.floor(now / 900) % 4 === 0 ? "happy" : "neutral";
      const sitting = now < this._holdUntil && (this._actKind === "sit" || this._actKind === "sleep");
      const seq = LEG[this._gait];
      legRows = sitting ? null : (walking ? seq[Math.floor(this._walkDist / 7) % seq.length] : LEG.stand[0]);
      bob = walking && Math.floor(this._walkDist / 7) % 2 ? (this._gait === "hop" ? -4 : -2) : 0;
      const asw = Math.sin(this._walkDist / 11) * 1.3; this._armL = walking ? Math.round(4 - asw) : 5; this._armR = walking ? Math.round(4 + asw) : 5;
      if (now < (this._blinkUntil || 0) && (expr === "neutral" || expr === "happy" || expr === "curious")) expr = "blink";
      tag = EMO[expr].tag;
    }

    this._grid = buildGrid(expr, legRows);
    this._sprite.queue_repaint();
    let hopY = 0;
    if (now < (this._hopUntil || 0)) hopY = -Math.round(Math.sin((1 - (this._hopUntil - now) / 320) * Math.PI) * 6);
    const px = Math.round(this._x - AW / 2 + swayX), py = Math.round(this._y - S / 2 + bob + hopY);
    this._sprite.set_position(px, py);
    this._sprite.set_pivot_point(0.5, 0.5);
    this._sprite.rotation_angle_z = now < (this._rollUntil || 0) ? (1 - (this._rollUntil - now) / 520) * 360
      : (expr === "spin" ? (now / 2) % 360 : (expr === "dizzy" ? Math.sin(now / 110) * 12 : 0));

    this._layoutChrome(px, py, tag || "");
  }

  disable() {
    this._destroyPortal?.();
    if (this._settings && this._settingsId) { this._settings.disconnect(this._settingsId); this._settingsId = 0; }
    for (const id of this._sources) GLib.source_remove(id);
    this._sources?.clear();
    for (const b of this._bubbles) b.destroy();
    this._bubbles?.clear();
    if (this._sprite) { if (this._clickId) this._sprite.disconnect(this._clickId); this._sprite.destroy(); }
    this._emote?.destroy();
    this._sprite = null; this._emote = null; this._clickId = null; this._win = null; this._grid = null;
  }
}
