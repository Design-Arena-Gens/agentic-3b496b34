import { TaskPriority } from "@prisma/client";
import { z } from "zod";

import { IST_TIMEZONE, nowInIST } from "@/lib/time";
import { getOpenAI } from "@/server/openai";

import type { TaskDraft } from "./types";

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  due_iso: z.string().datetime().optional().nullable(),
  reminder_lead_minutes: z.number().int().optional().nullable(),
  early_reminder_lead_minutes: z.number().int().optional().nullable(),
  priority: z.enum(["high", "normal", "low"]).default("normal"),
  tags: z.array(z.string()).default([]),
});

const responseSchema = z.object({
  tasks: z.array(taskSchema).default([]),
});

const priorityMap: Record<string, TaskPriority> = {
  high: TaskPriority.HIGH,
  normal: TaskPriority.NORMAL,
  low: TaskPriority.LOW,
};

export const extractTasksFromText = async (
  text: string,
): Promise<TaskDraft[]> => {
  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "task_extraction_response",
        schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string", description: "Short task title" },
                  description: {
                    type: "string",
                    description: "Optional extra context for the task",
                  },
                  due_iso: {
                    type: "string",
                    description:
                      "ISO 8601 string in Asia/Kolkata timezone for when the task should happen. Make a best-effort guess when user gives fuzzy timing.",
                    nullable: true,
                  },
                  reminder_lead_minutes: {
                    type: "integer",
                    description:
                      "Minutes before due time to send standard reminder. Use 0 when reminder should fire exactly at due time.",
                    nullable: true,
                  },
                  early_reminder_lead_minutes: {
                    type: "integer",
                    description:
                      "Extra early reminder offset for important tasks (e.g. 30 minutes). Leave null when not needed.",
                    nullable: true,
                  },
                  priority: {
                    type: "string",
                    enum: ["high", "normal", "low"],
                    description:
                      "Overall priority inferred from user intent. Choose 'high' when urgency or importance is implied.",
                    default: "normal",
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "Relevant short tags like call, payment, work, personal, follow-up.",
                    default: [],
                  },
                },
              },
            },
          },
        },
        strict: true,
      },
    },
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: `You are a helpful assistant that extracts tasks from user messages. The current time in ${IST_TIMEZONE} is ${nowInIST().toISOString()}. All due times must be in ISO 8601 format with timezone offset for Asia/Kolkata (+05:30). When the user omits time, choose a sensible default (morning = 09:00, afternoon = 15:00, evening = 19:00). Split combined requests into separate tasks.`,
          },
        ],
      },
      { role: "user", content: [{ type: "text", text }] },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    console.error("task extraction json parse error", error, raw);
    return [];
  }
  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) {
    console.error("task extraction parse error", parsed.error);
    return [];
  }

  return parsed.data.tasks.map((task) => {
    const dueDate =
      task.due_iso != null ? new Date(task.due_iso) : undefined;
    const remindAt =
      dueDate && task.reminder_lead_minutes != null
        ? new Date(dueDate.getTime() - task.reminder_lead_minutes * 60 * 1000)
        : undefined;
    const earlyRemindAt =
      dueDate && task.early_reminder_lead_minutes != null
        ? new Date(
            dueDate.getTime() - task.early_reminder_lead_minutes * 60 * 1000,
          )
        : undefined;

    return {
      title: task.title,
      description: task.description,
      dueAt: dueDate,
      remindAt,
      earlyRemindAt,
      priority: priorityMap[task.priority] ?? TaskPriority.NORMAL,
      tags: task.tags.map((tag) => tag.toLowerCase()),
    } satisfies TaskDraft;
  });
};
