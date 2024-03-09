'use strict';

/* exported log */
export function my_log(msg) {
  log(`[GravaterExtension] ${msg}`);
}

/* exported debug */
export function debug(msg) {
  //if (settings.get_boolean('debug')) {
    my_log(`DEBUG: ${msg}`);
  //}
}
