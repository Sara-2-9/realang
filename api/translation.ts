// HuggingFace Helsinki-NLP/opus-mt Translation API
// Free tier: ~1000 requests/day via Inference API
// Docs: https://huggingface.co/docs/api-inference/index

const HF_API_BASE_URL = "https://api-inference.huggingface.co/models/Helsinki-NLP";
const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN;

// Wait time for model cold start (ms)
const MODEL_LOADING_RETRY_DELAY = 10000;

// Helsinki-NLP model mapping for supported language pairs
// Format: "Source-Target": "opus-mt-src-tgt"
// Note: Helsinki uses 2-letter ISO codes
const HELSINKI_MODEL_MAP: Record<string, string> = {
  // English pairs
  "English-Italian": "opus-mt-en-it",
  "English-Spanish": "opus-mt-en-es",
  "English-French": "opus-mt-en-fr",
  "English-German": "opus-mt-en-de",
  "English-Portuguese": "opus-mt-en-pt",
  "English-Russian": "opus-mt-en-ru",
  "English-Chinese": "opus-mt-en-zh",
  "English-Japanese": "opus-mt-en-jap",
  "English-Arabic": "opus-mt-en-ar",
  "English-Dutch": "opus-mt-en-nl",
  "English-Polish": "opus-mt-en-pl",
  "English-Turkish": "opus-mt-en-tr",
  "English-Swedish": "opus-mt-en-sv",
  "English-Norwegian": "opus-mt-en-no",
  "English-Danish": "opus-mt-en-da",
  "English-Finnish": "opus-mt-en-fi",
  "English-Greek": "opus-mt-en-el",
  "English-Czech": "opus-mt-en-cs",
  "English-Romanian": "opus-mt-en-ro",
  "English-Hungarian": "opus-mt-en-hu",
  "English-Ukrainian": "opus-mt-en-uk",
  "English-Vietnamese": "opus-mt-en-vi",
  "English-Thai": "opus-mt-en-th",
  "English-Indonesian": "opus-mt-en-id",
  "English-Korean": "opus-mt-en-ko",
  "English-Hindi": "opus-mt-en-hi",
  
  // Italian pairs
  "Italian-English": "opus-mt-it-en",
  "Italian-Spanish": "opus-mt-it-es",
  "Italian-French": "opus-mt-it-fr",
  "Italian-German": "opus-mt-it-de",
  
  // Spanish pairs
  "Spanish-English": "opus-mt-es-en",
  "Spanish-Italian": "opus-mt-es-it",
  "Spanish-French": "opus-mt-es-fr",
  "Spanish-German": "opus-mt-es-de",
  "Spanish-Portuguese": "opus-mt-es-pt",
  
  // French pairs
  "French-English": "opus-mt-fr-en",
  "French-Italian": "opus-mt-fr-it",
  "French-Spanish": "opus-mt-fr-es",
  "French-German": "opus-mt-fr-de",
  
  // German pairs
  "German-English": "opus-mt-de-en",
  "German-Italian": "opus-mt-de-it",
  "German-Spanish": "opus-mt-de-es",
  "German-French": "opus-mt-de-fr",
  
  // Portuguese pairs
  "Portuguese-English": "opus-mt-pt-en",
  "Portuguese-Spanish": "opus-mt-pt-es",
  
  // Russian pairs
  "Russian-English": "opus-mt-ru-en",
  
  // Chinese pairs
  "Chinese-English": "opus-mt-zh-en",
  
  // Japanese pairs
  "Japanese-English": "opus-mt-jap-en",
  
  // Dutch pairs
  "Dutch-English": "opus-mt-nl-en",
  "Dutch-German": "opus-mt-nl-de",
  
  // Polish pairs
  "Polish-English": "opus-mt-pl-en",
  
  // Turkish pairs
  "Turkish-English": "opus-mt-tr-en",
  
  // Arabic pairs
  "Arabic-English": "opus-mt-ar-en",
  
  // Other common pairs
  "Swedish-English": "opus-mt-sv-en",
  "Norwegian-English": "opus-mt-no-en",
  "Danish-English": "opus-mt-da-en",
  "Finnish-English": "opus-mt-fi-en",
  "Greek-English": "opus-mt-el-en",
  "Czech-English": "opus-mt-cs-en",
  "Romanian-English": "opus-mt-ro-en",
  "Hungarian-English": "opus-mt-hu-en",
  "Ukrainian-English": "opus-mt-uk-en",
  "Vietnamese-English": "opus-mt-vi-en",
  "Thai-English": "opus-mt-th-en",
  "Indonesian-English": "opus-mt-id-en",
  "Korean-English": "opus-mt-ko-en",
  "Hindi-English": "opus-mt-hi-en",
};

// 2-letter language codes for Helsinki models
const LANGUAGE_CODE_MAP: Record<string, string> = {
  "English": "en",
  "Italian": "it",
  "Spanish": "es",
  "French": "fr",
  "German": "de",
  "Portuguese": "pt",
  "Russian": "ru",
  "Chinese": "zh",
  "Japanese": "jap",
  "Arabic": "ar",
  "Dutch": "nl",
  "Polish": "pl",
  "Turkish": "tr",
  "Swedish": "sv",
  "Norwegian": "no",
  "Danish": "da",
  "Finnish": "fi",
  "Greek": "el",
  "Czech": "cs",
  "Romanian": "ro",
  "Hungarian": "hu",
  "Ukrainian": "uk",
  "Vietnamese": "vi",
  "Thai": "th",
  "Indonesian": "id",
  "Korean": "ko",
  "Hindi": "hi",
  "Malay": "ms",
  "Filipino": "tl",
};

export interface TranslationRequest {
  inputs: string;
}

