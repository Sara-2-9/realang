import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../context/TranslationContext";
import { Audio } from "expo-av";
import SpeakerBubble from "../components/SpeakerBubble";
import TranscriptBubble from "../components/TranscriptBubble";

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
];

const { width } = Dimensions.get("window");

export default function ListeningScreen() {
  const router = useRouter();
  const { userLanguage, apiKey } = useTranslation();

  const [isListening, setIsListening] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

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
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please grant microphone access to use voice detection.");
      return false;
    }
    return true;
  };

  const simulateDetectedSpeakers = () => {
    // Simulate detecting speakers in the environment
    const mockSpeakers: Speaker[] = [
      {
        id: "speaker-1",
        name: "Speaker 1",
        language: "Spanish",
        color: SPEAKER_COLORS[0],
        isSpeaking: false,
        lastActive: new Date(),
      },
      {
        id: "speaker-2",
        name: "Speaker 2",
        language: "French",
        color: SPEAKER_COLORS[1],
        isSpeaking: false,
        lastActive: new Date(),
      },
    ];
    setSpeakers(mockSpeakers);

    // Simulate speech detection
    const interval = setInterval(() => {
      const randomSpeakerIndex = Math.floor(Math.random() * mockSpeakers.length);
      const speaker = mockSpeakers[randomSpeakerIndex];

      setSpeakers((prev) =>
        prev.map((s, i) => ({
          ...s,
          isSpeaking: i === randomSpeakerIndex,
        }))
      );

      // Simulate a new message
      const mockPhrases: Record<string, { original: string; translated: string }[]> = {
        Spanish: [
          { original: "Hola, ¿cómo estás?", translated: "Hello, how are you?" },
          { original: "El clima está muy bueno hoy", translated: "The weather is very nice today" },
          { original: "¿Quieres tomar un café?", translated: "Do you want to have a coffee?" },
        ],
        French: [
          { original: "Bonjour, comment ça va?", translated: "Hello, how are you?" },
          { original: "Il fait beau aujourd'hui", translated: "The weather is nice today" },
          { original: "Je voudrais un croissant", translated: "I would like a croissant" },
        ],
      };

      const phrases = mockPhrases[speaker.language] || mockPhrases.Spanish;
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

      const newMessage: Message = {
        id: Date.now().toString(),
        participantId: speaker.id,
        participantName: speaker.name,
        originalText: randomPhrase.original,
        translatedText: randomPhrase.translated,
        originalLanguage: speaker.language,
        timestamp: new Date(),
        speakerColor: speaker.color,
      };

      setMessages((prev) => [...prev, newMessage]);

      // Stop speaking indicator after a delay
      setTimeout(() => {
        setSpeakers((prev) =>
          prev.map((s) => ({
            ...s,
            isSpeaking: false,
          }))
        );
      }, 2000);
    }, 5000);

    return interval;
  };

  const startListening = async () => {
    if (!apiKey) {
      Alert.alert("API Key Required", "Please set your ElevenLabs API key in Settings.");
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsListening(true);

      // Start simulating speaker detection
      const intervalId = simulateDetectedSpeakers();
      (newRecording as any).intervalId = intervalId;
    } catch (err) {
      console.error("Failed to start listening", err);
      Alert.alert("Error", "Failed to start listening.");
    }
  };

  const stopListening = async () => {
    if (!recording) return;

    try {
      if ((recording as any).intervalId) {
        clearInterval((recording as any).intervalId);
      }
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setIsListening(false);
      setSpeakers((prev) => prev.map((s) => ({ ...s, isSpeaking: false })));
    } catch (err) {
      console.error("Failed to stop listening", err);
    }
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
            {isListening ? `${speakers.length} speakers detected` : "Tap to start"}
          </Text>
        </View>
        <View style={styles.languageBadge}>
          <Text style={styles.languageBadgeText}>{userLanguage}</Text>
        </View>
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
              {isListening ? "Detecting speakers..." : "No speakers detected"}
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
                ? "Waiting for speech..."
                : "Start listening to capture conversations"}
            </Text>
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
  speakersContainer: {
    padding: 16,
    minHeight: 140,
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