'use strict';

/* exported log */
export function gr_log(msg) {
  log(`[GravaterExtension] ${msg}`);
}

/* exported debug */
export function gr_debug(settings, msg) {
  if (settings.get_boolean('debug')) {
    gr_log(`DEBUG: ${msg}`);
  }
}
