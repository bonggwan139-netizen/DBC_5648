export const env = {
  vworldApiKey: process.env.NEXT_PUBLIC_VWORLD_API_KEY ?? "",
  vworldReferrer: process.env.NEXT_PUBLIC_VWORLD_REFERRER ?? ""
};

export const isVworldEnabled = env.vworldApiKey.length > 0;
