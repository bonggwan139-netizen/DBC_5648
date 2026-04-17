import { VWORLD_DEFAULT_DOMAIN, VWORLD_PUBLIC_DEFAULT_API_KEY } from "./constants";

export type MapServerEnv = {
  vworldApiKey: string;
  vworldDomain: string;
};

export function getMapServerEnv(): MapServerEnv {
  return {
    vworldApiKey: process.env.NEXT_PUBLIC_VWORLD_API_KEY ?? process.env.VWORLD_API_KEY ?? VWORLD_PUBLIC_DEFAULT_API_KEY,
    vworldDomain: process.env.NEXT_PUBLIC_VWORLD_DOMAIN ?? process.env.VWORLD_DOMAIN ?? VWORLD_DEFAULT_DOMAIN
  };
}
