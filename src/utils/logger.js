import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

export const GravatarLogger = new GObject.registerClass({
    GTypeName: "GravatarLogger",
    Properties: {
        'debugging_on': GObject.ParamSpec.boolean(
            `debugging_on`,
            `Debug`,
            `Log debug level messages.`,
            GObject.ParamFlags.READWRITE,
            false,
        ),
    }
}, class GravatarLogger extends GObject.Object {
    constructor(settings) {
        super();
        this.settings = settings;
        this.settings.bind('debug', this, 'debugging_on',
        Gio.SettingsBindFlags.DEFAULT);
    }

    log(msg) {
        console.log(`${this.prepareMessage(msg)}`);
    }

    error(msg) {
        console.error(`${this.prepareMessage(msg)}`);
    }

    debug(msg) {
        if (this.debugging_on) {
            console.log(`${this.prepareMessage('[DEBUG] ' + msg)}`);
        }
    }

    prepareMessage(msg) {
        return `[Gravatar] ${msg}`;
    }
});
