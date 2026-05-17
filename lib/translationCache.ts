import AsyncStorage from "@react-native-async-storage/async-storage";

interface CacheEntry {
  embedding: number[];
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

const CACHE_KEY = "realang_translation_cache";
const MAX_ENTRIES = 200;
const DEFAULT_THRESHOLD = 0.95;

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function getCachedTranslation(
  embedding: number[],
  targetLanguage: string,
  threshold = DEFAULT_THRESHOLD
): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entries: CacheEntry[] = JSON.parse(raw);
    for (const entry of entries) {
      if (entry.targetLanguage === targetLanguage) {
        const sim = cosineSimilarity(embedding, entry.embedding);
        if (sim >= threshold) {
          return entry.translatedText;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveTranslation(
  originalText: string,
  translatedText: string,
  embedding: number[],
  sourceLanguage: string,
  targetLanguage: string
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const entries: CacheEntry[] = raw ? JSON.parse(raw) : [];
    entries.push({
      embedding,
      originalText,
      translatedText,
      sourceLanguage,
      targetLanguage,
    });
    if (entries.length > MAX_ENTRIES) {
      entries.splice(0, entries.length - MAX_ENTRIES);
    }
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Cache save error:", error);
  }
}

export async function clearTranslationCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error("Cache clear error:", error);
  }
}
