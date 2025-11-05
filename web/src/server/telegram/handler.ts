import { formatDueDate, getISTDayBoundsUtc, nowInIST } from "@/lib/time";
import { parseDurationToMs } from "@/lib/duration";
import {
  formatTaskForMessage,
  listOpenTasks,
  listTodayTasks,
  markTaskDoneByIndex,
  saveTasksForChat,
  snoozeTaskByIndex,
} from "@/server/tasks/service";
import { extractTasksFromText } from "@/server/tasks/extract";

import { sendTelegramMessage } from "./client";
import { transcribeVoiceNote } from "./voice";

type TelegramUpdate = {
  message?: TelegramMessage;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number };
  voice?: { file_id: string };
  from?: { first_name?: string };
};

export const handleTelegramUpdate = async (update: TelegramUpdate) => {
  if (!update.message) return;
  const { chat, message_id, voice } = update.message;
  const chatId = chat.id.toString();

  let text = update.message.text?.trim();
  if (!text && voice) {
    try {
      text = await transcribeVoiceNote(voice.file_id);
    } catch (error) {
      console.error("voice transcription failed", error);
      await sendTelegramMessage(
        chat.id,
        "Couldn't understand that voice note, please try again.",
      );
      return;
    }
  }

  if (!text) {
    await sendTelegramMessage(chat.id, "Send a task or command so I can help.");
    return;
  }

  if (text.startsWith("/")) {
    await handleCommand(text, chat.id, chatId, message_id);
    return;
  }

  const normalized = text.toLowerCase();

  if (
    normalized.includes("what's next") ||
    normalized.includes("whats next") ||
    normalized.includes("what is next") ||
    normalized.includes("next task")
  ) {
    await sendUpcomingTasks(chat.id, chatId);
    return;
  }

  if (normalized.includes("show me") && normalized.includes("today")) {
    await sendTodayTasks(chat.id, chatId);
    return;
  }

  const doneMatch = normalized.match(/mark\s+task\s+(\d+)\s+as\s+done/);
  if (doneMatch) {
    const index = Number(doneMatch[1]);
    await completeTask(chat.id, chatId, index);
    return;
  }

  const plainDoneMatch = normalized.match(/done\s+(\d+)/);
  if (plainDoneMatch) {
    const index = Number(plainDoneMatch[1]);
    await completeTask(chat.id, chatId, index);
    return;
  }

  // Default to task extraction.
  await extractAndSaveTasks(text, chat.id, chatId, message_id);
};

const handleCommand = async (
  text: string,
  chatIdNumber: number,
  chatId: string,
  messageId: number,
) => {
  const [command, ...restParts] = text.split(/\s+/);
  const payload = restParts.join(" ").trim();
  switch (command) {
    case "/add":
      if (!payload) {
        await sendTelegramMessage(
          chatIdNumber,
          "Usage: /add Pay rent tomorrow 10am",
        );
        return;
      }
      await extractAndSaveTasks(payload, chatIdNumber, chatId, messageId);
      return;
    case "/next":
      await sendUpcomingTasks(chatIdNumber, chatId);
      return;
    case "/today":
      await sendTodayTasks(chatIdNumber, chatId);
      return;
    case "/done":
      if (!payload) {
        await sendTelegramMessage(chatIdNumber, "Usage: /done 2");
        return;
      }
      await completeTask(chatIdNumber, chatId, Number(payload));
      return;
    case "/snooze": {
      const [indexPart, durationPart] = payload.split(/\s+/);
      if (!indexPart || !durationPart) {
        await sendTelegramMessage(chatIdNumber, "Usage: /snooze 3 2h");
        return;
      }
      const index = Number(indexPart);
      const durationMs = parseDurationToMs(durationPart);
      if (!index || !durationMs) {
        await sendTelegramMessage(
          chatIdNumber,
          "Couldn't understand that snooze request.",
        );
        return;
      }
      const task = await snoozeTaskByIndex(chatId, index, durationMs);
      if (!task) {
        await sendTelegramMessage(chatIdNumber, "Task not found.");
        return;
      }
      await sendTelegramMessage(
        chatIdNumber,
        `Snoozed task ${index} to ${formatTaskForMessage(task)}`,
      );
      return;
    }
    default:
      await sendTelegramMessage(
        chatIdNumber,
        "I don't know that command yet. Try /add, /next, /today, /done, /snooze.",
      );
  }
};

const extractAndSaveTasks = async (
  text: string,
  chatIdNumber: number,
  chatId: string,
  messageId: number,
) => {
  const drafts = await extractTasksFromText(text);
  if (!drafts.length) {
    await sendTelegramMessage(
      chatIdNumber,
      "I couldn't find any tasks in that message.",
    );
    return;
  }

  const tasks = await saveTasksForChat(chatId, messageId, drafts);
  if (!tasks.length) {
    await sendTelegramMessage(
      chatIdNumber,
      "Something went wrong while saving your task.",
    );
    return;
  }

  if (tasks.length === 1) {
    const [task] = tasks;
    const dueText = task.dueAt ? ` — ${formatDueDate(task.dueAt)}` : "";
    await sendTelegramMessage(chatIdNumber, `Task added: ${task.title}${dueText} ✅`, {
      replyToMessageId: messageId,
    });
    return;
  }

  const lines = tasks.map(
    (task, idx) => `${idx + 1}. ${formatTaskForMessage(task)}`,
  );
  await sendTelegramMessage(
    chatIdNumber,
    `Added ${tasks.length} tasks:\n${lines.join("\n")}`,
    { replyToMessageId: messageId },
  );
};

const sendUpcomingTasks = async (chatIdNumber: number, chatId: string) => {
  const tasks = await listOpenTasks(chatId, 5);
  if (!tasks.length) {
    await sendTelegramMessage(chatIdNumber, "You're all caught up ✅");
    return;
  }
  const lines = tasks.map(
    (task, idx) => `${idx + 1}. ${formatTaskForMessage(task)}`,
  );
  await sendTelegramMessage(
    chatIdNumber,
    `Next up:\n${lines.join("\n")}`,
  );
};

const sendTodayTasks = async (chatIdNumber: number, chatId: string) => {
  const { startUtc, endUtc } = getISTDayBoundsUtc();
  const tasks = await listTodayTasks(chatId, startUtc, endUtc);
  if (!tasks.length) {
    await sendTelegramMessage(chatIdNumber, "No tasks due today 🎉");
    return;
  }
  const lines = tasks.map(
    (task, idx) => `${idx + 1}. ${formatTaskForMessage(task)}`,
  );
  await sendTelegramMessage(
    chatIdNumber,
    `Today's plan (${nowInIST().toLocaleDateString("en-IN")}):\n${lines.join("\n")}`,
  );
};

const completeTask = async (
  chatIdNumber: number,
  chatId: string,
  index: number,
) => {
  if (!index || Number.isNaN(index)) {
    await sendTelegramMessage(chatIdNumber, "Give me the task number to finish.");
    return;
  }
  const task = await markTaskDoneByIndex(chatId, index);
  if (!task) {
    await sendTelegramMessage(chatIdNumber, "Couldn't find that task.");
    return;
  }
  await sendTelegramMessage(
    chatIdNumber,
    `Nice! Marked task ${index} done: ${task.title} ✅`,
  );
};
