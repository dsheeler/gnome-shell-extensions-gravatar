# Gravatar GNOME Shell Extension

<a href="https://extensions.gnome.org/extension/6922/gravatar/"><img src="https://img.shields.io/badge/Download-extensions.gnome.org-4a86cf.svg?logo=gnome&style=plastic" /></a>

A GNOME Shell extension to synchronize your user icon with an avatar service, one of Gravatar or Libravatar.

## Prerequisites
* `gnome-shell`
* `dconf` _(optional)_
* `gnome-shell-extension-prefs` _(optional)_

## Installation

Easiest way to install the extension is via [extensions.gnome.org](https://extensions.gnome.org/extension/6922/gravatar/), the official Gnome extension platform. Head over there and install with one click by toggling the switch on the site.

If you wish to build and install the extension manually, you will need the following tools:
* `git`
* `glib-compile-schemas`
* `make`
* `dconf` _(optional)_

The packages which include the above tools may vary between different GNU/Linux distributions. Check your distribution's documentation / package list to find the most suitable packages.

```bash
# clone the repository
git clone https://github.com/dsheeler/gnome-shell-extensions-gravatar.git
# enter the local repository directory
cd gnome-shell-extensions-gravatar
# run the build/install toolchain
make
```

#### Uninstall
```bash
make uninstall
```
## Usage
### Triggering a Download from Avatar Service
The extension downloads your avatar in various circumstances.

#### Starting the Extension
Every time the extension is enabled (for example at login), the extension downloads your user icon from the avatar service.

#### Settings Changes
 When either  the `email` or the `service` setting changes, the extension also performs a download.

#### Keyboard Shortcut
The extension provides another option to trigger a download: by pressing a user-defined keybinding. This enables the user to, for example, update their user icon after an update on the avatar service. The prefs widget provides an interface to change the keybinding. The default is `<Ctrl><Super>g`.

### Settings
Settings can be configured from the preferences gui:
```bash
gnome-extensions prefs gravatar@dsheeler.net
```
or from the command line via `dconf`. Settings marked with `*` can only be changed by using `dconf`.

#### Service: _(default: `gravatar`)_
```bash
dconf write /org/gnome/shell/extensions/gravatar/service "'<SERVICE_NAME>'"
```
Where `<SERVICE_NAME>` is one of `gravatar` or `libravatar`.

#### Email Address: _(default: `null`)_
```bash
dconf write /org/gnome/shell/extensions/gravatar/email "'<EMAIL>'"
```

#### Download Keybinding: _(default: `["<Ctrl><Super>g"]`)_
```bash
dconf write /org/gnome/shell/extensions/gravatar/gravatar-ondemand-keybinding '["<KEYBINDING_STRING>"]'
```

#### Desktop Notification on Update: _(default: `false`)_

```bash
dconf write /org/gnome/shell/extensions/gravatar/notifications "'<BOOL>'"
```

#### Debug Mode: _(default: `false`)_
```bash
dconf write /org/gnome/shell/extensions/gravatar/debug "'<BOOL>'"
```

#### * Icon Size: _(default: `192`)_
**1 - 2048 pixel square** _(See: [gravatar.com](https://en.gravatar.com/site/implement/images/#size))_

```bash
dconf write /org/gnome/shell/extensions/gravatar/icon-size <SIZE>
```

## Bug Reporting
Bugs should be reported via the [GitHub Issue Tracker](https://github.com/dsheeler/gnome-shell-extensions-gravatar/issues)

### Logs
#### Extension
```bash
journalctl /usr/bin/gnome-shell -f
```

#### Prefs Widget
```bash
journalctl /usr/bin/gjs -f
```

## Credits
This project is a fork of Daniel Demus' fork of the original Gravatar extension by Jon Rouleau.

## License
The MIT License (MIT)
