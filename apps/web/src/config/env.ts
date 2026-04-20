import {
  getPublicMapEnvErrorMessage,
  isMapRenderable,
  mapRenderGuard,
  mapPublicEnv,
  missingPublicMapEnvKeys
} from "@/components/service/map/config/publicEnv";

export const env = mapPublicEnv;
export const isVworldEnabled = isMapRenderable;
export const getVworldEnvErrorMessage = getPublicMapEnvErrorMessage;
export const missingVworldEnvKeys = missingPublicMapEnvKeys;
export const vworldMapRenderGuard = mapRenderGuard;
