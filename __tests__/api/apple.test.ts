jest.mock("@react-native-ai/apple", () => ({
  apple: {
    transcriptionModel: jest.fn(() => ({ prepare: jest.fn() })),
    languageModel: jest.fn(() => ({})),
    speechModel: jest.fn(() => ({})),
    textEmbeddingModel: jest.fn(() => ({})),
  },
}));

jest.mock("ai", () => ({
  generateText: jest.fn(),
  experimental_transcribe: jest.fn(),
  experimental_generateSpeech: jest.fn(),
  embed: jest.fn(),
}));

jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "/cache/",
  EncodingType: { Base64: "base64" },
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
}));

import { apple } from "@react-native-ai/apple";
import {
  generateText,
  experimental_transcribe,
  experimental_generateSpeech,
  embed,
} from "ai";
import * as FileSystem from "expo-file-system/legacy";
import { createAudioPlayer } from "expo-audio";
import {
  transcribeAudio,
  translateText,
  synthesizeSpeech,
  embedText,
} from "../../api/apple";

describe("api/apple", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("transcribeAudio", () => {
    it("returns transcribed text", async () => {
      (experimental_transcribe as jest.Mock).mockResolvedValue({
        text: "Hello world",
      });

      const result = await transcribeAudio("base64audio", "en");
      expect(result).toBe("Hello world");
      expect(apple.transcriptionModel).toHaveBeenCalledWith({ language: "en" });
      expect(experimental_transcribe).toHaveBeenCalledWith({
        model: expect.any(Object),
        audio: "base64audio",
      });
    });

    it("returns empty string when no text", async () => {
      (experimental_transcribe as jest.Mock).mockResolvedValue({ text: "" });
      const result = await transcribeAudio("base64audio", "en");
      expect(result).toBe("");
    });
  });

  describe("translateText", () => {
    it("returns translated text", async () => {
      (generateText as jest.Mock).mockResolvedValue({ text: " Ciao mondo " });

      const result = await translateText("Hello world", "English", "Italian");
      expect(result).toBe("Ciao mondo");
      expect(generateText).toHaveBeenCalledWith({
        model: expect.any(Object),
        prompt: expect.stringContaining("English") && expect.stringContaining("Italian"),
      });
    });
  });

  describe("synthesizeSpeech", () => {
    it("writes audio file and plays it", async () => {
      const audio = { uint8Array: new Uint8Array([1, 2, 3]), base64: "AQID", format: "wav" };
      (experimental_generateSpeech as jest.Mock).mockResolvedValue({ audio });

      await synthesizeSpeech("Hello", "en");
      expect(experimental_generateSpeech).toHaveBeenCalledWith({
        model: expect.any(Object),
        text: "Hello",
        language: "en",
      });
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      expect(createAudioPlayer).toHaveBeenCalled();
    });

    it("throws when no audio returned", async () => {
      (experimental_generateSpeech as jest.Mock).mockResolvedValue({ audio: undefined });
      await expect(synthesizeSpeech("Hello")).rejects.toThrow("No audio generated");
    });
  });

  describe("embedText", () => {
    it("returns embedding vector", async () => {
      (embed as jest.Mock).mockResolvedValue({ embedding: [0.1, 0.2, 0.3] });
      const result = await embedText("Hello");
      expect(result).toEqual([0.1, 0.2, 0.3]);
      expect(embed).toHaveBeenCalledWith({
        model: expect.any(Object),
        value: "Hello",
      });
    });
  });
});
