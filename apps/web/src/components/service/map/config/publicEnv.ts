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

export const mapPublicEnv: MapPublicEnv = {
  mapServiceEnabled: (process.env.NEXT_PUBLIC_ENABLE_MAP_SERVICE ?? "true") !== "false",
  vworldApiKey: process.env.NEXT_PUBLIC_VWORLD_API_KEY ?? "",
  vworldReferrer: process.env.NEXT_PUBLIC_VWORLD_REFERRER ?? VWORLD_DEFAULT_REFERRER,
  vworldDomain: process.env.NEXT_PUBLIC_VWORLD_DOMAIN ?? VWORLD_DEFAULT_DOMAIN,
  vworld3dBootstrapUrl: process.env.NEXT_PUBLIC_VWORLD_3D_BOOTSTRAP_URL ?? VWORLD_3D_DEFAULT_BOOTSTRAP_URL,
  vworld3dVersion: process.env.NEXT_PUBLIC_VWORLD_3D_VERSION ?? VWORLD_3D_DEFAULT_VERSION
};

export const missingPublicMapEnvKeys = [
  {
    key: "NEXT_PUBLIC_VWORLD_API_KEY",
    value: mapPublicEnv.vworldApiKey,
    purpose: "2D/3D VWorld basemap rendering"
  }
].filter((entry) => entry.value.length === 0);

export const isMapRenderable = mapPublicEnv.mapServiceEnabled && missingPublicMapEnvKeys.length === 0;

export function getPublicMapEnvErrorMessage() {
  if (missingPublicMapEnvKeys.length === 0) {
    return mapPublicEnv.mapServiceEnabled ? null : "현재 환경에서 지도 서비스가 비활성화되어 있습니다.";
  }

  const missingKeys = missingPublicMapEnvKeys.map((entry) => entry.key).join(", ");
  return `지도 초기화에 필요한 환경변수가 없습니다: ${missingKeys}`;
}
