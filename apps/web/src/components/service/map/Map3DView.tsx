"use client";

export function Map3DView() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-slate-950 p-8 text-center">
      <div className="max-w-md rounded-2xl border border-slate-700 bg-slate-900/70 p-6 text-slate-200">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">3D Workspace</p>
        <h3 className="mt-3 text-lg font-semibold">3D 지도 연동 준비중</h3>
        <p className="mt-2 text-sm text-slate-300">
          현재 2D 지도는 정상 제공 중이며, 3D 엔진은 추후 안정적인 방식으로 다시 연결할 예정입니다.
        </p>
      </div>
    </div>
  );
}
