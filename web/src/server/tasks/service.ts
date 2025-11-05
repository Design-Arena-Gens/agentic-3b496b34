import { addMilliseconds } from "date-fns";

import { formatDateForList } from "@/lib/time";
import { prisma } from "@/server/prisma";

import type { TaskPriority } from "@prisma/client";
import type { TaskDraft } from "./types";

export const saveTasksForChat = async (
  chatId: string,
  sourceMessageId: number | undefined,
  drafts: TaskDraft[],
) => {
  if (!drafts.length) {
    return [];
  }

  const created = await prisma.$transaction(
    drafts.map((draft) => {
      const dueAt = draft.dueAt ?? undefined;
      const remindAt = draft.remindAt ?? dueAt ?? undefined;
      const earlyRemindAt =
        draft.earlyRemindAt ??
        (draft.priority === "HIGH" && dueAt
          ? new Date(dueAt.getTime() - 30 * 60 * 1000)
          : undefined);
      return prisma.task.create({
        data: {
          chatId,
          sourceMessageId,
          title: draft.title,
          description: draft.description ?? undefined,
          dueAt,
          remindAt,
          earlyRemindAt,
          priority: draft.priority,
          tags: draft.tags,
        },
      });
    }),
  );

  return created;
};

export const listOpenTasks = async (chatId: string, limit = 5) => {
  const tasks = await prisma.task.findMany({
    where: { chatId, status: "OPEN" },
    orderBy: [
      { dueAt: { sort: "asc", nulls: "last" } },
      { createdAt: "asc" },
    ],
    take: limit,
  });

  return tasks;
};

export const listTodayTasks = async (chatId: string, dayStart: Date, dayEnd: Date) =>
  prisma.task.findMany({
    where: {
      chatId,
      status: "OPEN",
      dueAt: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }],
  });

export const markTaskDoneByIndex = async (chatId: string, index: number) => {
  const tasks = await listOpenTasks(chatId, index);
  const task = tasks[index - 1];
  if (!task) return null;
  return prisma.task.update({
    where: { id: task.id },
    data: { status: "DONE" },
  });
};

export const snoozeTaskByIndex = async (
  chatId: string,
  index: number,
  durationMs: number,
) => {
  const tasks = await listOpenTasks(chatId, index);
  const task = tasks[index - 1];
  if (!task) return null;
  const baseDate = task.dueAt ?? new Date();
  const newDue = addMilliseconds(baseDate, durationMs);
  return prisma.task.update({
    where: { id: task.id },
    data: {
      dueAt: newDue,
      remindAt: null,
      earlyRemindAt: null,
    },
  });
};

export const formatTaskForMessage = (task: {
  title: string;
  dueAt: Date | null;
  priority: TaskPriority | string;
  tags: string[];
}) => {
  const parts = [`${task.title}`];
  if (task.dueAt) {
    parts.push(`⏰ ${formatDateForList(task.dueAt)}`);
  }
  if (task.priority === "HIGH") {
    parts.push("🔥 High priority");
  }
  if (task.tags.length) {
    parts.push(`#${task.tags.join(" #")}`);
  }
  return parts.join(" — ");
};
