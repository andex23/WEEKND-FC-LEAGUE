import { NextResponse } from "next/server"

let memoryConfig: any = null

export async function GET() {
  return NextResponse.json({ config: memoryConfig })
}

export async function POST(request: Request) {
  const body = await request.json()
  memoryConfig = body?.config || memoryConfig
  return NextResponse.json({ ok: true, config: memoryConfig })
}
