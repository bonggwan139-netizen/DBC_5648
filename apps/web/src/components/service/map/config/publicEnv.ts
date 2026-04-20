import {
  VWORLD_3D_DEFAULT_BOOTSTRAP_URL,
  VWORLD_3D_DEFAULT_VERSION,
  VWORLD_DEFAULT_DOMAIN,
  VWORLD_DEFAULT_REFERRER,
  VWORLD_PUBLIC_DEFAULT_API_KEY
} from "./constants";

export type MapPublicEnv = {
  mapServiceEnabled: boolean;
  vworldApiKey: string;
  vworldReferrer: string;
  vworldDomain: string;
  vworld3dBootstrapUrl: string;
  vworld3dVersion: string;
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

export const mapPublicEnv: MapPublicEnv = {
  mapServiceEnabled: (process.env.NEXT_PUBLIC_ENABLE_MAP_SERVICE ?? "true") !== "false",
  vworldApiKey: process.env.NEXT_PUBLIC_VWORLD_API_KEY ?? VWORLD_PUBLIC_DEFAULT_API_KEY,
  vworldReferrer: process.env.NEXT_PUBLIC_VWORLD_REFERRER ?? VWORLD_DEFAULT_REFERRER,
  vworldDomain: normalizeVworldDomain(process.env.NEXT_PUBLIC_VWORLD_DOMAIN ?? VWORLD_DEFAULT_DOMAIN),
  vworld3dBootstrapUrl: process.env.NEXT_PUBLIC_VWORLD_3D_BOOTSTRAP_URL ?? VWORLD_3D_DEFAULT_BOOTSTRAP_URL,
  vworld3dVersion: process.env.NEXT_PUBLIC_VWORLD_3D_VERSION ?? VWORLD_3D_DEFAULT_VERSION
};

export const missingPublicMapEnvKeys = mapPublicEnv.vworldApiKey.trim().length === 0 ? ["VWorld API key"] : [];

export const isMapRenderable = mapPublicEnv.mapServiceEnabled && missingPublicMapEnvKeys.length === 0;

export const mapRenderGuard = {
  canRender: isMapRenderable,
  userMessage: mapPublicEnv.mapServiceEnabled
    ? "지도 설정을 확인하는 중입니다. 잠시 후 다시 시도해 주세요."
    : "현재 환경에서 지도 서비스가 비활성화되어 있습니다.",
  developerMessage: !isMapRenderable
    ? "VWorld key source is empty. Check NEXT_PUBLIC_VWORLD_API_KEY (or default key constant)."
    : null
} as const;

const loggedScopes = new Set<string>();

export function logPublicMapEnvDiagnostics(scope: string) {
  if (mapRenderGuard.canRender || loggedScopes.has(scope)) {
    return;
  }

  loggedScopes.add(scope);
  console.warn("[map-env-guard] Map rendering blocked", {
    scope,
    mapServiceEnabled: mapPublicEnv.mapServiceEnabled,
    missingPublicMapEnvKeys
  });
}

export function getPublicMapEnvErrorMessage() {
  return mapRenderGuard.canRender ? null : mapRenderGuard.userMessage;
}
