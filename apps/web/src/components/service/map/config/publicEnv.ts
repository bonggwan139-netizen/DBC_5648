import {
  VWORLD_3D_DEFAULT_BOOTSTRAP_URL,
  VWORLD_3D_DEFAULT_VERSION,
  VWORLD_DEFAULT_DOMAIN,
  VWORLD_DEFAULT_REFERRER
} from "./constants";

export type MapPublicEnv = {
  mapServiceEnabled: boolean;
  vworldApiKey: string;
  vworldReferrer: string;
  vworldDomain: string;
  vworld3dBootstrapUrl: string;
  vworld3dVersion: string;
};

type PublicEnvKeyConfig = {
  key: string;
  required: boolean;
  value: string | boolean;
  purpose: string;
};

export const mapPublicEnv: MapPublicEnv = {
  mapServiceEnabled: (process.env.NEXT_PUBLIC_ENABLE_MAP_SERVICE ?? "true") !== "false",
  vworldApiKey: process.env.NEXT_PUBLIC_VWORLD_API_KEY ?? "",
  vworldReferrer: process.env.NEXT_PUBLIC_VWORLD_REFERRER ?? VWORLD_DEFAULT_REFERRER,
  vworldDomain: process.env.NEXT_PUBLIC_VWORLD_DOMAIN ?? VWORLD_DEFAULT_DOMAIN,
  vworld3dBootstrapUrl: process.env.NEXT_PUBLIC_VWORLD_3D_BOOTSTRAP_URL ?? VWORLD_3D_DEFAULT_BOOTSTRAP_URL,
  vworld3dVersion: process.env.NEXT_PUBLIC_VWORLD_3D_VERSION ?? VWORLD_3D_DEFAULT_VERSION
};

export const mapPublicEnvConfig: PublicEnvKeyConfig[] = [
  {
    key: "NEXT_PUBLIC_ENABLE_MAP_SERVICE",
    required: false,
    value: mapPublicEnv.mapServiceEnabled,
    purpose: "지도 기능 활성/비활성 토글"
  },
  {
    key: "NEXT_PUBLIC_VWORLD_API_KEY",
    required: true,
    value: mapPublicEnv.vworldApiKey,
    purpose: "2D/3D VWorld basemap 렌더링"
  },
  {
    key: "NEXT_PUBLIC_VWORLD_REFERRER",
    required: false,
    value: mapPublicEnv.vworldReferrer,
    purpose: "운영 referrer 메타/표시"
  },
  {
    key: "NEXT_PUBLIC_VWORLD_DOMAIN",
    required: false,
    value: mapPublicEnv.vworldDomain,
    purpose: "VWorld 도메인 파라미터 기본값"
  }
];

export const missingPublicMapEnvKeys = mapPublicEnvConfig
  .filter((entry) => entry.required && String(entry.value).trim().length === 0)
  .map((entry) => entry.key);

export const isMapRenderable = mapPublicEnv.mapServiceEnabled && missingPublicMapEnvKeys.length === 0;

export const mapRenderGuard = {
  isEnabled: mapPublicEnv.mapServiceEnabled,
  missingRequiredKeys: missingPublicMapEnvKeys,
  canRender: isMapRenderable,
  userMessage: mapPublicEnv.mapServiceEnabled
    ? "지도를 준비하는 데 필요한 설정이 아직 적용되지 않았습니다. 잠시 후 다시 시도해 주세요."
    : "현재 환경에서 지도 서비스가 비활성화되어 있습니다.",
  developerMessage:
    missingPublicMapEnvKeys.length > 0
      ? [
          `Missing required map env: ${missingPublicMapEnvKeys.join(", ")}`,
          "NEXT_PUBLIC_* values are baked into the client at build time.",
          "If you added env in Vercel after deployment, redeploy this commit."
        ].join(" ")
      : mapPublicEnv.mapServiceEnabled
        ? null
        : "Map service is disabled by NEXT_PUBLIC_ENABLE_MAP_SERVICE=false."
} as const;

const loggedScopes = new Set<string>();

export function getPublicMapEnvErrorMessage() {
  return mapRenderGuard.canRender ? null : mapRenderGuard.userMessage;
}

export function logPublicMapEnvDiagnostics(scope: string) {
  if (mapRenderGuard.canRender) {
    return;
  }
  if (loggedScopes.has(scope)) {
    return;
  }
  loggedScopes.add(scope);

  const detail = {
    scope,
    canRender: mapRenderGuard.canRender,
    isEnabled: mapRenderGuard.isEnabled,
    missingRequiredKeys: mapRenderGuard.missingRequiredKeys,
    remediation: [
      "Check Vercel Environment Variables for the current scope (Production/Preview/Development).",
      "Set NEXT_PUBLIC_VWORLD_API_KEY and trigger a new deployment.",
      "Confirm the deployment URL you are testing matches the scope where env is set."
    ],
    config: mapPublicEnvConfig.map((entry) => ({
      key: entry.key,
      required: entry.required,
      hasValue: String(entry.value).trim().length > 0,
      purpose: entry.purpose
    }))
  };

  console.warn("[map-env-guard] Map rendering blocked.", detail);
}
