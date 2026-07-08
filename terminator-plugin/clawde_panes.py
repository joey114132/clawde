# Clawde panes — a Terminator plugin that publishes each split pane's geometry so the
# Clawde GNOME Shell extension can wander and teleport between the splits *inside* one
# Terminator window (which the compositor otherwise sees as a single window).
#
# It writes ~/.cache/clawde/panes.json ~once a second: for each window, the window's
# content size and the rectangle of every pane, relative to the window's top-left. The
# extension combines those with the window's absolute position (which only it knows).
#
# Install: copy to ~/.config/terminator/plugins/, then enable in
#   Terminator → right-click → Preferences → Plugins → tick "ClawdePanes".
import os
import json

from gi.repository import GLib
import terminatorlib.plugin as plugin
from terminatorlib.terminator import Terminator

AVAILABLE = ['ClawdePanes']
CACHE = os.path.join(GLib.get_user_cache_dir(), 'clawde', 'panes.json')


class ClawdePanes(plugin.Plugin):
    # 'terminal_menu' just gets the plugin loaded; the callback below is a harmless no-op.
    capabilities = ['terminal_menu']

    def __init__(self):
        plugin.Plugin.__init__(self)
        try:
            os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        except OSError:
            pass
        GLib.timeout_add(900, self._publish)

    def callback(self, menuitems, menu, terminal):
        pass  # required by the terminal_menu capability; we add nothing to the menu

    def _publish(self):
        try:
            groups = {}
            for term in Terminator().terminals:
                top = term.get_toplevel()
                if top is None or not top.is_toplevel():
                    continue
                pos = term.translate_coordinates(top, 0, 0)
                if pos is None:
                    continue
                tx, ty = pos
                a = term.get_allocation()
                ta = top.get_allocation()
                g = groups.setdefault(id(top), {'w': int(ta.width), 'h': int(ta.height), 'panes': []})
                g['panes'].append({'x': int(tx), 'y': int(ty), 'w': int(a.width), 'h': int(a.height)})
            tmp = CACHE + '.tmp'
            with open(tmp, 'w') as f:
                json.dump({'windows': list(groups.values())}, f)
            os.replace(tmp, CACHE)  # atomic
        except Exception:
            pass
        return True  # keep the timer running
