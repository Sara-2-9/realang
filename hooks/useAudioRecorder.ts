import { useState, useRef, useCallback, useEffect } from "react";
import { Alert, AppState } from "react-native";
import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
  AudioModule,
} from "expo-audio";
import { File } from "expo-file-system";
import { transcribeAudio, TranscriptionResult } from "../api/elevenlabs";
import { translateTextWithNLLB } from "../api/translation";

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

export function useAudioRecorderLoop(apiKey: string, targetLanguage: string) {
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

  const logApiCall = useCallback((api: string, endpoint: string, status: string) => {
    if (!isMountedRef.current) return;
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${api}: ${endpoint} - ${status}`;
    setApiCallLog((prev) => [...prev.slice(-9), logEntry]);
  }, []);

  const translateMessage = useCallback(
    async (messageId: string, originalText: string, sourceLanguage: string) => {
      const currentId = ++fetchProfileId.current;
      try {
        const textToTranslate = originalText.trim();
        if (!isMountedRef.current) return;
        setTranslationError("");

        const translatedText = await translateTextWithNLLB(
          textToTranslate,
          sourceLanguage,
          targetLanguage
        );

        if (currentId !== fetchProfileId.current) return;

        if (translatedText && isMountedRef.current) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, translatedText, isTranslating: false }
                : msg
            )
          );
          logApiCall("NLLB-200", "/translate", "Success");
        } else {
          throw new Error("Translation returned null");
        }
      } catch (error) {
        if (currentId !== fetchProfileId.current) return;
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (isMountedRef.current) {
          setTranslationError(`Translation failed: ${errorMsg}`);
          logApiCall("NLLB-200", "/translate", `Error: ${errorMsg.substring(0, 50)}`);
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
    [targetLanguage, logApiCall]
  );

  const processTranscriptionResult = useCallback(
    async (result: TranscriptionResult) => {
      if (!result.text || result.text.trim() === "") return;

      const detectedLanguage = result.detected_language || "Unknown";
      const fullTranscribedText = result.text.trim();
      const needsTranslation = detectedLanguage !== targetLanguage;

      if (isMountedRef.current) {
        setDebugInfo(
          `Detected: ${detectedLanguage}\nFull text: ${fullTranscribedText.substring(0, 100)}...`
        );
      }

      const processUtterance = async (text: string, speakerId: string) => {
        const speaker = getOrCreateSpeaker(speakerId, detectedLanguage);
        speaker.isSpeaking = true;
        speaker.lastActive = new Date();
        if (isMountedRef.current) {
          setSpeakers(Array.from(speakerMapRef.current.values()));
        }

        const messageId = Date.now().toString() + speakerId + Math.random();
        const newMessage: Message = {
          id: messageId,
          participantId: speaker.id,
          participantName: speaker.name,
          originalText: text,
          translatedText: needsTranslation
            ? `Translating to ${targetLanguage}...`
            : text,
          originalLanguage: detectedLanguage,
          timestamp: new Date(),
          speakerColor: speaker.color,
          isTranslating: needsTranslation,
        };

        if (isMountedRef.current) {
          setMessages((prev) => [...prev, newMessage]);
        }

        if (needsTranslation) {
          logApiCall("NLLB-200", "/translate", "Calling...");
          translateMessage(messageId, text, detectedLanguage);
        }

        timeoutRef.current = setTimeout(() => {
          speaker.isSpeaking = false;
          if (isMountedRef.current) {
            setSpeakers(Array.from(speakerMapRef.current.values()));
          }
        }, 1500);
      };

      if (result.utterances && result.utterances.length > 0) {
        for (const utterance of result.utterances) {
          const utteranceText = utterance.text?.trim();
          if (!utteranceText) continue;
          await processUtterance(utteranceText, utterance.speaker_id || "speaker_0");
        }
      } else {
        await processUtterance(fullTranscribedText, "speaker_0");
      }
    },
    [getOrCreateSpeaker, logApiCall, targetLanguage, translateMessage]
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
        setDebugInfo(`Sending to API (${Math.round(fileSize / 1024)}KB)...`);
      }

      if (fileSize < 5000) {
        if (isMountedRef.current) setDebugInfo("No audio detected, listening...");
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

      logApiCall("ElevenLabs", "/v1/speech-to-text", "Calling...");
      const result = await transcribeAudio(uri, apiKey);
      logApiCall(
        "ElevenLabs",
        "/v1/speech-to-text",
        result?.text ? "Success" : "No speech"
      );

      try {
        file.delete();
      } catch {}

      if (result && result.text && result.text.trim()) {
        if (isMountedRef.current) setLastError("");
        await processTranscriptionResult(result);
      } else {
        if (isMountedRef.current) setDebugInfo("No speech detected, listening...");
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
  }, [apiKey, audioRecorder, processTranscriptionResult, logApiCall]);

  const startListening = useCallback(async () => {
    if (!apiKey) {
      Alert.alert(
        "API Key Required",
        "Please set your ElevenLabs API key in Settings to enable real voice recognition.",
        [{ text: "OK" }]
      );
      return;
    }

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
  }, [apiKey, recordAndTranscribe]);

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
