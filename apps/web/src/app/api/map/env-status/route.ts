import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      serverHasPublicVworldKey: Boolean(process.env.NEXT_PUBLIC_VWORLD_API_KEY),
      serverHasWfsKey: Boolean(process.env.VWORLD_API_KEY),
      nodeEnv: process.env.NODE_ENV ?? "unknown"
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
