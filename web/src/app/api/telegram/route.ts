import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { handleTelegramUpdate } from "@/server/telegram/handler";

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (WEBHOOK_SECRET) {
    const incoming = req.headers.get("x-telegram-bot-api-secret-token");
    if (incoming !== WEBHOOK_SECRET) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  try {
    const body = (await req.json()) as unknown;
    await handleTelegramUpdate(body as any);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("telegram webhook error", error);
    return new NextResponse("error", { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
