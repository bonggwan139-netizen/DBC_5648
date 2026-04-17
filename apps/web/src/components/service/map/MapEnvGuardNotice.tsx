"use client";

import { useEffect, useMemo, useState } from "react";
import { mapRenderGuard } from "./config/publicEnv";

type MapEnvGuardNoticeProps = {
  mode: "2d" | "3d";
};

type EnvStatus = {
  serverHasPublicVworldKey: boolean;
  serverHasWfsKey: boolean;
  nodeEnv: string;
  vercelEnv: string;
  vercelUrl: string | null;
};

function deriveDevHint(status: EnvStatus | null) {
  if (!status) {
    return "서버 env 상태를 조회하지 못했습니다. /api/map/env-status 응답을 확인하세요.";
  }

  if (!status.serverHasPublicVworldKey) {
    return `Vercel ${status.vercelEnv} 스코프에 NEXT_PUBLIC_VWORLD_API_KEY가 등록되지 않았을 가능성이 큽니다.`;
  }

  return "서버에는 NEXT_PUBLIC_VWORLD_API_KEY가 있지만 현재 클라이언트 번들에는 비어 있습니다. 환경변수 추가 이후 재배포가 필요합니다.";
}

function logOperatorDiagnostic(status: EnvStatus | null) {
  const payload = {
    mapRenderable: mapRenderGuard.canRender,
    missingRequiredKeys: mapRenderGuard.missingRequiredKeys,
    server: status
  };

  console.warn("[map-env-guard] operator checklist hint", payload);
}

export function MapEnvGuardNotice({ mode }: MapEnvGuardNoticeProps) {
  const title = mode === "2d" ? "지도를 불러올 수 없습니다" : "3D 지도를 불러올 수 없습니다";
  const showDevHints = process.env.NODE_ENV !== "production";
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);

  useEffect(() => {
    fetch("/api/map/env-status", { cache: "no-store" })
      .then((response) => response.json())
      .then((json: EnvStatus) => {
        setEnvStatus(json);
        logOperatorDiagnostic(json);
      })
      .catch(() => {
        logOperatorDiagnostic(null);
        setEnvStatus(null);
      });
  }, []);

  const extraHint = useMemo(() => deriveDevHint(envStatus), [envStatus]);

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 p-8 text-center text-sm text-slate-600">
      <div className="max-w-md">
        <p className="font-semibold text-slate-700">{title}</p>
        <p className="mt-2">{mapRenderGuard.userMessage}</p>

        {showDevHints && mapRenderGuard.developerMessage ? (
          <p className="mt-3 rounded-md bg-slate-200/70 px-3 py-2 text-left text-xs text-slate-700">
            Dev hint: {mapRenderGuard.developerMessage}
            {extraHint ? <><br />{extraHint}</> : null}
            {envStatus?.vercelUrl ? <><br />Current deploy: {envStatus.vercelUrl}</> : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
