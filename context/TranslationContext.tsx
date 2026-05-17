import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  USER_LANGUAGE: "realang_user_language",
  TARGET_LANGUAGE: "realang_target_language",
  ENABLE_SPEECH_OUTPUT: "realang_enable_speech_output",
};

interface TranslationContextType {
  userLanguage: string;
  setUserLanguage: (language: string) => void;
  targetLanguage: string;
  setTargetLanguage: (language: string) => void;
  enableSpeechOutput: boolean;
  setEnableSpeechOutput: (enabled: boolean) => void;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [userLanguage, setUserLanguageState] = useState("English");
  const [targetLanguage, setTargetLanguageState] = useState("English");
  const [enableSpeechOutput, setEnableSpeechOutputState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedLanguage, storedTargetLanguage, storedSpeech] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER_LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.TARGET_LANGUAGE),
          AsyncStorage.getItem(STORAGE_KEYS.ENABLE_SPEECH_OUTPUT),
        ]);

      if (storedLanguage) {
        setUserLanguageState(storedLanguage);
      }
      if (storedTargetLanguage) {
        setTargetLanguageState(storedTargetLanguage);
      }
      if (storedSpeech === "true") {
        setEnableSpeechOutputState(true);
      }
    } catch (error) {
      console.error("Error loading stored data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUserLanguage = async (language: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_LANGUAGE, language);
      setUserLanguageState(language);
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  const setTargetLanguage = async (language: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TARGET_LANGUAGE, language);
      setTargetLanguageState(language);
    } catch (error) {
      console.error("Error saving target language:", error);
    }
  };

  const setEnableSpeechOutput = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ENABLE_SPEECH_OUTPUT,
        String(enabled)
      );
      setEnableSpeechOutputState(enabled);
    } catch (error) {
      console.error("Error saving speech output setting:", error);
    }
  };

  const value = useMemo(
    () => ({
      userLanguage,
      setUserLanguage,
      targetLanguage,
      setTargetLanguage,
      enableSpeechOutput,
      setEnableSpeechOutput,
      isLoading,
    }),
    [userLanguage, targetLanguage, enableSpeechOutput, isLoading]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error(
      "useTranslation must be used within a TranslationProvider"
    );
  }
  return context;
}
