import { toFile } from "openai/uploads";

import { getOpenAI } from "@/server/openai";

import { fetchVoiceFile } from "./client";

export const transcribeVoiceNote = async (fileId: string) => {
  const buffer = await fetchVoiceFile(fileId);
  const file = await toFile(buffer, "voice.ogg");
  const client = getOpenAI();
  const transcription = await client.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
    response_format: "text",
  });
  return transcription.trim();
};
