import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../context/TranslationContext";
import LanguageSelector from "../../components/LanguageSelector";

export default function HomeScreen() {
  const router = useRouter();
  const { userLanguage, setUserLanguage } = useTranslation();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const handleStartListening = () => {
    router.push("/listening");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={{ uri: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop" }}
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

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.startButton} onPress={handleStartListening}>
            <View style={styles.startButtonInner}>
              <Ionicons name="ear" size={40} color="#fff" />
              <Text style={styles.startButtonText}>Start Listening</Text>
              <Text style={styles.startButtonSubtext}>Detect and translate conversations</Text>
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
              <Text style={styles.featureText}>App detects voices and identifies different speakers</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureNumber}>
              <Text style={styles.featureNumberText}>2</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Auto-detect languages</Text>
              <Text style={styles.featureText}>Each speaker's language is automatically identified</Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureNumber}>
              <Text style={styles.featureNumberText}>3</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Real-time translation</Text>
              <Text style={styles.featureText}>Conversations translated to your language instantly</Text>
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