import { getISTDayBoundsUtc, nowInIST } from "@/lib/time";
import { prisma } from "@/server/prisma";
import { sendTelegramMessage } from "@/server/telegram/client";
import { formatTaskForMessage } from "@/server/tasks/service";

export const sendDailyDigests = async () => {
  const { startUtc, endUtc } = getISTDayBoundsUtc();
  const chats = await prisma.task.findMany({
    where: { status: "OPEN" },
    select: { chatId: true },
    distinct: ["chatId"],
  });

  for (const chat of chats) {
    const tasks = await prisma.task.findMany({
      where: {
        chatId: chat.chatId,
        status: "OPEN",
        dueAt: { gte: startUtc, lt: endUtc },
      },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }],
    });

    const todayLabel = nowInIST().toLocaleDateString("en-IN");
    if (!tasks.length) {
      await sendTelegramMessage(
        chat.chatId,
        `Good morning! Nothing scheduled for today (${todayLabel}). Enjoy the open day 🎉`,
      );
      continue;
    }
    const lines = tasks.map(
      (task, idx) => `${idx + 1}. ${formatTaskForMessage(task)}`,
    );
    await sendTelegramMessage(
      chat.chatId,
      `Good morning! Here's your plan for today (${todayLabel}):\n${lines.join("\n")}`,
    );
  }
};