export interface TranslationResponse {
  translation_text: string;
}

/**
 * Get the Helsinki model name for a language pair
 * @param sourceLanguage Source language name (e.g., "Italian")
 * @param targetLanguage Target language name (e.g., "English")
 * @returns Model name or null if not supported
 */
function getModelForLanguagePair(sourceLanguage: string, targetLanguage: string): string | null {
  const pairKey = `${sourceLanguage}-${targetLanguage}`;
  return HELSINKI_MODEL_MAP[pairKey] || null;
}

/**
 * Translate text using HuggingFace Helsinki-NLP/opus-mt Inference API (FREE)
 * Falls back to English as intermediate language if direct translation is not available
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
  
  console.log("=== Helsinki-NLP Translation ===");
  console.log("Text:", fullText.substring(0, 100) + (fullText.length > 100 ? "..." : ""));
  console.log("From:", sourceLanguage, "To:", targetLanguage);

  if (sourceLanguage === targetLanguage) {
    console.log("Same language, returning original");
    return fullText;
  }

  if (!fullText) {
    return "";
  }

  const modelName = getModelForLanguagePair(sourceLanguage, targetLanguage);
  
  // Direct translation available
  if (modelName) {
    return await translateWithModel(fullText, modelName);
  }
  
  // Fallback: Use English as bridge language
  console.log(`No direct model for ${sourceLanguage} → ${targetLanguage}, trying via English...`);
  
  // Check if we can translate source → English → target
  const sourceToEnModel = getModelForLanguagePair(sourceLanguage, "English");
  const enToTargetModel = getModelForLanguagePair("English", targetLanguage);
  
  if (!sourceToEnModel) {
    throw new Error(`Translation not supported: no model from ${sourceLanguage} to English`);
  }
  
  if (!enToTargetModel) {
    throw new Error(`Translation not supported: no model from English to ${targetLanguage}`);
  }
  
  console.log("Using English bridge translation...");
  
  // Step 1: Source → English
  const englishText = await translateWithModel(fullText, sourceToEnModel);
  console.log("Intermediate (EN):", englishText.substring(0, 100));
  
  // Step 2: English → Target
  const finalText = await translateWithModel(englishText, enToTargetModel);
  console.log("Final translation:", finalText);
  
  return finalText;
}

/**
 * Internal function to translate with a specific model
 * @param text Text to translate
 * @param modelName Helsinki model name (e.g., "opus-mt-en-it")
 * @returns Translated text
 */
async function translateWithModel(text: string, modelName: string): Promise<string> {
  const apiUrl = `${HF_API_BASE_URL}/${modelName}`;
  console.log("Using model:", modelName);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (HF_TOKEN) {
    headers["Authorization"] = `Bearer ${HF_TOKEN}`;
  }
  
  console.log("Sending request to HuggingFace...");
  
  let response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ inputs: text }),
  });
  
  // Handle model loading state (503)
  if (response.status === 503) {
    console.log("Model is loading, waiting...");
    await new Promise(resolve => setTimeout(resolve, MODEL_LOADING_RETRY_DELAY));
    
    response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ inputs: text }),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Helsinki API error:", response.status, errorText);
    throw new Error(`Helsinki API error: ${response.status}`);
  }

  const data = await response.json();
  console.log("Response:", JSON.stringify(data).substring(0, 200));

  // Helsinki returns array: [{translation_text: "..."}]
  let translatedText = "";
  
  if (Array.isArray(data) && data.length > 0) {
    translatedText = data[0].translation_text || "";
  } else if (data.translation_text) {
    // Alternative response format
    translatedText = data.translation_text;
  }

  if (!translatedText) {
    throw new Error("Empty translation response");
  }

  return translatedText.trim();
}

/**
 * Check if Helsinki model is available for a language pair
 * @param sourceLanguage Source language name
 * @param targetLanguage Target language name
 * @returns boolean indicating if translation is supported
 */
export function isLanguagePairSupported(sourceLanguage: string, targetLanguage: string): boolean {
  return getModelForLanguagePair(sourceLanguage, targetLanguage) !== null;
}

/**
 * Check if Helsinki model is available/loaded
 * @param sourceLanguage Source language to check
 * @param targetLanguage Target language to check
 * @returns boolean indicating if model is ready
 */
export async function checkNLLBStatus(sourceLanguage = "English", targetLanguage = "Italian"): Promise<boolean> {
  try {
    const modelName = getModelForLanguagePair(sourceLanguage, targetLanguage);
    if (!modelName) return false;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (HF_TOKEN) {
      headers["Authorization"] = `Bearer ${HF_TOKEN}`;
    }
    
    const response = await fetch(`${HF_API_BASE_URL}/${modelName}`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        inputs: "Hello",
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Helsinki status check failed:", error);
    return false;
  }
}

/**
 * Get supported language pairs for Helsinki-NLP
 * @returns Array of supported "Source → Target" strings
 */
export function getSupportedLanguagePairs(): string[] {
  return Object.keys(HELSINKI_MODEL_MAP).map(key => {
    const [src, tgt] = key.split("-");
    return `${src} → ${tgt}`;
  });
}

/**
 * Get supported languages (unique list)
 * @returns Array of supported language names
 */
export function getSupportedLanguages(): string[] {
  const languages = new Set<string>();
  Object.keys(HELSINKI_MODEL_MAP).forEach(key => {
    const [src, tgt] = key.split("-");
    languages.add(src);
    languages.add(tgt);
  });
  return Array.from(languages).sort();
}

/**
 * Validate if a language is supported by Helsinki
 * @param language Language name
 * @returns boolean
 */
export function isLanguageSupported(language: string): boolean {
  return language in LANGUAGE_CODE_MAP;
}
