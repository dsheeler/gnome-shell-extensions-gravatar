'use strict';

import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'
import { OnDemandShortcutButton } from './shortcutButton.js'

function makeResetButton() {
    return new Gtk.Button({
        icon_name: "edit-clear-symbolic",
        tooltip_text: _("Reset to default value"),
        valign: Gtk.Align.CENTER,
    });
}

function buildRadioAdw(settings, key, buttons, title, subtitle=null) {
    let pref = new Adw.ActionRow({
        title: title,
    });
    if (subtitle !== null) {
        pref.set_subtitle(subtitle);
    }
    let hbox = new Gtk.Box({
         orientation: Gtk.Orientation.HORIZONTAL,
         spacing: 10,
         valign: Gtk.Align.CENTER,
     });

    let radio = new Gtk.ToggleButton();

    let radio_for_button = {};
    for (let button_name of buttons.keys()) {
        radio = new Gtk.ToggleButton({group: radio, label: button_name});
        radio_for_button[button_name] = radio;
        if (button_name.toLowerCase() === settings.get_string(key).toLowerCase()) {
            radio.set_active(true);
            for (let pref_row of buttons.get(button_name)[0]) {
                pref_row.set_sensitive(radio_for_button[button_name].get_active());
            }
            for (let pref_row of buttons.get(button_name)[1]) {
                pref_row.set_sensitive(!radio_for_button[button_name].get_active());
            }
        }
        radio.connect('toggled', function(widget) {
            if (widget.get_active()) {
                settings.set_string(key, widget.get_label());
            }
            for (let pref_row of buttons.get(button_name)[0]) {
                pref_row.set_sensitive(widget.get_active());
            }
            for (let pref_row of buttons.get(button_name)[1]) {
                pref_row.set_sensitive(!widget.get_active());
            }
        });
        hbox.append(radio);
    }

    let reset_button = makeResetButton();
    reset_button.connect("clicked", function(_button) {
        settings.reset(key);
        for (let button of buttons.keys()) {
            if (button.toLowerCase() === settings.get_string(key).toLowerCase()) {
                radio_for_button[button].set_active(true);
            }
        }
    });

    pref.set_activatable_widget(hbox);
    pref.add_suffix(hbox);
    pref.add_suffix(reset_button);
    return pref;
}

export default class GravatarPreferences extends ExtensionPreferences {
    constructor(metadata) {
        super(metadata);
    }

    getVersionString(_page) {
        return _('Version %d').format(this.metadata.version);
    }

