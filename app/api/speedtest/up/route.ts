import { type NextRequest, NextResponse } from "next/server"

// Receives and discards an upload so the browser can measure upload speed.
// The fetch resolves once the whole body has arrived, which is the timing
// the client uses. (Kept under Vercel's request-body size limit.)
export async function POST(request: NextRequest) {
  await request.arrayBuffer().catch(() => null)
  return NextResponse.json({ ok: true })
}
