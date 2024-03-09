'use strict';

import GLib from 'gi://GLib';

/* exported setInterval */
export function setInterval(func, millis) {
  return GLib.timeout_add(GLib.PRIORITY_DEFAULT, millis, () => {
    func();
    // Repeat
    return true;
  });
}

/* exported clearInterval */
export function clearInterval(id) {
  return GLib.Source.remove(id);
}
