import { VWORLD_DEFAULT_DOMAIN } from "./constants";

export type MapServerEnv = {
  vworldApiKey: string;
  vworldDomain: string;
};

export function getMapServerEnv(): MapServerEnv {
  return {
    vworldApiKey: process.env.VWORLD_API_KEY ?? "",
    vworldDomain: process.env.VWORLD_DOMAIN ?? VWORLD_DEFAULT_DOMAIN
  };
}

export function getMissingMapServerEnvKeys(env: MapServerEnv) {
  const missing = [] as string[];
  if (!env.vworldApiKey) {
    missing.push("VWORLD_API_KEY");
  }

  return missing;
}
