import { useState, useRef, useCallback, useEffect } from "react";
import { Alert, AppState } from "react-native";
import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
  AudioModule,
} from "expo-audio";
import { File } from "expo-file-system";
import {
  transcribeAudio,
  translateText,
  synthesizeSpeech,
  embedText,
} from "../api/apple";
import {
  getCachedTranslation,
  saveTranslation,
} from "../lib/translationCache";
import { APPLE_LANGUAGE_CODE_MAP } from "../constants/languages";

export interface Speaker {
  id: string;
  name: string;
  language: string;
  color: string;
  isSpeaking: boolean;
  lastActive: Date;
}

export interface Message {
  id: string;
  participantId: string;
  participantName: string;
  originalText: string;
  translatedText: string;
  originalLanguage: string;
  timestamp: Date;
  speakerColor: string;
  isTranslating?: boolean;
}

const SPEAKER_COLORS = [
  "#9BB068",
  "#D4A574",
  "#7BA3A8",
  "#C4789F",
  "#8B7355",
  "#6B8E6B",
  "#B5738B",
  "#6B9B9B",
];

const RECORDING_DURATION_MS = 6000;

export function useAudioRecorderLoop(
  userLanguage: string,
  targetLanguage: string,
  enableSpeechOutput: boolean
) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recordingCount, setRecordingCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState("");
  const [apiCallLog, setApiCallLog] = useState<string[]>([]);
  const [lastError, setLastError] = useState("");
  const [translationError, setTranslationError] = useState("");

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const speakerMapRef = useRef<Map<string, Speaker>>(new Map());
  const isListeningRef = useRef(false);
  const isRecordingRef = useRef(false);
  const processingRef = useRef(false);
  const isMountedRef = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchProfileId = useRef(0);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (isRecordingRef.current) {
        audioRecorder.stop().catch(() => {});
      }
    };
  }, [audioRecorder]);

  // Stop listening when app goes to background
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState !== "active" && isListeningRef.current) {
        stopListening();
      }
    });
    return () => subscription.remove();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await AudioModule.requestRecordingPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please grant microphone access to use voice detection."
        );
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const getOrCreateSpeaker = useCallback(
    (speakerId: string, detectedLanguage: string): Speaker => {
      const existingSpeaker = speakerMapRef.current.get(speakerId);
      if (existingSpeaker) {
        if (detectedLanguage && detectedLanguage !== "Unknown") {
          existingSpeaker.language = detectedLanguage;
        }
        return existingSpeaker;
      }

      const speakerIndex = speakerMapRef.current.size;
      const newSpeaker: Speaker = {
        id: speakerId,
        name: `Speaker ${speakerIndex + 1}`,
        language: detectedLanguage || "Unknown",
        color: SPEAKER_COLORS[speakerIndex % SPEAKER_COLORS.length],
        isSpeaking: false,
        lastActive: new Date(),
      };

      speakerMapRef.current.set(speakerId, newSpeaker);
      return newSpeaker;
    },
    []
  );

  const logApiCall = useCallback(
    (api: string, endpoint: string, status: string) => {
      if (!isMountedRef.current) return;
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = `[${timestamp}] ${api}: ${endpoint} - ${status}`;
      setApiCallLog((prev) => [...prev.slice(-9), logEntry]);
    },
    []
  );

  const translateMessage = useCallback(
    async (messageId: string, originalText: string) => {
      const currentId = ++fetchProfileId.current;
      try {
        if (!isMountedRef.current) return;
        setTranslationError("");

        // 1. Embed the original text
        const embedding = await embedText(originalText);

        if (currentId !== fetchProfileId.current) return;

        // 2. Check embedding cache
        let translatedText = await getCachedTranslation(embedding, userLanguage);

        // 3. Cache miss → LLM translation
        if (!translatedText) {
          translatedText = await translateText(
            originalText,
            targetLanguage,
            userLanguage
          );
          if (translatedText && isMountedRef.current) {
            await saveTranslation(
              originalText,
              translatedText,
              embedding,
              targetLanguage,
              userLanguage
            );
          }
        }

        if (currentId !== fetchProfileId.current) return;

        if (translatedText && isMountedRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, translatedText, isTranslating: false }
                : msg
            )
          );
          logApiCall("Apple LLM", "/translate", "Success");

          if (enableSpeechOutput) {
            const langCode = APPLE_LANGUAGE_CODE_MAP[userLanguage];
            synthesizeSpeech(translatedText, langCode).catch(() => {});
          }
        } else {
          throw new Error("Translation returned null");
        }
      } catch (error) {
        if (currentId !== fetchProfileId.current) return;
        const errorMsg =
          error instanceof Error ? error.message : String(error);
        if (isMountedRef.current) {
          setTranslationError(`Translation failed: ${errorMsg}`);
          logApiCall(
            "Apple LLM",
            "/translate",
            `Error: ${errorMsg.substring(0, 50)}`
          );
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? {
                    ...msg,
                    translatedText: `[Translation failed: ${errorMsg}] ${msg.originalText}`,
                    isTranslating: false,
                  }
                : msg
            )
          );
        }
      }
    },
    [userLanguage, targetLanguage, enableSpeechOutput, logApiCall]
  );

  const processTranscriptionResult = useCallback(
    async (text: string) => {
      if (!text || text.trim() === "") return;

      const sourceLanguage = targetLanguage;
      const needsTranslation = sourceLanguage !== userLanguage;

      if (isMountedRef.current) {
        setDebugInfo(
          `Source: ${sourceLanguage}\nText: ${text.substring(0, 100)}...`
        );
      }

      const speaker = getOrCreateSpeaker("speaker_0", sourceLanguage);
      speaker.isSpeaking = true;
      speaker.lastActive = new Date();
      if (isMountedRef.current) {
        setSpeakers(Array.from(speakerMapRef.current.values()));
      }

      const messageId = Date.now().toString() + Math.random();
      const newMessage: Message = {
        id: messageId,
        participantId: speaker.id,
        participantName: speaker.name,
        originalText: text,
        translatedText: needsTranslation
          ? `Translating to ${userLanguage}...`
          : text,
        originalLanguage: sourceLanguage,
        timestamp: new Date(),
        speakerColor: speaker.color,
        isTranslating: needsTranslation,
      };

      if (isMountedRef.current) {
        setMessages((prev) => [...prev, newMessage]);
      }

      if (needsTranslation) {
        logApiCall("Apple LLM", "/translate", "Calling...");
        translateMessage(messageId, text);
      }

      timeoutRef.current = setTimeout(() => {
        speaker.isSpeaking = false;
        if (isMountedRef.current) {
          setSpeakers(Array.from(speakerMapRef.current.values()));
        }
      }, 1500);
    },
    [
      getOrCreateSpeaker,
      logApiCall,
      targetLanguage,
      userLanguage,
      translateMessage,
    ]
  );

  const recordAndTranscribe = useCallback(async () => {
    if (!isListeningRef.current || processingRef.current) return;
    processingRef.current = true;

    try {
      if (isMountedRef.current) setDebugInfo("Starting recording...");

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      isRecordingRef.current = true;
      if (isMountedRef.current) {
        setIsRecording(true);
        setRecordingCount((prev) => prev + 1);
      }

      await new Promise((resolve) => {
        timeoutRef.current = setTimeout(resolve, RECORDING_DURATION_MS);
      });

      if (!isListeningRef.current || !isMountedRef.current) {
        try {
          await audioRecorder.stop();
        } catch {}
        isRecordingRef.current = false;
        if (isMountedRef.current) setIsRecording(false);
        processingRef.current = false;
        return;
      }

      if (isMountedRef.current) {
        setDebugInfo("Processing audio...");
        setIsProcessing(true);
      }

      await audioRecorder.stop();
      isRecordingRef.current = false;
      if (isMountedRef.current) setIsRecording(false);

      const uri = audioRecorder.uri;
      if (!uri) {
        if (isMountedRef.current) setLastError("No recording URI");
        setIsProcessing(false);
        processingRef.current = false;
        if (isListeningRef.current && isMountedRef.current) {
          timeoutRef.current = setTimeout(() => recordAndTranscribe(), 500);
        }
        return;
      }

      const file = new File(uri);
      if (!file.exists) {
        if (isMountedRef.current) setLastError("File not found");
        setIsProcessing(false);
        processingRef.current = false;
        if (isListeningRef.current && isMountedRef.current) {
          timeoutRef.current = setTimeout(() => recordAndTranscribe(), 500);
        }
        return;
      }

      const fileSize = file.size || 0;
      if (isMountedRef.current) {
        setDebugInfo(`Transcribing (${Math.round(fileSize / 1024)}KB)...`);
      }

      if (fileSize < 5000) {
        if (isMountedRef.current)
          setDebugInfo("No audio detected, listening...");
        try {
          file.delete();
        } catch {}
        setIsProcessing(false);
        processingRef.current = false;
        if (isListeningRef.current && isMountedRef.current) {
          timeoutRef.current = setTimeout(() => recordAndTranscribe(), 300);
        }
        return;
      }

      const audioBase64 = await file.base64();
      const langCode = APPLE_LANGUAGE_CODE_MAP[targetLanguage];
      logApiCall("Apple STT", "/transcribe", "Calling...");
      const transcribedText = await transcribeAudio(audioBase64, langCode);
      logApiCall(
        "Apple STT",
        "/transcribe",
        transcribedText ? "Success" : "No speech"
      );

      try {
        file.delete();
      } catch {}

      if (transcribedText && transcribedText.trim()) {
        if (isMountedRef.current) setLastError("");
        await processTranscriptionResult(transcribedText);
      } else {
        if (isMountedRef.current)
          setDebugInfo("No speech detected, listening...");
      }

      setIsProcessing(false);
      processingRef.current = false;

      if (isListeningRef.current && isMountedRef.current) {
        timeoutRef.current = setTimeout(() => recordAndTranscribe(), 300);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isMountedRef.current) {
        setLastError(message);
        setDebugInfo(`Error: ${message}`);
      }
      setIsProcessing(false);
      processingRef.current = false;

      if (isRecordingRef.current) {
        try {
          await audioRecorder.stop();
        } catch {}
      }
      isRecordingRef.current = false;
      if (isMountedRef.current) setIsRecording(false);

      if (isListeningRef.current && isMountedRef.current) {
        timeoutRef.current = setTimeout(() => recordAndTranscribe(), 1000);
      }
    }
  }, [
    audioRecorder,
    targetLanguage,
    processTranscriptionResult,
    logApiCall,
  ]);

  const startListening = useCallback(async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (isMountedRef.current) {
      setDebugInfo("Initializing...");
      setLastError("");
      setIsListening(true);
      setIsProcessing(false);
      setSpeakers([]);
      setMessages([]);
      setRecordingCount(0);
    }
    isListeningRef.current = true;
    processingRef.current = false;
    speakerMapRef.current.clear();
    fetchProfileId.current = 0;

    recordAndTranscribe();
  }, [recordAndTranscribe]);

  const stopListening = useCallback(async () => {
    isListeningRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isMountedRef.current) {
      setDebugInfo("Stopped");
      setIsListening(false);
      setIsProcessing(false);
      setSpeakers((prev) => prev.map((s) => ({ ...s, isSpeaking: false })));
    }

    if (isRecordingRef.current) {
      try {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        if (uri) {
          try {
            const file = new File(uri);
            if (file.exists) file.delete();
          } catch {}
        }
      } catch {}
      isRecordingRef.current = false;
      if (isMountedRef.current) setIsRecording(false);
    }

    processingRef.current = false;
  }, [audioRecorder]);

  return {
    isListening,
    isRecording,
    isProcessing,
    speakers,
    messages,
    recordingCount,
    debugInfo,
    apiCallLog,
    lastError,
    translationError,
    startListening,
    stopListening,
  };
}
