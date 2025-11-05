import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { runDueReminders } from "@/server/reminders";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  await runDueReminders();
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const response = await GET(req);
  return response;
}
