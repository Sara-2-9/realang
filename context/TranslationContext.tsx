import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  USER_LANGUAGE: "realang_user_language",
  API_KEY: "realang_api_key",
};

interface TranslationContextType {
  userLanguage: string;
  setUserLanguage: (language: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined
);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [userLanguage, setUserLanguageState] = useState("English");
  const [apiKey, setApiKeyState] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedLanguage, storedApiKey] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_LANGUAGE),
        AsyncStorage.getItem(STORAGE_KEYS.API_KEY),
      ]);

      if (storedLanguage) {
        setUserLanguageState(storedLanguage);
      }
      if (storedApiKey) {
        setApiKeyState(storedApiKey);
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

  const setApiKey = async (key: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_KEY, key);
      setApiKeyState(key);
    } catch (error) {
      console.error("Error saving API key:", error);
    }
  };

  return (
    <TranslationContext.Provider
      value={{
        userLanguage,
        setUserLanguage,
        apiKey,
        setApiKey,
        isLoading,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
}