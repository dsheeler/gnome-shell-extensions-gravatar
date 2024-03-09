'use strict';

import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'
import {ShortcutButton} from './shortcutButton.js'
import { my_log } from './utils/logger.js';

export default class GravatarPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    this.settings = this.getSettings();
    this.aboutWindow = null;
 
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

    this.runPrefGroup = new Adw.PreferencesGroup({
      title: "Run",
    });
    this.page.add(this.runPrefGroup);
    
    this.shortcutActionRow = new Adw.ActionRow({
      title: "Keyboard Shortcut",
    });
    this.runPrefGroup.add(this.shortcutActionRow);
    
    this.shortcutButton = new ShortcutButton(this.settings, [{
      hhomogeneous: false,
    });
    this.shortcutActionRow.add_suffix(this.shortcutButton);
    this.shortcutActionRow.set_activatable_widget(this.shortcutButton);

    this.chooseButton = new Gtk.Button({
      label: "Choose...",
    });

    /* this.chooseStackPage = new Gtk.StackPage({
      name: "choose_page",
      child: this.chooseButton, 
    }); */
    this.chooseButton.connect("clicked", this.shortcutButton.onChooseButtonClicked.bind(this.shortcutButton));

    this.shortcutButton.add_named(this.chooseButton, "choose");
    //this.shortcutButton.keybinding = this.settings.get_string('gravatar-ondemand-keybinding');
    this.hbox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
    });
    
   /*  this.editStackPage = new Gtk.StackPage({
      name: "edit_page",
      child: hbox,
    }); */
    let changeButton = new Gtk.Button({
      tooltip_text: "Change keyboard shortcut",
    })
    this.hbox.append(changeButton);
    
    changeButton.connect("clicked", this.shortcutButton.onChangeButtonClicked.bind(this.shortcutButton));
    this.shortcutLabel = new Gtk.ShortcutLabel({
      accelerator: this.settings.get_string("gravatar-ondemand-keybinding"),
    });
    my_log(`shortcutLabel.accelerator ${this.shortcutLabel.accelerator}`);

    changeButton.set_child(this.shortcutLabel);
    this.shortcutButton.add_named(this.hbox, "edit");

  

    this.settings.bind("gravatar-ondemand-keybinding", this.shortcutLabel, "accelerator", Gio.SettingsBindFlags.DEFAULT);

    
    
    

    /*this.refreshIconActionRow.add_suffix(this.refreshIconButton);
    this.refreshIconActionRow.set_activatable_widget(this.refreshIconButton);
    this.refreshIconButton.connect('clicked', (button) => {
      let current_setting = this.settings.get_boolean('refresh-toggle');
      this.settings.set_boolean('refresh-toggle', !current_setting);
    })*/;
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
        version: this.metadata.version.toString(),
        license: 'The MIT License (MIT)',
        copyright: 'Copyright 2024 Daniel Sheeler',
        issue_url: 'https://github.com/dsheeler/gnome-shell-extensions-gravatar/issues'
      });
      aboutWindow.show();
    });
  }
    /*this._builder = new Gtk.Builder();
    this._builder.set_translation_domain(this._metadata['gettext-domain']);
    this._builder.add_from_file(`${this.path}/prefs.ui`);

    // Setup the prefs widget
    this._widget = this._builder.get_object('prefs_widget');
    this._widget.connect('destroy', () => {
      if (this._email !== this._settings.get_string('email')) {
        debug(`Updating email to "${this._email}"`);
        this._settings.set_string('email', this._email);
      }
    });

    // Setup the email settings entry
    const emailObj = this._builder.get_object('email');
    emailObj.connect('changed', (obj) => {
      this._email = obj.get_text().trim();

      if (isValidEmail(this._email)) {
        obj.set_icon_from_icon_name(Gtk.PositionType.RIGHT, null);
      } else {
        obj.set_icon_from_icon_name(Gtk.PositionType.RIGHT, 'dialog-warning');
      }
    });
    emailObj.set_text(this._settings.get_string('email'));

    // Set the version text
    const versionObj = this._builder.get_object('version');
    versionObj.set_text(this._metadata.version.toString());
    window.add(this._widget);*/
}
