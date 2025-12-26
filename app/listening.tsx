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
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import SpeakerBubble from "../components/SpeakerBubble";
import TranscriptBubble from "../components/TranscriptBubble";
import { transcribeAudio, TranscriptionResult } from "../api/elevenlabs";

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
  const { userLanguage, apiKey } = useTranslation();

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingCount, setRecordingCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [lastError, setLastError] = useState<string>("");
  const flatListRef = useRef<FlatList>(null);
  const speakerMapRef = useRef<Map<string, Speaker>>(new Map());
  const isListeningRef = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
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
      const { status } = await Audio.requestPermissionsAsync();
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

  const processTranscriptionResult = (result: TranscriptionResult) => {
    console.log("Processing transcription result:", JSON.stringify(result));
    
    if (!result.text || result.text.trim() === "") {
      console.log("Empty transcription text, skipping");
      return;
    }

    const detectedLanguage = result.detected_language || "Unknown";
    setDebugInfo(`Detected: ${detectedLanguage}\nText: ${result.text.substring(0, 50)}...`);
    
    // Process utterances if available (speaker diarization)
    if (result.utterances && result.utterances.length > 0) {
      console.log("Processing utterances:", result.utterances.length);
      result.utterances.forEach((utterance) => {
        if (!utterance.text || utterance.text.trim() === "") return;
        
        const speakerId = utterance.speaker_id || "speaker_0";
        const speaker = getOrCreateSpeaker(speakerId, detectedLanguage);
        
        speaker.isSpeaking = true;
        speaker.lastActive = new Date();
        
        setSpeakers(Array.from(speakerMapRef.current.values()));
        
        const translatedText = detectedLanguage === userLanguage 
          ? utterance.text 
          : `[${userLanguage}] ${utterance.text}`;
        
        const newMessage: Message = {
          id: Date.now().toString() + speakerId + Math.random(),
          participantId: speaker.id,
          participantName: speaker.name,
          originalText: utterance.text,
          translatedText: translatedText,
          originalLanguage: detectedLanguage,
          timestamp: new Date(),
          speakerColor: speaker.color,
        };

        setMessages((prev) => [...prev, newMessage]);

        setTimeout(() => {
          speaker.isSpeaking = false;
          setSpeakers(Array.from(speakerMapRef.current.values()));
        }, 1500);
      });
    } else {
      console.log("No utterances, using single speaker");
      const speakerId = "speaker_0";
      const speaker = getOrCreateSpeaker(speakerId, detectedLanguage);
      
      speaker.isSpeaking = true;
      speaker.lastActive = new Date();
      
      setSpeakers(Array.from(speakerMapRef.current.values()));
      
      const translatedText = detectedLanguage === userLanguage 
        ? result.text 
        : `[${userLanguage}] ${result.text}`;
      
      const newMessage: Message = {
        id: Date.now().toString() + Math.random(),
        participantId: speaker.id,
        participantName: speaker.name,
        originalText: result.text,
        translatedText: translatedText,
        originalLanguage: detectedLanguage,
        timestamp: new Date(),
        speakerColor: speaker.color,
      };

      setMessages((prev) => [...prev, newMessage]);

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
    let localRecording: Audio.Recording | null = null;

    try {
      console.log("=== Starting new recording segment ===");
      setDebugInfo("Starting recording...");

      // Configure audio session for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      // Create recording with proper settings
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: ".wav",
          outputFormat: Audio.AndroidOutputFormat.DEFAULT,
          audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
        },
        ios: {
          extension: ".wav",
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 256000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 256000,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(
        recordingOptions
      );
      
      localRecording = newRecording;
      recordingRef.current = newRecording;
      setRecording(newRecording);
      setRecordingCount((prev) => prev + 1);
      
      console.log("Recording started successfully");
      setDebugInfo("Recording... Speak now!");

      // Wait for recording duration
      await new Promise(resolve => setTimeout(resolve, RECORDING_DURATION_MS));

      // Check if still listening
      if (!isListeningRef.current) {
        console.log("Stopped listening, aborting");
        try {
          await localRecording.stopAndUnloadAsync();
        } catch (e) {}
        processingRef.current = false;
        return;
      }

      console.log("Stopping recording...");
      setDebugInfo("Processing audio...");
      setIsProcessing(true);

      // Stop recording and get URI
      await localRecording.stopAndUnloadAsync();
      const uri = localRecording.getURI();
      recordingRef.current = null;
      setRecording(null);
      
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

      // Check file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log("File info:", JSON.stringify(fileInfo));
      
      if (!fileInfo.exists) {
        console.error("Recording file does not exist");
        setLastError("File not found");
        setIsProcessing(false);
        processingRef.current = false;
        if (isListeningRef.current) {
          setTimeout(() => recordAndTranscribe(), 500);
        }
        return;
      }

      const fileSize = (fileInfo as any).size || 0;
      console.log("File size:", fileSize);
      setDebugInfo(`Sending to API (${Math.round(fileSize/1024)}KB)...`);

      // Minimum file size check (very small files likely have no audio)
      if (fileSize < 5000) {
        console.log("File too small, likely no audio");
        setDebugInfo("No audio detected, listening...");
        try {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        } catch (e) {}
        setIsProcessing(false);
        processingRef.current = false;
        if (isListeningRef.current) {
          setTimeout(() => recordAndTranscribe(), 300);
        }
        return;
      }

      // Transcribe the audio
      const result = await transcribeAudio(uri, apiKey);
      
      console.log("Transcription result:", JSON.stringify(result));

      // Clean up the audio file
      try {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      } catch (e) {
        console.log("Failed to delete file:", e);
      }

      if (result && result.text && result.text.trim()) {
        setLastError("");
        processTranscriptionResult(result);
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
      if (localRecording) {
        try {
          await localRecording.stopAndUnloadAsync();
        } catch (e) {}
      }
      recordingRef.current = null;
      setRecording(null);

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

    const currentRecording = recordingRef.current;
    if (currentRecording) {
      try {
        await currentRecording.stopAndUnloadAsync();
        const uri = currentRecording.getURI();
        if (uri) {
          try {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          } catch (e) {}
        }
      } catch (err) {
        console.error("Failed to stop recording:", err);
      }
      recordingRef.current = null;
      setRecording(null);
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
    <SafeAreaView style={styles.container} edges={["top"]}>
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
          <Text style={styles.languageBadgeText}>{userLanguage}</Text>
        </View>
      </View>

      {/* Debug info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText} numberOfLines={3}>{debugInfo}</Text>
        {lastError ? <Text style={styles.errorText}>{lastError}</Text> : null}
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
        <Text style={styles.transcriptTitle}>Conversation</Text>
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
                Using ElevenLabs Scribe for transcription
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
    </SafeAreaView>
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
  transcriptTitle: {
    fontSize: 14,
    color: "#A69783",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
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