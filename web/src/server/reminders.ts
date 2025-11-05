import { prisma } from "@/server/prisma";
import { sendTelegramMessage } from "@/server/telegram/client";
import { formatTaskForMessage } from "@/server/tasks/service";

export const runDueReminders = async () => {
  const now = new Date();
  const tasks = await prisma.task.findMany({
    where: {
      status: "OPEN",
      OR: [
        { remindAt: { lte: now } },
        { earlyRemindAt: { lte: now } },
      ],
    },
  });

  for (const task of tasks) {
    if (task.remindAt && task.remindAt <= now) {
      await sendTelegramMessage(
        task.chatId,
        `Reminder ⏰\n${formatTaskForMessage(task)}`,
      );
      await prisma.task.update({
        where: { id: task.id },
        data: { remindAt: null },
      });
    } else if (task.earlyRemindAt && task.earlyRemindAt <= now) {
      await sendTelegramMessage(
        task.chatId,
        `Heads up ⏰ (early reminder)\n${formatTaskForMessage(task)}`,
      );
      await prisma.task.update({
        where: { id: task.id },
        data: { earlyRemindAt: null },
      });
    }
  }
};
