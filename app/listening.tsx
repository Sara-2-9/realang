import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../context/TranslationContext";
import { 
  useAudioRecorder, 
  RecordingPresets, 
  setAudioModeAsync, 
  AudioModule,
  useAudioRecorderState,
} from "expo-audio";
import { File, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import SpeakerBubble from "../components/SpeakerBubble";
import TranscriptBubble from "../components/TranscriptBubble";
import { transcribeAudio, TranscriptionResult } from "../api/elevenlabs";
import { translateTextWithNLLB } from "../api/translation";

interface Speaker {
  id: string;
  name: string;
  language: string;
  color: string;
  isSpeaking: boolean;
  lastActive: Date;
}

interface Message {
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

const { width } = Dimensions.get("window");

const RECORDING_DURATION_MS = 6000; // Record 6 seconds at a time for better transcription

export default function ListeningScreen() {
  const router = useRouter();
  const { userLanguage, targetLanguage, apiKey } = useTranslation();

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [recordingCount, setRecordingCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [apiCallLog, setApiCallLog] = useState<string[]>([]);
  const [lastError, setLastError] = useState<string>("");
  const [translationError, setTranslationError] = useState<string>("");
  const flatListRef = useRef<FlatList>(null);
  const speakerMapRef = useRef<Map<string, Speaker>>(new Map());
  const isListeningRef = useRef(false);
  const isRecordingRef = useRef(false);
  const processingRef = useRef(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      pulseAnim.setValue(1);
      waveAnim1.setValue(0);
      waveAnim2.setValue(0);
      waveAnim3.setValue(0);
    }
  }, [isListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    const createWave = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createWave(waveAnim1, 0).start();
    createWave(waveAnim2, 600).start();
    createWave(waveAnim3, 1200).start();
  };

  const requestPermissions = async () => {
    try {
      const { status } = await AudioModule.requestRecordingPermissionsAsync();
      console.log("Audio permission status:", status);
      if (status !== "granted") {
        Alert.alert("Permission required", "Please grant microphone access to use voice detection.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Permission error:", error);
      return false;
    }
  };

  const getOrCreateSpeaker = (speakerId: string, detectedLanguage: string): Speaker => {
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
  };

  const translateMessage = async (messageId: string, originalText: string, sourceLanguage: string) => {
    try {
      // Ensure we're translating the FULL original text
      const textToTranslate = originalText.trim();
      
      console.log("=== translateMessage called ===");
      console.log("Message ID:", messageId);
      console.log("Full text to translate:", textToTranslate);
      console.log("Text length:", textToTranslate.length);
      console.log("From:", sourceLanguage, "To:", targetLanguage);
      
      setTranslationError("");
      
      // Translate the FULL text to target language using NLLB-200 (FREE)
      const translatedText = await translateTextWithNLLB(textToTranslate, sourceLanguage, targetLanguage);
      
      console.log("Translation result:", translatedText);
      console.log("Translation result length:", translatedText?.length);
      
      if (translatedText) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, translatedText, isTranslating: false }
              : msg
          )
        );
        console.log("Translation complete for message:", messageId);
        console.log("Final translated text stored:", translatedText);
        logApiCall("NLLB-200", "/translate", "Success");
      } else {
        throw new Error("Translation returned null");
      }
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error("Translation error for message:", messageId, errorMsg);
      setTranslationError(`Translation failed: ${errorMsg}`);
      logApiCall("NLLB-200", "/translate", `Error: ${errorMsg.substring(0, 50)}`);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, translatedText: `[Translation failed: ${errorMsg}] ${msg.originalText}`, isTranslating: false }
            : msg
        )
      );
    }
  };

  const logApiCall = (api: string, endpoint: string, status: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${api}: ${endpoint} - ${status}`;
    setApiCallLog((prev) => [...prev.slice(-9), logEntry]);
  };

  const processTranscriptionResult = async (result: TranscriptionResult) => {
    console.log("Processing transcription result:", JSON.stringify(result));
    
    if (!result.text || result.text.trim() === "") {
      console.log("Empty transcription text, skipping");
      return;
    }

    const detectedLanguage = result.detected_language || "Unknown";
    
    // Use the FULL text from the transcription result
    const fullTranscribedText = result.text.trim();
    
    setDebugInfo(`Detected: ${detectedLanguage}\nFull text: ${fullTranscribedText.substring(0, 100)}...`);
    console.log("Full transcribed text:", fullTranscribedText);
    
    // Translate to target language, unless already in target language
    const needsTranslation = detectedLanguage !== targetLanguage;
    
    // Process utterances if available (speaker diarization)
    if (result.utterances && result.utterances.length > 0) {
      console.log("Processing utterances:", result.utterances.length);
      
      for (const utterance of result.utterances) {
        // Use the full utterance text, trimmed
        const utteranceText = utterance.text?.trim();
        if (!utteranceText) continue;
        
        console.log("Processing utterance text:", utteranceText);
        
        const speakerId = utterance.speaker_id || "speaker_0";
        const speaker = getOrCreateSpeaker(speakerId, detectedLanguage);
        
        speaker.isSpeaking = true;
        speaker.lastActive = new Date();
        
        setSpeakers(Array.from(speakerMapRef.current.values()));
        
        const messageId = Date.now().toString() + speakerId + Math.random();
        
        // Create message with placeholder for translation - use FULL utterance text
        const newMessage: Message = {
          id: messageId,
          participantId: speaker.id,
          participantName: speaker.name,
          originalText: utteranceText,
          translatedText: needsTranslation ? `Translating to ${targetLanguage}...` : utteranceText,
          originalLanguage: detectedLanguage,
          timestamp: new Date(),
          speakerColor: speaker.color,
          isTranslating: needsTranslation,
        };

        setMessages((prev) => [...prev, newMessage]);

        // Translate the FULL utterance text
        if (needsTranslation) {
          logApiCall("NLLB-200", "/translate", "Calling...");
          console.log("Sending full text for translation:", utteranceText);
          translateMessage(messageId, utteranceText, detectedLanguage);
        }

        setTimeout(() => {
          speaker.isSpeaking = false;
          setSpeakers(Array.from(speakerMapRef.current.values()));
        }, 1500);
      }
    } else {
      // No utterances - use the full transcribed text as a single message
      console.log("No utterances, using full text as single speaker:", fullTranscribedText);
      
      const speakerId = "speaker_0";
      const speaker = getOrCreateSpeaker(speakerId, detectedLanguage);
      
      speaker.isSpeaking = true;
      speaker.lastActive = new Date();
      
      setSpeakers(Array.from(speakerMapRef.current.values()));
      
      const messageId = Date.now().toString() + Math.random();
      
      // Use the FULL transcribed text
      const newMessage: Message = {
        id: messageId,
        participantId: speaker.id,
        participantName: speaker.name,
        originalText: fullTranscribedText,
        translatedText: needsTranslation ? `Translating to ${targetLanguage}...` : fullTranscribedText,
        originalLanguage: detectedLanguage,
        timestamp: new Date(),
        speakerColor: speaker.color,
        isTranslating: needsTranslation,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Translate the FULL text
      if (needsTranslation) {
        console.log("Sending full text for translation:", fullTranscribedText);
        translateMessage(messageId, fullTranscribedText, detectedLanguage);
      }

      setTimeout(() => {
        speaker.isSpeaking = false;
        setSpeakers(Array.from(speakerMapRef.current.values()));
      }, 1500);
    }
  };

  const recordAndTranscribe = async () => {
    if (!isListeningRef.current || processingRef.current) {
      return;
    }

    processingRef.current = true;

    try {
      console.log("=== Starting new recording segment ===");
      setDebugInfo("Starting recording...");

      // Configure audio session for recording
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Prepare and start recording
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      isRecordingRef.current = true;
      setIsRecording(true);
      setRecordingCount((prev) => prev + 1);
      
      console.log("Recording started successfully");
      setDebugInfo("Recording... Speak now!");

      // Wait for recording duration
      await new Promise(resolve => setTimeout(resolve, RECORDING_DURATION_MS));

      // Check if still listening
      if (!isListeningRef.current) {
        console.log("Stopped listening, aborting");
        try {
          await audioRecorder.stop();
        } catch (e) {}
        isRecordingRef.current = false;
        setIsRecording(false);
        processingRef.current = false;
        return;
      }

      console.log("Stopping recording...");
      setDebugInfo("Processing audio...");
      setIsProcessing(true);

      // Stop recording and get URI
      await audioRecorder.stop();
      isRecordingRef.current = false;
      setIsRecording(false);
      const uri = audioRecorder.uri;
      
      console.log("Recording URI:", uri);

      if (!uri) {
        console.error("No recording URI");
        setLastError("No recording URI");
        setIsProcessing(false);
        processingRef.current = false;
        if (isListeningRef.current) {
          setTimeout(() => recordAndTranscribe(), 500);
        }
        return;
      }

      // Check file info using new File API
      const file = new File(uri);
      console.log("File exists:", file.exists);
      
      if (!file.exists) {
        console.error("Recording file does not exist");
        setLastError("File not found");
        setIsProcessing(false);
        processingRef.current = false;
        if (isListeningRef.current) {
          setTimeout(() => recordAndTranscribe(), 500);
        }
        return;
      }

      const fileSize = file.size || 0;
      console.log("File size:", fileSize);
      setDebugInfo(`Sending to API (${Math.round(fileSize/1024)}KB)...`);

      // Minimum file size check (very small files likely have no audio)
      if (fileSize < 5000) {
        console.log("File too small, likely no audio");
        setDebugInfo("No audio detected, listening...");
        try {
          file.delete();
        } catch (e) {}
        setIsProcessing(false);
        processingRef.current = false;
        if (isListeningRef.current) {
          setTimeout(() => recordAndTranscribe(), 300);
        }
        return;
      }

      // Transcribe the audio
      logApiCall("ElevenLabs", "/v1/speech-to-text", "Calling...");
      const result = await transcribeAudio(uri, apiKey);
      logApiCall("ElevenLabs", "/v1/speech-to-text", result?.text ? "Success" : "No speech");
      
      console.log("Transcription result:", JSON.stringify(result));

      // Clean up the audio file
      try {
        file.delete();
      } catch (e) {
        console.log("Failed to delete file:", e);
      }

      if (result && result.text && result.text.trim()) {
        setLastError("");
        await processTranscriptionResult(result);
      } else {
        console.log("No speech detected or empty result");
        setDebugInfo("No speech detected, listening...");
      }

      setIsProcessing(false);
      processingRef.current = false;

      // Continue recording if still listening
      if (isListeningRef.current) {
        setTimeout(() => recordAndTranscribe(), 300);
      }
    } catch (err: any) {
      console.error("Recording/transcription error:", err);
      setLastError(err?.message || String(err));
      setDebugInfo(`Error: ${err?.message || err}`);
      setIsProcessing(false);
      processingRef.current = false;

      // Try to clean up
      if (isRecordingRef.current) {
        try {
          await audioRecorder.stop();
        } catch (e) {}
      }
      isRecordingRef.current = false;
      setIsRecording(false);

      // Retry if still listening
      if (isListeningRef.current) {
        setTimeout(() => recordAndTranscribe(), 1000);
      }
    }
  };

  const startListening = async () => {
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

    console.log("Starting listening...");
    setDebugInfo("Initializing...");
    setLastError("");
    
    setIsListening(true);
    isListeningRef.current = true;
    processingRef.current = false;
    speakerMapRef.current.clear();
    setSpeakers([]);
    setMessages([]);
    setRecordingCount(0);

    // Start recording loop
    recordAndTranscribe();
  };

  const stopListening = async () => {
    console.log("Stopping listening...");
    setDebugInfo("Stopped");
    
    setIsListening(false);
    isListeningRef.current = false;

    if (isRecordingRef.current) {
      try {
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        if (uri) {
          try {
            const file = new File(uri);
            if (file.exists) {
              file.delete();
            }
          } catch (e) {}
        }
      } catch (err) {
        console.error("Failed to stop recording:", err);
      }
      isRecordingRef.current = false;
      setIsRecording(false);
    }

    setSpeakers((prev) => prev.map((s) => ({ ...s, isSpeaking: false })));
    setIsProcessing(false);
    processingRef.current = false;
  };

  const handleBack = () => {
    if (isListening) {
      stopListening();
    }
    router.back();
  };

  const renderMessage = ({ item }: any) => (
    <TranscriptBubble
      message={item}
      isOwnMessage={false}
      speakerColor={item.speakerColor}
      targetLanguage={targetLanguage}
    />
  );

  const renderWave = (anim: Animated.Value, size: number) => {
    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, size / 80],
    });
    const opacity = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 0],
    });

    return (
      <Animated.View
        style={[
          styles.wave,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#5C4D3C" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Live Translation</Text>
          <Text style={styles.headerSubtitle}>
            {isListening 
              ? isProcessing 
                ? "Processing..." 
                : `Recording #${recordingCount} - ${speakers.length} speaker${speakers.length !== 1 ? "s" : ""}` 
              : "Tap to start"}
          </Text>
        </View>
        <View style={styles.languageBadge}>
          <Text style={styles.languageBadgeText}>→ {targetLanguage.substring(0, 3).toUpperCase()}</Text>
        </View>
      </View>

      {/* Debug info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText} numberOfLines={2}>{debugInfo}</Text>
        {lastError ? <Text style={styles.errorText}>STT Error: {lastError}</Text> : null}
        {translationError ? <Text style={styles.translationErrorText}>Translation Error: {translationError}</Text> : null}
        {apiCallLog.length > 0 && (
          <View style={styles.apiLogContainer}>
            <Text style={styles.apiLogTitle}>API Calls:</Text>
            {apiCallLog.slice(-5).map((log, index) => (
              <Text key={index} style={styles.apiLogEntry}>{log}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Speakers visualization */}
      <View style={styles.speakersContainer}>
        {speakers.length > 0 ? (
          <View style={styles.speakersGrid}>
            {speakers.map((speaker) => (
              <SpeakerBubble key={speaker.id} speaker={speaker} />
            ))}
          </View>
        ) : (
          <View style={styles.noSpeakersContainer}>
            <Text style={styles.noSpeakersText}>
              {isListening ? "Listening for speakers..." : "No speakers detected"}
            </Text>
          </View>
        )}
      </View>

      {/* Transcript */}
      <View style={styles.transcriptContainer}>
        <View style={styles.transcriptHeader}>
          <Text style={styles.transcriptTitle}>Conversation</Text>
          <View style={styles.translationNote}>
            <Ionicons name="language" size={14} color="#9BB068" />
            <Text style={styles.translationNoteText}>Translated to {targetLanguage}</Text>
          </View>
        </View>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#B5A898" />
            <Text style={styles.emptyStateText}>
              {isListening
                ? "Listening... Speak to see transcription"
                : "Start listening to capture conversations"}
            </Text>
            {isListening && (
              <Text style={styles.emptyStateHint}>
                All speech will be translated to {targetLanguage}
              </Text>
            )}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        )}
      </View>

      {/* Main listening button */}
      <View style={styles.controlsContainer}>
        <View style={styles.listeningButtonContainer}>
          {isListening && (
            <>
              {renderWave(waveAnim1, 200)}
              {renderWave(waveAnim2, 260)}
              {renderWave(waveAnim3, 320)}
            </>
          )}
          <Animated.View
            style={[
              styles.listeningButtonWrapper,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.listeningButton,
                isListening && styles.listeningButtonActive,
              ]}
              onPress={isListening ? stopListening : startListening}
            >
              <Ionicons
                name={isListening ? "ear" : "ear-outline"}
                size={48}
                color="#fff"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
        <Text style={styles.listeningHint}>
          {isListening ? "Tap to stop listening" : "Tap to start listening"}
        </Text>
      </View>
    </ SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD0",
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5C4D3C",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#A69783",
    marginTop: 2,
  },
  languageBadge: {
    backgroundColor: "#9BB068",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  languageBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  debugContainer: {
    backgroundColor: "#FFF3E0",
    padding: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: "#5C4D3C",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  errorText: {
    fontSize: 11,
    color: "#D32F2F",
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  translationErrorText: {
    fontSize: 11,
    color: "#FF6F00",
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontWeight: "bold",
  },
  apiLogContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E8DFD0",
  },
  apiLogTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#5C4D3C",
    marginBottom: 4,
  },
  apiLogEntry: {
    fontSize: 10,
    color: "#6B5D4D",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 2,
  },
  speakersContainer: {
    padding: 16,
    minHeight: 100,
    borderBottomWidth: 1,
    borderBottomColor: "#E8DFD0",
  },
  speakersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  noSpeakersContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noSpeakersText: {
    color: "#A69783",
    fontSize: 14,
  },
  transcriptContainer: {
    flex: 1,
    padding: 16,
  },
  transcriptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  transcriptTitle: {
    fontSize: 14,
    color: "#A69783",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  translationNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  translationNoteText: {
    fontSize: 11,
    color: "#9BB068",
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyStateText: {
    color: "#A69783",
    fontSize: 16,
    textAlign: "center",
  },
  emptyStateHint: {
    color: "#B5A898",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  messagesList: {
    gap: 12,
  },
  controlsContainer: {
    alignItems: "center",
    paddingVertical: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#E8DFD0",
  },
  listeningButtonContainer: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  wave: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#9BB068",
  },
  listeningButtonWrapper: {
    zIndex: 10,
  },
  listeningButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#B5A898",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  listeningButtonActive: {
    backgroundColor: "#9BB068",
  },
  listeningHint: {
    color: "#A69783",
    fontSize: 14,
    marginTop: 16,
  },
});