    fillPreferencesWindow(window) {
        let IconsPath = GLib.build_filenamev([this.path, 'ui', 'icons']);
        let iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
        iconTheme.add_search_path(IconsPath);

        window.settings = this.getSettings();

        let page = new Adw.PreferencesPage({
            title: _("Settings"),
            icon_name: "general-symbolic",
        })
        window.add(page);

        let prefGroup = new Adw.PreferencesGroup();
        page.add(prefGroup);

        let service_buttons = new Map([ ["Gravatar", [[],[]]], ["Libravatar", [[],[]]]]);
        prefGroup.add(buildRadioAdw(window.settings, "service", service_buttons, _("Avatar Service")));

        let emailEntryRow = new Adw.EntryRow({
            title: _("Email Address"),
            show_apply_button: true,
            text: window.settings.get_string('email'),
        });
        prefGroup.add(emailEntryRow);

        window.settings.bind('email', emailEntryRow, 'text', Gio.SettingsBindFlags.GET);
        emailEntryRow.connect("apply", () => {
            window.settings.set_string('email', emailEntryRow.get_text());
        });

        let shortcutButton = new OnDemandShortcutButton(window.settings, {
            hhomogeneous: false,
        });
        window.settings.connect("changed::gravatar-ondemand-keybinding", () => {
            shortcutButton.keybinding = window.settings.get_strv("gravatar-ondemand-keybinding")[0];
        });
        shortcutButton.keybinding = window.settings.get_strv("gravatar-ondemand-keybinding")[0];

        shortcutButton.connect("notify::keybinding", () => {
            window.settings.set_strv("gravatar-ondemand-keybinding", [shortcutButton.keybinding]);
        });

        let shortcutActionRow = new Adw.ActionRow({
            title: _("Keyboard Shortcut"),
            subtitle: _("Shortcut triggers downloading and setting user icon from avatar service")
        });
        prefGroup.add(shortcutActionRow);

        shortcutActionRow.add_suffix(shortcutButton);
        shortcutActionRow.set_activatable_widget(shortcutButton);

        let debug_row = new Adw.SwitchRow({
            title: _("Enable Debug Logging"),
        });
        window.settings.bind('debug', debug_row, 'active', Gio.SettingsBindFlags.DEFAULT);

        let notifications_row = new Adw.SwitchRow({
            title: _("Enable Desktop Notifications"),
        });
        window.settings.bind('notifications', notifications_row, 'active', Gio.SettingsBindFlags.DEFAULT);

        prefGroup.add(notifications_row);
        prefGroup.add(debug_row);

        let contribution_page = new Adw.PreferencesPage({
            title: _("Contribute"),
            icon_name: 'contribute-symbolic',
        });

        window.add(contribution_page);

        let contribute_icon_pref_group = new Adw.PreferencesGroup();
        let icon_box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            margin_top: 24,
            margin_bottom: 24,
            spacing: 18,
        });

        let icon_image = new Gtk.Image({
            icon_name: "gravatar",
            pixel_size: 128,
        });

        let label_box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 6,
        });

        let label = new Gtk.Label({
            label: "Gravatar",
            wrap: true,
        });
        let context = label.get_style_context();
        context.add_class("title-1");

        let another_label = new Gtk.Label({
            label: this.getVersionString(),
        });

        let links_pref_group = new Adw.PreferencesGroup();
        let code_row = new Adw.ActionRow({
            icon_name: "code-symbolic",
            title: _("Code (create pull requests, report issues, etc.)")
        });
        let github_link = new Gtk.LinkButton({
            label: "Github",
            uri: "https://github.com/dsheeler/gnome-shell-extensions-gravatar/",
        });

        let donate_row = new Adw.ActionRow({
            title: _("Donate"),
            icon_name: "support-symbolic",
        })
        let donate_link = new Gtk.LinkButton({
            label: "Liberapay",
            uri: "https://liberapay.com/dsheeler/donate",
        });

        let donate_link_paypal = new Gtk.LinkButton({
            label: "PayPal",
            uri: "https://paypal.me/DanielSheeler?country.x=US&locale.x=en_US",
        });

        let donate_link_github = new Gtk.LinkButton({
            label: "Github",
            uri: "https://github.com/sponsors/dsheeler",
        });

        code_row.add_suffix(github_link);
        code_row.set_activatable_widget(github_link);

        donate_row.add_suffix(donate_link);
        donate_row.add_suffix(donate_link_paypal);
        donate_row.add_suffix(donate_link_github);

        links_pref_group.add(code_row);
        links_pref_group.add(donate_row);

        label_box.append(label);
        label_box.append(another_label);
        icon_box.append(icon_image);
        icon_box.append(label_box);
        contribute_icon_pref_group.add(icon_box);

        contribution_page.add(contribute_icon_pref_group);
        contribution_page.add(links_pref_group)

        window.set_search_enabled(true);

        /* The prefs-default-width/height save/restore mechanism
        stolen from openweather refined:
        openweather-extension@penguin-teal.github.io */
        let prefsWidth = window.settings.get_double("prefs-default-width");
        let prefsHeight = window.settings.get_double("prefs-default-height");

        window.set_default_size(prefsWidth, prefsHeight);
        window.set_search_enabled(true);

        window.connect("close-request", () => {
            let currentWidth = window.default_width;
            let currentHeight = window.default_height;
            // Remember user window size adjustments.
            if (currentWidth !== prefsWidth || currentHeight !== prefsHeight) {
                window.settings.set_double("prefs-default-width", currentWidth);
                window.settings.set_double("prefs-default-height", currentHeight);
            }
        });
    }
}
