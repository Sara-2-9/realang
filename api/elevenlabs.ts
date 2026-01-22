import { Audio } from "expo-av";
import { File, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

const LANGUAGE_CODES: Record<string, string> = {
  English: "eng",
  Spanish: "spa",
  French: "fra",
  German: "deu",
  Italian: "ita",
  Portuguese: "por",
  Polish: "pol",
  Russian: "rus",
  Japanese: "jpn",
  Korean: "kor",
  Chinese: "zho",
  Arabic: "ara",
  Hindi: "hin",
  Turkish: "tur",
  Dutch: "nld",
  Swedish: "swe",
  Norwegian: "nor",
  Danish: "dan",
  Finnish: "fin",
  Greek: "ell",
  Czech: "ces",
  Romanian: "ron",
  Hungarian: "hun",
  Ukrainian: "ukr",
  Vietnamese: "vie",
  Thai: "tha",
  Indonesian: "ind",
  Malay: "msa",
  Filipino: "fil",
};

const TTS_LANGUAGE_CODES: Record<string, string> = {
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
      detected_language: getLanguageFromCode(data.language_code),
      words: data.words,
      utterances: data.utterances,
    };
  } catch (error: any) {
    console.error("Transcription error:", error);
    throw error;
  }
}

function getLanguageFromCode(code: string | undefined): string {
  if (!code) return "Unknown";
  
  const languageMap: Record<string, string> = {
    eng: "English",
    spa: "Spanish",
    fra: "French",
    deu: "German",
    ita: "Italian",
    por: "Portuguese",
    pol: "Polish",
    rus: "Russian",
    jpn: "Japanese",
    kor: "Korean",
    zho: "Chinese",
    cmn: "Chinese",
    ara: "Arabic",
    hin: "Hindi",
    tur: "Turkish",
    nld: "Dutch",
    swe: "Swedish",
    nor: "Norwegian",
    dan: "Danish",
    fin: "Finnish",
    ell: "Greek",
    ces: "Czech",
    ron: "Romanian",
    hun: "Hungarian",
    ukr: "Ukrainian",
    vie: "Vietnamese",
    tha: "Thai",
    ind: "Indonesian",
    msa: "Malay",
    fil: "Filipino",
  };

  return languageMap[code] || code;
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  apiKey: string
): Promise<string | null> {
  const fullText = text.trim();
  
  console.log("=== translateText API function ===");
  console.log("FULL text received:", fullText);
  console.log("Text length:", fullText.length);
  console.log("Source language:", sourceLanguage);
  console.log("Target language:", targetLanguage);
  
  if (sourceLanguage === targetLanguage) {
    console.log("Same language, returning original");
    return fullText;
  }

  if (!apiKey) {
    console.error("No API key provided for translation");
    throw new Error("API key is required for translation");
  }

  const sourceLangCode = TTS_LANGUAGE_CODES[sourceLanguage] || "en";
  const targetLangCode = TTS_LANGUAGE_CODES[targetLanguage] || "en";
  
  console.log("Source lang code:", sourceLangCode);
  console.log("Target lang code:", targetLangCode);
  
  try {
    console.log("Attempting translation via TTS + Dubbing pipeline...");
    
    // Generate speech in source language
    const voiceId = VOICE_IDS[sourceLanguage] || VOICE_IDS.default;
    
    const ttsResponse = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: fullText,
          model_id: "eleven_multilingual_v2",
          language_code: sourceLangCode,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("TTS API error:", ttsResponse.status, errorText);
      throw new Error(`TTS failed: ${ttsResponse.status} - ${errorText.substring(0, 100)}`);
    }

    console.log("TTS successful, creating dubbing project...");

    // Get audio as blob
    const audioBlob = await ttsResponse.blob();
    console.log("Audio blob size:", audioBlob.size);

    // Create FormData for dubbing - must specify target_lang (singular, not array)
    const formData = new FormData();
    formData.append("file", audioBlob, "audio_to_translate.mp3");
    formData.append("source_lang", sourceLangCode);
    formData.append("target_lang", targetLangCode);
    formData.append("mode", "automatic");
    formData.append("num_speakers", "1");
    formData.append("watermark", "false");

    console.log("Dubbing request - source_lang:", sourceLangCode, "target_lang:", targetLangCode);

    // Create dubbing project
    const dubbingResponse = await fetch(`${ELEVENLABS_API_URL}/dubbing`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
      },
      body: formData,
    });

    if (!dubbingResponse.ok) {
      const errorText = await dubbingResponse.text();
      console.error("Dubbing API error:", dubbingResponse.status, errorText);
      
      // Parse error for better debugging
      let errorDetail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail) {
          if (typeof errorJson.detail === "object") {
            errorDetail = `${errorJson.detail.status}: ${errorJson.detail.message}`;
          } else {
            errorDetail = errorJson.detail;
          }
        }
      } catch (e) {
        // Keep original error text
      }
      
      // Handle specific 400 errors
      if (dubbingResponse.status === 400) {
        console.error("Dubbing 400 error details:", {
          source_lang: sourceLangCode,
          target_lang: targetLangCode,
          error: errorDetail
        });
        throw new Error(`Dubbing validation error: ${errorDetail}`);
      }
      
      throw new Error(`Dubbing failed: ${dubbingResponse.status} - ${errorDetail}`);
    }

    const dubbingData = await dubbingResponse.json();
    const dubbingId = dubbingData.dubbing_id;
    
    console.log("Dubbing ID:", dubbingId);
    console.log("Expected duration:", dubbingData.expected_duration_sec);

    // Poll for dubbing completion
    let attempts = 0;
    const maxAttempts = 60;
    let dubbingStatus = "dubbing";
    let lastStatusData: any = null;
    
    while ((dubbingStatus === "dubbing" || dubbingStatus === "transcribing") && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(
        `${ELEVENLABS_API_URL}/dubbing/${dubbingId}`,
        {
          headers: {
            "xi-api-key": apiKey,
          },
        }
      );

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        attempts++;
        continue;
      }

      lastStatusData = await statusResponse.json();
      dubbingStatus = lastStatusData.status;
      console.log("Dubbing status:", dubbingStatus, "attempt:", attempts + 1);
      
      if (lastStatusData.error) {
        console.error("Dubbing error from API:", lastStatusData.error);
        throw new Error(`Dubbing error: ${lastStatusData.error}`);
      }
      
      attempts++;
    }

    if (dubbingStatus !== "dubbed") {
      console.error("Dubbing did not complete. Final status:", dubbingStatus, "Last data:", JSON.stringify(lastStatusData));
      throw new Error(`Dubbing timeout. Status: ${dubbingStatus}`);
    }

    // Get the transcript for the target language
    console.log("Getting dubbed transcript for language:", targetLangCode);
    
    const transcriptResponse = await fetch(
      `${ELEVENLABS_API_URL}/dubbing/${dubbingId}/transcript/${targetLangCode}`,
      {
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error("Transcript API error:", transcriptResponse.status, errorText);
      throw new Error(`Transcript fetch failed: ${transcriptResponse.status} - ${errorText.substring(0, 100)}`);
    }

    const transcriptData = await transcriptResponse.json();
    console.log("Transcript data:", JSON.stringify(transcriptData));

    // Extract translated text from transcript
    let translatedText = "";
    if (transcriptData.utterances && transcriptData.utterances.length > 0) {
      translatedText = transcriptData.utterances
        .map((u: any) => u.text || u.translated_text || "")
        .join(" ")
        .trim();
    } else if (transcriptData.text) {
      translatedText = transcriptData.text;
    } else if (typeof transcriptData === "string") {
      translatedText = transcriptData;
    }

    // Clean up - delete the dubbing project
    try {
      await fetch(`${ELEVENLABS_API_URL}/dubbing/${dubbingId}`, {
        method: "DELETE",
        headers: {
          "xi-api-key": apiKey,
        },
      });
      console.log("Deleted dubbing project:", dubbingId);
    } catch (deleteError) {
      console.log("Failed to delete dubbing project:", deleteError);
    }

    if (translatedText) {
      console.log("=== FINAL translated text ===");
      console.log("Final text:", translatedText);
      console.log("Final text length:", translatedText.length);
      return translatedText;
    }

    throw new Error("No translated text in response");
  } catch (error: any) {
    console.error("Translation pipeline error:", error);
    throw error;
  }
}



export async function textToSpeech(
  text: string,
  language: string,
  apiKey: string
): Promise<void> {
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

export { LANGUAGE_CODES, TTS_LANGUAGE_CODES };