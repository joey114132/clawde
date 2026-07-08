// Clawde preferences — speed, size, and which monitor he roams.
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ClawdePrefs extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup({ title: 'Clawde 🧡' });
    page.add(group);

    const speed = new Adw.SpinRow({
      title: 'Speed', subtitle: 'How fast he wanders',
      adjustment: new Gtk.Adjustment({ lower: 0.4, upper: 2.5, step_increment: 0.1 }), digits: 1,
    });
    settings.bind('speed', speed, 'value', Gio.SettingsBindFlags.DEFAULT);
    group.add(speed);

    const size = new Adw.SpinRow({
      title: 'Size', subtitle: 'How big he is',
      adjustment: new Gtk.Adjustment({ lower: 0.5, upper: 2.0, step_increment: 0.1 }), digits: 1,
    });
    settings.bind('size', size, 'value', Gio.SettingsBindFlags.DEFAULT);
    group.add(size);

    const monitor = new Adw.SpinRow({
      title: 'Monitor', subtitle: '−1 = all monitors · 0 = first · 1 = second · …',
      adjustment: new Gtk.Adjustment({ lower: -1, upper: 8, step_increment: 1 }),
    });
    monitor.set_value(settings.get_int('monitor'));                 // 'i' key ↔ double row: bind manually
    monitor.connect('notify::value', () => settings.set_int('monitor', Math.round(monitor.get_value())));
    group.add(monitor);

    window.add(page);
  }
}
