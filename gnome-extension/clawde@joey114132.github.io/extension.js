// Clawde — a Claude Code mascot that patrols the edges of your terminal windows
// and teleports between them. Runs inside GNOME Shell as a desktop overlay, so it
// can see every window's position and float above them. Auto-starts with the session.
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

// The pixel-art Clawde (1 = orange body, 2 = black eye, 0 = transparent).
const MATRIX = [
    '011000110',
    '111111111',
    '111111111',
    '112211221',
    '112211221',
    '111111111',
    '111111111',
    '010101010',
    '010101010',
];
const PX = 4;                    // device px per sprite pixel
const ORANGE = [0.82, 0.46, 0.32];
const EYE = [0.08, 0.08, 0.08];

// wm_class substrings that identify a terminal window
const TERMINALS = ['terminal', 'terminator', 'ghostty', 'kitty', 'alacritty',
    'konsole', 'xterm', 'wezterm', 'foot', 'tilix', 'rio', 'contour'];
const HELLOS = ['hi! ◕ᴥ◕', 'coding? ☕', 'boop!', 'keep going!', 'wheee!', 'found me!', '✨'];

const TICK_MS = 60;
const WALK_SPEED = 6;            // px along the window perimeter per tick
const TELEPORT_MIN_MS = 6000;
const TELEPORT_MAX_MS = 14000;
const BUBBLE_MS = 1800;

export default class ClawdeExtension extends Extension {
    enable() {
        this._sources = new Set();
        this._bubbles = new Set();
        this._win = null;
        this._d = 0;

        const cols = MATRIX[0].length, rows = MATRIX.length;
        this._sw = cols * PX;
        this._sh = rows * PX;
        this._sprite = new St.DrawingArea({width: this._sw, height: this._sh, reactive: true});
        this._sprite.connect('repaint', (area) => this._paint(area));
        this._clickId = this._sprite.connect('button-press-event', () => {
            this._interact();
            return Clutter.EVENT_STOP;
        });
        Main.layoutManager.uiGroup.add_child(this._sprite);

        this._pickWindow();
        this._ttl = this._rand(TELEPORT_MIN_MS, TELEPORT_MAX_MS);
        const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, TICK_MS, () => {
            this._tick();
            return GLib.SOURCE_CONTINUE;
        });
        this._sources.add(id);
    }

    _rand(a, b) { return a + Math.floor(Math.random() * (b - a)); }

    _paint(area) {
        const cr = area.get_context();
        const cols = MATRIX[0].length, rows = MATRIX.length;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const ch = MATRIX[r][c];
                if (ch === '0') continue;
                const col = ch === '2' ? EYE : ORANGE;
                cr.setSourceRGBA(col[0], col[1], col[2], 1);
                cr.rectangle(c * PX, r * PX, PX, PX);
                cr.fill();
            }
        }
        cr.$dispose();
    }

    // terminal windows on the active workspace, visible
    _terminalWindows() {
        const ws = global.workspace_manager.get_active_workspace();
        const normal = global.get_window_actors()
            .map(a => a.meta_window)
            .filter(w => w && !w.minimized &&
                w.get_window_type() === Meta.WindowType.NORMAL &&
                w.located_on_workspace(ws));
        const terms = normal.filter(w => {
            const cls = (w.get_wm_class() || '').toLowerCase();
            return TERMINALS.some(t => cls.includes(t));
        });
        return terms.length ? terms : normal;   // fall back to any window if no terminal found
    }

    _pickWindow() {
        const list = this._terminalWindows();
        if (!list.length) { this._win = null; return; }
        const others = this._win ? list.filter(w => w !== this._win) : list;
        const pool = others.length ? others : list;
        this._win = pool[Math.floor(Math.random() * pool.length)];
        const r = this._win.get_frame_rect();
        this._d = Math.random() * (2 * (r.width + r.height));   // random spot on its border
    }

    // map perimeter distance d to a point on the window's edge, sprite centered on it
    _pointAt(r, d) {
        const P = 2 * (r.width + r.height);
        d = ((d % P) + P) % P;
        let x, y;
        if (d < r.width) { x = r.x + d; y = r.y; }
        else if (d < r.width + r.height) { x = r.x + r.width; y = r.y + (d - r.width); }
        else if (d < 2 * r.width + r.height) { x = r.x + r.width - (d - r.width - r.height); y = r.y + r.height; }
        else { x = r.x; y = r.y + r.height - (d - 2 * r.width - r.height); }
        return [Math.round(x - this._sw / 2), Math.round(y - this._sh / 2)];
    }

    _tick() {
        this._ttl -= TICK_MS;
        if (this._ttl <= 0) {                 // time to teleport to another terminal
            this._pickWindow();
            this._ttl = this._rand(TELEPORT_MIN_MS, TELEPORT_MAX_MS);
        }
        if (!this._win || this._win.minimized) { this._pickWindow(); }
        if (!this._win) { this._sprite.hide(); return; }

        this._sprite.show();
        const r = this._win.get_frame_rect();
        this._d += WALK_SPEED;
        const [px, py] = this._pointAt(r, this._d);
        this._sprite.set_position(px, py);
        for (const b of this._bubbles)
            b.set_position(px, Math.max(0, py - 22));
    }

    _interact() {
        this._say(HELLOS[Math.floor(Math.random() * HELLOS.length)]);
        if (Math.random() < 0.5) {            // poke → run off to another terminal
            this._pickWindow();
            this._ttl = this._rand(TELEPORT_MIN_MS, TELEPORT_MAX_MS);
        }
    }

    _say(text) {
        const bubble = new St.Label({
            text,
            style: 'background-color: rgba(20,20,20,0.9); color: #fff; ' +
                   'border-radius: 10px; padding: 3px 8px; font-size: 12px;',
            reactive: false,
        });
        Main.layoutManager.uiGroup.add_child(bubble);
        const [x, y] = this._sprite.get_position();
        bubble.set_position(x, Math.max(0, y - 22));
        this._bubbles.add(bubble);
        let id;
        id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, BUBBLE_MS, () => {
            this._bubbles.delete(bubble);
            bubble.destroy();
            this._sources.delete(id);
            return GLib.SOURCE_REMOVE;
        });
        this._sources.add(id);
    }

    disable() {
        for (const id of this._sources)
            GLib.source_remove(id);
        this._sources?.clear();
        for (const b of this._bubbles)
            b.destroy();
        this._bubbles?.clear();
        if (this._sprite) {
            if (this._clickId)
                this._sprite.disconnect(this._clickId);
            this._sprite.destroy();
        }
        this._sprite = null;
        this._clickId = null;
        this._win = null;
    }
}
