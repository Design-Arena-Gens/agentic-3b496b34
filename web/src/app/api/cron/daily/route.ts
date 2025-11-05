import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { sendDailyDigests } from "@/server/daily";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  await sendDailyDigests();
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
