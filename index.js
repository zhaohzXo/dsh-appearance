/**
 * Host half of the appearance plugin. Wallpaper and boot intro live entirely in
 * the Client UI, so the Host only needs a Loader entry whose `apply` is a no-op.
 * @module dsh-appearance
 */

/** Keep the Loader entry meaningful without implying Host-side state. */
export function apply() {}
