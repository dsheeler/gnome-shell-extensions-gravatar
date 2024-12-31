'use strict';

import Gio from 'gi://Gio'
import AccountsService from 'gi://AccountsService'
import GLib from 'gi://GLib'
import Soup from 'gi://Soup'
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { md5 } from './lib/md5.js'
import { GravatarLogger } from './utils/logger.js'

export default class GravatarExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this.settings = this.getSettings();
        this.logger = null;
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
        this.logger = new GravatarLogger(this.settings);
        this.logger.debug('Enabling');
        this.user = AccountsService.UserManager.get_default().get_user(this.username);
        this.waitForUser(() => {
            this.loadIcon();
            this.emailChangedId = this.settings.connect('changed::email', this.loadIcon.bind(this));
            this.serviceChangedId = this.settings.connect('changed::service', this.loadIcon.bind(this));
            this.keybindingChangedId = this.settings.connect("changed::gravatar-ondemand-keybinding", () => {
                this.removeKeybinding();
                this.addKeybinding();
            })
            this.addKeybinding();
        });
    }

    disable() {
        this.logger.debug('Disabling');
        this.user = null;
        this.removeKeybinding();
        if (this.emailChangedId) {
            this.settings.disconnect(this.emailChangedId);
            this.emailChangedId = null;
        }

        if (this.serviceChangedId) {
            this.settings.disconnect(this.serviceChangedId);
            this.serviceChangedId = null;
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
        this.logger = null;
    }

    /*
    ***********************************************
    * Private Methods                             *
    ***********************************************
    */

    addKeybinding() {
        this.logger.debug("Adding keybinding");
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
                this.logger.debug("On-demand keybinding pressed; loading icon");
                this.loadIcon();
            }
        )
    }

    removeKeybinding() {
        this.logger.debug(`Remove keybinding ${this.previousKeybinding}`);
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
        this.logger.debug('Waiting for user to initialize...');
        let loopCount = 0;
        this.userLoop = setInterval(() => {
            loopCount += 1;
            if (this.user.isLoaded) {
                this.logger.debug('User initialized');
                clearInterval(this.userLoop);
                this.userLoop = null;
                return cb();
            }
            if (loopCount >= 30) {
                clearInterval(this.userLoop);
                this.userLoop = null;
                this.logger.error('Timeout waiting for user to initialize');
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
        this.logger.debug(`Hashing "${email}"`);
        return md5(email);
    }

    /* Set Icon */
    setIcon(icon) {
        this.user.set_icon_file(icon);
    }

    /* Download From Gravatar */
    loadIcon() {
        const email = this.settings.get_string('email').toLowerCase();
        const hash = this.getHash();
        if (hash === null) {
            return;
        }
        try {
            let baseUrl = null;
            const service = this.settings.get_string('service');
            if (service.toLowerCase() === "gravatar") {
                baseUrl = "gravatar.com";
            } else if (service.toLowerCase() === "libravatar") {
                baseUrl = "seccdn.libravatar.org";
            } else {
                throw RangeError(`'service' setting '${service}' is invalid`);
            }

            const url = `http://${baseUrl}/avatar/${hash}?s=${this.getIconSize()}&d=404`;

            const request = Soup.Message.new('GET', url);
            const icon = Gio.file_new_for_path(`${this.tmpDir}/${Date.now()}_${hash}`);

            // initialize session
            if (!this.httpSession) {
                this.logger.debug('Creating new http session');
                this.httpSession = new Soup.Session();
            }
            this.httpSession.abort();
            this.logger.debug(`Downloading gravatar icon from ${url}`);
            this.logger.debug(`Saving to ${icon.get_path()}`);
            const fstream = icon.replace(null, false, Gio.FileCreateFlags.NONE, null);
            this.httpSession.send_and_splice_async(
                request,
                fstream,
                Gio.OutputStreamSpliceFlags.CLOSE_TARGET,
                0,
                null,
                (session, result) => {
                    if (session.send_and_splice_finish(result) > -1) {
                        const upperCaseService = service.toLowerCase().replace(/^\w/, (match,  _offset, _string) => {
                            return match.toUpperCase();
                        });
                        if (session.get_async_result_message(result).get_status() !== Soup.Status.NOT_FOUND) {
                            this.setIcon(icon.get_path());
                            let file_icon = Gio.FileIcon.new(icon);
                            this.showNotification(`Installed Icon from ${upperCaseService}`,  `${email}`, file_icon);
                        } else {
                            let error_icon = Gio.ThemedIcon.new_with_default_fallbacks('network-error');
                            this.showNotification('Gravatar Extension', `Failed to download ${email} from ${upperCaseService}`, error_icon);
                            this.logger.error(`Failed to download ${email} from ${upperCaseService}`);
                        }
                    }
                    this.logger.debug(`Deleting ${icon.get_path()}`);
                    icon.delete(null);
                });
            } catch (e) {
                this.logger.error(e.message);
            }
        }

        showNotification(title, message, gicon) {
            if (!this.settings.get_boolean('notifications')) return;

            if (this.notifSource === null) {
                // We have to prepare this only once
                this.notifSource = new MessageTray.Source({
                    title: this.metadata.name.toString(),
                    icon: Gio.icon_new_for_string(GLib.build_filenamev([this.path, 'ui', 'icons', 'hicolor', 'scalable', 'actions', 'gravatar.svg'])),
                });

                // Take care of not leaving unneeded sources
                this.notifSource.connect('destroy', ()=>{this.notifSource = null;});
                Main.messageTray.add(this.notifSource);
            }

            let notification = null;
            // We do not want to have multiple notifications stacked
            // instead we will update previous
            if (this.notifSource.notifications.length === 0) {
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
