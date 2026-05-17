import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  cosineSimilarity,
  getCachedTranslation,
  saveTranslation,
  clearTranslationCache,
} from "../../lib/translationCache";

describe("lib/translationCache", () => {
  beforeEach(() => {
    (AsyncStorage as any).__resetStore?.();
    jest.clearAllMocks();
  });

  describe("cosineSimilarity", () => {
    it("returns 1 for identical vectors", () => {
      const v = [1, 2, 3];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1);
    });

    it("returns 0 for orthogonal vectors", () => {
      expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBe(0);
    });

    it("returns 0 for zero vectors", () => {
      expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
    });

    it("returns 0 for different lengths", () => {
      expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    });
  });

  describe("getCachedTranslation", () => {
    it("returns null when cache is empty", async () => {
      const result = await getCachedTranslation([0.1, 0.2], "English");
      expect(result).toBeNull();
    });

    it("returns cached text when similarity is above threshold", async () => {
      const embedding = [1, 0, 0];
      await saveTranslation(
        "Hello",
        "Ciao",
        embedding,
        "English",
        "Italian"
      );
      const result = await getCachedTranslation(embedding, "Italian", 0.95);
      expect(result).toBe("Ciao");
    });

    it("returns null when target language does not match", async () => {
      const embedding = [1, 0, 0];
      await saveTranslation(
        "Hello",
        "Ciao",
        embedding,
        "English",
        "Italian"
      );
      const result = await getCachedTranslation(embedding, "Spanish", 0.95);
      expect(result).toBeNull();
    });

    it("returns null when similarity is below threshold", async () => {
      const embedding = [1, 0, 0];
      await saveTranslation(
        "Hello",
        "Ciao",
        embedding,
        "English",
        "Italian"
      );
      const result = await getCachedTranslation([0, 1, 0], "Italian", 0.95);
      expect(result).toBeNull();
    });
  });

  describe("saveTranslation", () => {
    it("stores a new entry", async () => {
      await saveTranslation("Hi", "Ciao", [1, 0], "English", "Italian");
      const result = await getCachedTranslation([1, 0], "Italian", 0.95);
      expect(result).toBe("Ciao");
    });

    it("trims cache to MAX_ENTRIES", async () => {
      for (let i = 0; i < 205; i++) {
        await saveTranslation(`t${i}`, `x${i}`, [i], "A", "B");
      }
      const raw = await AsyncStorage.getItem("realang_translation_cache");
      const entries = JSON.parse(raw || "[]");
      expect(entries.length).toBe(200);
    });
  });

  describe("clearTranslationCache", () => {
    it("removes all cached entries", async () => {
      await saveTranslation("Hi", "Ciao", [1, 0], "English", "Italian");
      await clearTranslationCache();
      const result = await getCachedTranslation([1, 0], "Italian", 0.95);
      expect(result).toBeNull();
    });
  });
});
