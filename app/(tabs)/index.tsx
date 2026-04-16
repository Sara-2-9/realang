import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../context/TranslationContext";
import LanguageSelector from "../../components/LanguageSelector";
import { apple, AppleTranscription } from "@react-native-ai/apple";
import { experimental_transcribe } from "ai";
import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
  AudioModule,
} from "expo-audio";
import { File } from "expo-file-system";

// Map full language names to ISO 639-1 codes for Apple SpeechAnalyzer
const LANGUAGE_CODE_MAP: Record<string, string> = {
  "English": "en",
  "Spanish": "es",
  "French": "fr",
  "German": "de",
  "Italian": "it",
  "Portuguese": "pt",
  "Polish": "pl",
  "Russian": "ru",
  "Japanese": "ja",
  "Korean": "ko",
  "Chinese": "zh",
  "Arabic": "ar",
  "Hindi": "hi",
  "Turkish": "tr",
  "Dutch": "nl",
  "Swedish": "sv",
  "Norwegian": "no",
  "Danish": "da",
  "Finnish": "fi",
  "Greek": "el",
  "Czech": "cs",
  "Romanian": "ro",
  "Hungarian": "hu",
  "Ukrainian": "uk",
  "Vietnamese": "vi",
  "Thai": "th",
  "Indonesian": "id",
  "Malay": "ms",
  "Filipino": "fil",
};

