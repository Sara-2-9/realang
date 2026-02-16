// HuggingFace NLLB-200 Translation API
// Free tier: ~1000 requests/day via Inference API

const HF_API_URL = "https://api-inference.huggingface.co/models/facebook/nllb-200-distilled-600M";

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
    // Prepare the request body for NLLB
    // NLLB requires special formatting with language tokens
    const inputs = `${srcLangCode} ${fullText}`;
    
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: inputs,
        parameters: {
          src_lang: srcLangCode,
          tgt_lang: tgtLangCode,
        },
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NLLB API error:", response.status, errorText);
      
      // If model is loading, retry after a delay
      if (response.status === 503 || errorText.includes("currently loading")) {
        console.log("Model is loading, waiting 10s and retrying...");
        await new Promise(resolve => setTimeout(resolve, 10000));
        return translateTextWithNLLB(text, sourceLanguage, targetLanguage);
      }
      
      throw new Error(`NLLB API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log("Response data:", JSON.stringify(data).substring(0, 200));

    // Handle different response formats from HuggingFace
    let translatedText = "";
    
    if (Array.isArray(data) && data.length > 0) {
      // Format: [{"translation_text": "..."}]
      if (data[0].translation_text) {
        translatedText = data[0].translation_text;
      } else if (data[0].generated_text) {
        translatedText = data[0].generated_text;
      }
    } else if (typeof data === "object" && data.translation_text) {
      translatedText = data.translation_text;
    } else if (typeof data === "object" && data.generated_text) {
      translatedText = data.generated_text;
    } else if (typeof data === "string") {
      translatedText = data;
    }

    if (!translatedText) {
      console.error("Unexpected response format:", data);
      throw new Error("Invalid response format from NLLB API");
    }

    // Clean up the output (remove language code prefix if present)
    translatedText = translatedText.replace(new RegExp(`^${tgtLangCode}\\s*`), "").trim();

    console.log("=== Translation complete ===");
    console.log("Translated:", translatedText.substring(0, 100) + (translatedText.length > 100 ? "..." : ""));
    
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
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
