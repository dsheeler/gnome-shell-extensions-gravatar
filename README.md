# Gravatar GNOME Shell Extension

<a href="https://extensions.gnome.org/extension/6922/gravatar/"><img src="https://img.shields.io/badge/Download-extensions.gnome.org-4a86cf.svg?logo=gnome&style=plastic" /></a>

A GNOME Shell extension to synchronize your user icon with Gravatar.

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
#### Triggering a Download from Gravatar
Every time the extension is enabled (for example at login), the extension downloads your user icon from Gravatar. When the `email` setting is changed, the extension also performs a download. 

The extension provides a third option to trigger a download which is by pressing a user-defined keybinding. This enables the user to, for example, update their user icon after an update on Gravatar. The prefs widget provides an interface to change the keybinding. The default is `<Ctrl><Super>g`.    

## Settings
Settings can be configured from the `gnome-shell-extension-prefs` tool or from the command line via `dconf`. Settings marked with `*` can only be changed by using `dconf`.

#### Debug Mode: _(default: `false`)_
```bash
dconf write /org/gnome/shell/extensions/gravatar/debug "'<BOOL>'"
```

#### Email Address: _(default: `null`)_
```bash
dconf write /org/gnome/shell/extensions/gravatar/email "'<EMAIL>'"
```

#### Download Keybinding: _(default: `["<Ctrl><Super>g"]`)_
```bash
dconf write /org/gnome/shell/extensions/gravatar/gravatar-ondemand-keybinding '["<KEYBINDING_STRING>"]'
```

#### *Icon Size: _(default: `192`)_
* **1 - 2048 pixel square** _(See: [gravatar.com](https://en.gravatar.com/site/implement/images/#size))_

```bash
dconf write /org/gnome/shell/extensions/gravatar/icon-size <SIZE>
```


#### Desktop Notification on Update: _(default: `false`)_

```bash
dconf write /org/gnome/shell/extensions/gravatar/notifications "'<BOOL>'"
```

## Bug Reporting
Bugs should be reported via the [GitHub Issue Tracker](https://github.com/dsheeler/gnome-shell-extensions-gravatar/issues)

#### Logs
##### Extension
```bash
journalctl /usr/bin/gnome-shell -f
```

##### Prefs Widget
```bash
gnome-shell-extension-prefs gravatar@gnome-shell-extensions.dsheeler.net
```
## Credits
This project is a fork of Daniel Demus' fork of the original Gravatar extension by Jon Rouleau.

## License
The MIT License (MIT)
