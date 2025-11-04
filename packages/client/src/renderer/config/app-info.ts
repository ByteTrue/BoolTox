const versionSource = (globalThis as { __APP_VERSION__?: string }).__APP_VERSION__;

export const APP_VERSION = typeof versionSource === "string" && versionSource.length > 0 ? versionSource : "0.0.0";
