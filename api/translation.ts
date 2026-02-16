// HuggingFace NLLB-200 Translation API
// Free tier: ~1000 requests/day via Inference API
// Docs: https://huggingface.co/docs/api-inference/index

const HF_API_URL = "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M";
const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN;

// Wait time for model cold start (ms)
const MODEL_LOADING_RETRY_DELAY = 10000;

// Language code mapping from app languages to NLLB-200 codes (FLORES-200 format)
const NLLB_LANGUAGE_CODES: Record<string, string> = {
  English: "eng_Latn",
  Spanish: "spa_Latn",
  French: "fra_Latn",
  German: "deu_Latn",
  Italian: "ita_Latn",
  Portuguese: "por_Latn",
  Polish: "pol_Latn",
  Russian: "rus_Cyrl",
  Japanese: "jpn_Jpan",
  Korean: "kor_Hang",
  Chinese: "zho_Hans",
  Arabic: "ara_Arab",
  Hindi: "hin_Deva",
  Turkish: "tur_Latn",
  Dutch: "nld_Latn",
  Swedish: "swe_Latn",
  Norwegian: "nor_Latn",
  Danish: "dan_Latn",
  Finnish: "fin_Latn",
  Greek: "ell_Grek",
  Czech: "ces_Latn",
  Romanian: "ron_Latn",
  Hungarian: "hun_Latn",
  Ukrainian: "ukr_Cyrl",
  Vietnamese: "vie_Latn",
  Thai: "tha_Thai",
  Indonesian: "ind_Latn",
  Malay: "msa_Latn",
  Filipino: "fil_Latn",
};

export interface TranslationRequest {
  inputs: string;
  parameters?: {
    src_lang?: string;
    tgt_lang?: string;
  };
}

export interface TranslationResponse {
  translation_text: string;
}

/**
 * Translate text using HuggingFace NLLB-200 Inference API (FREE)
 * @param text Text to translate
 * @param sourceLanguage Source language name (e.g., "Italian")
 * @param targetLanguage Target language name (e.g., "English")
 * @returns Translated text
 */
export async function translateTextWithNLLB(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  const fullText = text.trim();
  
  console.log("=== NLLB-200 Translation ===");
  console.log("Text:", fullText.substring(0, 100) + (fullText.length > 100 ? "..." : ""));
  console.log("From:", sourceLanguage, "To:", targetLanguage);

  if (sourceLanguage === targetLanguage) {
    console.log("Same language, returning original");
    return fullText;
  }

  if (!fullText) {
    return "";
  }

  const srcLangCode = NLLB_LANGUAGE_CODES[sourceLanguage] || "eng_Latn";
  const tgtLangCode = NLLB_LANGUAGE_CODES[targetLanguage] || "eng_Latn";

  console.log("Source code:", srcLangCode, "Target code:", tgtLangCode);

  try {
    // NLLB format: prepend source language token to input
    // Example: "ita_Latn Ciao, come va?"
    const inputs = `${srcLangCode} ${fullText}`;
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (HF_TOKEN) {
      headers["Authorization"] = `Bearer ${HF_TOKEN}`;
    }
    
    console.log("Sending request to HuggingFace...");
    
    let response = await fetch(HF_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ inputs }),
    });
    
    // Handle model loading state (503)
    if (response.status === 503) {
      console.log("Model is loading, waiting...");
      await new Promise(resolve => setTimeout(resolve, MODEL_LOADING_RETRY_DELAY));
      
      response = await fetch(HF_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ inputs }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NLLB API error:", response.status, errorText);
      throw new Error(`NLLB API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response:", JSON.stringify(data).substring(0, 200));

    // HuggingFace returns array: [{translation_text: "..."}]
    let translatedText = "";
    
    if (Array.isArray(data) && data.length > 0) {
      translatedText = data[0].translation_text || data[0].generated_text || "";
    }

    if (!translatedText) {
      throw new Error("Empty translation response");
    }

    // Remove target language token if present
    translatedText = translatedText.replace(new RegExp(`^${tgtLangCode}\\s*`), "").trim();

    console.log("Translated:", translatedText);
    return translatedText;
  } catch (error: any) {
    console.error("NLLB translation error:", error);
    throw error;
  }
}

/**
 * Check if NLLB model is available/loaded
 * @returns boolean indicating if model is ready
 */
export async function checkNLLBStatus(): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (HF_TOKEN) {
      headers["Authorization"] = `Bearer ${HF_TOKEN}`;
    }
    
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        inputs: "eng_Latn Hello",
        parameters: {
          src_lang: "eng_Latn",
          tgt_lang: "fra_Latn",
        },
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("NLLB status check failed:", error);
    return false;
  }
}

/**
 * Get supported language pairs for NLLB
 * @returns Array of supported language names
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(NLLB_LANGUAGE_CODES);
}

/**
 * Validate if a language is supported by NLLB
 * @param language Language name
 * @returns boolean
 */
export function isLanguageSupported(language: string): boolean {
  return language in NLLB_LANGUAGE_CODES;
}
