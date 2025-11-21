declare const __APP_VERSION__: string | undefined;

const versionSource = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : undefined;

export const APP_VERSION = versionSource && versionSource.length > 0 ? versionSource : '0.0.0';
