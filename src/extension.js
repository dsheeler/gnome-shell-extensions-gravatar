'use strict';

import Gio from 'gi://Gio'
import AccountsService from 'gi://AccountsService'
import GLib from 'gi://GLib'
import St from 'gi://St'
import Soup from 'gi://Soup'

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import { md5 } from './lib/md5.js'
import { my_log, debug } from './utils/logger.js'
import { setInterval, clearInterval } from './utils/timing.js'

export default class GravatarExtension extends Extension {
  constructor(metadata) {

    debug('initializing');
    
    super(metadata);
    this._settings = this.getSettings();
    this._tmpDir = '/tmp';
    this._username = GLib.get_user_name();
    this._user = AccountsService.UserManager.get_default().get_user(this._username);
    this._notifSource = null;
  }

  /*
   ***********************************************
   * Public Methods                              *
   ***********************************************
   */
  enable() {
    debug('enabling');
    this._waitForUser(() => {
      this._changedId = this._settings.connect('changed', this._loadIcon.bind(this));
      this._loadIcon();
    });
  }

  disable() {
    debug('disabling');
    if (this._changedId) {
      this._settings.disconnect(this._changedId);
      this._changedId = null;
    }

    if (this._userLoop) {
      clearInterval(this._userLoop);
      this._userLoop = null;
    }

    if (this._httpSession) {
      this._httpSession.abort();
      this._httpSession = null;
    }
  }

  /*
   ***********************************************
   * Private Methods                             *
   ***********************************************
   */
  _waitForUser(cb) {
    // This fixes an issue where sometimes this._user is not
    // initialized when the extension loads
    if (this._user.isLoaded) {
      cb();
      return;
    }
    debug('Waiting for user to initialize...');
    let loopCount = 0;
    this._userLoop = setInterval(() => {
      loopCount += 1;
      if (this._user.isLoaded) {
        debug('User initialized');
        clearInterval(this._userLoop);
        this._userLoop = null;
        return cb();
      }
      if (loopCount >= 30) {
        clearInterval(this._userLoop);
        this._userLoop = null;
        my_log('Timeout waiting for user to initialize');
      }
      return null;
    }, 1000);
  }

  /* Settings */
  _getIconSize() {
    return this._settings.get_int('icon-size');
  }

  _getHash() {
    const email = this._settings.get_string('email').toLowerCase();
    debug(`Hashing "${email}"`);
    return md5(email);
  }

  /* Set Icon */
  _setIcon(icon) {
    this._user.set_icon_file(icon);
  }

  /* Download From Gravatar */
  _loadIcon() {
    const email = this._settings.get_string('email').toLowerCase();
    const hash = this._getHash();
    if (hash === null) {
      return;
    }
    try {
      const url = `http://www.gravatar.com/avatar/${hash}?s=${this._getIconSize()}&d=mm`;
      const request = Soup.Message.new('GET', url);
      const icon = Gio.file_new_for_path(`${this._tmpDir}/${Date.now()}_${hash}`);
      my_log(`Downloading gravatar icon from ${url}`);
      debug(`Saving to ${icon.get_path()}`);

      // initialize session
      if (!this._httpSession) {
        debug('Creating new http session');
        this._httpSession = new Soup.Session();
      }
      this._httpSession.abort();

      const fstream = icon.replace(null, false, Gio.FileCreateFlags.NONE, null);
      
      this._httpSession.send_and_splice_async(
        request, 
        fstream, 
        Gio.OutputStreamSpliceFlags.CLOSE_TARGET,
        0,
        null,
        (object, result, data) => {
          if (object.send_and_splice_finish(result) > -1) {
            this._setIcon(icon.get_path());
            let file_icon = Gio.FileIcon.new(icon);
            this._showNotification('Gravatar Extension', `Installed Icon for ${email}`, file_icon);
            //Main.osdWindowManager.show(-1, file_icon, `Installed Gravatar Icon for '${email}'`);
          } else {
            let error_icon = Gio.ThemedIcon.new_with_default_fallbacks('network-error-symbolic');
            Main.osdWindowManager.show(-1, error_icon, `Failed to Download Gravatar Icon for '${email}'`);
            my_log(`Failed to download ${url}`);
          }
          debug(`Deleting ${icon.get_path()}`);
          icon.delete(null);
        });
    } catch (e) {
      my_log(e.message);
    }
  }

	_showNotification(title, message, gicon) {
		if (this._notifSource == null) {
			// We have to prepare this only once
			this._notifSource = new MessageTray.SystemNotificationSource();
			this._notifSource.createIcon = function() {
				return new St.Icon({ gicon: gicon });
			};
			// Take care of not leaving unneeded sources
			this._notifSource.connect('destroy', ()=>{this._notifSource = null;});
			Main.messageTray.add(this._notifSource);
		}
		let notification = null;
		// We do not want to have multiple notifications stacked
		// instead we will update previous
		if (this._notifSource.notifications.length == 0) {
			notification = new MessageTray.Notification(this._notifSource, title, message);
			//notification.addAction( _('Update now') , ()=>{this._updateNow();} );
		} else {
			notification = this._notifSource.notifications[0];
			notification.update( title, message, { clear: true });
		}
		notification.setTransient(false);
		this._notifSource.showNotification(notification);
	}
}
 