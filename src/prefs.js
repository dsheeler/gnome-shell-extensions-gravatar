'use strict';

import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'
import {OnDemandShortcutButton} from './shortcutButton.js'

export default class GravatarPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    this.settings = this.getSettings();
    this.aboutWindow = null;
    window.set_default_size(960, 420);
    this.page = new Adw.PreferencesPage({
      title: "Gravatar",
    })
    window.add(this.page);

		this.prefGroup = new Adw.PreferencesGroup({
			title: _("Settings"),
		});
    this.page.add(this.prefGroup);

    this.emailEntryRow = new Adw.EntryRow({
      title: "Gravatar Email Address",
      show_apply_button: true, 
      text: this.settings.get_string('email'),
    });
    this.prefGroup.add(this.emailEntryRow);
    
    this.emailEntryRow.connect("apply", () => {
      this.settings.set_string('email', this.emailEntryRow.get_text());
    });

    this.shortcutButton = new OnDemandShortcutButton(this.settings, {
      hhomogeneous: false,
    });
    this.settings.connect("changed::gravatar-ondemand-keybinding", () => {
      this.shortcutButton.keybinding = this.settings.get_strv("gravatar-ondemand-keybinding")[0];
    });
    this.shortcutButton.keybinding = this.settings.get_strv("gravatar-ondemand-keybinding")[0];

    this.shortcutButton.connect("notify::keybinding", () => {
      this.settings.set_strv("gravatar-ondemand-keybinding", [this.shortcutButton.keybinding]);
    });

    this.shortcutActionRow = new Adw.ActionRow({
      title: "Keyboard Shortcut",
      subtitle: "Shortcut triggers downloading and setting user icon from Gravatar"
    });
    this.prefGroup.add(this.shortcutActionRow);
    
    this.shortcutActionRow.add_suffix(this.shortcutButton);
    this.shortcutActionRow.set_activatable_widget(this.shortcutButton);

    this.aboutPrefGroup = new Adw.PreferencesGroup({
      title: "About",
    });
    this.page.add(this.aboutPrefGroup);
    
    this.aboutActionRow = new Adw.ActionRow({
      title: 'Extension Information',
    });
    this.aboutPrefGroup.add(this.aboutActionRow);

    this.aboutButton = new Gtk.Button({
      icon_name: "org.gnome.Settings-about-symbolic",
      valign: Gtk.Align.CENTER,
      tooltip_text: 'About the Gravatar Extension'
    });
    this.aboutActionRow.add_suffix(this.aboutButton);
    this.aboutActionRow.set_activatable_widget(this.aboutButton);
    this.aboutButton.connect("clicked", (button) => {
      let aboutWindow =  new Adw.AboutWindow({
        website: 'https://github.com/dsheeler/gnome-shell-extensions-gravatar',
        application_name: "Gravatar",
        developer_name: "Daniel Sheeler (dsheeler )",
        version: this.metadata.version.toString(),
        license: 'The MIT License (MIT)',
        copyright: 'Copyright (C) 2024 Daniel Sheeler',
        issue_url: 'https://github.com/dsheeler/gnome-shell-extensions-gravatar/issues'
      });
      aboutWindow.show();
    });
  }
}
