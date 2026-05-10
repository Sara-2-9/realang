import { createAudioPlayer } from "expo-audio";
import { File } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import {
  TTS_LANGUAGE_CODES,
  VOICE_IDS,
  getLanguageNameFromCode,
} from "../constants/languages";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export interface TranscriptionResult {
  text: string;
  language_code?: string;
  detected_language?: string;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    speaker_id?: string;
  }>;
  utterances?: Array<{
    text: string;
    start: number;
    end: number;
    speaker_id?: string;
  }>;
}

export async function transcribeAudio(
  audioUri: string,
  apiKey: string
): Promise<TranscriptionResult | null> {
  try {
    // Use new File API to check existence
    const file = new File(audioUri);
    if (!file.exists) {
      console.error("Audio file does not exist:", audioUri);
      return null;
    }

    console.log("=== Transcribing audio ===");
    console.log("Audio URI:", audioUri);
    console.log("File size:", file.size);

    // Determine file extension from URI
    const extension = audioUri.split(".").pop()?.toLowerCase() || "wav";
    const mimeType = extension === "m4a" ? "audio/m4a" : 
                     extension === "wav" ? "audio/wav" : 
                     extension === "mp3" ? "audio/mpeg" : "audio/wav";

    console.log("File extension:", extension);
    console.log("MIME type:", mimeType);

    // Create FormData for React Native
    const formData = new FormData();
    
    // Append file with proper format for React Native
    formData.append("file", {
      uri: audioUri,
      type: mimeType,
      name: `recording.${extension}`,
    } as any);
    
    formData.append("model_id", "scribe_v1");
    formData.append("diarize", "true");
    formData.append("tag_audio_events", "false");

    console.log("Sending request to ElevenLabs Speech-to-Text API...");

    const response = await fetch(`${ELEVENLABS_API_URL}/speech-to-text`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Accept": "application/json",
      },
      body: formData,
    });

    console.log("Response status:", response.status);
    console.log("Response status text:", response.statusText);

    const responseText = await response.text();
    console.log("Response body:", responseText.substring(0, 500));

    if (!response.ok) {
      console.error("Transcription API error:", response.status, responseText);
      throw new Error(`API Error ${response.status}: ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response JSON:", e);
      return null;
    }

    console.log("Parsed transcription data:", JSON.stringify(data).substring(0, 500));

    return {
      text: data.text || "",
      language_code: data.language_code,
      detected_language: getLanguageNameFromCode(data.language_code),
      words: data.words,
      utterances: data.utterances,
    };
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

export async function textToSpeech(
  text: string,
  language: string,
  apiKey: string
): Promise<string> {
  try {
    const voiceId = VOICE_IDS[language] || VOICE_IDS.default;
    const langCode = TTS_LANGUAGE_CODES[language] || "en";

    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          language_code: langCode,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("TTS error:", errorText);
      throw new Error(`TTS failed: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = arrayBufferToBase64(arrayBuffer);

    const fileUri = FileSystem.cacheDirectory + `tts_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const player = createAudioPlayer({ uri: fileUri });
    player.play();

    return fileUri;
  } catch (error) {
    console.error("TTS error:", error);
    throw error;
  }
}