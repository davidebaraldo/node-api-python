/**
 * The native addon's BuildModuleProxy already creates a JS object where:
 * - Each callable Python attribute has two versions: func() (async) and funcSync() (sync)
 * - Non-callable attributes are converted directly
 * - __getattr__() provides dynamic access
 *
 * No JS-side Proxy is needed — the native object is used directly.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NativeAddon = Record<string, any>
