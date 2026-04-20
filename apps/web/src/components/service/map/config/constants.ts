export const MAP_DEFAULT_CENTER: [number, number] = [127.0276, 37.4979];

export const VWORLD_DEFAULT_REFERRER = "https://dbc-5648.vercel.app";
export const VWORLD_DEFAULT_DOMAIN = "dbc-5648.vercel.app";
export const VWORLD_PUBLIC_DEFAULT_API_KEY = "3C11E290-3F00-3957-8B03-FB4CB582692F";
export const VWORLD_3D_DEFAULT_BOOTSTRAP_URL = "https://map.vworld.kr/js/webglMapInit.js.do";
export const VWORLD_3D_DEFAULT_VERSION = "3.0";

export const VWORLD_DATA_LAYER = "LP_PA_CBND_BUBUN";
export const VWORLD_DATA_MAX_SIZE_LIMIT = 1000;
export const VWORLD_DATA_DEFAULT_SIZE = 500;
export const MAP_DATA_MIN_ZOOM = 14;
export const MAP_DATA_MOVEEND_DEBOUNCE_MS = 450;

/**
 * Backward-compatible aliases for older deployments that may still compile a
 * legacy cadastral route from a stale build cache or older branch.
 * Keep these aliases until all environments are fully switched to /api/vworld/data.
 */
export const VWORLD_WFS_TYPENAME = VWORLD_DATA_LAYER;
export const VWORLD_WFS_MAX_FEATURES_LIMIT = VWORLD_DATA_MAX_SIZE_LIMIT;
export const VWORLD_WFS_DEFAULT_MAX_FEATURES = VWORLD_DATA_DEFAULT_SIZE;
