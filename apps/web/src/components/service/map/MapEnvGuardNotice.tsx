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
};

function deriveDevHint(status: EnvStatus | null) {
  if (!status) {
    return null;
  }

  if (!status.serverHasPublicVworldKey) {
    return "Vercel 현재 스코프(Production/Preview/Development)에 NEXT_PUBLIC_VWORLD_API_KEY가 등록되지 않았을 가능성이 큽니다.";
  }

  return "서버에는 NEXT_PUBLIC_VWORLD_API_KEY가 있지만 현재 클라이언트 번들에는 비어 있습니다. 환경변수 추가 이후 재배포가 필요합니다.";
}

export function MapEnvGuardNotice({ mode }: MapEnvGuardNoticeProps) {
  const title = mode === "2d" ? "지도를 불러올 수 없습니다" : "3D 지도를 불러올 수 없습니다";
  const showDevHints = process.env.NODE_ENV !== "production";
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);

  useEffect(() => {
    if (!showDevHints) {
      return;
    }

    fetch("/api/map/env-status", { cache: "no-store" })
      .then((response) => response.json())
      .then((json: EnvStatus) => {
        setEnvStatus(json);
      })
      .catch(() => {
        setEnvStatus(null);
      });
  }, [showDevHints]);

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
          </p>
        ) : null}
      </div>
    </div>
  );
}
