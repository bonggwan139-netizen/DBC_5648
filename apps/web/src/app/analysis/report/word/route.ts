export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPORT_WORD_UPSTREAM_URL = "http://34.47.87.148:8000/analysis/report/word";

const PASSTHROUGH_RESPONSE_HEADERS = ["content-type", "content-disposition", "content-length"] as const;

function buildPassthroughHeaders(upstreamHeaders: Headers) {
  const headers = new Headers();

  PASSTHROUGH_RESPONSE_HEADERS.forEach((name) => {
    const value = upstreamHeaders.get(name);
    if (value) {
      headers.set(name, value);
    }
  });

  return headers;
}

export async function POST(request: Request) {
  let body: ArrayBuffer;

  try {
    body = await request.arrayBuffer();
  } catch (error) {
    console.error("[report-word-proxy] Failed to read request body.", error);
    return new Response("Invalid report request body.", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }

  try {
    const upstream = await fetch(REPORT_WORD_UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": request.headers.get("content-type") ?? "application/json"
      },
      body,
      cache: "no-store"
    });

    if (!upstream.ok) {
      const upstreamMessage = await upstream.text().catch(() => "");
      console.error("[report-word-proxy] Upstream returned an error.", {
        status: upstream.status,
        statusText: upstream.statusText,
        message: upstreamMessage.slice(0, 500)
      });

      return new Response("Report upstream request failed.", {
        status: upstream.status,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: buildPassthroughHeaders(upstream.headers)
    });
  } catch (error) {
    console.error("[report-word-proxy] Failed to reach report upstream.", error);
    return new Response("Report upstream is unavailable.", {
      status: 502,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }
}
