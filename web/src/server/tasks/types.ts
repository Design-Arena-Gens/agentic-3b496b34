import { TaskPriority } from "@prisma/client";

export type TaskDraft = {
  title: string;
  description?: string | null;
  dueAt?: Date | null;
  priority: TaskPriority;
  tags: string[];
  remindAt?: Date | null;
  earlyRemindAt?: Date | null;
};
