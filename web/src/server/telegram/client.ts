const getToken = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  return token;
};

const apiBase = () => `https://api.telegram.org/bot${getToken()}`;

export type SendMessageOptions = {
  parseMode?: "MarkdownV2" | "HTML";
  replyToMessageId?: number;
  disableNotification?: boolean;
};

export const sendTelegramMessage = async (
  chatId: string | number,
  text: string,
  options: SendMessageOptions = {},
) => {
  const body = {
    chat_id: chatId,
    text,
    parse_mode: options.parseMode,
    reply_to_message_id: options.replyToMessageId,
    disable_notification: options.disableNotification,
  };
  const resp = await fetch(`${apiBase()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const error = await resp.text();
    console.error("Telegram sendMessage failed", error);
  }
};

export const fetchVoiceFile = async (fileId: string) => {
  const resp = await fetch(`${apiBase()}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });
  if (!resp.ok) {
    throw new Error(`Failed to get file: ${await resp.text()}`);
  }
  const data = (await resp.json()) as {
    ok: boolean;
    result?: { file_path?: string };
  };
  if (!data.ok || !data.result?.file_path) {
    throw new Error("Telegram did not return file_path");
  }
  const fileResp = await fetch(
    `https://api.telegram.org/file/bot${getToken()}/${data.result.file_path}`,
  );
  if (!fileResp.ok) {
    throw new Error(`Failed to download voice file: ${await fileResp.text()}`);
  }
  const arrayBuffer = await fileResp.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
