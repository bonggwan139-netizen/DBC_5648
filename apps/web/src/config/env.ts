const DEFAULT_VWORLD_REFERRER = "https://dbc-5648.vercel.app";
const DEFAULT_VWORLD_DOMAIN = "dbc-5648.vercel.app";
const DEFAULT_VWORLD_3D_BOOTSTRAP_URL = "https://map.vworld.kr/js/webglMapInit.js.do";
const DEFAULT_VWORLD_3D_VERSION = "3.0";

export const env = {
  vworldApiKey: process.env.NEXT_PUBLIC_VWORLD_API_KEY ?? "",
  vworldReferrer: process.env.NEXT_PUBLIC_VWORLD_REFERRER ?? DEFAULT_VWORLD_REFERRER,
  vworldDomain: process.env.NEXT_PUBLIC_VWORLD_DOMAIN ?? DEFAULT_VWORLD_DOMAIN,
  vworld3dBootstrapUrl:
    process.env.NEXT_PUBLIC_VWORLD_3D_BOOTSTRAP_URL ?? DEFAULT_VWORLD_3D_BOOTSTRAP_URL,
  vworld3dVersion: process.env.NEXT_PUBLIC_VWORLD_3D_VERSION ?? DEFAULT_VWORLD_3D_VERSION
};

export const isVworldEnabled = env.vworldApiKey.length > 0;
