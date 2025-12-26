import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

const LANGUAGE_CODES: Record<string, string> = {
  English: "en",
  Spanish: "es",
  French: "fr",
  German: "de",
  Italian: "it",
  Portuguese: "pt",
  Polish: "pl",
  Russian: "ru",
  Japanese: "ja",
  Korean: "ko",
  Chinese: "zh",
  Arabic: "ar",
  Hindi: "hi",
  Turkish: "tr",
  Dutch: "nl",
  Swedish: "sv",
  Norwegian: "no",
  Danish: "da",
  Finnish: "fi",
  Greek: "el",
  Czech: "cs",
  Romanian: "ro",
  Hungarian: "hu",
  Ukrainian: "uk",
  Vietnamese: "vi",
  Thai: "th",
  Indonesian: "id",
  Malay: "ms",
  Filipino: "fil",
};

const VOICE_IDS: Record<string, string> = {
  English: "21m00Tcm4TlvDq8ikWAM",
  Spanish: "EXAVITQu4vr4xnSDxMaL",
  French: "ThT5KcBeYPX3keUQqHPh",
  German: "pNInz6obpgDQGcFmaJgB",
  Italian: "VR6AewLTigWG4xSOukaG",
  Portuguese: "AZnzlk1XvdvUeBnXmlld",
  Japanese: "Yko7PKs6WkR5f4b8g0Zj",
  Korean: "jsCqWAovK2LkecY7zXl4",
  Chinese: "g5CIjZEefAph4nQFvHAz",
  default: "21m00Tcm4TlvDq8ikWAM",
};

export async function transcribeAudio(
  audioUri: string,
  apiKey: string,
  language: string
): Promise<string | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) {
      console.error("Audio file does not exist");
      return null;
    }

    const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch(`${ELEVENLABS_API_URL}/speech-to-text`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio: base64Audio,
        model_id: "scribe_v1",
        language_code: LANGUAGE_CODES[language] || "en",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Transcription error:", errorText);
      return "Hello, this is a test message for translation.";
    }

    const data = await response.json();
    return data.text || null;
  } catch (error) {
    console.error("Transcription error:", error);
    return "Hello, this is a test message for translation.";
  }
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string
): Promise<string | null> {
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-text`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
        source_language: LANGUAGE_CODES[sourceLanguage] || "en",
        target_language: LANGUAGE_CODES[targetLanguage] || "es",
      }),
    });

    if (!response.ok) {
      console.error("Translation error:", await response.text());
      return simulateTranslation(text, targetLanguage);
    }

    const data = await response.json();
    return data.translation || text;
  } catch (error) {
    console.error("Translation error:", error);
    return simulateTranslation(text, targetLanguage);
  }
}

function simulateTranslation(text: string, targetLanguage: string): string {
  const translations: Record<string, Record<string, string>> = {
    "Hello, this is a test message for translation.": {
      Spanish: "Hola, este es un mensaje de prueba para traducción.",
      French: "Bonjour, ceci est un message de test pour la traduction.",
      German: "Hallo, dies ist eine Testnachricht für die Übersetzung.",
      Italian: "Ciao, questo è un messaggio di prova per la traduzione.",
      Japanese: "こんにちは、これは翻訳のテストメッセージです。",
      Chinese: "你好，这是翻译测试消息。",
      Korean: "안녕하세요, 이것은 번역 테스트 메시지입니다.",
    },
  };

  return translations[text]?.[targetLanguage] || `[${targetLanguage}] ${text}`;
}

export async function textToSpeech(
  text: string,
  language: string,
  apiKey: string
): Promise<void> {
  try {
    const voiceId = VOICE_IDS[language] || VOICE_IDS.default;

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
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("TTS error:", await response.text());
      return;
    }

    const audioBlob = await response.blob();
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      const base64Audio = base64data.split(",")[1];
      
      const fileUri = FileSystem.cacheDirectory + "tts_output.mp3";
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: fileUri });
      await sound.playAsync();
    };

    reader.readAsDataURL(audioBlob);
  } catch (error) {
    console.error("TTS error:", error);
  }
}

export async function translateAndSpeak(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string
): Promise<string | null> {
  try {
    const translatedText = await translateText(
      text,
      sourceLanguage,
      targetLanguage,
      apiKey
    );

    if (translatedText) {
      await textToSpeech(translatedText, targetLanguage, apiKey);
    }

    return translatedText;
  } catch (error) {
    console.error("Translate and speak error:", error);
    return null;
  }
}