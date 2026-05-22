import { type NextRequest } from "next/server"

const MAX_BYTES = 25_000_000

// Streams a payload of the requested size so the browser can measure download
// speed against our own server (same-origin, no third-party dependency).
export function GET(request: NextRequest) {
  const requested = Number(request.nextUrl.searchParams.get("bytes")) || 12_000_000
  const total = Math.min(Math.max(requested, 1024), MAX_BYTES)
  let sent = 0

  const stream = new ReadableStream({
    pull(controller) {
      if (sent >= total) {
        controller.close()
        return
      }
      const size = Math.min(65536, total - sent)
      controller.enqueue(new Uint8Array(size))
      sent += size
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Cache-Control": "no-store",
    },
  })
}
