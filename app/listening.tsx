import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../context/TranslationContext";
import SpeakerBubble from "../components/SpeakerBubble";
import TranscriptBubble from "../components/TranscriptBubble";
import { useAudioRecorderLoop, Message } from "../hooks/useAudioRecorder";

// Dimensions available if needed for future layout calculations

export default function ListeningScreen() {
  const router = useRouter();
  const { targetLanguage, apiKey } = useTranslation();

  const {
    isListening,
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
  } = useAudioRecorderLoop(apiKey, targetLanguage);

  const flatListRef = useRef<FlatList>(null);
  const isAtBottomRef = useRef(true);

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

  const handleBack = () => {
    if (isListening) {
      stopListening();
    }
    router.back();
  };

  const handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    isAtBottomRef.current =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
  };

  const handleContentSizeChange = () => {
    if (isAtBottomRef.current) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <TranscriptBubble
        message={item}
        isOwnMessage={false}
        speakerColor={item.speakerColor}
        targetLanguage={targetLanguage}
      />
    ),
    [targetLanguage]
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
          <Text style={styles.languageBadgeText}>
            → {targetLanguage.substring(0, 3).toUpperCase()}
          </Text>
        </View>
      </View>

      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText} numberOfLines={2}>
            {debugInfo}
          </Text>
          {lastError ? (
            <Text style={styles.errorText}>STT Error: {lastError}</Text>
          ) : null}
          {translationError ? (
            <Text style={styles.translationErrorText}>
              Translation Error: {translationError}
            </Text>
          ) : null}
          {apiCallLog.length > 0 && (
            <View style={styles.apiLogContainer}>
              <Text style={styles.apiLogTitle}>API Calls:</Text>
              {apiCallLog.slice(-5).map((log, index) => (
                <Text key={index} style={styles.apiLogEntry}>
                  {log}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

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
            <Text style={styles.translationNoteText}>
              Translated to {targetLanguage}
            </Text>
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
            onContentSizeChange={handleContentSizeChange}
            onScroll={handleScroll}
            scrollEventThrottle={250}
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
