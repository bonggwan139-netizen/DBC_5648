const DEFAULT_VWORLD_API_KEY = "3C11E290-3F00-3957-8B03-FB4CB582692F";
const DEFAULT_VWORLD_REFERRER = "https://dbc-5648.vercel.app";
const DEFAULT_VWORLD_DOMAIN = "dbc-5648.vercel.app";
const DEFAULT_VWORLD_3D_BOOTSTRAP_URL = "https://map.vworld.kr/js/webglMapInit.js.do";

export const env = {
  vworldApiKey: process.env.NEXT_PUBLIC_VWORLD_API_KEY ?? DEFAULT_VWORLD_API_KEY,
  vworldReferrer: process.env.NEXT_PUBLIC_VWORLD_REFERRER ?? DEFAULT_VWORLD_REFERRER,
  vworldDomain: process.env.NEXT_PUBLIC_VWORLD_DOMAIN ?? DEFAULT_VWORLD_DOMAIN,
  vworld3dBootstrapUrl:
    process.env.NEXT_PUBLIC_VWORLD_3D_BOOTSTRAP_URL ?? DEFAULT_VWORLD_3D_BOOTSTRAP_URL
};

export const isVworldEnabled = env.vworldApiKey.length > 0;
