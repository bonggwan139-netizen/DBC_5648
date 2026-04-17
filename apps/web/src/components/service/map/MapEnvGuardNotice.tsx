import { mapRenderGuard } from "./config/publicEnv";

type MapEnvGuardNoticeProps = {
  mode: "2d" | "3d";
};

export function MapEnvGuardNotice({ mode }: MapEnvGuardNoticeProps) {
  const title = mode === "2d" ? "지도를 불러올 수 없습니다" : "3D 지도를 불러올 수 없습니다";
  const showDevHints = process.env.NODE_ENV !== "production";

  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-100 p-8 text-center text-sm text-slate-600">
      <div className="max-w-md">
        <p className="font-semibold text-slate-700">{title}</p>
        <p className="mt-2">{mapRenderGuard.userMessage}</p>

        {showDevHints && mapRenderGuard.developerMessage ? (
          <p className="mt-3 rounded-md bg-slate-200/70 px-3 py-2 text-left text-xs text-slate-700">
            Dev hint: {mapRenderGuard.developerMessage}
          </p>
        ) : null}
      </div>
    </div>
  );
}
