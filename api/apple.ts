import { apple } from "@react-native-ai/apple";
import {
  generateText,
  experimental_transcribe,
  experimental_generateSpeech,
  embed,
} from "ai";
import { createAudioPlayer } from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function transcribeAudio(
  audioBase64: string,
  languageCode: string
): Promise<string> {
  const model = apple.transcriptionModel({ language: languageCode });
  await model.prepare?.();

  const result = await experimental_transcribe({
    model,
    audio: audioBase64,
  });

  return result.text || "";
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  const prompt = `Translate the following text exactly from ${sourceLanguage} to ${targetLanguage}. Output ONLY the translation, with no explanations, no quotes, and no extra text:\n\n${text}`;

  const result = await generateText({
    model: apple.languageModel(),
    prompt,
  });

  return result.text.trim();
}

export async function synthesizeSpeech(
  text: string,
  language?: string
): Promise<void> {
  const result = await experimental_generateSpeech({
    model: apple.speechModel(),
    text,
    language,
  });

  if (!result.audio) {
    throw new Error("No audio generated");
  }

  const base64 = uint8ArrayToBase64(result.audio.uint8Array);
  const fileUri = FileSystem.cacheDirectory + `speech_${Date.now()}.wav`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const player = createAudioPlayer({ uri: fileUri });
  player.play();
}

export async function embedText(text: string): Promise<number[]> {
  const result = await embed({
    model: apple.textEmbeddingModel(),
    value: text,
  });
  return result.embedding;
}
