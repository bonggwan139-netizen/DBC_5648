const DEFAULT_VWORLD_API_KEY = "3C11E290-3F00-3957-8B03-FB4CB582692F";
const DEFAULT_VWORLD_REFERRER = "https://dbc-5648.vercel.app";

export const env = {
  vworldApiKey: process.env.NEXT_PUBLIC_VWORLD_API_KEY ?? DEFAULT_VWORLD_API_KEY,
  vworldReferrer: process.env.NEXT_PUBLIC_VWORLD_REFERRER ?? DEFAULT_VWORLD_REFERRER
};

export const isVworldEnabled = env.vworldApiKey.length > 0;