export default function HomeScreen() {
  const router = useRouter();
  const { userLanguage, setUserLanguage, targetLanguage, setTargetLanguage } =
    useTranslation();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showTargetLanguageSelector, setShowTargetLanguageSelector] =
    useState(false);
  
  // Transcription states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [transcriptionError, setTranscriptionError] = useState("");
  
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const isRecordingRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        audioRecorder.stop().catch(() => {});
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await AudioModule.requestRecordingPermissionsAsync();
      console.log("Audio permission status:", status);
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please grant microphone access to use speech recognition."
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Permission error:", error);
      return false;
    }
  };

  const handleStartListening = async () => {
    // If already recording, stop and transcribe
    if (isRecording) {
      await stopRecordingAndTranscribe();
      return;
    }

    // Start new recording
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      console.log("=== Starting recording ===");
      setTranscriptionError("");
      setIsRecording(true);
      isRecordingRef.current = true;

      // Configure audio session
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Prepare and start recording
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      
      console.log("Recording started");
    } catch (error: any) {
      console.error("Recording error:", error);
      setTranscriptionError(`Recording error: ${error.message}`);
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const stopRecordingAndTranscribe = async () => {
    if (!isRecordingRef.current) return;

    try {
      console.log("=== Stopping recording ===");
      setIsRecording(false);
      isRecordingRef.current = false;
      setIsTranscribing(true);

      // Stop recording
      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (!uri) {
        throw new Error("No recording URI available");
      }

      // Check file
      const file = new File(uri);
      console.log("File exists:", file.exists, "Size:", file.size);

      if (!file.exists || file.size < 1000) {
        throw new Error("Recording too short or file not found");
      }

      const langCode = LANGUAGE_CODE_MAP[userLanguage] || "en";
      console.log("Language code:", langCode, "(from:", userLanguage, ")");

      // Check if Apple Transcription is available for this language
      const isAvailable = await AppleTranscription.isAvailable(langCode);
      console.log("Apple Transcription available:", isAvailable);

      if (!isAvailable) {
        throw new Error(
          `Language "${userLanguage}" (${langCode}) is not available for Apple Transcription. ` +
          `Try downloading the language assets in Settings > General > Dictionary, ` +
          `or use a different language.`
        );
      }

      console.log("=== Using Apple Transcription (on-device) ===");
      
      // Read file as base64 for Apple
      const base64Audio = await file.base64();
      const model = apple.transcriptionModel({ language: langCode });
      
      // Prepare model (may download assets if needed)
      console.log("Preparing model...");
      await model.prepare();

      console.log("Transcribing...");
      const response = await experimental_transcribe({
        model,
        audio: base64Audio,
      });

      const text = response.text || "";
      console.log("Apple Transcription result:", text);
      
      if (response.segments) {
        console.log("Segments:", response.segments);
      }

      setTranscribedText(text || "No speech detected");

      // Clean up file
      try {
        file.delete();
      } catch (e) {
        console.log("Failed to delete file:", e);
      }

    } catch (error: any) {
      console.error("Transcription error:", error);
      setTranscriptionError(error.message || String(error));
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo-reaLang.png')}
            style={styles.logo}
          />
          <Text style={styles.title}>reaLang</Text>
          <Text style={styles.subtitle}>Real-time AI Translation</Text>
        </View>

        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>Your Language</Text>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageSelector(true)}
          >
            <Ionicons name="language" size={24} color="#8B7355" />
            <Text style={styles.languageText}>{userLanguage}</Text>
            <Ionicons name="chevron-down" size={20} color="#B5A898" />
          </TouchableOpacity>
        </View>

        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>Translate To</Text>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowTargetLanguageSelector(true)}
          >
            <Ionicons name="arrow-forward-circle" size={24} color="#9BB068" />
            <Text style={styles.languageText}>{targetLanguage}</Text>
            <Ionicons name="chevron-down" size={20} color="#B5A898" />
          </TouchableOpacity>
        </View>

        {/* Transcription Display */}
        {(transcribedText || isRecording || isTranscribing || transcriptionError) && (
          <View style={styles.transcriptionContainer}>
            <Text style={styles.transcriptionLabel}>
              {isRecording ? "🎙️ Recording... Tap to stop" : 
               isTranscribing ? "🔄 Transcribing..." : 
               "📝 What you said:"}
            </Text>
            
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>Listening...</Text>
              </View>
            )}
            
            {isTranscribing && (
              <ActivityIndicator size="small" color="#8B7355" style={styles.loader} />
            )}
            
            {transcribedText && !isRecording && !isTranscribing && (
              <Text style={styles.transcribedText}>{transcribedText}</Text>
            )}
            
            {transcriptionError && (
              <Text style={styles.errorText}>{transcriptionError}</Text>
            )}
          </View>
        )}

        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.startButton,
              isRecording && styles.stopButton
            ]}
            onPress={handleStartListening}
            disabled={isTranscribing}
          >
            <View style={styles.startButtonInner}>
              <Ionicons 
                name={isRecording ? "stop-circle" : "ear"} 
                size={40} 
                color="#fff" 
              />
              <Text style={styles.startButtonText}>
                {isRecording ? "Stop & Transcribe" : "Start Listening"}
              </Text>
              <Text style={styles.startButtonSubtext}>
                {isRecording 
                  ? "Tap to stop and see transcription" 
                  : "Detect and translate conversations"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>How it works</Text>
          <View style={styles.featureItem}>
            <View style={styles.featureNumber}>
              <Text style={styles.featureNumberText}>1</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Listen to surroundings</Text>
              <Text style={styles.featureText}>
                App detects voices and identifies different speakers
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureNumber}>
              <Text style={styles.featureNumberText}>2</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Auto-detect languages</Text>
              <Text style={styles.featureText}>
                Each speaker's language is automatically identified
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureNumber}>
              <Text style={styles.featureNumberText}>3</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Real-time translation</Text>
              <Text style={styles.featureText}>
                Conversations translated to your language instantly
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.supportedSection}>
          <Ionicons name="globe" size={20} color="#8B7355" />
          <Text style={styles.supportedText}>Support for 29+ languages</Text>
        </View>
      </ScrollView>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        onSelect={(lang) => {
          setUserLanguage(lang);
          setShowLanguageSelector(false);
        }}
        selectedLanguage={userLanguage}
        title="Select Your Language"
      />

      <LanguageSelector
        visible={showTargetLanguageSelector}
        onClose={() => setShowTargetLanguageSelector(false)}
        onSelect={(lang) => {
          setTargetLanguage(lang);
          setShowTargetLanguageSelector(false);
        }}
        selectedLanguage={targetLanguage}
        title="Select Translation Language"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FBF8F3",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#8B7355",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#A69783",
  },
  languageSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#A69783",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F0E8",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8DFD0",
  },
  languageText: {
    flex: 1,
    fontSize: 18,
    color: "#5C4D3C",
    marginLeft: 12,
  },
  transcriptionContainer: {
    backgroundColor: "#F5F0E8",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8DFD0",
  },
  transcriptionLabel: {
    fontSize: 12,
    color: "#A69783",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#D32F2F",
  },
  recordingText: {
    fontSize: 16,
    color: "#5C4D3C",
    fontWeight: "500",
  },
  loader: {
    marginVertical: 8,
  },
  transcribedText: {
    fontSize: 16,
    color: "#5C4D3C",
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    color: "#D32F2F",
  },
  actionSection: {
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: "#9BB068",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#9BB068",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  stopButton: {
    backgroundColor: "#D32F2F",
    shadowColor: "#D32F2F",
  },
  startButtonInner: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },
  startButtonSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  featuresSection: {
    backgroundColor: "#F5F0E8",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#5C4D3C",
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  featureNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8B7355",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureNumberText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#5C4D3C",
    marginBottom: 2,
  },
  featureText: {
    fontSize: 13,
    color: "#6B5D4D",
    lineHeight: 18,
  },
  supportedSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  supportedText: {
    fontSize: 14,
    color: "#8B7355",
  },
});
