'use strict';

import Gio from 'gi://Gio'
import AccountsService from 'gi://AccountsService'
import GLib from 'gi://GLib'
import St from 'gi://St'
import Soup from 'gi://Soup'
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { md5 } from './lib/md5.js'
import { gr_log, gr_debug } from './utils/logger.js'

export default class GravatarExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this.settings = this.getSettings();
    gr_debug(this.settings, 'initializing');
    this.tmpDir = '/tmp';
    this.username = GLib.get_user_name();
    this.notifSource = null;
    this.previousKeybinding = "";
  }

  /*
   ***********************************************
   * Public Methods                              *
   ***********************************************
   */
  enable() {
    gr_debug(this.settings, 'enabling');
    this.user = AccountsService.UserManager.get_default().get_user(this.username);
    this.waitForUser(() => {
      this.emailChangedId = this.settings.connect('changed::email', this.loadIcon.bind(this));
      this.loadIcon();
      this.keybindingChangedId = this.settings.connect("changed::gravatar-ondemand-keybinding", () => {
        this.removeKeybinding();
        this.addKeybinding();
      })
      this.addKeybinding();
    });
  }

  disable() {
    gr_debug(this.settings, 'disabling');
    this.user = null;
    this.removeKeybinding();
    if (this.emailChangedId) {
      this.settings.disconnect(this.emailChangedId);
      this.emailChangedId = null;
    }

    if (this.keybindingChangedId) {
      this.settings.disconnect(this.keybindingChangedId);
      this.keybindingChangedId = null;
    }

    if (this.userLoop) {
      clearInterval(this.userLoop);
      this.userLoop = null;
    }

    if (this.httpSession) {
      this.httpSession.abort();
      this.httpSession = null;
    }
  }

  /*
   ***********************************************
   * Private Methods                             *
   ***********************************************
   */

  addKeybinding() {
    gr_debug(this.settings, "adding keybinding");
    this.previousKeybinding = this.settings.get_strv("gravatar-ondemand-keybinding")[0];
    if (!this.previousKeybinding) {
      return;
    }
    Main.wm.addKeybinding(
      'gravatar-ondemand-keybinding',
      this.settings,
      Meta.KeyBindingFlags.IGNORE_AUTOREPEAT,
      Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
      () => {
        gr_debug(this.settings, "ondemand keybinding pressed; loading icon");
        this.loadIcon({
          use_osd: true
        });
      }
    )
  }

  removeKeybinding() {
    gr_debug(this.settings, `remove keybinding ${this.previousKeybinding}`);
    if (this.previousKeybinding) {
      Main.wm.removeKeybinding('gravatar-ondemand-keybinding');
    }
  }

  waitForUser(cb) {
    // This fixes an issue where sometimes this.user is not
    // initialized when the extension loads
    if (this.user.isLoaded) {
      cb();
      return;
    }
    gr_debug(this.settings, 'Waiting for user to initialize...');
    let loopCount = 0;
    this.userLoop = setInterval(() => {
      loopCount += 1;
      if (this.user.isLoaded) {
        gr_debug(this.settings, 'User initialized');
        clearInterval(this.userLoop);
        this.userLoop = null;
        return cb();
      }
      if (loopCount >= 30) {
        clearInterval(this.userLoop);
        this.userLoop = null;
        gr_log('Timeout waiting for user to initialize');
      }
      return null;
    }, 1000);
  }

  /* Settings */
  getIconSize() {
    return this.settings.get_int('icon-size');
  }

  getHash() {
    const email = this.settings.get_string('email').toLowerCase();
    gr_debug(this.settings, `Hashing "${email}"`);
    return md5(email);
  }

  /* Set Icon */
  setIcon(icon) {
    this.user.set_icon_file(icon);
  }

  /* Download From Gravatar */
  loadIcon(use_osd=false) {
    const email = this.settings.get_string('email').toLowerCase();
    const hash = this.getHash();
    if (hash === null) {
      return;
    }
    try {
      const url = `http://www.gravatar.com/avatar/${hash}?s=${this.getIconSize()}&d=mm`;
      const request = Soup.Message.new('GET', url);
      const icon = Gio.file_new_for_path(`${this.tmpDir}/${Date.now()}_${hash}`);
      gr_debug(this.settings, `Downloading gravatar icon from ${url}`);
      gr_debug(this.settings, `Saving to ${icon.get_path()}`);

      // initialize session
      if (!this.httpSession) {
        gr_debug(this.settings, 'Creating new http session');
        this.httpSession = new Soup.Session();
      }
      this.httpSession.abort();

      const fstream = icon.replace(null, false, Gio.FileCreateFlags.NONE, null);
      this.httpSession.send_and_splice_async(
        request, 
        fstream, 
        Gio.OutputStreamSpliceFlags.CLOSE_TARGET,
        0,
        null,
        (object, result, data) => {
          if (object.send_and_splice_finish(result) > -1) {
            this.setIcon(icon.get_path());
            let file_icon = Gio.FileIcon.new(icon);
            if (use_osd) Main.osdWindowManager.show(-1, file_icon, `Installed Gravatar Icon for '${email}'`);
            else this.showNotification('Gravatar Extension', `Installed Icon for ${email}`, file_icon);
          } else {
            let error_icon = Gio.ThemedIcon.new_with_default_fallbacks('network-error');
            if (use_osd) Main.osdWindowManager.show(-1, error_icon, `Failed to Download Gravatar Icon for '${email}'`);
            else this.showNotification('Gravatar Extension', `Failed to download ${url}`, error_icon);
            gr_log(`Failed to download ${url}`);
          }
          gr_debug(this.settings, `Deleting ${icon.get_path()}`);
          icon.delete(null);
        });
    } catch (e) {
      gr_log(e.message);
    }
  }

  showNotification(title, message, gicon) {
    if (this.notifSource == null) {
      // We have to prepare this only once
      this.notifSource = MessageTray.getSystemSource();
      
      // Take care of not leaving unneeded sources
      this.notifSource.connect('destroy', ()=>{this.notifSource = null;});
    }
    this.notifSource.createIcon = function() {
      return new St.Icon({ gicon: gicon });
    };

    let notification = null;
    // We do not want to have multiple notifications stacked
    // instead we will update previous
    if (this.notifSource.notifications.length == 0) {
      notification = new MessageTray.Notification({
        source: this.notifSource, 
        title: title, 
        body: message,
        gicon: gicon
      });
    } else {
      notification = this.notifSource.notifications[0];
      notification.title = title;
      notification.body =  message;
      notification.clear = true;
      notification.gicon = gicon;
    }
    notification.isTransient = true;
    this.notifSource.addNotification(notification);
  }
}
 