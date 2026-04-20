import { VWORLD_DEFAULT_DOMAIN, VWORLD_PUBLIC_DEFAULT_API_KEY } from "./constants";

export type MapServerEnv = {
  vworldApiKey: string;
  vworldDomain: string;
};

function normalizeVworldDomain(domain: string) {
  const trimmed = domain.trim();
  if (!trimmed) {
    return VWORLD_DEFAULT_DOMAIN;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/+$/, "");
  }

  return `https://${trimmed.replace(/\/+$/, "")}`;
}

export function getMapServerEnv(): MapServerEnv {
  return {
    vworldApiKey: process.env.NEXT_PUBLIC_VWORLD_API_KEY ?? process.env.VWORLD_API_KEY ?? VWORLD_PUBLIC_DEFAULT_API_KEY,
    vworldDomain: normalizeVworldDomain(
      process.env.NEXT_PUBLIC_VWORLD_DOMAIN ?? process.env.VWORLD_DOMAIN ?? VWORLD_DEFAULT_DOMAIN
    )
  };
}
